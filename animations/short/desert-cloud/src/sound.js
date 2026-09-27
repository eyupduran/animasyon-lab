// The whole soundtrack, synthesised once with an OfflineAudioContext: dry wind and cicadas,
// the cloud's small voice, drops and a hiss, a three-note kalimba motif, the rising pad,
// the thunderclap, the downpour, glassy chimes for the meadow, and silence at the end.
import { TOTAL, CLIMAX, SIZZLE } from './score.js';
import { mulberry } from './util.js';

const SR = 44100;
const NOTE = n => 440 * Math.pow(2, (n - 69) / 12);
const C5 = 72, D5 = 74, E5 = 76, G5 = 79, A5 = 81, C6 = 84, E6 = 88, G6 = 91;

export async function renderSoundtrack() {
  const ctx = new OfflineAudioContext(2, Math.ceil(TOTAL * SR), SR);
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.3;
  const master = ctx.createGain(); master.gain.value = 2.2;
  const out = ctx.createGain(); out.gain.value = 0.72;            // headroom for the thunder
  master.connect(comp); comp.connect(out); out.connect(ctx.destination);
  const rnd = mulberry(2026);

  // one long noise buffer, reused by every noisy source
  const nb = ctx.createBuffer(1, SR * 4, SR); const nd = nb.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = rnd() * 2 - 1;
  const noise = (t0, t1, off = 0) => { const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true; s.start(t0, off % 4); s.stop(t1); return s; };
  const pan = (x) => { const p = ctx.createStereoPanner(); p.pan.value = x; p.connect(master); return p; };
  const env = (g, pts) => { g.gain.setValueAtTime(pts[0][1], pts[0][0]); for (const [t, v] of pts.slice(1)) g.gain.linearRampToValueAtTime(v, t); };

  // ---- wind bed ----
  {
    const s = noise(0, TOTAL);
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.7;
    const g = ctx.createGain();
    s.connect(f); f.connect(g); g.connect(pan(0));
    f.frequency.setValueAtTime(420, 0);
    const pts = [[0, 0.0], [1.2, 0.09]];
    for (let t = 2; t < 24; t += 1.6) pts.push([t, 0.06 + 0.06 * rnd()]);
    pts.push([25.5, 0.16], [29, 0.2], [34, 0.26], [40.2, 0.22], [41.2, 0.04], [42.55, 0.02], [43.2, 0.22], [47, 0.2], [51, 0.07], [58, 0.05], [61, 0.03], [63.2, 0]);
    env(g, pts);
    f.frequency.setValueAtTime(420, 24); f.frequency.exponentialRampToValueAtTime(900, 31); f.frequency.exponentialRampToValueAtTime(1500, 40); f.frequency.exponentialRampToValueAtTime(500, 43); f.frequency.exponentialRampToValueAtTime(380, 60);
  }
  // ---- cicadas in the heat ----
  for (const [fr, p, ph] of [[5200, -0.5, 0], [6100, 0.45, 0.7]]) {
    const o = ctx.createOscillator(); o.frequency.value = fr;
    const am = ctx.createGain(); am.gain.value = 0;
    const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 27 + ph * 5;
    const lg = ctx.createGain(); lg.gain.value = 0.5; lfo.connect(lg); lg.connect(am.gain);
    const g = ctx.createGain();
    o.connect(am); am.connect(g); g.connect(pan(p));
    const pts = [[0, 0]];
    for (let t = 0.5 + ph; t < 23; t += 2.6) pts.push([t, 0.0], [t + 0.8, 0.012], [t + 1.9, 0.006]);
    pts.push([24.5, 0]);
    env(g, pts);
    o.start(0); lfo.start(0); o.stop(25); lfo.stop(25);
  }

  // ---- the cloud's voice: soft sine "bups" with a glide ----
  const voice = (t, f0, f1, d, v = 0.12, wob = 0) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    const o2 = ctx.createOscillator(); o2.type = 'triangle';
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d);
    o2.frequency.setValueAtTime(f0 * 2, t); o2.frequency.exponentialRampToValueAtTime(f1 * 2, t + d);
    if (wob) { const l = ctx.createOscillator(); l.frequency.value = 9; const lg = ctx.createGain(); lg.gain.value = wob; l.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency); l.start(t); l.stop(t + d + 0.1); }
    const g = ctx.createGain(); const g2 = ctx.createGain(); g2.gain.value = 0.18;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(f); f.connect(pan(0.1));
    env(g, [[t, 0], [t + 0.025, v], [t + d * 0.7, v * 0.7], [t + d, 0]]);
    o.start(t); o2.start(t); o.stop(t + d + 0.05); o2.stop(t + d + 0.05);
  };
  voice(6.62, 520, 760, 0.16);
  voice(8.85, 560, 900, 0.22, 0.1);
  voice(10.25, 700, 640, 0.12, 0.07);
  voice(13.2, 470, 400, 0.2, 0.08);
  voice(17.0, 420, 360, 0.18, 0.08);
  voice(17.75, 620, 720, 1.4, 0.07, 18);
  voice(21.7, 620, 380, 0.7, 0.1);
  voice(25.45, 480, 820, 0.28, 0.09);
  voice(26.5, 640, 520, 0.14, 0.07);
  voice(28.2, 600, 500, 0.14, 0.06);
  voice(29.1, 480, 1150, 0.8, 0.1);
  voice(57.4, 520, 980, 0.2, 0.1); voice(58.1, 600, 1100, 0.18, 0.09); voice(58.8, 660, 1250, 0.3, 0.1);

  // ---- drops, tiny hisses, the sizzle ----
  const hiss = (t, d, v, fr = 4000) => {
    const s = noise(t, t + d + 0.05, t * 3.7); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = fr;
    const g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(pan(0.15));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0005, t + d);
  };
  const plink = (t, f0, v = 0.12) => {
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.12);
    const g = ctx.createGain(); o.connect(g); g.connect(pan(0.2));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18);
    o.start(t); o.stop(t + 0.2);
  };
  for (const [t0, life] of [[18.2, 0.62], [18.55, 0.9], [18.95, 1.25]]) hiss(t0 + life, 0.25, 0.04, 5000);
  plink(SIZZLE, 1500, 0.14);
  hiss(SIZZLE + 0.01, 1.3, 0.12, 2500);

  // ---- kalimba motif ----
  const kal = (t, n, v = 0.13, p = 0) => {
    const f = NOTE(n);
    for (const [m, a, d] of [[1, 1, 1.4], [2.76, 0.25, 0.25], [5.4, 0.08, 0.12]]) {
      const o = ctx.createOscillator(); o.frequency.value = f * m;
      const g = ctx.createGain(); o.connect(g); g.connect(pan(p));
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0003, t + d);
      o.start(t); o.stop(t + d + 0.05);
    }
  };
  kal(9.0, E5, 0.1); kal(9.35, G5, 0.1);                                     // hope
  kal(22.0, G5, 0.1); kal(22.45, E5, 0.09); kal(22.95, D5, 0.09);            // it didn't work
  kal(55.25, E5, 0.11); kal(55.6, G5, 0.11); kal(55.95, C6, 0.13);           // it did
  kal(57.55, C5, 0.08, -0.2); kal(58.25, E5, 0.08, 0); kal(58.95, G5, 0.1, 0.2); kal(59.6, C6, 0.09, 0);

  // ---- pad: rises with the climb, holds its breath, resolves after the storm ----
  const pad = (notes, pts, fpts, gain = 1) => {
    const g = ctx.createGain(); const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.Q.value = 0.8;
    g.connect(f); f.connect(pan(0));
    env(g, pts.map(([t, v]) => [t, v * gain]));
    f.frequency.setValueAtTime(fpts[0][1], fpts[0][0]); for (const [t, v] of fpts.slice(1)) f.frequency.exponentialRampToValueAtTime(v, t);
    const t0 = pts[0][0], t1 = pts[pts.length - 1][0];
    notes.forEach((n, i) => { for (const det of [-6, 5]) { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = NOTE(n); o.detune.value = det + i; o.connect(g); o.start(t0); o.stop(t1 + 0.1); } });
  };
  pad([48, 55, 62, 64], [[28.8, 0], [31, 0.012], [36, 0.03], [40.5, 0.045], [42.1, 0.05], [42.35, 0.0], [42.6, 0]], [[28.8, 260], [36, 900], [42.2, 2600]]);
  pad([53, 60, 64, 69], [[43.5, 0], [46, 0.018], [48.6, 0.028], [52, 0.03], [58, 0.024], [61.5, 0.01], [63.3, 0]], [[43.5, 500], [48.6, 1800], [63, 700]]);

  // ---- thunder: crack, body, sub drop, rumble ----
  const thunder = (t, v, far = 0) => {
    const s1 = noise(t, t + 0.3, 1.3); const f1 = ctx.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = far ? 1500 : 900;
    const g1 = ctx.createGain(); s1.connect(f1); f1.connect(g1); g1.connect(pan(-0.1));
    g1.gain.setValueAtTime(0, t); g1.gain.linearRampToValueAtTime(0.28 * v * (1 - far), t + 0.006); g1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    const s2 = noise(t, t + 5, 2.1); const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.setValueAtTime(700, t); f2.frequency.exponentialRampToValueAtTime(120, t + 3);
    const g2 = ctx.createGain(); s2.connect(f2); f2.connect(g2); g2.connect(pan(0));
    g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.65 * v, t + 0.03);
    for (let k = 0.3; k < 4.5; k += 0.35) g2.gain.linearRampToValueAtTime(v * 0.9 * Math.exp(-k * 0.9) * (0.5 + rnd()), t + k);
    g2.gain.linearRampToValueAtTime(0, t + 4.9);
    const o = ctx.createOscillator(); o.frequency.setValueAtTime(62, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.6);
    const g3 = ctx.createGain(); o.connect(g3); g3.connect(pan(0));
    g3.gain.setValueAtTime(0, t); g3.gain.linearRampToValueAtTime(0.4 * v, t + 0.02); g3.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
    o.start(t); o.stop(t + 1.9);
  };
  thunder(CLIMAX, 1);
  thunder(45.25, 0.45, 1);
  thunder(47.35, 0.22, 1);

  // ---- the downpour ----
  {
    const s = noise(CLIMAX, 52, 0.4); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2600; f.Q.value = 0.4;
    const g = ctx.createGain(); s.connect(f); f.connect(g); g.connect(pan(0));
    env(g, [[CLIMAX, 0], [CLIMAX + 0.6, 0.26], [46.8, 0.24], [51.4, 0], [52, 0]]);
    const s2 = noise(CLIMAX, 52, 2.9); const f2 = ctx.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = 700;
    const g2 = ctx.createGain(); s2.connect(f2); f2.connect(g2); g2.connect(pan(0));
    env(g2, [[CLIMAX, 0], [CLIMAX + 0.9, 0.16], [46.8, 0.15], [51.4, 0], [52, 0]]);
    // pattering on stone and leaves
    for (let t = CLIMAX + 0.3; t < 51; t += 0.012 + rnd() * 0.03) {
      const dens = t < 46.8 ? 1 : 1 - (t - 46.8) / 4.2;
      if (rnd() > dens) continue;
      plink(t, 1800 + rnd() * 2600, 0.012 + rnd() * 0.02);
    }
    // the last drops
    for (const t of [51.4, 51.9, 52.7, 53.6]) plink(t, 1400 + rnd() * 800, 0.05);
  }

  // ---- glass chimes as the meadow runs out from the bud ----
  {
    const scale = [C6, D5 + 12, E6, G5 + 12, A5 + 12, G6];
    for (let t = 49.4; t < 55; t += 0.09 + rnd() * 0.12) {
      const dens = Math.sin(Math.PI * (t - 49.4) / 5.6);
      if (rnd() > dens) continue;
      const n = scale[Math.floor(rnd() * scale.length)];
      const o = ctx.createOscillator(); o.frequency.value = NOTE(n);
      const g = ctx.createGain(); o.connect(g); g.connect(pan(rnd() * 1.4 - 0.7));
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.025, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0003, t + 1.1);
      o.start(t); o.stop(t + 1.15);
    }
  }

  return ctx.startRendering();
}
