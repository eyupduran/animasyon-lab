// Absolute timing of chapters and subtitles, plus easing helpers.
import { CHAPTERS, cueDuration } from './script.js';

export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const smoother = t => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const seg = (u, a, b) => clamp01((u - a) / (b - a));

export function buildTimeline() {
  let T = 0;
  const chapters = CHAPTERS.map((c, i) => {
    const start = T;
    let t = c.lead ?? 0.6;
    const cues = c.cues.map(text => {
      const d = cueDuration(text);
      const cue = { text, start: start + t, end: start + t + d };
      t += d + 0.35;
      return cue;
    });
    const dur = t + 0.5;
    T += dur;
    return { ...c, index: i, start, dur, end: start + dur, cues };
  });
  const byId = Object.fromEntries(chapters.map(c => [c.id, c]));
  return {
    chapters, byId, total: T,
    chapterAt(t) { for (const c of chapters) if (t < c.end) return c; return chapters[chapters.length - 1]; },
    // chapter progress 0..1 (0 before it starts, 1 after it ends)
    ph(id, t) { const c = byId[id]; return clamp01((t - c.start) / c.dur); },
    cueAt(t) {
      const c = this.chapterAt(t);
      for (const q of c.cues) if (t >= q.start - 0.05 && t < q.end + 0.3) return q;
      return null;
    },
    // fraction of a chapter at which its n-th cue starts (for syncing actions to sentences)
    cueU(id, n) { const c = byId[id]; return (c.cues[n].start - c.start) / c.dur; },
  };
}
