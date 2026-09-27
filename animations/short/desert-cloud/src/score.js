// The story as pure functions of time: what the cloud does (hero), what the weather does (env)
// and how the light looks (look). Everything the renderer draws is read from here.
import * as THREE from 'three';
import { track, smooth, clamp, lerp, noise1, EASE } from './util.js';

export const TOTAL = 66.5;
export const TITLE = 63.5;
export const CLIMAX = 42.6;                 // the thunderclap: 64 % of the film
export const BUD = [0, 0, 0];               // the wilted bud in the crack

const blinks = [5.3, 7.5, 12.3, 23.2, 26.05, 32.5, 50.2, 57.25, 61.3];
function blink(t) { let b = 0; for (const s of blinks) { const d = Math.abs(t - s); if (d < 0.11) b = Math.max(b, 1 - d / 0.11); } return b; }

// damped wobble after an event: A·e^(−k·dt)·sin(w·dt)
const wob = (t, t0, A, k = 5, w = 16) => (t < t0 ? 0 : A * Math.exp(-k * (t - t0)) * Math.sin(w * (t - t0)));
// a hop: 0 → h → 0 over [t0, t0+d]
const hop = (t, t0, d, h) => { const k = (t - t0) / d; return k > 0 && k < 1 ? 4 * h * k * (1 - k) : 0; };

const POS = [
  [0, [24, 5.2, 3]],
  [1.2, [24, 5.2, 3]],
  [6.6, [3.1, 4.1, 1.0], 'out'],
  [8.4, [3.0, 4.2, 1.0]],
  [10.2, [1.7, 3.15, 0.8], 'io'],
  [11.1, [1.62, 3.2, 0.8]],
  [13.2, [0.95, 1.95, 0.55], 'io'],
  [16.8, [0.95, 1.98, 0.55]],
  [17.35, [0.95, 2.2, 0.55], 'out'],
  [17.8, [0.95, 1.88, 0.55], 'in'],
  [21.4, [0.95, 1.9, 0.55]],
  [23.4, [1.05, 1.6, 0.75], 'io'],
  [24.6, [1.05, 1.62, 0.75]],
  [25.6, [1.0, 2.15, 0.35]],
  [26.5, [0.95, 2.2, 1.35], 'out'],        // no: drifts back toward the bud
  [27.4, [0.9, 2.45, -0.7]],
  [28.2, [0.9, 2.35, 0.7], 'out'],         // no again
  [29.1, [0.85, 2.7, -0.9], 'in'],         // lets go
  [31.0, [0.3, 7.5, -17], 'in'],
  [34.0, [0.0, 13, -42], 'sine'],
  [37.2, [0.0, 27, -55]],
  [40.5, [0.0, 44, -48], 'out'],
  [42.6, [0.0, 45, -48]],
  [48.4, [0.0, 44, -46]],
  [52.5, [0.6, 16, -16], 'in'],
  [56.4, [1.05, 1.85, 0.7], 'out'],
  [60.3, [1.0, 1.9, 0.65]],
  [63.6, [5, 7.2, 3], 'in'],
  [66.5, [8, 9.5, 1]],
];
const SCALE = [
  [0, 0.62], [21.0, 0.62], [23.4, 0.56], [29, 0.56], [31, 0.66],
  [33.5, 2.2, 'in'], [36.2, 7.5], [38.6, 15], [40.5, 19, 'out'],
  [42.4, 20.4], [42.6, 19.6], [48.4, 15.5], [50.5, 9], [53.2, 2.2], [56.4, 0.64, 'out'], [66.5, 0.64],
];
// tower growth: extra bubbles boil up while it climbs (0 small cumulus → 1 cumulonimbus)
const GROW = [[0, 0], [31.5, 0], [37.8, 0.75, 'io'], [40.6, 1, 'out'], [48.4, 1], [53.5, 0, 'io']];
const YAW = [
  [0, -0.55], [6.6, -0.5], [7.3, 0.35], [8.1, -0.25], [9, -0.35], [13.2, -0.15], [24.6, -0.15],
  [25.7, 2.55, 'io'], [26.5, 0.5, 'out'], [27.4, 2.6, 'io'], [28.2, 0.9, 'out'], [29.2, 2.9, 'io'],
  [31.2, 2.4], [33.8, 0.15, 'io'], [40.5, 0.0], [52.5, 0.0], [56.4, -0.2], [60.4, -0.1], [61.5, 0.9], [63.6, 1.4],
];
const GAZE = [
  [0, [-0.7, 0.05]], [6.5, [-0.6, 0.05]], [7.2, [0.7, 0.2]], [8.0, [-0.5, 0.15]],
  [8.8, [-0.5, -0.85], 'out'], [13.2, [-0.25, -1]], [24.2, [-0.1, -0.9]],
  [25.4, [0, 0.7]], [26.3, [-0.2, -0.8]], [27.3, [0, 0.8]], [28.1, [-0.2, -0.8]], [29.0, [0, 0.9]],
  [33, [0, 0.4]], [39.5, [0, -0.3]], [41.2, [0, -0.7]], [48.4, [0, -0.7]], [53, [-0.1, -0.8]],
  [56.4, [-0.35, -0.95]], [60.3, [-0.3, -0.8]], [61.0, [0.8, 0.1]], [62.0, [-0.6, -0.4]], [62.9, [0.8, 0.1]],
];
// 0 open … 1 shut (on top of blinks)
const LID = [
  [0, 0.05], [19.6, 0.05], [21.8, 0.5], [24.2, 0.5], [25.2, 0.0], [41.9, 0.0], [42.45, 1, 'in'],
  [47.3, 1], [48.2, 0.05, 'out'], [66.5, 0.05],
];
// happy squint (lower lids up); sad = droop
const HAPPY = [[0, 0], [52, 0], [53.5, 0.35], [57.4, 0.35], [57.7, 1, 'out'], [60.2, 1], [61, 0.2], [66.5, 0.2]];
const DROOP = [[0, 0], [19.8, 0], [22.2, 1, 'io'], [24.4, 1], [25.6, 0.3], [29.5, 0]];

