// The whole soundtrack, rendered once with an OfflineAudioContext (Web Audio, nothing recorded).
// The page plays this buffer live and the video takes the same buffer: they are identical.
// Layers: room tone · the governor's whirr and gear ticks (their speed follows the cylinder) ·
// music-box notes (a tooth's real modes: fundamental, a close twin that beats, ~5.9× partial, click) ·
// silence where "do" should be · the hero's creak · the climax (box thump, the long do, sympathetic
// teeth, a rising pad) · then nothing.
import { TOTAL, NOTES, PITCH, T_REL, TC, T_MISS2, T_TOUCH, rateAt, beatsAt, toothX, BEAT, B_END } from './score.js';
import { rng, clamp } from './util.js';

const mtof = m => 440 * 2 ** ((m - 69) / 12);
const R0 = 1 / BEAT;

function noiseBuffer(ctx, secs, seed) {
  const b = ctx.createBuffer(1, Math.ceil(secs * ctx.sampleRate), ctx.sampleRate), d = b.getChannelData(0), r = rng(seed);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  return b;
}
// exponentially decaying, low-passed noise: a small wooden box / a quiet room
function impulse(ctx, secs, damp, seed) {
  const n = Math.ceil(secs * ctx.sampleRate), b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c), r = rng(seed + c * 101); let lp = 0;
    for (let i = 0; i < n; i++) { const x = r() * 2 - 1; lp += (x - lp) * damp; d[i] = lp * Math.exp(-6.9 * i / n) * (i < 40 ? i / 40 : 1); }
  }
  return b;
}
// a curve sampled from a function of time, for setValueCurveAtTime
const curve = (f, t0, t1, hz = 60) => { const n = Math.max(2, Math.ceil((t1 - t0) * hz)); const a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = f(t0 + (t1 - t0) * i / (n - 1)); return a; };

