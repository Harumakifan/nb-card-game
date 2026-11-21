class SoundSynth {
  constructor() { this.ctx = null; this.muted = false; }
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(type) {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const nowMs = Date.now();
    if (type === 'click') {
      if (nowMs - (this._lastClickMs || 0) < 80) return;
      this._lastClickMs = nowMs;
    }
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    if (type === 'click') {
      osc.frequency.setValueAtTime(640, now); osc.frequency.exponentialRampToValueAtTime(940, now + 0.045);
      gain.gain.setValueAtTime(0.11, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.045);
      osc.start(now); osc.stop(now + 0.045);
    } else if (type === 'draw') {
      osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(780, now + 0.08);
      gain.gain.setValueAtTime(0.12, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
      osc.start(now); osc.stop(now + 0.08);
    } else if (type === 'play') {
      osc.frequency.setValueAtTime(310, now); osc.frequency.exponentialRampToValueAtTime(680, now + 0.14);
      gain.gain.setValueAtTime(0.17, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.14);
      osc.start(now); osc.stop(now + 0.14);
    } else if (type === 'legend') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now); osc.frequency.exponentialRampToValueAtTime(1180, now + 0.36);
      gain.gain.setValueAtTime(0.24, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.36);
      osc.start(now); osc.stop(now + 0.36);
    } else if (type === 'sacrifice') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(210, now); osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
      gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'lastwords') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(580, now); osc.frequency.exponentialRampToValueAtTime(240, now + 0.26);
      gain.gain.setValueAtTime(0.22, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.26);
      osc.start(now); osc.stop(now + 0.26);
    } else if (type === 'hit') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      gain.gain.setValueAtTime(0.28, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
      osc.start(now); osc.stop(now + 0.15);
    } else if (type === 'synergy') {
      osc.frequency.setValueAtTime(520, now); osc.frequency.exponentialRampToValueAtTime(1040, now + 0.2);
      gain.gain.setValueAtTime(0.15, now); gain.gain.linearRampToValueAtTime(0.01, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    }
  }
}
const sfx = new SoundSynth();

