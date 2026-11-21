// 服务器端"无头浏览器"垫片：让客户端规则代码（src/client/*.js）在 Node vm 中原样运行。
//
// 设计原则：
//   - 规则代码里夹杂了大量特效/渲染调用（getElementById(...).classList.add 等）。服务器只关心
//     对局状态，所以这些 DOM 操作全部被"吸收"成无副作用的空操作。
//   - 返回值尽量贴近浏览器的"空页面"语义（querySelector → null、contains → false、尺寸 → 0），
//     避免把假对象当成真值从而改变规则分支。
//   - 任何未实现的属性访问都会记录到 missing 集合，测试里会把它打印出来，方便补齐。
//   - 绝不实现 then：否则 `await el.animate()` 之类会把假对象当 thenable 永久挂起。

const RECT0 = Object.freeze({ x: 0, y: 0, left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 });

function makeAbsorber(missing, label) {
  // 可调用、可取任意属性的"黑洞"对象，用于 canvas 上下文这类纯输出接口
  const fn = function () { return undefined; };
  return new Proxy(fn, {
    get(target, prop) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      if (prop in target) return target[prop];
      if (missing) missing.add(`${label}.${String(prop)}`);
      return makeAbsorber(null, label);
    },
    set(target, prop, value) { target[prop] = value; return true; },
    apply() { return undefined; },
  });
}

class FakeClassList {
  constructor(owner) { this._owner = owner; this._set = new Set(); }
  _sync() { this._owner._className = [...this._set].join(' '); }
  add(...names) { names.forEach(n => this._set.add(String(n))); this._sync(); }
  remove(...names) { names.forEach(n => this._set.delete(String(n))); this._sync(); }
  toggle(name, force) {
    const has = this._set.has(name);
    const want = force === undefined ? !has : Boolean(force);
    if (want) this._set.add(name); else this._set.delete(name);
    this._sync();
    return want;
  }
  contains(name) { return this._set.has(name); }
  replace(a, b) { if (!this._set.has(a)) return false; this._set.delete(a); this._set.add(b); this._sync(); return true; }
  item(i) { return [...this._set][i] ?? null; }
  forEach(fn) { [...this._set].forEach(fn); }
  get length() { return this._set.size; }
  get value() { return this._owner._className; }
  toString() { return this._owner._className; }
  [Symbol.iterator]() { return this._set[Symbol.iterator](); }
  _reset(str) { this._set = new Set(String(str || '').split(/\s+/).filter(Boolean)); this._sync(); }
}

function makeStyle() {
  const store = Object.create(null);
  const api = {
    setProperty(k, v) { store[k] = String(v); },
    removeProperty(k) { const v = store[k]; delete store[k]; return v ?? ''; },
    getPropertyValue(k) { return store[k] ?? ''; },
    get cssText() { return store.__cssText ?? ''; },
    set cssText(v) { store.__cssText = String(v); },
  };
  return new Proxy(api, {
    get(t, p) { if (p in t) return t[p]; if (typeof p === 'symbol') return undefined; return store[p] ?? ''; },
    set(t, p, v) { if (p === 'cssText') { t.cssText = v; return true; } store[p] = String(v); return true; },
  });
}

function makeAnimation() {
  return {
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    onfinish: null, oncancel: null, playState: 'finished', currentTime: 0,
    cancel() {}, finish() {}, play() {}, pause() {}, reverse() {}, commitStyles() {}, persist() {},
    addEventListener() {}, removeEventListener() {},
  };
}

function makeCanvasContext(canvas, missing) {
  const gradient = () => ({ addColorStop() {} });
  const base = {
    canvas,
    createLinearGradient: gradient, createRadialGradient: gradient, createConicGradient: gradient,
    createPattern: () => ({ setTransform() {} }),
    measureText: (t) => ({ width: String(t ?? '').length * 8, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2 }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(0, Math.min(w * h * 4, 1 << 20))) }),
    createImageData: (w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(0, Math.min(w * h * 4, 1 << 20))) }),
    isPointInPath: () => false, isPointInStroke: () => false,
    getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 }),
    getLineDash: () => [],
    getContextAttributes: () => ({}),
  };
  const noop = () => undefined;
  return new Proxy(base, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'then' || typeof p === 'symbol') return undefined;
      return noop; // fillRect / beginPath / arc / drawImage …… 全部空操作
    },
    set(t, p, v) { t[p] = v; return true; },
  });
}

