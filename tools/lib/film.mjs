// Helpers for the minimal film contract (window.__film): the film only draws a moment; the tools
// make subtitles, mix the narration and list the chapters.
//   window.__film = {
//     duration,                       // seconds
//     renderAt(t),                    // draws the moment t (same t → same frame); may return a Promise
//     narration: [{ id, at }],        // optional: narration clip ids (narration/lines.json) and when each starts
//     chapters: [{ t, title }],       // optional
//     sound(from, to),                // optional: the film's own sound (music, effects) as an AudioBuffer,
//                                     //           rendered with an OfflineAudioContext
//   }
import fs from 'fs';
import path from 'path';

const letters = s => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');

// written text position (ratio of letters) → seconds in the clip, through the recognised words
function ratioToTime(words, dur) {
  if (!words || !words.length) return r => r * dur;
  const lens = words.map(w => Math.max(1, letters(w[2]).length));
  const total = lens.reduce((a, b) => a + b, 0);
  const pts = []; let acc = 0;
  words.forEach((w, i) => { pts.push([acc / total, w[0]]); acc += lens[i]; });
  pts.push([1, words[words.length - 1][1]]);
  return r => {
    for (let i = 1; i < pts.length; i++) if (r <= pts[i][0]) {
      const [r0, t0] = pts[i - 1], [r1, t1] = pts[i];
      return t0 + (t1 - t0) * (r - r0) / Math.max(1e-6, r1 - r0);
    }
    return pts[pts.length - 1][1];
  };
}

function splitLong(s, max = 84) {
  if (s.length <= max) return [s];
  const mid = s.length / 2;
  const cut = re => { const c = []; let m; while ((m = re.exec(s))) c.push(m.index + m[0].length); const ok = c.filter(i => i > 18 && s.length - i > 18); return ok.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0]; };
  const k = cut(/[;:]\s/g) ?? cut(/,\s/g) ?? cut(/\s(?=(ve|ama|çünkü|ise|yani)\s)/g) ?? cut(/\s/g);
  return k ? [...splitLong(s.slice(0, k).trim(), max), ...splitLong(s.slice(k).trim(), max)] : [s];
}
const twoLines = s => {
  if (s.length <= 44) return s;
  const w = s.split(' '); let best = 1, d = 1e9, acc = 0;
  for (let i = 0; i < w.length - 1; i++) { acc += w[i].length + 1; const x = Math.abs(acc - (s.length - acc)); if (x < d) { d = x; best = i + 1; } }
  return w.slice(0, best).join(' ') + '\n' + w.slice(best).join(' ');
};
const stamp = s => { const ms = Math.max(0, Math.round(s * 1000)); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };

// narration files of an animation: lines.json (say, optional text shown in subtitles) + manifest.json
export function readNarration(dir) {
  const lf = path.join(dir, 'narration', 'lines.json'), mf = path.join(dir, 'narration', 'manifest.json');
  if (!fs.existsSync(lf) || !fs.existsSync(mf)) return null;
  const spec = JSON.parse(fs.readFileSync(lf, 'utf8')), man = JSON.parse(fs.readFileSync(mf, 'utf8'));
  const out = {};
  for (const l of spec.lines) {
    const m = man.lines[l.id]; if (!m) continue;
    out[l.id] = { text: l.text || l.say, dur: m.dur, words: m.words, file: path.join(dir, spec.out || 'public/voice', path.basename(m.file)) };
  }
  return out;
}

// subtitles from the written text, timed by the recognised words; placed: [{ id, at }]
export function makeSrt(narr, placed, from = 0, to = Infinity) {
  const cues = [];
  for (const p of placed) {
    const n = narr[p.id]; if (!n) continue;
    const map = ratioToTime(n.words, n.dur), total = letters(n.text).length || 1;
    const sentences = n.text.match(/[^.!?]+[.!?…]+/g) || [n.text];
    let pos = 0;
    for (const sen of sentences) for (const part of splitLong(sen.trim())) {
      const i = n.text.indexOf(part, pos); pos = i + part.length;
      const t0 = map(letters(n.text.slice(0, i)).length / total), t1 = map(letters(n.text.slice(0, pos)).length / total);
      cues.push({ a: p.at + t0 - 0.08, b: p.at + Math.max(t1, t0 + 0.8) + 0.25, text: twoLines(part) });
    }
  }
  cues.sort((x, y) => x.a - y.a);
  for (let i = 0; i < cues.length - 1; i++) cues[i].b = Math.min(cues[i].b, cues[i + 1].a - 0.04);
  let k = 1, s = '';
  for (const c of cues) { if (c.b < from || c.a > to) continue; s += `${k++}\n${stamp(Math.max(from, c.a) - from)} --> ${stamp(Math.min(to, c.b) - from)}\n${c.text}\n\n`; }
  return s;
}

// ffmpeg arguments that lay the narration clips over the film's own sound (or silence)
export function mixArgs({ base, narr, placed, from, len, musicDb = -10 }) {
  const inputs = [], filters = [], mix = [];
  if (base) { inputs.push('-i', base); filters.push(`[0:a]volume=${musicDb}dB[m]`); mix.push('[m]'); }
  else { inputs.push('-f', 'lavfi', '-t', String(len), '-i', 'anullsrc=r=48000:cl=stereo'); mix.push('[0:a]'); }
  let k = 1;
  for (const p of placed) {
    const n = narr[p.id]; if (!n) continue;
    const start = p.at - from; if (start + n.dur < 0 || start > len) continue;
    if (start >= 0) { inputs.push('-i', n.file); filters.push(`[${k}:a]adelay=${Math.round(start * 1000)}:all=1[v${k}]`); }
    else { inputs.push('-ss', String(-start), '-i', n.file); filters.push(`[${k}:a]anull[v${k}]`); }
    mix.push(`[v${k}]`); k++;
  }
  filters.push(`${mix.join('')}amix=inputs=${mix.length}:normalize=0:duration=first,alimiter=limit=0.89[out]`);
  return [...inputs, '-filter_complex', filters.join(';'), '-map', '[out]', '-t', String(len), '-ar', '48000', '-ac', '2'];
}

// page-side: AudioBuffer → base64 WAV chunks (runs inside page.evaluate)
export const WAV_IN_PAGE = `async (from, to) => {
  const buf = await window.__film.sound(from, to);
  const ch = Math.min(2, buf.numberOfChannels), n = buf.length, sr = buf.sampleRate;
  const dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true);
  dv.setUint16(22, ch, true); dv.setUint32(24, sr, true); dv.setUint32(28, sr * ch * 2, true); dv.setUint16(32, ch * 2, true); dv.setUint16(34, 16, true);
  w(36, 'data'); dv.setUint32(40, n * ch * 2, true);
  const d = [...Array(ch)].map((_, i) => buf.getChannelData(i)); let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, d[c][i])); dv.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
  const bytes = new Uint8Array(dv.buffer); window.__wav = [];
  for (let i = 0; i < bytes.length; i += 1 << 20) { let s = ''; const p = bytes.subarray(i, i + (1 << 20)); for (let j = 0; j < p.length; j += 8192) s += String.fromCharCode.apply(null, p.subarray(j, j + 8192)); window.__wav.push(btoa(s)); }
  return window.__wav.length;
}`;
