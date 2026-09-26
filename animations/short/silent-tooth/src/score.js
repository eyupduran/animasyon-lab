// The score and the mechanism's clock. The pinned cylinder turns by B(t) beats (24 per turn);
// every pin's pluck time is solved from that curve, so picture and sound share one clock.
// The spring runs down in the third turn: the melody slows until the broken pin reaches the
// hero tooth exactly at TC (the climax), and the cylinder stops right after.
import { clamp, smooth, smoother, inOutCubic, inOutSine, outCubic, backOut, noise1, kf } from './util.js';

export const TOTAL = 64;
export const BPR = 24;            // beats per revolution
export const BEAT = 0.46;         // seconds per beat at full spring
export const T_REL = 2.0;         // the stop lever releases the mechanism
export const TC = 41.6;           // climax: the broken pin lets go of the hero tooth
export const HERO = 7;            // the C6 tooth: its pin is broken, it has never rung

// comb, low to high (MIDI). 18 teeth.
export const PITCH = [72, 74, 76, 77, 79, 81, 83, 84, 86, 88, 89, 91, 93, 95, 96, 98, 100, 103];
const NAME = { C5: 0, D5: 1, E5: 2, F5: 3, G5: 4, A5: 5, B5: 6, C6: 7, D6: 8, E6: 9, F6: 10, G6: 11, A6: 12, B6: 13, C7: 14, D7: 15, E7: 16, G7: 17 };
// one revolution of the cylinder: an original waltz in C major that rises "re – si – …" and stops
// where "do" should land (beat 21: the broken pin)
const SONG = [
  [0, 'E6'], [0, 'C5'], [1, 'G6'], [1.5, 'G5'], [2, 'A6'],
  [3, 'G6'], [3, 'E5'], [4, 'C7'], [4.5, 'G5'], [5, 'E6'], [5.5, 'B6'],
  [6, 'F6'], [6, 'F5'], [7, 'E6'], [7.5, 'A5'], [8, 'D6'],
  [9, 'E6'], [9, 'C5'], [10, 'E5'], [10, 'D7'], [10.5, 'G5'], [11, 'G6'],
  [12, 'A6'], [12, 'F5'], [13, 'G6'], [13, 'E7'], [13.5, 'A5'], [14, 'F6'],
  [15, 'E6'], [15, 'C5'], [16, 'G6'], [16.5, 'E5'], [16.5, 'G7'], [17, 'F6'],
  [18, 'E6'], [18, 'G5'], [19, 'D6'], [19.5, 'D5'], [20, 'B5'],
];
// the first pins sit half a beat before the tooth line, so nothing sounds before the mechanism moves
const LEAD = 0.5;
export const STUB_BEAT = 21 + LEAD;
export const PINS = SONG.map(([b, n]) => ({ b: b + LEAD, tooth: NAME[n] }));

// ---------------- mechanism geometry (millimetres) ----------------
export const R = 4.6;             // cylinder radius
export const HP = 0.6;            // pin height
export const HS = 0.2;            // what is left of the broken pin
export const Y_UNDER = 4.98;      // underside of a tooth tip at rest
export const TOOTH_T = 0.45;      // tooth thickness
export const toothX = i => (i - 8.5) * 2.0;
export const toothLen = i => 11 - 4.5 * i / 17;

// ---------------- clock ----------------
const R0 = 1 / BEAT, TAU = 14.5, DT = 0.002;
function rate(t, ts) {
  if (t < T_REL) return 0;
  let r = R0 * (1 - Math.exp(-(t - T_REL) / 0.12));
  if (t > ts) r *= Math.exp(-(t - ts) / TAU);
  if (t > TC) r *= 1 - smoother((t - TC) / 1.3);
  return r;
}
function integrate(ts, until) { let b = 0; for (let t = 0; t < until; t += DT) b += rate(t + DT / 2, ts) * DT; return b; }
// solve the moment the spring starts to fade so the broken pin arrives exactly at TC
const TARGET = 2 * BPR + STUB_BEAT;
let lo = 10, hi = 40;
for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (integrate(m, TC) < TARGET) lo = m; else hi = m; }
export const T_FADE = (lo + hi) / 2;
const TABLE = new Float64Array(Math.ceil(TOTAL / DT) + 2);
{ let b = 0; for (let i = 1; i < TABLE.length; i++) { b += rate((i - 0.5) * DT, T_FADE) * DT; TABLE[i] = b; } }
export function beatsAt(t) {
  const x = clamp(t, 0, TOTAL) / DT, i = Math.floor(x), f = x - i;
  return TABLE[i] + (TABLE[Math.min(TABLE.length - 1, i + 1)] - TABLE[i]) * f;
}
export const rateAt = t => rate(t, T_FADE);
export function timeOfBeat(b) {
  let a = 0, z = TABLE.length - 1;
  if (b > TABLE[z]) return Infinity;
  while (z - a > 1) { const m = (a + z) >> 1; if (TABLE[m] < b) a = m; else z = m; }
  return (a + (b - TABLE[a]) / Math.max(1e-9, TABLE[z] - TABLE[a])) * DT;
}
export const B_END = TABLE[TABLE.length - 1];