export function hero(t) {
  let pos = track(t, POS);
  let S = track(t, SCALE);
  // bob and drift; small only while the cloud is small
  const small = clamp(1.6 - S * 0.6);
  pos = [
    pos[0] + noise1(t * 0.35 + 3) * 0.06 * small,
    pos[1] + Math.sin(t * 1.9) * 0.07 * small + Math.sin(t * 0.7) * 0.05,
    pos[2],
  ];
  // hops of joy by the flower
  pos[1] += hop(t, 57.55, 0.5, 0.55) + hop(t, 58.25, 0.45, 0.45) + hop(t, 58.95, 0.55, 0.7);
  // breath in before the thunder
  S *= 1 + 0.06 * smooth(40.9, 42.4, t) * (t < CLIMAX ? 1 : 0);

  // squash & stretch [sx, sy]
  let sy = 1;
  sy += wob(t, 6.6, 0.1, 4.5, 13);                                   // arrives
  sy -= 0.16 * (smooth(16.9, 17.3, t) - smooth(17.35, 17.55, t));      // anticipation crouch
  sy += 0.14 * (smooth(17.5, 17.75, t) - smooth(19.2, 19.5, t));       // wringing
  sy += (t > 17.7 && t < 19.3 ? 0.035 * Math.sin(t * 38) : 0);          // strain tremble
  sy += wob(t, 19.4, -0.09, 5, 15);
  sy -= 0.08 * track(t, DROOP);
  sy += wob(t, 29.1, 0.12, 3.5, 11);                                   // lets go
  sy += wob(t, CLIMAX, -0.1, 3, 9);                                    // exhale
  for (const h of [57.55, 58.25, 58.95]) { sy -= 0.2 * (smooth(h - 0.18, h - 0.03, t) - smooth(h - 0.03, h + 0.07, t)); sy += 0.12 * (smooth(h, h + 0.1, t) - smooth(h + 0.25, h + 0.45, t)); }
  sy += wob(t, 59.5, -0.12, 5, 14);
  const sx = 1 / Math.sqrt(Math.max(0.5, sy));

  const blinkK = blink(t);
  return {
    pos, S, grow: track(t, GROW), sx, sy,
    yaw: track(t, YAW), gaze: track(t, GAZE),
    lid: clamp(Math.max(track(t, LID), blinkK)),
    happy: track(t, HAPPY), droop: track(t, DROOP),
    heavy: smooth(38.5, 42.2, t) * (1 - smooth(47.5, 52.5, t)),
    flash: env(t).flash,
  };
}

// the four drops of the first attempt: each falls, shrinks and is gone before the ground
const DROPS = [[18.2, -0.25, 0.1, 0.62], [18.55, 0.2, -0.1, 0.9], [18.95, -0.05, 0.2, 1.25], [19.4, -0.61, -0.29, 0.78]];
export function drops(t) {
  const out = [];
  for (const [t0, ox, oz, life] of DROPS) {
    const d = t - t0; if (d < 0 || d > life) continue;
    const last = t0 === DROPS[3][0];
    const h = hero(t0);
    const y = h.pos[1] - 0.36 - 0.5 * 9.0 * d * d * 0.55;
    const k = d / life;
    out.push({ p: [h.pos[0] + ox, Math.max(y, 0.2), h.pos[2] + oz], r: 0.1 * (last ? 1 - 0.3 * k : 1 - k * k) });
  }
  return out;
}
export const SIZZLE = 20.18;                 // the last drop meets the hot stone

