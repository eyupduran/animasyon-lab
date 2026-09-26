// The cut list. Each shot is a function of story time returning where the lens is, what it looks
// at, its field of view, where focus sits and how much the background melts. Cuts, not orbits;
// long lenses; handheld drift that is a pure function of time.
import { TC, T_MISS1, T_MISS2, HERO, toothX, TOTAL } from './score.js';
import { clamp, smooth, inOutSine, inOutCubic, outCubic, outExpo, env, ramp, noise1 } from './util.js';

const XH = toothX(HERO);
const L = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
const MIR = (x, z, d) => [x + 0.6 * d, 5.43 + 0.45 * d, z - 0.66 * d];   // camera where the window mirrors in the teeth's tops

// [start, fn(t, u)] ; u is 0..1 across the shot
const SHOTS = [
  // 1 · the cylinder surface: pins come over the top toward us
  [0, (t, u) => ({ pos: L([toothX(12) + 13.5, 5.55, -2.6], [toothX(12) + 12.4, 5.45, -2.2], inOutSine(u)), tgt: [toothX(12), 5.0, 0.9], fov: 14, focus: [toothX(12), 5.1, 0.3], blur: 30, hide: ['R', 12] })],
  // 2 · the world: an open walnut box on a table at night
  [5.6, (t, u) => ({ pos: L([-66, 104, -128], [-57, 90, -110], inOutSine(u)), tgt: [0, 0, 8], fov: 24, focus: [0, 0, 2], blur: 6 })],
  // 3 · along the tips: bright teeth ring; focus finds the dull one; the melody stops short
  [9.6, (t, u) => ({ pos: L([13.5, 6.7, -7.6], [12.6, 6.6, -7.3], inOutSine(u)), tgt: [XH + 0.5, 5.15, 0.6], ex: 0.75, fov: 18, focus: t < 10.5 ? [5, 5.3, 0] : [ramp(t, 10.5, 11.3, 5, XH), 5.3, 0.4], blur: 26 })],
  // 4 · the hero from above: a dusty top among clean neighbours, trembling when they sing
  [13.6, (t, u) => ({ pos: L(MIR(XH + 0.3, 2.8, 15), MIR(XH + 0.3, 2.8, 13.2), inOutSine(u)), tgt: [XH + 0.3, 5.4, 2.8], fov: 17, focus: [XH, 5.45, 2.4], blur: 24, ex: 0.5 })],
  // 5 · profile: the broken pin comes round; the tooth reaches and falls short
  [19.0, (t, u) => ({ pos: L([XH + 15.5, 5.5, -1.7], [XH + 14.6, 5.42, -1.45], inOutSine(u)), tgt: [XH, 4.95, 0.5], fov: 13, focus: [XH, 5.0, 0.35], blur: 30, hide: ['R', HERO] })],
  // 6 · the governor slows: the spring is running down
  [24.4, (t, u) => ({ pos: L([-4.5, 15.5, -27], [-6.5, 15, -25], inOutSine(u)), tgt: [-16.5, 8.8, -4], fov: 23, focus: [-19.7, 11.4, -6.1], blur: 18 })],
  // 7 · high over the comb: the whole tune, slower; one tooth is grey
  [28.4, (t, u) => ({ pos: L([7, 23, -31], [5.5, 21, -28.5], inOutSine(u)), tgt: [-0.5, 3.5, 2.5], fov: 24, focus: [XH, 5.4, 1.5], blur: 12 })],
  // 8 · face to face with the tip: it starts down, loses heart, pulls back
  [32.8, (t, u) => ({ pos: L([XH + 1.2, 6.5, -9.4], [XH + 0.9, 6.35, -8.6], inOutSine(u)), tgt: [XH, 5.05, 0.6], ex: 0.8, fov: 14, focus: [XH, 5.2, 0.1], blur: 28 })],
  // 9 · profile, tight: the long reach, the touch, the lift… let go (200 ms push-in)
  [36.4, (t, u) => {
    const push = outCubic(clamp((t - TC) / 0.2));
    return { pos: L([XH + 12.5, 5.22, -1.0], [XH + 11.3, 5.16, -0.75], inOutSine(u)), tgt: [XH, 4.88, 0.35], fov: ramp(t, 36.4, TC, 11.2, 9.6) * (1 - 0.16 * push), focus: [XH, 5.0, 0.3], blur: 34, hide: ['R', HERO] };
  }],
  // 10 · the strongest frame: the dust cloud hanging in the window light
  [42.1, (t, u) => ({ pos: L([XH + 11.8, 2.4, -12.6], [XH + 10.9, 2.8, -11.6], inOutSine(u)), tgt: L([XH - 0.3, 7.2, 1.2], [XH - 0.3, 8.4, 1.2], inOutSine(u)), fov: 20, focus: [XH, ramp(t, 42.1, 47, 7.2, 8.4), 1.0], blur: 20 })],
  // 11 · the movement has stopped; the tooth still rings, clean
  [47.0, (t, u) => ({ pos: L([-30, 26, -46], [-26, 23, -40], inOutSine(u)), tgt: [0, 3, 3], fov: 25, focus: [XH, 5.4, 2], blur: 10 })],
  // 12 · close: the clean tooth holds the window; the last ring dies away; black; title
  [53.2, (t, u) => ({ pos: L(MIR(XH, 3.0, 13.5), MIR(XH, 3.0, 12), inOutSine(u)), tgt: [XH, 5.4, 3.0], fov: 14, focus: [XH, 5.45, 2.6], blur: 26, ex: 0.5 })],
];
const END = TOTAL;

export const shotIndex = t => { let k = 0; for (let i = 0; i < SHOTS.length; i++) if (t >= SHOTS[i][0]) k = i; return k; };
export const shotTimes = () => SHOTS.map(([t0], i) => { const t1 = (SHOTS[i + 1] || [END])[0]; return t0 + (t1 - t0) * 0.5; });
export const HEAVY = [40.5, 43.4, 49];   // frames used to pick the quality tier

export function shot(t) {
  const k = shotIndex(t), [t0, f] = SHOTS[k], t1 = (SHOTS[k + 1] || [END])[0];
  const s = f(t, clamp((t - t0) / (t1 - t0)));
  const d = Math.hypot(s.tgt[0] - s.pos[0], s.tgt[1] - s.pos[1], s.tgt[2] - s.pos[2]);
  // handheld: slow, pure, proportional to distance
  const a = d * 0.0022;
  s.pos = [s.pos[0] + a * noise1(t * 0.9, 1), s.pos[1] + a * noise1(t * 0.8, 2), s.pos[2] + a * 0.5 * noise1(t * 0.7, 3)];
  s.tgt = [s.tgt[0] + a * 0.4 * noise1(t * 0.6, 4), s.tgt[1] + a * 0.4 * noise1(t * 0.65, 5), s.tgt[2]];
  s.index = k;
  return s;
}

// film-wide look over time
export function look(t) {
  const warm = smooth((t - TC) / 1.8);
  const flash = t >= TC ? Math.exp(-(t - TC) / 0.35) : 0;
  const fade = smooth((t - 0.5) / 2.3) * (1 - smooth((t - 57.8) / 1.6));
  return {
    warm, fade,
    exposure: 1.75 + 0.5 * flash + 0.1 * warm,
    bloom: 0.07 + 0.1 * warm + 0.25 * flash,
    thresh: 0.9 - 0.25 * warm,
  };
}
export const titleOpacity = t => env(t, 59.6, 60.9, 62.6, 63.7);
