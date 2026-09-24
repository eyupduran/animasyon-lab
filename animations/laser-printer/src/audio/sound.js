// Synthesised machine sounds (Web Audio, no recordings): motors, polygon-mirror whine, fan,
// fuser hiss, scanner stepper, paper swishes, solenoid clicks, lid thud and data blips.
export class Sound {
  constructor() { this.ctx = null; this.muted = false; }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    const C = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = C.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
    this.master = C.createGain(); this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(comp).connect(C.destination);
    this.noise = makeNoise(C);
    const loopNoise = (type, f, q, g0 = 0) => {
      const src = C.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const flt = C.createBiquadFilter(); flt.type = type; flt.frequency.value = f; flt.Q.value = q;
      const g = C.createGain(); g.gain.value = g0;
      src.connect(flt).connect(g).connect(this.master); src.start();
      return { g, flt };
    };
    this.room = loopNoise('lowpass', 300, 0.5, 0.012);
    this.fan = loopNoise('bandpass', 520, 0.6);
    this.hiss = loopNoise('highpass', 3500, 0.7);
    // drive motor: two saws through a low-pass
    const mg = C.createGain(); mg.gain.value = 0;
    const mf = C.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 280; mf.Q.value = 2;
    this.motorOsc = [58, 117].map((f, i) => { const o = C.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const g = C.createGain(); g.gain.value = i ? 0.4 : 1; o.connect(g).connect(mf); o.start(); return o; });
    mf.connect(mg).connect(this.master);
    this.motor = { g: mg, f: mf };
    // gear whine
    const wo = C.createOscillator(); wo.type = 'triangle'; wo.frequency.value = 410;
    const wg = C.createGain(); wg.gain.value = 0; wo.connect(wg).connect(this.master); wo.start();
    this.whine = { o: wo, g: wg };
    // polygon mirror
    const po = C.createOscillator(); po.type = 'sine'; po.frequency.value = 1880;
    const lfo = C.createOscillator(); lfo.frequency.value = 5.5; const lg = C.createGain(); lg.gain.value = 7; lfo.connect(lg).connect(po.frequency); lfo.start();
    const pg = C.createGain(); pg.gain.value = 0; po.connect(pg).connect(this.master); po.start();
    this.poly = { g: pg };
    // scanner stepper
    const so = C.createOscillator(); so.type = 'square'; so.frequency.value = 160;
    const sf = C.createBiquadFilter(); sf.type = 'lowpass'; sf.frequency.value = 900;
    const sg = C.createGain(); sg.gain.value = 0; so.connect(sf).connect(sg).connect(this.master); so.start();
    this.stepper = { o: so, g: sg };
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.05);
  }

  // continuous layers follow the machine state; rates are in cm/s of the process
  update(p) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, k = 0.08;
    const drive = Math.min(1, Math.abs(p.drumSpeed) / 6);
    this.motor.g.gain.setTargetAtTime(p.on ? 0.035 + 0.06 * drive : 0, t, k);
    this.motorOsc[0].frequency.setTargetAtTime(52 + 20 * drive, t, k);
    this.motorOsc[1].frequency.setTargetAtTime(104 + 40 * drive, t, k);
    this.whine.g.gain.setTargetAtTime(p.on ? 0.006 * drive : 0, t, k);
    this.whine.o.frequency.setTargetAtTime(330 + 260 * drive, t, k);
    this.poly.g.gain.setTargetAtTime(p.laser ? 0.006 : 0, t, 0.2);
    this.fan.g.gain.setTargetAtTime(p.on ? 0.05 : 0.0, t, 0.4);
    this.hiss.g.gain.setTargetAtTime(p.fuser ? 0.008 : 0, t, 0.3);
    const sp = Math.abs(p.scanSpeed);
    this.stepper.g.gain.setTargetAtTime(sp > 0.05 ? 0.018 : 0, t, 0.05);
    this.stepper.o.frequency.setTargetAtTime(120 + sp * 40, t, 0.05);
  }

  // one-shot events
  click(gain = 0.25) { this.burst({ f: 2400, q: 1.2, dur: 0.035, gain }); this.thump(90, 0.06, gain * 0.8); }
  swish(dur = 0.5, gain = 0.12) { this.burst({ f: 2800, q: 0.7, dur, gain, sweep: 0.6 }); }
  lid(gain = 0.45) { this.thump(70, 0.18, gain); this.burst({ f: 900, q: 0.8, dur: 0.08, gain: gain * 0.3 }); }
  beep() { this.tone(1320, 0.06, 0.05); setTimeout(() => this.tone(1760, 0.08, 0.05), 70); }
  blip() { this.tone(900 + Math.random() * 900, 0.03, 0.02); }

  burst({ f, q, dur, gain, sweep = 0 }) {
    if (!this.ctx || this.muted) return;
    const C = this.ctx, t = C.currentTime;
    const s = C.createBufferSource(); s.buffer = this.noise;
    const fl = C.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (sweep) fl.frequency.exponentialRampToValueAtTime(f * (1 - sweep * 0.7), t + dur);
    const g = C.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + Math.min(0.05, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    s.connect(fl).connect(g).connect(this.master); s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  thump(f, dur, gain) {
    if (!this.ctx || this.muted) return;
    const C = this.ctx, t = C.currentTime;
    const o = C.createOscillator(); o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f * 0.6, t + dur);
    const g = C.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
  tone(f, dur, gain) {
    if (!this.ctx || this.muted) return;
    const C = this.ctx, t = C.currentTime;
    const o = C.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = C.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur);
    o.connect(g).connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  }
}

function makeNoise(C) {
  const len = C.sampleRate * 2, b = C.createBuffer(1, len, C.sampleRate), d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = 0.97 * last + 0.03 * w; d[i] = w * 0.6 + last * 3; }
  return b;
}
