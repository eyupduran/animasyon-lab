// Absolute timing of chapters and subtitles, plus easing helpers.
// Each subtitle lasts as long as its recorded narration (narration/manifest.json, made with
// `npm run voice -- laser-printer` at the repository root) plus a breath, and never less than
// comfortable reading time. Long subtitles are split into two-line segments that follow the voice.
import { CHAPTERS } from './script.js';
import { spoken } from './spoken.js';
import manifest from '../../narration/manifest.json';

export const clamp01 = x => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const smoother = t => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const seg = (u, a, b) => clamp01((u - a) / (b - a));

const MAX_SEG = 92;     // characters per subtitle segment (two lines of ~46)
const GAP = 0.33;       // breath after each sentence

// split a subtitle into readable pieces at sentence, then clause boundaries
export function splitSubtitle(text) {
  if (text.includes('|')) return text.split('|').map(p => p.trim()).flatMap(splitSubtitle);
  if (text.length <= MAX_SEG) return [text];
  const sentences = text.match(/[^.!?;:]+[.!?;:]+(\s|$)|[^.!?;:]+$/g).map(s => s.trim());
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if (!cur) cur = s;
    else if ((cur + ' ' + s).length <= MAX_SEG) cur += ' ' + s;
    else { out.push(cur); cur = s; }
  }
  if (cur) out.push(cur);
  // a single overlong sentence: break at the comma nearest the middle
  return out.flatMap(p => {
    if (p.length <= MAX_SEG) return [p];
    const mid = p.length / 2;
    let best = -1;
    for (let i = p.indexOf(','); i >= 0; i = p.indexOf(',', i + 1)) if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
    if (best >= 0 && Math.abs(best - mid) < p.length * 0.2) return [p.slice(0, best + 1), p.slice(best + 2)];
    // no comma near the middle: prefer a "ve"/"ya da" joint, else the space nearest the middle
    let sp = -1;
    for (let i = p.indexOf(' '); i >= 0; i = p.indexOf(' ', i + 1)) {
      const joint = /^(ve|ya|ama|sonra|böylece) /.test(p.slice(i + 1)) ? 0.6 : 1;
      if (sp < 0 || Math.abs(i - mid) * joint < Math.abs(sp - mid) * (/^(ve|ya|ama|sonra|böylece) /.test(p.slice(sp + 1)) ? 0.6 : 1)) sp = i;
    }
    return [p.slice(0, sp), p.slice(sp + 1)];
  });
}

// time (in the clip) at which a given fraction of the sentence's characters has started to be spoken
function speechClock(words, dur) {
  if (!words || !words.length) return f => f * dur;
  const total = words.reduce((a, w) => a + w[2].length + 1, 0);
  const pts = [];
  let acc = 0;
  for (const w of words) { pts.push([acc / total, w[0]]); acc += w[2].length + 1; }
  pts.push([1, words[words.length - 1][1]]);
  return f => {
    if (f <= 0) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (f <= pts[i][0]) {
      const [f0, t0] = pts[i - 1], [f1, t1] = pts[i];
      return t0 + (t1 - t0) * (f - f0) / Math.max(1e-6, f1 - f0);
    }
    return pts[pts.length - 1][1];
  };
}

export function buildTimeline() {
  let T = 0;
  const chapters = CHAPTERS.map((c, i) => {
    const start = T;
    let t = c.lead ?? 0.6;
    const cues = c.cues.map((raw, n) => {
      const text = raw.replace(/\s*\|\s*/g, ' ');
      const v = manifest.lines[`${c.id}-${n}`];
      const voice = v ? { url: `./${v.file}`, dur: v.dur } : null;
      const read = 0.8 + text.length / 18;
      const d = Math.max(read, voice ? voice.dur + GAP : 1.3 + text.length / 14.5);
      const cue = { text, say: spoken(raw), start: start + t, end: start + t + d, voice };
      // when is each written word spoken? The recorded words give a time for every position in the
      // sentence; a written word gets the time of its position (so "600" follows "altı yüz").
      const parts = splitSubtitle(raw);
      const speak = voice ? voice.dur : d - 0.4;
      const at = speechClock(v?.words, speak);
      const all = parts.join(' ');
      let pos = 0;
      cue.segs = parts.map(p => {
        const words = p.split(/\s+/).filter(Boolean).map(w => {
          const i = all.indexOf(w, pos); pos = i + w.length;
          return { w, t: cue.start + at(i / all.length) };
        });
        return { text: p, words, start: words[0].t, end: 0 };
      });
      cue.segs[0].start = cue.start;
      cue.segs.forEach((g, k) => { g.end = k < cue.segs.length - 1 ? cue.segs[k + 1].start : cue.end; });
      t += d + 0.12;
      return cue;
    });
    const dur = t + 0.5;
    T += dur;
    return { ...c, index: i, start, dur, end: start + dur, cues };
  });
  const byId = Object.fromEntries(chapters.map(c => [c.id, c]));
  const allSegs = chapters.flatMap(c => c.cues.flatMap(q => q.segs));
  return {
    chapters, byId, total: T, segments: allSegs,
    chapterAt(t) { for (const c of chapters) if (t < c.end) return c; return chapters[chapters.length - 1]; },
    // chapter progress 0..1 (0 before it starts, 1 after it ends)
    ph(id, t) { const c = byId[id]; return clamp01((t - c.start) / c.dur); },
    cueAt(t) {
      const c = this.chapterAt(t);
      for (const q of c.cues) if (t >= q.start - 0.05 && t < q.end + 0.2) return q;
      return null;
    },
    segAt(t) {
      const q = this.cueAt(t);
      if (!q) return null;
      for (const s of q.segs) if (t < s.end) return s;
      return q.segs[q.segs.length - 1];
    },
    // fraction of a chapter at which its n-th cue starts (for syncing actions to sentences)
    cueU(id, n) { const c = byId[id]; return (c.cues[n].start - c.start) / c.dur; },
  };
}

// break a segment into at most two balanced lines (as on television and in .srt files)
export function twoLines(text) {
  if (text.length <= 44) return [text];
  const mid = text.length / 2;
  let best = -1;
  for (let i = text.indexOf(' '); i >= 0; i = text.indexOf(' ', i + 1)) if (best < 0 || Math.abs(i - mid) < Math.abs(best - mid)) best = i;
  return best < 0 ? [text] : [text.slice(0, best), text.slice(best + 1)];
}
