// Twelve shots, joined by cuts. Each is a pure function of time; a slow handheld drift is added on top.
import { hero, env, CLIMAX, TITLE, TOTAL } from './score.js';
import { lerp, mix3, EASE, clamp, noise1, smooth } from './util.js';

const hl = (a, b, k, e = 'sine') => mix3(a, b, EASE[e](clamp(k)));
// pos/tgt either fixed arrays or functions of (u, t)
const SHOTS = [
  // 1 · wide: the scorched valley; the little cloud floats in from the right
  { t0: 0, t1: 8, fov: [42, 40], pos: u => hl([-4.5, 1.3, 17], [-4, 1.4, 15], u), tgt: u => hl([2.5, 3.9, -8], [2, 3.6, -8], u), hand: 1 },
  // 2 · medium: it sees the bud, hesitates, comes down
  { t0: 8, t1: 13.2, fov: [34, 33], pos: u => hl([5.2, 1.9, 8.8], [4.6, 1.7, 8.2], u), tgt: (u, t) => mix3(hero(t).pos, [0, 0.4, 0], 0.5), hand: 1 },
  // 3 · macro: the wilted bud, the cloud's shadow falls over it
  { t0: 13.2, t1: 16.5, fov: [30, 28], pos: u => hl([1.0, 0.48, 3.0], [0.82, 0.45, 2.7], u), tgt: [0.12, 0.58, 0], hand: 0.3 },
  // 4 · medium: the attempt, four drops, the hiss, the sag
  { t0: 16.5, t1: 24.2, fov: [31, 30], pos: u => hl([-2.9, 0.7, 5.0], [-2.6, 0.72, 4.6], u), tgt: [0.45, 1.05, 0.3], hand: 0.8 },
  // 5 · wide: the wind turns and climbs the slope; it looks up, hesitates, lets go
  { t0: 24.2, t1: 31, fov: [44, 46], pos: u => hl([4.6, 1.2, 6.8], [4.2, 1.4, 6.2], u), tgt: (u, t) => hl([-1.2, 3.4, -20], [-1, 6.5, -30], u), hand: 1 },
  // 6 · wide, low: the climb, the growth, the sunset
  { t0: 31, t1: 40.5, fov: [52, 56], pos: u => hl([2, 0.9, 18], [1.5, 0.8, 21], u), tgt: (u, t) => hl([0, 7, -18], [0, 32, -40], u, 'io'), hand: 0.8 },
  // 7 · low long lens: the giant face; a breath; eyes close
  { t0: 40.5, t1: CLIMAX, fov: [21, 19], pos: u => hl([1.5, 1.2, 22], [1.5, 1.2, 21], u), tgt: (u, t) => { const h = hero(t); return [h.pos[0], h.pos[1] + h.S * 0.12, h.pos[2] + h.S * 0.9]; }, hand: 0.5 },
  // 8 · wide: the thunderclap, the downpour (a fast 200 ms push at the strike)
  { t0: CLIMAX, t1: 48.5, fov: [52, 47], pos: u => hl([-9, 1.4, 30], [-8, 1.6, 26], u), tgt: [0, 17, -24], hand: 1.2, punch: CLIMAX },
  // 9 · wide: the rain passes, the bow, the meadow runs out from the bud; the cloud comes back small
  { t0: 48.5, t1: 54.2, fov: [46, 44], pos: u => hl([3.5, 1.5, 28], [3, 1.7, 25], u), tgt: u => hl([0, 12, -20], [0, 6.5, -14], u), hand: 0.7 },
  // 10 · macro: the bud opens
  { t0: 54.2, t1: 56.6, fov: [28, 26], pos: u => hl([1.5, 0.66, 2.4], [1.35, 0.72, 2.15], u), tgt: [0.28, 0.82, 0], hand: 0.3 },
  // 11 · medium: joy
  { t0: 56.6, t1: 60.6, fov: [31, 30], pos: u => hl([-4.3, 1.0, 7.7], [-4.0, 1.05, 7.2], u), tgt: [0.55, 1.3, 0.35], hand: 0.7 },
  // 12 · wide: dusk; it drifts off; first stars
  { t0: 60.6, t1: TOTAL, fov: [42, 42], pos: u => hl([-3, 1.2, 11.5], [-3, 2.0, 13], u), tgt: (u, t) => mix3(hl([1, 3.2, -6], [2.5, 5.6, -6], u), hero(t).pos, 0.35), hand: 0.6 },
];

export function shot(t) {
  const s = SHOTS.find(x => t < x.t1) || SHOTS[SHOTS.length - 1];
  const u = clamp((t - s.t0) / (s.t1 - s.t0));
  const f = v => (typeof v === 'function' ? v(u, t) : v);
  const pos = f(s.pos).slice(), tgt = f(s.tgt).slice();
  let fov = lerp(s.fov[0], s.fov[1], EASE.sine(u));
  if (s.punch) fov *= 1 - 0.07 * EASE.out(clamp((t - s.punch) / 0.2));
  // handheld: slow, deterministic; a small kick on thunder
  const e = env(t);
  const k = 0.035 * s.hand * Math.hypot(tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]) * 0.05 + 0.004;
  tgt[0] += noise1(t * 0.45 + 11) * k * 1.4 + noise1(t * 9 + 3) * e.shake * 0.25;
  tgt[1] += noise1(t * 0.38 + 23) * k + noise1(t * 11 + 7) * e.shake * 0.25;
  pos[1] += noise1(t * 0.3 + 5) * k * 0.4;
  return { pos, tgt, fov, index: SHOTS.indexOf(s) };
}
export const titleOpacity = t => smooth(TITLE - 0.35, TITLE + 0.25, t);
// frames drawn once at load so every shader is compiled before playback (drops, steam, rain, bow)
export const shotTimes = () => [...SHOTS.map(s => (s.t0 + s.t1) / 2), 18.7, 20.4, 42.9, 50.5, 55.2];
export const HEAVY = [44.5, 50.5, 58.5];
