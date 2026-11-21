// 无头规则引擎宿主：在 Node vm 沙箱中原样运行客户端规则代码（src/client/*.js），
// 保证"服务器裁判"和"浏览器单机"用的是同一份规则实现，避免两套规则逐渐分叉。
//
// 每个 EngineHost 对应一个独立的 vm 上下文（即一局对战），互不共享全局状态。
// 编译后的脚本（vm.Script）在所有上下文之间复用，只编译一次。

import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { webcrypto, randomInt } from 'node:crypto';
import { createFakeDom, extractIdsFromHtml } from './fakeDom.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CLIENT_DIR = join(ROOT, 'src', 'client');
const INDEX_HTML = join(ROOT, 'web', 'index.html');

let _compiled = null;
let _knownIds = null;

function loadClientBundle() {
  if (_compiled) return _compiled;
  const files = JSON.parse(readFileSync(join(CLIENT_DIR, 'manifest.json'), 'utf8'));
  const code = files.map(f => readFileSync(join(CLIENT_DIR, f), 'utf8')).join('');
  _compiled = new vm.Script(code, { filename: 'cardforge-client-bundle.js' });
  _knownIds = extractIdsFromHtml(readFileSync(INDEX_HTML, 'utf8'));
  return _compiled;
}

// 服务器侧覆盖：在客户端代码加载完成后执行（同一上下文，共享全局词法作用域）
const SERVER_OVERRIDES = new vm.Script(`
  window.CF_SERVER_MODE = true;
  window.CF_BATTLE_SPEED = 1000;
  sleep = () => Promise.resolve();
  battleMode = 'pvp_online';
  // 纯表现层：服务器不需要渲染，直接置空以节省 CPU（规则状态不受影响，见 engine 测试中的一致性校验）
  for (const name of __CF_UI_STUBS__) {
    if (typeof globalThis[name] === 'function') {
      const isAsync = globalThis[name].constructor && globalThis[name].constructor.name === 'AsyncFunction';
      globalThis[name] = isAsync ? (async () => undefined) : (() => undefined);
    }
  }
  // 致命一击的扣血写在特效回调里：服务器上跳过动画但必须执行回调
  playLethalSlowMotion = async (targetSide, dmg, onImpact) => { if (typeof onImpact === 'function') await onImpact(); };
  getAnimeIllustrationDataURI = () => '';
  getAnimeIllustrationLayers = () => ({ bgUri: '', fgUri: '' });
  onlineIsMyTurn = () => true;
  broadcastOnlineSync = () => undefined;
  updateOnlineHudPill = () => undefined;
  syncOnlineAvatarsAndHud = () => undefined;
  showOnlineVictoryDefeatModal = (iWon) => { __cfServer.onGameOver(iWon); };
  recordLocalVfx = (ev) => { __cfServer.events.push(ev); };
`, { filename: 'cardforge-server-overrides.js' });

// 纯渲染/特效函数（不修改对局状态）。仅在服务器上置空。
export const UI_STUBS = [
  'renderAllBattleUI', 'renderBattleRecordPanel', 'renderMulliganDualBox', 'renderDynamicCounterRow',
  'updateSelfDmgHudBadge', 'syncGlobalAnimPhases', 'syncDetailSelectionHighlight', 'renderCrestsRowDOM',
  'openCardDetailPanel', 'openCrestDetailPanel', 'showSacrificeGuideBanner', 'updatePendingLeftTopView',
  'playTurnStartBanner', 'startTurnCountdownTimer', 'stopTurnCountdownTimer', 'startMulliganCountdownTimer',
  'stopMulliganCountdownTimer', 'savePveBattleProgress', 'cfTraceSnapshot', 'cfTracePush', 'setHandCollapsed',
  'spawnFloatNumber', 'playRowWideVFX', 'playMeleeImpactVFX', 'playAoeShockwaveVFX', 'playLeaderDamageTypeVFX',
  'playDestroyShatterVFX', 'playDeckToBoardInvocationVFX', 'playBoardToHandBounceVFX', 'animateCardTrajectory',
  'playOverdrawBurnAnim', 'playShuffleIntoDeckAnim', 'playExtraEnergyVFX', 'playHandCardWaveAndVanishVFX',
  'playBanishVoidSVG', 'playMinionEnterVfx', 'playCardEnterVFX', 'playHandCardVFX', 'playOverflowBanishAnim',
  'playSacrificeBloodRitualSVG', 'showOppSpellShowcase', 'spawnImpactRing',
];
// 注意：任何会修改对局状态（或接受回调）的函数都不能放进这里，test/engine.test.js 有静态检查。
// 注意：showTriggeredEffectToast / playSynergyBeam / playLastWordsTriggerVFX / playCrestTriggerVFX
// 会记录特效事件与战报（turnLogs），属于"需要同步给客户端"的信息，因此保留原实现（假 DOM 吸收渲染部分）。