// every pluck in the film: { t, tooth, b } (broken-pin passes are listed apart)
export const NOTES = [];
export const STUBS = [];
for (let rev = 0; rev < 3; rev++) {
  for (const p of PINS) { const b = rev * BPR + p.b; const t = timeOfBeat(b); if (t < TOTAL) NOTES.push({ t, b, tooth: p.tooth }); }
  STUBS.push({ t: timeOfBeat(rev * BPR + STUB_BEAT), b: rev * BPR + STUB_BEAT });
}
NOTES.sort((a, b) => a.t - b.t);
export const T_MISS1 = STUBS[0].t, T_MISS2 = STUBS[1].t;
const byTooth = PITCH.map((_, i) => NOTES.filter(n => n.tooth === i));

// ---------------- the hero's will: how far it bends by itself (mm, negative = down toward the pins) ----------------
const M2 = T_MISS2;
export function heroReach(t) {
  let d = 0;
  // turn 1: after the silence, a small sag (disappointment)
  d += -0.035 * Math.sin(Math.PI * clamp((t - T_MISS1 - 0.25) / 1.4)) ** 2;
  // turn 2: wind-up, reach, fall short, spring back
  if (t > M2 - 2.2 && t < M2 + 0.08) {
    d += kf(t, [[M2 - 2.2, 0], [M2 - 1.85, 0.03, outCubic], [M2 - 0.2, -0.125, inOutCubic], [M2 + 0.08, -0.13]]);
  } else if (t >= M2 + 0.08) {
    const s = t - (M2 + 0.08);
    d += -0.13 * Math.exp(-s * 3.2) * Math.cos(2 * Math.PI * 4.2 * s);
  }
  // turn 3: starts down, loses heart and pulls back; then the long reach
  d += kf(t, [[33.0, 0], [33.9, -0.085, inOutCubic], [34.3, -0.09], [34.75, 0.025, (u) => backOut(u, 2.2)], [35.6, 0.015], [36.4, 0]]);
  if (t > 36.4 && t < TC) d += kf(t, [[36.4, 0], [37.9, -0.16, inOutCubic], [38.4, -0.15], [39.6, -0.36, inOutCubic], [TC, -0.36]]);
  return d;
}
// the effort tremor while it strains down (visible, fine)
export const heroStrain = t => t < TC ? clamp((t - 37.2) / 2.5) * (t < 40.9 ? 1 : 1 - clamp((t - 40.9) / 0.7) * 0.4) + 0.5 * Math.sin(Math.PI * clamp((t - M2 + 0.9) / 1.1)) : 0;

// ---------------- tooth deflection at the tip (mm, + = lifted) ----------------
const PHI = 2 * Math.PI / BPR;
const ringOf = (t, tr, a, tau, f) => t < tr ? 0 : a * Math.exp(-(t - tr) / tau) * Math.cos(2 * Math.PI * f * (t - tr));
export function toothDeflect(i, t, B = beatsAt(t)) {
  const hero = i === HERO;
  const rest = hero ? heroReach(t) : 0;
  let d = rest;
  // pins in contact: a pin rising under the tip lifts it (real geometry: tip of the pin at radius R+HP)
  const pins = hero ? STUBS : byTooth[i];
  const hp = hero ? HS : HP;
  let lastRel = null;
  for (const n of pins) {
    const phi = (n.b - B) * PHI;
    if (phi > 0 && phi < 0.42) d = Math.max(d, (R + hp) * Math.cos(phi) - Y_UNDER);
    if (phi <= 0 && (!lastRel || n.t > lastRel.t)) lastRel = n;
  }
  if (!hero) {
    // ring after each release (the last two cover quick repeats)
    for (const n of pins) if (n.t <= t && t - n.t < 3) d += ringOf(t, n.t, (R + HP) - Y_UNDER, 0.42, 8.5 + i * 0.2);
    return d;
  }
  // the hero: sympathetic quiver when its neighbours ring
  for (const n of NOTES) if ((n.tooth === 6 || n.tooth === 8 || n.tooth === 0 || n.tooth === 14) && n.t <= t && t - n.t < 2) d += ringOf(t, n.t, 0.022, 0.5, 6.1);
  // strain tremor
  const st = heroStrain(t);
  if (st > 0) d += st * 0.012 * noise1(t * 26, 3);
  // the climax: released from the broken pin, it rings for the first time (drawn larger than life)
  if (t >= TC) {
    const s = t - TC, restAfter = -0.03;
    const a0 = (R + HS) - Y_UNDER - restAfter;       // where the pin let go
    d = restAfter + a0 * (1 + 1.1 * smooth(s / 0.07)) * Math.exp(-s / 3.4) * Math.cos(2 * Math.PI * 7.5 * s);
  }
  return d;
}
// when the reaching hero first touches the broken pin (a small tick in the sound)
export const T_TOUCH = (() => { for (let t = 38; t < TC; t += 0.005) { const B = beatsAt(t), phi = (STUBS[2].b - B) * PHI; if ((R + HS) * Math.cos(phi) - Y_UNDER > heroReach(t)) return t; } return TC - 1; })();
