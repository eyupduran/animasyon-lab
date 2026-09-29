// Joins finished videos into one long "tek parça" video. No new production: it only needs the MP4s.
//   npm run compile -- derleme-1                          a compilation defined in channel/plan.json (its parts, in order)
//   npm run compile -- <ad> <slug|no> <slug|no> … [--title "…"]
//   add --subs to join the copies with burnt-in subtitles (<slug>-altyazili.mp4) instead of the clean ones
// Reads each film's renders/<slug>.mp4, .srt and -chapters.txt; make them first with /youtube <slug> (or npm run video).
// Writes renders/compilations/<ad>/: <ad>.mp4, <ad>.srt, bolumler.txt (renders/ is not in git).
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { ROOT, findAnimation } from './lib/animations.mjs';

const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf(`--${n}`); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const subs = flag('subs');
let title = opt('title', '');
const [name, ...refs] = args;
if (!name) { console.log('kullanım: npm run compile -- <derleme adı> [<slug|no> …] [--title "…"] [--subs]'); process.exit(1); }

const planFile = path.join(ROOT, 'channel', 'plan.json');
const plan = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : { videos: [], compilations: [] };
const planned = (plan.compilations || []).find(c => c.id === name);
const parts = refs.length ? refs : planned ? planned.parts.map(String) : [];
if (!parts.length) { console.log(`"${name}" çizelgede tanımlı bir derleme değil; birleştirilecek filmleri sırayla yazın.`); process.exit(1); }
if (!title) title = planned ? planned.title : name;

const films = parts.map(ref => {
  const row = plan.videos.find(v => String(v.no) === ref || v.slug === ref);
  const slug = row ? row.slug : ref;
  const a = findAnimation(slug, { exit: false });
  if (!a) return { slug, missing: `${slug} henüz üretilmedi` };
  const base = path.join(a.dir, 'renders', slug);
  const mp4 = `${base}${subs ? '-altyazili' : ''}.mp4`;
  const cfg = JSON.parse(fs.readFileSync(path.join(a.dir, 'animation.json'), 'utf8'));
  return { slug, mp4, srt: `${base}.srt`, title: row ? row.title : cfg.title, missing: fs.existsSync(mp4) ? null : `${path.relative(ROOT, mp4)} yok → /youtube ${slug}` };
});
const missing = films.filter(f => f.missing);
if (missing.length) { console.log('Birleştirilemedi, eksik videolar:\n' + missing.map(f => '  ✗ ' + f.missing).join('\n')); process.exit(1); }

const probe = f => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels,pix_fmt', '-of', 'json', f], { encoding: 'utf8' }));
for (const f of films) {
  const p = probe(f.mp4), v = p.streams.find(s => s.codec_type === 'video'), a = p.streams.find(s => s.codec_type === 'audio');
  f.dur = Number(p.format.duration);
  f.sig = [v?.codec_name, v?.width, v?.height, v?.r_frame_rate, v?.pix_fmt, a?.codec_name, a?.sample_rate, a?.channels].join('|');
  if (!a) f.sig += '|sessiz';
}
const same = films.every(f => f.sig === films[0].sig) && !films[0].sig.endsWith('sessiz');

const out = path.join(ROOT, 'renders', 'compilations', name);
fs.mkdirSync(out, { recursive: true });
const mp4 = path.join(out, `${name}.mp4`);
const total = films.reduce((s, f) => s + f.dur, 0);
console.log(`${title}: ${films.length} film, ${(total / 60).toFixed(1)} dakika`);

if (same) {
  // identical encodings: join without re-encoding
  const list = path.join(out, 'list.txt');
  fs.writeFileSync(list, films.map(f => `file '${f.mp4.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n', 'utf8');
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  fs.rmSync(list, { force: true });
} else {
  console.log('Videoların biçimi farklı; yeniden kodlanıyor (uzun sürer)…');
  const inputs = films.flatMap(f => ['-i', f.mp4]);
  const chain = films.map((_, i) => `[${i}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,fps=30,format=yuv420p,setsar=1[v${i}];[${i}:a]aresample=48000,aformat=channel_layouts=stereo[a${i}]`).join(';');
  const join = films.map((_, i) => `[v${i}][a${i}]`).join('') + `concat=n=${films.length}:v=1:a=1[v][a]`;
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', `${chain};${join}`, '-map', '[v]', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
}

// subtitles: every film's cues shifted to where that film starts
const stamp = s => { const ms = Math.max(0, Math.round(s * 1000)); const p = (n, l = 2) => String(n).padStart(l, '0'); return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`; };
const secs = t => { const m = t.match(/(\d+):(\d+):(\d+)[,.](\d+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : 0; };
let at = 0, k = 1, srt = '';
const chapters = [];
for (const f of films) {
  chapters.push({ t: at, title: f.title });
  if (fs.existsSync(f.srt)) {
    for (const block of fs.readFileSync(f.srt, 'utf8').replace(/\r/g, '').split(/\n\n+/)) {
      const lines = block.trim().split('\n');
      const i = lines.findIndex(l => l.includes('-->'));
      if (i < 0) continue;
      const [a, b] = lines[i].split('-->').map(x => secs(x.trim()));
      srt += `${k++}\n${stamp(at + a)} --> ${stamp(at + b)}\n${lines.slice(i + 1).join('\n')}\n\n`;
    }
  }
  at += f.dur;
}
if (srt) fs.writeFileSync(path.join(out, `${name}.srt`), srt, 'utf8');
const clock = t => { const s = Math.floor(t), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, '0'); return total >= 3600 ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };
fs.writeFileSync(path.join(out, 'bolumler.txt'), chapters.map(c => `${clock(c.t)} ${c.title}`).join('\n') + '\n', 'utf8');

const made = Number(probe(mp4).format.duration);
if (Math.abs(made - total) > 1.5) console.log(`! Süre beklenenden farklı: ${made.toFixed(1)} sn (beklenen ${total.toFixed(1)} sn). Videoyu izleyip kontrol edin.`);
console.log(`→ ${path.relative(ROOT, mp4)} (${(made / 60).toFixed(1)} dk)${srt ? `\n→ ${path.relative(ROOT, path.join(out, name + '.srt'))}` : ''}\n→ ${path.relative(ROOT, path.join(out, 'bolumler.txt'))}`);