// weather and world state
const RAIN = [[0, 0], [CLIMAX - 0.05, 0], [CLIMAX + 0.7, 1, 'out'], [46.8, 1], [51.2, 0, 'io']];
export function env(t) {
  let flash = 0;
  for (const [t0, a, d] of [[CLIMAX, 1, 0.5], [CLIMAX + 0.18, 0.7, 0.35], [45.2, 0.55, 0.4], [45.35, 0.35, 0.3], [47.3, 0.25, 0.35]]) {
    const k = (t - t0) / d; if (k >= 0 && k < 1) flash = Math.max(flash, a * Math.pow(1 - k, 2.2) * (0.75 + 0.25 * Math.sin(k * 40)));
  }
  return {
    rain: track(t, RAIN),
    wet: smooth(CLIMAX + 0.3, 46, t) * (1 - 0.55 * smooth(51, 58, t)),
    dust: 1 - smooth(31, 36, t),
    updraft: smooth(24.3, 26.5, t) * (1 - smooth(38, 41, t)),
    haze: 1 - smooth(26, 34, t),
    bloom: Math.min(1, 8 * Math.pow(Math.max(0, t - 49.2), 1.6) / 190),   // flower front, × 190 m
    budOpen: smooth(54.4, 55.9, t),
    budLift: smooth(49.4, 53.8, t),
    rainbow: smooth(48.6, 51.6, t) * (1 - smooth(59.5, 62.5, t)),
    stars: smooth(60.8, 63.5, t),
    flash,
    shake: flash * 0.6,
  };
}

// ---------------- light ----------------
const C = h => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const V = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
// palette states: sky zenith, sky horizon, sun colour, sun intensity, sun direction, exposure
const STATES = {
  noon: { top: C('#f7863e'), hor: C('#ffd49a'), sun: C('#fff1d8'), sunI: 1.85, dir: V(-0.55, 1.15, 0.45), ex: 1.0, amb: 0.72 },
  gold: { top: C('#e27454'), hor: C('#ffc27c'), sun: C('#ffbb66'), sunI: 2.1, dir: V(0.55, 0.5, 0.85), ex: 1.02, amb: 0.95 },
  dusk: { top: C('#7a3a97'), hor: C('#ff8d5e'), sun: C('#ff7b48'), sunI: 2.2, dir: V(0.45, 0.2, 0.95), ex: 1.05, amb: 0.9 },
  storm: { top: C('#1e2266'), hor: C('#5c4aa8'), sun: C('#8a7ce0'), sunI: 0.35, dir: V(0.4, 0.16, 1), ex: 1.25, amb: 0.8 },
  after: { top: C('#2e6ee2'), hor: C('#ffb2c6'), sun: C('#ffc46e'), sunI: 2.4, dir: V(0.35, 0.13, 1), ex: 1.0, amb: 1.0 },
  eve: { top: C('#172168'), hor: C('#ff6f9a'), sun: C('#ff8a6c'), sunI: 1.3, dir: V(0.3, 0.035, 1), ex: 1.15, amb: 0.85 },
};
const TIMELINE = [[0, 'noon'], [26, 'noon'], [33, 'gold'], [39, 'dusk'], [41.6, 'storm'], [47.4, 'storm'], [50.8, 'after'], [58.5, 'after'], [63.5, 'eve']];
function mixState(a, b, k) {
  const o = {};
  for (const key of Object.keys(a)) o[key] = Array.isArray(a[key]) ? a[key].map((v, i) => lerp(v, b[key][i], k)) : lerp(a[key], b[key], k);
  const l = Math.hypot(...o.dir); o.dir = o.dir.map(v => v / l);
  return o;
}
export function look(t) {
  let i = 1; while (i < TIMELINE.length - 1 && t > TIMELINE[i][0]) i++;
  const [t0, a] = TIMELINE[i - 1], [t1, b] = TIMELINE[i];
  const s = mixState(STATES[a], STATES[b], EASE.sine(clamp((t - t0) / (t1 - t0))));
  const e = env(t);
  s.flash = e.flash;
  s.bloomGain = 0.4 + 0.6 * e.flash + 0.15 * e.rainbow;
  return s;
}

// little puffs of steam: one where each drop gives up in the air, a hiss of them on the stone
export function puffs(t) {
  const out = [];
  const burst = (t0, p, n, life, spread, size, seed) => {
    for (let i = 0; i < n; i++) {
      const d = t - t0 - i * 0.05; if (d < 0 || d > life) continue;
      const k = d / life, a = seed + i * 2.39;
      out.push({ p: [p[0] + Math.cos(a) * spread * (0.3 + k), p[1] + 0.05 + k * (0.45 + (i % 3) * 0.12), p[2] + Math.sin(a) * spread * (0.3 + k)], a: Math.sin(Math.PI * Math.min(1, k * 1.6)) * (1 - k) * 0.9, s: size * (0.6 + 1.2 * k) });
    }
  };
  DROPS.forEach(([t0, ox, oz, life], j) => {
    if (j === 3) return;
    const h = hero(t0), d = life;
    burst(t0 + life, [h.pos[0] + ox, h.pos[1] - 0.36 - 0.5 * 9.0 * d * d * 0.55, h.pos[2] + oz], 4, 0.9, 0.05, 0.14, j * 3);
  });
  burst(SIZZLE, [0.34, 0.18, 0.26], 14, 1.5, 0.07, 0.2, 1.1);
  return out.slice(0, 48);
}