export function createFakeDom({ knownIds = [], missing = new Set() } = {}) {
  const byId = new Map();
  const known = new Set(knownIds);
  let doc;

  class FakeNode {
    constructor(tagName = 'div') {
      this.tagName = String(tagName).toUpperCase();
      this.nodeName = this.tagName;
      this.nodeType = tagName.startsWith('#') ? 3 : 1;
      this.namespaceURI = null;
      this._id = '';
      this._className = '';
      this.classList = new FakeClassList(this);
      this.style = makeStyle();
      this.dataset = {};
      this._attrs = new Map();
      this.children = [];
      this.parentNode = null;
      this._html = '';
      this._text = '';
      this.value = '';
      this.checked = false;
      this.disabled = false;
      this.hidden = false;
      this.src = '';
      this.href = '';
      this.alt = '';
      this.title = '';
      this.type = '';
      this.name = '';
      this.placeholder = '';
      this.selectedIndex = -1;
      this.options = [];
      this.files = [];
      this.width = this.tagName === 'CANVAS' ? 300 : 0;
      this.height = this.tagName === 'CANVAS' ? 150 : 0;
      this.offsetWidth = 0; this.offsetHeight = 0; this.offsetTop = 0; this.offsetLeft = 0;
      this.clientWidth = 0; this.clientHeight = 0;
      this.scrollTop = 0; this.scrollLeft = 0; this.scrollWidth = 0; this.scrollHeight = 0;
      this.tabIndex = 0;
      this.isConnected = false;
      this.ownerDocument = doc;
      this.srcdoc = '';
      this.contentWindow = null;
      this.sheet = null;
      this.onclick = null;
    }
    get id() { return this._id; }
    set id(v) { this._id = String(v); if (this._id) byId.set(this._id, this); }
    get className() { return this._className; }
    set className(v) { this.classList._reset(v); }
    get childNodes() { return this.children; }
    get childElementCount() { return this.children.length; }
    get parentElement() { return this.parentNode; }
    get firstElementChild() { return this.children[0] ?? null; }
    get lastElementChild() { return this.children[this.children.length - 1] ?? null; }
    get firstChild() { return this.firstElementChild; }
    get lastChild() { return this.lastElementChild; }
    get nextElementSibling() { const p = this.parentNode; if (!p) return null; return p.children[p.children.indexOf(this) + 1] ?? null; }
    get previousElementSibling() { const p = this.parentNode; if (!p) return null; const i = p.children.indexOf(this); return i > 0 ? p.children[i - 1] : null; }
    get nextSibling() { return this.nextElementSibling; }
    get previousSibling() { return this.previousElementSibling; }
    get innerHTML() { return this._html; }
    set innerHTML(v) { this._html = String(v ?? ''); this._detachAll(); }
    get outerHTML() { return this._html; }
    set outerHTML(v) { /* 吸收 */ }
    get textContent() { return this._text; }
    set textContent(v) { this._text = String(v ?? ''); this._detachAll(); }
    get innerText() { return this._text; }
    set innerText(v) { this.textContent = v; }
    get attributes() { return [...this._attrs].map(([name, value]) => ({ name, value })); }

    _detachAll() { this.children.forEach(c => { c.parentNode = null; }); this.children = []; }
    appendChild(c) {
      if (!c || typeof c !== 'object') return c;
      if (c.tagName === '#FRAGMENT') { [...c.children].forEach(x => this.appendChild(x)); return c; }
      if (c.parentNode) c.parentNode.removeChild(c);
      c.parentNode = this; c.isConnected = true;
      this.children.push(c);
      return c;
    }
    append(...nodes) { nodes.forEach(n => { if (n && typeof n === 'object') this.appendChild(n); }); }
    prepend(...nodes) { nodes.reverse().forEach(n => { if (n && typeof n === 'object') this.insertBefore(n, this.children[0] ?? null); }); }
    insertBefore(n, ref) {
      if (!n || typeof n !== 'object') return n;
      if (n.parentNode) n.parentNode.removeChild(n);
      const i = ref ? this.children.indexOf(ref) : -1;
      n.parentNode = this; n.isConnected = true;
      if (i === -1) this.children.push(n); else this.children.splice(i, 0, n);
      return n;
    }
    after(...nodes) { const p = this.parentNode; if (!p) return; const next = this.nextElementSibling; nodes.forEach(n => p.insertBefore(n, next)); }
    before(...nodes) { const p = this.parentNode; if (!p) return; nodes.forEach(n => p.insertBefore(n, this)); }
    removeChild(c) { const i = this.children.indexOf(c); if (i !== -1) { this.children.splice(i, 1); c.parentNode = null; c.isConnected = false; } return c; }
    replaceChild(n, old) { const i = this.children.indexOf(old); if (i !== -1) { this.children[i] = n; n.parentNode = this; old.parentNode = null; } return old; }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceWith(n) { if (this.parentNode) this.parentNode.replaceChild(n, this); }
    replaceChildren(...nodes) { this._detachAll(); this.append(...nodes); }
    cloneNode() { const c = new FakeNode(this.tagName.toLowerCase()); c.className = this.className; return c; }
    contains(n) { if (n === this) return true; return this.children.some(c => c.contains(n)); }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    getElementsByClassName() { return []; }
    getElementsByTagName() { return []; }
    closest() { return null; }
    matches() { return false; }
    getBoundingClientRect() { return { ...RECT0 }; }
    getClientRects() { return []; }
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return true; }
    setAttribute(k, v) { this._attrs.set(k, String(v)); if (k === 'id') this.id = v; if (k === 'class') this.className = v; }
    getAttribute(k) { return this._attrs.has(k) ? this._attrs.get(k) : null; }
    removeAttribute(k) { this._attrs.delete(k); }
    hasAttribute(k) { return this._attrs.has(k); }
    toggleAttribute(k, f) { const want = f === undefined ? !this._attrs.has(k) : Boolean(f); if (want) this._attrs.set(k, ''); else this._attrs.delete(k); return want; }
    setAttributeNS(ns, k, v) { this.setAttribute(k, v); }
    getAttributeNS(ns, k) { return this.getAttribute(k); }
    insertAdjacentHTML() {}
    insertAdjacentElement(pos, el) { this.appendChild(el); return el; }
    insertAdjacentText() {}
    focus() {} blur() {} click() {} select() {} setSelectionRange() {}
    scrollIntoView() {} scrollTo() {} scrollBy() {}
    animate() { return makeAnimation(); }
    getAnimations() { return []; }
    requestFullscreen() { return Promise.resolve(); }
    webkitRequestFullscreen() { return Promise.resolve(); }
    setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return false; }
    play() { return Promise.resolve(); } pause() {} load() {}
    getContext() { return this._ctx || (this._ctx = makeCanvasContext(this, missing)); }
    toDataURL() { return 'data:image/png;base64,'; }
    toBlob(cb) { if (typeof cb === 'function') cb(null); }
    getTotalLength() { return 0; }
    getPointAtLength() { return { x: 0, y: 0 }; }
    getBBox() { return { x: 0, y: 0, width: 0, height: 0 }; }
    showModal() {} close() {} submit() {} reset() {} checkValidity() { return true; }
    add() {} // <select>.add
  }

  const proxify = (node) => new Proxy(node, {
    get(t, p, r) {
      if (p in t) return Reflect.get(t, p, r);
      if (p === 'then' || typeof p === 'symbol') return undefined;
      if (typeof p === 'string' && p.startsWith('on')) return null;
      missing.add(`Element.${String(p)}`);
      return undefined;
    },
  });

  const make = (tag) => proxify(new FakeNode(tag));

  doc = {
    readyState: 'complete', hidden: false, visibilityState: 'visible',
    fullscreenElement: null, webkitFullscreenElement: null, cookie: '', title: '', referrer: '',
    activeElement: null,
    getElementById(id) {
      if (byId.has(id)) return byId.get(id);
      if (!known.has(id)) return null; // 与浏览器一致：页面上不存在的 id 返回 null
      const el = make('div');
      el.id = id;
      el.isConnected = true;
      return el;
    },
    createElement: (tag) => make(tag),
    createElementNS: (ns, tag) => make(tag),
    createTextNode: (t) => { const n = make('#text'); n._text = String(t ?? ''); return n; },
    createDocumentFragment: () => make('#fragment'),
    createComment: () => make('#comment'),
    createRange: () => ({ selectNodeContents() {}, collapse() {}, getBoundingClientRect: () => ({ ...RECT0 }) }),
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    elementFromPoint: () => null,
    elementsFromPoint: () => [],
    addEventListener() {}, removeEventListener() {}, dispatchEvent() { return true; },
    exitFullscreen: () => Promise.resolve(), webkitExitFullscreen: () => Promise.resolve(),
    execCommand: () => false,
    hasFocus: () => false,
    getSelection: () => ({ removeAllRanges() {}, addRange() {} }),
  };
  doc.documentElement = make('html');
  doc.head = make('head');
  doc.body = make('body');
  doc.documentElement.appendChild(doc.head);
  doc.documentElement.appendChild(doc.body);

  return { document: doc, makeElement: make, missing, absorber: (label) => makeAbsorber(missing, label) };
}

export function extractIdsFromHtml(html) {
  const ids = new Set();
  for (const m of String(html).matchAll(/\sid\s*=\s*"([^"]+)"/g)) ids.add(m[1]);
  return [...ids];
}
