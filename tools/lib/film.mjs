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

function splitLong(s, max = 84, min = 18) {
  if (s.length <= max) return [s];
  const mid = s.length / 2;
  const cut = re => { const c = []; let m; while ((m = re.exec(s))) c.push(m.index + m[0].length); const ok = c.filter(i => i > min && s.length - i > min); return ok.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0]; };
  const k = cut(/[;:]\s/g) ?? cut(/,\s/g) ?? cut(/\s(?=(ve|ama|çünkü|ise|yani|ya da|diye)\s)/g) ?? cut(/\s/g);
  return k ? [...splitLong(s.slice(0, k).trim(), max, min), ...splitLong(s.slice(k).trim(), max, min)] : [s];
}
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

// Subtitles move with the voice: a sentence (or a long sentence's part) is one chunk of at most two balanced
// lines; the whole chunk is laid out at once (so nothing reflows) and each word fades in as it is spoken.
// The same cues feed the .srt (plain chunks), the burned-in video (.ass, word by word) and the site player.
export const CUE = { chunk: 84, line: 44, lead: 0.12, hold: 1.6, gap: 0.05, reveal: 0.22 };

function toLines(text) {
  if (text.length <= CUE.line) return [text];
  const w = text.split(' '); let best = 1, d = 1e9, acc = 0;
  for (let i = 0; i < w.length - 1; i++) { acc += w[i].length + 1; const x = Math.abs(acc - (text.length - acc)); if (x < d) { d = x; best = i + 1; } }
  return [w.slice(0, best).join(' '), w.slice(best).join(' ')];
}

// cues of one clip in clip time: [{ a, b, lines: [..], words: [{ w, t }] }]
export function clipCues(n) {
  const map = ratioToTime(n.words, n.dur), total = letters(n.text).length || 1;
  const at = i => +map(letters(n.text.slice(0, i)).length / total).toFixed(3);
  const sentences = n.text.match(/[^.!?…]+(?:[.!?…]+|$)/g) || [n.text];
  const out = []; let pos = 0;
  for (const sen of sentences) {
    if (!sen.trim()) continue;
    for (const part of splitLong(sen.trim(), CUE.chunk, 20)) {
      const start = n.text.indexOf(part, pos); if (start < 0) continue; pos = start + part.length;
      const words = []; const re = /\S+/g; let m;
      while ((m = re.exec(part))) words.push({ w: m[0], t: at(start + m.index) });
      out.push({ lines: toLines(part), words });
    }
  }
  out.forEach((c, i) => {
    c.a = +(c.words[0].t - CUE.lead).toFixed(3);
    const last = c.words[c.words.length - 1].t;
    c.b = +(i + 1 < out.length ? out[i + 1].words[0].t - CUE.lead - CUE.gap : Math.min(n.dur + 0.4, last + CUE.hold)).toFixed(3);
  });
  return out;
}

// clip cues laid on the film's timeline; placed: [{ id, at }]
export function placeCues(clips, placed) {
  const cues = [];
  for (const p of placed) for (const c of clips[p.id] || []) cues.push({ a: p.at + c.a, b: p.at + c.b, lines: c.lines, words: c.words.map(w => ({ w: w.w, t: p.at + w.t })) });
  cues.sort((x, y) => x.a - y.a);
  for (let i = 0; i < cues.length - 1; i++) cues[i].b = Math.min(cues[i].b, cues[i + 1].a - CUE.gap);
  return cues;
}

export function makeCues(narr, placed) {
  const clips = {}; for (const id in narr) clips[id] = clipCues(narr[id]);
  return placeCues(clips, placed);
}

const cueText = c => c.lines ? c.lines.join('\n') : c.text;
export function cuesToSrt(cues, from = 0, to = Infinity) {
  let k = 1, s = '';
  for (const c of cues) { if (c.b < from || c.a > to) continue; s += `${k++}\n${stamp(Math.max(from, c.a) - from)} --> ${stamp(Math.min(to, c.b) - from)}\n${cueText(c)}\n\n`; }
  return s;
}

export function srtToCues(srt) {
  const t = x => { const [h, m, r] = x.trim().split(':'); return +h * 3600 + +m * 60 + parseFloat(r.replace(',', '.')); };
  return srt.replace(/\r/g, '').split(/\n\n+/).map(b => b.split('\n')).filter(l => l.length >= 3 && l[1].includes('-->'))
    .map(l => { const [a, b] = l[1].split('-->'); return { a: t(a), b: t(b), lines: l.slice(2) }; });
}

export function makeSrt(narr, placed, from = 0, to = Infinity) { return cuesToSrt(makeCues(narr, placed), from, to); }

// Subtitle look, shared by the video (.ass) and the site player (tools/player): Inter Medium, white, soft dark
// shadow and no band, bottom centre. Sizes are for a 1920×1080 frame.
export const SUB_STYLE = { font: 'Inter Medium', size: 42, bottom: 70, lineHeight: 1.42 };

// cues (with word times when present) → .ass; `from` shifts everything for clips
export function cuesToAss(cues, from = 0) {
  const S = SUB_STYLE;
  const ts = s => { const cs = Math.max(0, Math.round(s * 100)); return `${Math.floor(cs / 360000)}:${String(Math.floor(cs / 6000) % 60).padStart(2, '0')}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };
  const esc = x => x.replace(/[{}]/g, '').replace(/\\/g, '/');
  const body = c => {
    if (!c.words) return (c.lines || [c.text]).map(esc).join('\\N');
    // every word is there from the start (transparent), then fades in when it is spoken: no reflow
    let k = 0, out = [];
    for (const line of c.lines) {
      const n = line.split(' ').length, ws = c.words.slice(k, k + n); k += n;
      out.push(ws.map(w => {
        const t0 = Math.max(0, Math.round((w.t - 0.06 - c.a) * 1000)), t1 = t0 + Math.round(CUE.reveal * 1000);
        return `{\\1a&HFF&\\3a&HFF&\\4a&HFF&\\t(${t0},${t1},\\1a&H00&\\3a&H20&\\4a&H80&)}${esc(w.w)}`;
      }).join(' '));
    }
    return out.join('\\N');
  };
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,${S.font},${S.size},&H00F6FAFB,&H00F6FAFB,&H2006080A,&H8006080A,0,0,0,0,100,100,0,0,1,1.6,1.2,2,120,120,${S.bottom},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${cues.filter(c => c.b > from).map(c => { const d = { ...c, a: c.a - from, b: c.b - from, words: c.words && c.words.map(w => ({ w: w.w, t: w.t - from })) }; return `Dialogue: 0,${ts(d.a)},${ts(d.b)},Sub,,0,0,0,,{\\blur2.2\\fad(0,120)}${body(d)}`; }).join('\n')}
`;
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