function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(String(k)) ? m.get(String(k)) : null),
    setItem: (k, v) => { m.set(String(k), String(v)); },
    removeItem: (k) => { m.delete(String(k)); },
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}

class NoopObserver { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }

export function secureRandom() {
  // [0, 1) 均匀分布，53 位精度，来自 CSPRNG（洗牌 / 先后手不可预测）
  const b = new Uint32Array(2);
  webcrypto.getRandomValues(b);
  return (b[0] * 2 ** 21 + (b[1] >>> 11)) / 2 ** 53;
}

export class EngineHost {
  /**
   * @param {object} opts
   * @param {() => number} [opts.random] 随机数源（测试可注入可复现的种子随机数）
   * @param {boolean} [opts.keepUi] 不置空渲染函数（用于一致性测试）
   * @param {(level: string, args: any[]) => void} [opts.onLog]
   */
  constructor({ random = secureRandom, keepUi = false, onLog = null } = {}) {
    const script = loadClientBundle();
    this.missing = new Set();
    this.errors = [];
    this.events = [];
    this.gameOverFlag = null;
    this._timers = new Set();
    const dom = createFakeDom({ knownIds: _knownIds, missing: this.missing });

    const log = (level) => (...args) => {
      if (level === 'error') this.errors.push(args.map(a => (a && a.stack) || String(a)).join(' '));
      if (onLog) onLog(level, args);
    };
    const host = this;
    const timers = this._timers;

    const g = {
      document: dom.document,
      navigator: { userAgent: 'CardForgeServer/1.0', language: 'zh-CN', languages: ['zh-CN'], maxTouchPoints: 0, onLine: true,
        clipboard: { writeText: () => Promise.resolve(), readText: () => Promise.resolve('') }, vibrate() { return false; } },
      location: { protocol: 'https:', host: 'localhost', hostname: 'localhost', port: '', origin: 'https://localhost',
        href: 'https://localhost/', pathname: '/', search: '', hash: '', reload() {}, assign() {}, replace() {} },
      history: { pushState() {}, replaceState() {}, back() {} },
      screen: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1080,
        orientation: { type: 'landscape-primary', angle: 0, lock: () => Promise.reject(new Error('unsupported')), unlock() {}, addEventListener() {} } },
      innerWidth: 1600, innerHeight: 900, outerWidth: 1600, outerHeight: 900, devicePixelRatio: 1, scrollX: 0, scrollY: 0,
      visualViewport: { width: 1600, height: 900, scale: 1, addEventListener() {}, removeEventListener() {} },
      addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
      matchMedia: (q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
      getComputedStyle: () => ({ getPropertyValue: () => '' }),
      requestAnimationFrame: () => 0, cancelAnimationFrame() {},
      requestIdleCallback: () => 0, cancelIdleCallback() {},
      setTimeout: (fn, ms, ...a) => {
        // 只保留纯表现层的延迟清理；unref 避免阻止进程退出，dispose 时统一清理
        if (typeof fn !== 'function') return 0;
        const t = setTimeout(() => { timers.delete(t); try { fn(...a); } catch (e) { log('error')(e); } }, Math.min(Number(ms) || 0, 60_000));
        t.unref?.();
        timers.add(t);
        return t;
      },
      clearTimeout: (t) => { if (t) { clearTimeout(t); timers.delete(t); } },
      setInterval: () => 0, clearInterval() {},   // 客户端的计时器/动画循环在服务器上一律不运行
      queueMicrotask, structuredClone, TextEncoder, TextDecoder, URL, URLSearchParams, atob, btoa,
      AbortController, Blob: class { constructor(parts = []) { this.size = parts.reduce((n, p) => n + (p?.length || 0), 0); } },
      performance: { now: () => performance.now() },
      crypto: webcrypto,
      console: { log: log('log'), info: log('info'), warn: log('warn'), error: log('error'), debug: log('debug'), trace: log('debug') },
      localStorage: makeStorage(), sessionStorage: makeStorage(),
      indexedDB: undefined,
      fetch: () => Promise.reject(new Error('fetch is not available on the server')),
      WebSocket: undefined, AudioContext: undefined, webkitAudioContext: undefined,
      Image: class { constructor() { this.complete = true; this.naturalWidth = 0; this.naturalHeight = 0; this.onload = null; this.onerror = null; }
        set src(v) { this._src = v; const cb = this.onload; if (typeof cb === 'function') setImmediate(() => cb.call(this)); } get src() { return this._src; }
        decode() { return Promise.resolve(); } addEventListener() {} },
      Audio: class { play() { return Promise.resolve(); } pause() {} load() {} addEventListener() {} },
      MutationObserver: NoopObserver, ResizeObserver: NoopObserver, IntersectionObserver: NoopObserver,
      Event: class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } preventDefault() {} stopPropagation() {} },
      CustomEvent: class { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } preventDefault() {} stopPropagation() {} },
      MouseEvent: class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } },
      TouchEvent: class { constructor(type) { this.type = type; } },
      KeyboardEvent: class { constructor(type, init = {}) { this.type = type; Object.assign(this, init); } },
      HTMLElement: class {}, Element: class {}, Node: class {}, HTMLCanvasElement: class {}, SVGElement: class {},
      FileReader: class { readAsText() {} readAsDataURL() {} addEventListener() {} },
      DOMParser: class { parseFromString() { return dom.document; } },
      alert() {}, confirm: () => false, prompt: () => null, open: () => null, focus() {}, blur() {}, scrollTo() {},
      getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
      __CF_UI_STUBS__: keepUi ? [] : UI_STUBS,
      __cfServer: {
        get events() { return host.events; },
        onGameOver: (iWon) => { host.gameOverFlag = { side0Won: Boolean(iWon) }; },
      },
    };
    g.window = g; g.self = g; g.globalThis = g; g.top = g; g.parent = g; g.frames = g;

    const context = vm.createContext(g, { name: 'cardforge-match', codeGeneration: { strings: false, wasm: false } });
    // 沙箱内的 Math 是独立对象：替换随机源（服务器默认使用 CSPRNG）
    vm.runInContext('Math', context).random = random;
    this.context = context;

    script.runInContext(context, { timeout: 10_000 });
    SERVER_OVERRIDES.runInContext(context, { timeout: 2_000 });
  }

  /** 在沙箱内执行一段表达式（仅供宿主与测试使用，绝不传入用户数据拼接的代码） */
  eval(code) {
    return vm.runInContext(code, this.context, { timeout: 5_000 });
  }

  /** 取沙箱内的全局绑定（包括 let/const 声明的全局词法变量） */
  get(name) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) throw new Error('invalid identifier');
    return this.eval(name);
  }

  takeEvents() {
    const evs = this.events;
    this.events = [];
    return evs;
  }

  dispose() {
    for (const t of this._timers) clearTimeout(t);
    this._timers.clear();
    this.context = null;
  }
}

export function seededRandom(seed = 1) {
  // mulberry32：测试用的可复现随机数
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { randomInt };
