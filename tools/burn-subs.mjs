// Draws the subtitles into the picture: renders/<name>.mp4 + <name>.cues.json (word times; falls back to
// <name>.srt without the word-by-word reveal) → renders/<name>-altyazili.mp4
//   npm run subs -- <slug> [--srt] [--name <dosya adı, uzantısız>] [--crf 18]
//   --srt first rewrites renders/<slug>.srt from the film (narration placement + current cue rules), so an
//   existing video gets the current subtitles without being rendered again.
// Same look as the site player (tools/lib/film.mjs → SUB_STYLE, font assets/fonts). Audio is copied as is;
// only the picture is re-encoded. `npm run video` calls this at the end too.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findAnimation } from './lib/animations.mjs';
import { srtToCues, cuesToAss, cuesToSrt, makeCues, readNarration } from './lib/film.mjs';
import { openFilm } from './lib/page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FONTS = path.join(ROOT, 'assets', 'fonts');

export function burnSubs(renders, name, { crf = '18' } = {}) {
  const mp4 = path.join(renders, `${name}.mp4`), srt = path.join(renders, `${name}.srt`), json = path.join(renders, `${name}.cues.json`);
  if (!fs.existsSync(mp4) || (!fs.existsSync(srt) && !fs.existsSync(json))) throw new Error(`eksik: ${!fs.existsSync(mp4) ? mp4 : srt}`);
  const cues = fs.existsSync(json) ? JSON.parse(fs.readFileSync(json, 'utf8')) : srtToCues(fs.readFileSync(srt, 'utf8'));
  if (!cues.length) { console.log(`${name}.srt boş, altyazılı sürüm atlandı`); return null; }
  const ass = `${name}.ass`, out = `${name}-altyazili.mp4`;
  fs.writeFileSync(path.join(renders, ass), cuesToAss(cues), 'utf8');
  // run inside renders/ with relative paths: the filter's option syntax breaks on Windows drive letters
  const fonts = path.relative(renders, FONTS).split(path.sep).join('/');
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-stats', '-i', `${name}.mp4`,
    '-vf', `ass=${ass}:fontsdir=${fonts}`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', out], { cwd: renders, stdio: 'inherit' });
  fs.rmSync(path.join(renders, ass), { force: true });
  if (r.status !== 0) throw new Error('ffmpeg altyazı basımı başarısız');
  return path.join(renders, out);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
  const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!slug) { console.log('kullanım: npm run subs -- <slug> [--srt] [--name <dosya adı>] [--crf 18]'); process.exit(1); }
  const dir = findAnimation(slug).dir;
  if (args.includes('--srt')) {
    const f = await openFilm(dir);
    const placed = await f.page.evaluate(() => window.__film.narration || []);
    await f.close();
    const srt = path.join(dir, 'renders', `${opt('name', slug)}.srt`);
    const cues = makeCues(readNarration(dir) || {}, placed);
    fs.writeFileSync(srt, cuesToSrt(cues), 'utf8');
    fs.writeFileSync(srt.replace(/\.srt$/, '.cues.json'), JSON.stringify(cues), 'utf8');
    console.log(`→ ${path.relative(ROOT, srt)} yeniden yazıldı`);
  }
  const out = burnSubs(path.join(dir, 'renders'), opt('name', slug), { crf: opt('crf', '18') });
  if (out) console.log(`→ ${path.relative(ROOT, out)}`);
}