class BgmSynth {
  constructor() {
    this.enabled = true;
    this.playing = false;
    this._timer = null;
    this._step = 0;
    this._master = null;
    this._scene = 'menu';
  }
  detectScene() {
    const mm = document.getElementById('mainMenuOverlay');
    if (mm && !mm.classList.contains('hidden')) return 'menu';
    const dk = document.getElementById('screenDeck');
    if (dk && !dk.classList.contains('hidden')) return 'deck';
    return 'battle';
  }
  _tone(freq, dur, wave, vol, attack = 0.03, now) {
    if (!sfx.ctx || freq <= 0) return;
    const osc = sfx.ctx.createOscillator();
    const g = sfx.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0.0008, now);
    g.gain.linearRampToValueAtTime(vol, now + attack);
    g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    osc.connect(g);
    g.connect(this._master);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
  start() {
    if (!this.enabled || this.playing) return;
    sfx.init();
    if (!sfx.ctx) return;
    if (sfx.ctx.state === 'suspended') sfx.ctx.resume();
    this.playing = true;
    if (!this._master) {
      this._master = sfx.ctx.createGain();
      this._master.gain.value = 0.06;
      this._master.connect(sfx.ctx.destination);
    }

    const SCENES = {
      menu: {
        stepMs: 420,
        chords: [
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [174.61, 220.0, 261.63, 349.23], // Fmaj7
          [146.83, 220.0, 261.63, 329.63], // Dm9
          [164.81, 220.0, 246.94, 329.63], // E7sus4
          [220.0, 261.63, 329.63, 493.88], // Am9
          [130.81, 196.0, 246.94, 329.63], // Cmaj7
          [196.0, 246.94, 293.66, 329.63], // G6
          [164.81, 207.65, 246.94, 329.63] // E7
        ],
        lead: [659.25, 0, 523.25, 587.33, 659.25, 783.99, 659.25, 0, 587.33, 523.25, 493.88, 0, 523.25, 493.88, 440.0, 0]
      },
      deck: {
        stepMs: 460,
        chords: [
          [130.81, 196.0, 246.94, 329.63], // Cmaj7
          [220.0, 261.63, 329.63, 493.88], // Am9
          [174.61, 220.0, 261.63, 329.63], // Fmaj7
          [196.0, 246.94, 293.66, 349.23], // G7
          [164.81, 196.0, 246.94, 293.66], // Em7
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [146.83, 220.0, 261.63, 349.23], // Dm7
          [196.0, 246.94, 293.66, 392.0]   // G6
        ],
        lead: [523.25, 587.33, 659.25, 0, 587.33, 523.25, 440.0, 0, 392.0, 440.0, 523.25, 659.25, 587.33, 0, 523.25, 0]
      },
      battle: {
        stepMs: 260,
        chords: [
          [146.83, 220.0, 261.63, 349.23], // Dm7
          [116.54, 174.61, 233.08, 293.66],// Bbmaj7
          [130.81, 196.0, 261.63, 329.63], // C
          [220.0, 261.63, 329.63, 392.0],  // Am7
          [146.83, 220.0, 293.66, 349.23], // Dm
          [196.0, 233.08, 293.66, 349.23], // Gm7
          [116.54, 174.61, 220.0, 293.66], // Bbmaj7
          [110.0, 164.81, 220.0, 277.18]   // A7
        ],
        lead: [587.33, 0, 659.25, 698.46, 587.33, 0, 523.25, 587.33, 698.46, 783.99, 880.0, 0, 783.99, 698.46, 659.25, 587.33]
      }
    };

    const tick = () => {
      if (!this.enabled || !this.playing || !sfx.ctx || sfx.ctx.state !== 'running') return;
      const curScene = this.detectScene();
      if (curScene !== this._scene) {
        this._scene = curScene;
        this._step = 0;
        clearInterval(this._timer);
        this._timer = setInterval(tick, SCENES[curScene].stepMs);
      }
      const cfg = SCENES[curScene];
      const now = sfx.ctx.currentTime;
      const bar = Math.floor(this._step / 4) % cfg.chords.length;
      const beat = this._step % 4;
      const phraseB = Math.floor(this._step / 32) % 2 === 1;
      const chord = cfg.chords[bar];

      if (beat === 0) {
        chord.slice(0, 3).forEach(f => this._tone(f * 0.5, curScene === 'battle' ? 0.95 : 1.75, 'sine', curScene === 'battle' ? 0.14 : 0.16, 0.08, now));
      }

      if (curScene === 'battle') {
        // 战斗节拍低音脉冲 + B段高八度分解和弦
        const bassMult = (beat % 2 === 0) ? 0.5 : 1.0;
        this._tone(chord[0] * bassMult, 0.22, 'sawtooth', 0.075, 0.01, now);
        const arpIdx = phraseB ? (3 - beat) : beat;
        this._tone(chord[arpIdx] * (phraseB ? 2 : 1), 0.24, 'triangle', 0.09, 0.02, now);
        const lNote = cfg.lead[this._step % cfg.lead.length];
        if (lNote > 0 && (phraseB || beat % 2 === 0)) {
          this._tone(lNote, 0.32, 'triangle', 0.11, 0.02, now);
        }
      } else if (curScene === 'deck') {
        // 牌组编辑：温暖电钢与轻柔拨弦
        const arpIdx = (beat === 1 || beat === 3) ? (phraseB ? 3 : 2) : beat % 2;
        this._tone(chord[arpIdx], 0.55, 'sine', 0.11, 0.03, now);
        const lNote = cfg.lead[this._step % cfg.lead.length];
        if (lNote > 0) this._tone(lNote * (phraseB ? 1 : 0.5), 0.48, 'triangle', 0.07, 0.04, now);
      } else {
        // 主界面：空灵铃音分解 + 交替变奏旋律
        const arpOrder = phraseB ? [3, 2, 1, 2] : [0, 1, 2, 3];
        this._tone(chord[arpOrder[beat]] * 1.5, 0.65, 'sine', 0.09, 0.03, now);
        const lNote = cfg.lead[this._step % cfg.lead.length];
        if (lNote > 0) this._tone(lNote, 0.58, 'sine', 0.085, 0.04, now);
      }
      this._step += 1;
    };

    this._scene = this.detectScene();
    tick();
    this._timer = setInterval(tick, SCENES[this._scene].stepMs);
  }
  stop() {
    this.playing = false;
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.start();
    else this.stop();
    ['btnToggleBgm', 'btnMenuBgmToggle'].forEach(bid => {
      const btn = document.getElementById(bid);
      if (btn) {
        btn.textContent = this.enabled ? '🎵 音乐: 开' : '🔇 音乐: 关';
        btn.style.color = this.enabled ? '#fde047' : '#94a3b8';
      }
    });
  }
}
const bgm = new BgmSynth();
document.addEventListener('pointerdown', () => { if (bgm.enabled && !bgm.playing) bgm.start(); }, { passive: true });
document.getElementById('btnToggleBgm')?.addEventListener('click', (e) => {
  e.stopPropagation();
  bgm.toggle();
});
document.getElementById('btnMenuBgmToggle')?.addEventListener('click', (e) => {
  e.stopPropagation();
  bgm.toggle();
});
window.CF_BATTLE_SPEED = (function(){ try { const s = parseFloat(localStorage.getItem('cf_battle_speed') || '1'); return (s === 1.5 || s === 2) ? s : 1; } catch(e){ return 1; } })();