export async function renderSoundtrack(sr = 48000) {
  const ctx = new OfflineAudioContext(2, Math.ceil(TOTAL * sr), sr);
  // the film ends in silence: everything is gone by 59 s
  const out = ctx.createGain(); out.gain.setValueAtTime(1, 0); out.gain.setValueAtTime(1, 54); out.gain.linearRampToValueAtTime(0, 59);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 2.5; comp.attack.value = 0.004; comp.release.value = 0.3;
  out.connect(comp); comp.connect(ctx.destination);
  const box = ctx.createConvolver(); box.normalize = true; box.buffer = impulse(ctx, 0.7, 0.35, 11);
  const room = ctx.createConvolver(); room.normalize = true; room.buffer = impulse(ctx, 3.2, 0.12, 23);
  const boxG = ctx.createGain(); boxG.gain.value = 0.55; box.connect(boxG); boxG.connect(out);
  const roomG = ctx.createGain(); roomG.gain.value = 0.5; room.connect(roomG); roomG.connect(out);
  const noise = noiseBuffer(ctx, 4, 7);
  const bus = (pan = 0, sBox = 0.3, sRoom = 0.12) => {
    const g = ctx.createGain(), p = ctx.createStereoPanner(); p.pan.value = pan;
    g.connect(p); p.connect(out);
    const a = ctx.createGain(); a.gain.value = sBox; g.connect(a); a.connect(box);
    const b = ctx.createGain(); b.gain.value = sRoom; g.connect(b); b.connect(room);
    return g;
  };
  const noiseSrc = (t, dur) => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(t, (t * 1.37) % 3); s.stop(t + dur); return s; };
  // ambience duck: everything but the climax draws back just before it
  const duck = t => 1 - 0.8 * clamp((t - 39.6) / 1.8) + 0.45 * clamp((t - TC - 0.2) / 3);

  // ---------------- room tone ----------------
  {
    const s = noiseSrc(0, TOTAL, true), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    const g = ctx.createGain();
    g.gain.setValueCurveAtTime(curve(t => 0.05 * clamp(t / 1.5) * duck(t) * (1 - clamp((t - 52) / 5)), 0, TOTAL, 20), 0, TOTAL);
    s.connect(lp); lp.connect(g); g.connect(out);
  }

  // ---------------- governor whirr (air brake) ----------------
  {
    const rn = t => rateAt(t) / R0;
    const s = noiseSrc(T_REL - 0.05, TC + 2 - T_REL, true);
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueCurveAtTime(curve(t => 260 + 900 * rn(t), T_REL, TC + 1.9), T_REL, TC + 1.9 - T_REL);
    const am = ctx.createGain(); am.gain.value = 0.62;
    const lfo = ctx.createOscillator(); lfo.type = 'triangle';
    lfo.frequency.setValueCurveAtTime(curve(t => Math.max(0.1, 2 * 1.1 * rateAt(t)), T_REL, TC + 1.9), T_REL, TC + 1.9 - T_REL);
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.38; lfo.connect(lfoG); lfoG.connect(am.gain);
    lfo.start(T_REL); lfo.stop(TC + 2);
    const g = ctx.createGain();
    g.gain.setValueCurveAtTime(curve(t => 0.042 * Math.min(1, rn(t) * 1.2) * duck(t), T_REL, TC + 1.9), T_REL, TC + 1.9 - T_REL);
    s.connect(bp); bp.connect(am); am.connect(g); g.connect(bus(-0.55, 0.4, 0.05));
  }

  // ---------------- clicks written straight into buffers (gear ticks, creak) ----------------
  const clickTrack = (events, seed) => {
    const b = ctx.createBuffer(1, Math.ceil(TOTAL * sr), sr), d = b.getChannelData(0), r = rng(seed);
    for (const [t, a, len] of events) { const i0 = Math.floor(t * sr), n = Math.floor(len * sr); for (let k = 0; k < n && i0 + k < d.length; k++) d[i0 + k] += a * (r() * 2 - 1) * Math.exp(-5 * k / n); }
    const s = ctx.createBufferSource(); s.buffer = b; s.start(0); return s;
  };
  {
    // 44-tooth cylinder gear: a tick each time a tooth engages
    const ev = [];
    for (let k = 1; k < B_END * 44 / 24; k++) { const b = k * 24 / 44; let t = 0, lo = 0, hi = TOTAL; for (let j = 0; j < 40; j++) { const m = (lo + hi) / 2; if (beatsAt(m) < b) lo = m; else hi = m; } t = hi; if (t < TOTAL - 1) ev.push([t, 0.5 * (0.45 + 0.55 * rateAt(t) / R0) * duck(t), 0.004]); }
    const s = clickTrack(ev, 5), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3100; bp.Q.value = 6;
    const g = ctx.createGain(); g.gain.value = 0.03; s.connect(bp); bp.connect(g); g.connect(bus(0.5, 0.5, 0.05));
  }
  {
    // the hero's creak: stick-slip micro impulses, denser as it strains, through two narrow resonances
    const ev = [], r = rng(99);
    const strain = t => (t > 36.9 && t < 41.5 ? clamp((t - 36.9) / 3.5) : 0) + (t > T_MISS2 - 0.9 && t < T_MISS2 + 0.05 ? 0.4 : 0);
    for (let t = 0; t < TC; ) { const s = strain(t); if (s <= 0) { t += 0.01; continue; } t += 1 / (20 + 90 * s) * (0.5 + r()); ev.push([t, 0.4 + 0.6 * s * r(), 0.002]); }
    const s = clickTrack(ev, 17);
    const g = ctx.createGain(); g.gain.value = 0.07;
    for (const [f, q, a] of [[2350, 28, 1], [3620, 35, 0.6], [5100, 30, 0.3]]) { const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q; const ga = ctx.createGain(); ga.gain.value = a; s.connect(bp); bp.connect(ga); ga.connect(g); }
    g.connect(bus(-0.1, 0.2, 0.05));
  }

  // ---------------- small mechanical sounds ----------------
  const tick = (t, f, q, amp, len, pan = 0, sBox = 0.3) => {
    const s = noiseSrc(t, len), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(amp, t); g.gain.setTargetAtTime(0, t + 0.001, len / 4);
    s.connect(bp); bp.connect(g); g.connect(bus(pan, sBox, 0.05));
  };
  const thump = (t, f0, f1, amp, tau) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + tau * 2);
    const g = ctx.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(amp, t + 0.003); g.gain.setTargetAtTime(0, t + 0.004, tau);
    o.connect(g); g.connect(bus(0, 0.6, 0.2)); o.start(t); o.stop(t + tau * 8);
  };
  // the stop lever lets go
  tick(T_REL - 0.02, 2400, 3, 0.35, 0.03, -0.2); thump(T_REL - 0.02, 190, 120, 0.12, 0.04);
  // turn 2: the reach falls short and the tooth springs back (a dull, dusty tick)
  tick(T_MISS2 + 0.09, 1300, 2, 0.12, 0.05, -0.1, 0.5);
  // turn 3: tooth meets the broken pin
  tick(T_TOUCH, 5200, 9, 0.16, 0.02, -0.1, 0.5);

  // ---------------- music-box notes ----------------
  const note = (t, f, amp, decay, pan, sBox = 0.32, sRoom = 0.12, attack = 0.0015) => {
    const g = bus(pan, sBox, sRoom);
    const part = (ratio, a, dec, det = 0) => {
      const fr = f * ratio; if (fr > 17000) return;
      const o = ctx.createOscillator(); o.frequency.value = fr; if (det) o.detune.value = det;
      const e = ctx.createGain(); e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp * a, t + attack); e.gain.setTargetAtTime(0, t + attack, dec);
      o.connect(e); e.connect(g); o.start(t); o.stop(t + attack + dec * 7);
    };
    part(1, 1, decay);
    part(1, 0.32, decay * 0.8, 3.8);          // a twin mode a few cents off: the shimmer of a steel tooth
    part(5.93, 0.2, Math.min(0.14, decay * 0.2));
    part(2.0, 0.05, decay * 0.4);
    // the pin's click
    const s = noiseSrc(t, 0.012), hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2800;
    const e = ctx.createGain(); e.gain.setValueAtTime(amp * 0.22, t); e.gain.setTargetAtTime(0, t, 0.0025);
    s.connect(hp); hp.connect(e); e.connect(g);
  };
  for (const n of NOTES) {
    const f = mtof(PITCH[n.tooth]), lowness = 1 - n.tooth / 17;
    note(n.t, f, 0.16 + 0.05 * lowness, 0.55 + 1.4 * lowness, clamp(toothX(n.tooth) / 20) * 0.45);
  }

  // ---------------- the climax ----------------
  thump(TC, 78, 46, 0.95, 0.22);
  {
    const s = noiseSrc(TC, 0.25), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.5, TC); g.gain.setTargetAtTime(0, TC, 0.05);
    s.connect(lp); lp.connect(g); g.connect(bus(0, 0.6, 0.2));
  }
  const DO = mtof(84);
  note(TC, DO, 0.75, 3.8, -0.05, 0.45, 0.4);
  // sympathetic teeth: the other C's and the G swell in under it
  note(TC + 0.05, mtof(72), 0.075, 5.5, -0.35, 0.3, 0.4, 0.5);
  note(TC + 0.1, mtof(96), 0.05, 4.0, 0.3, 0.3, 0.4, 0.35);
  note(TC + 0.15, mtof(91), 0.035, 4.0, 0.2, 0.3, 0.4, 0.7);
  // dust leaving the tooth
  {
    const s = noiseSrc(TC + 0.03, 2.2), bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 4200; bp.Q.value = 0.7;
    const g = ctx.createGain(); g.gain.setValueAtTime(0, TC + 0.03); g.gain.linearRampToValueAtTime(0.03, TC + 0.2); g.gain.setTargetAtTime(0, TC + 0.25, 0.45);
    s.connect(bp); bp.connect(g); g.connect(bus(0, 0.1, 0.4));
  }
  // rising pad: soft triangles on C major, opening filter, then gone
  {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 0.4;
    lp.frequency.setValueAtTime(260, TC); lp.frequency.exponentialRampToValueAtTime(1700, TC + 4); lp.frequency.exponentialRampToValueAtTime(700, TC + 13);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, TC); g.gain.linearRampToValueAtTime(0.05, TC + 4); g.gain.linearRampToValueAtTime(0.036, TC + 9); g.gain.linearRampToValueAtTime(0, TC + 14.5);
    lp.connect(g); g.connect(bus(0, 0.1, 0.55));
    for (const [f, d] of [[130.81, -5], [196, 4], [261.63, -3], [329.63, 5], [392, -4], [523.25, 3]]) {
      for (const dd of [d, -d * 0.7]) { const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = dd; o.connect(lp); o.start(TC); o.stop(TC + 15); }
    }
  }

  const buf = await ctx.startRendering();
  // normalise to −1 dBFS
  let peak = 0; for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) peak = Math.max(peak, Math.abs(d[i])); }
  const k = peak > 0 ? 0.89 / peak : 1;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i++) d[i] *= k; }
  return buf;
}
