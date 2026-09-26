// Easing, envelopes and a deterministic hash. Nothing here depends on history: every motion in the
// film is a pure function of story time, so the video matches the page frame for frame.
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = u => { u = clamp(u); return u * u * (3 - 2 * u); };
export const smoother = u => { u = clamp(u); return u * u * u * (u * (u * 6 - 15) + 10); };
export const inCubic = u => { u = clamp(u); return u * u * u; };
export const outCubic = u => { u = clamp(u); return 1 - (1 - u) ** 3; };
export const inOutCubic = u => { u = clamp(u); return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2; };
export const inOutSine = u => { u = clamp(u); return -(Math.cos(Math.PI * u) - 1) / 2; };
export const outExpo = u => { u = clamp(u); return u >= 1 ? 1 : 1 - 2 ** (-10 * u); };
export const backOut = (u, s = 1.7) => { u = clamp(u); const c = s + 1; return 1 + c * (u - 1) ** 3 + s * (u - 1) ** 2; };
// 0 → 1 between a and b, holds, 1 → 0 between c and d
export const env = (t, a, b, c, d, e = smooth) => t <= a || t >= d ? 0 : t < b ? e((t - a) / (b - a)) : t <= c ? 1 : e(1 - (t - c) / (d - c));
// eased move from v0 to v1 over [t0, t1]
export const ramp = (t, t0, t1, v0, v1, e = inOutSine) => v0 + (v1 - v0) * e((t - t0) / (t1 - t0));
// keyframes [[t, v], …] with one easing per segment
export function kf(t, keys, e = inOutSine) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e1] = keys[i];
    if (t <= t1) {
      const [t0, v0] = keys[i - 1], u = (e1 || e)((t - t0) / (t1 - t0));
      return Array.isArray(v0) ? v0.map((a, k) => a + (v1[k] - a) * u) : v0 + (v1 - v0) * u;
    }
  }
  return keys[keys.length - 1][1];
}
export const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
export const hash2 = (a, b) => hash(a * 57.31 + b * 113.97);
// smooth value noise in 1D (pure, cheap), range about −1..1
export function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return (hash2(i, seed) * (1 - u) + hash2(i + 1, seed) * u) * 2 - 1;
}
// deterministic PRNG for build-time randomness (geometry, dust layout, noise buffers)
export function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
