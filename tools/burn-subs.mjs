// Draws the .srt subtitles into the picture: renders/<name>.mp4 + <name>.srt → renders/<name>-altyazili.mp4
//   npm run subs -- <slug> [--name <dosya adı, uzantısız>] [--crf 18]
// Audio is copied as is; only the picture is re-encoded. `npm run video` calls this at the end too.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { findAnimation } from './lib/animations.mjs';

// Style for 1080p (libass scales it to the video): white text, dark outline and soft shadow, near the bottom.
const STYLE = [
  'Fontname=Segoe UI Semibold', 'Fontsize=15', 'PrimaryColour=&H00FFFFFF', 'OutlineColour=&H00101010',
  'BackColour=&H80000000', 'BorderStyle=1', 'Outline=1.6', 'Shadow=0.8', 'MarginV=16', 'WrapStyle=0',
].join(',');

export function burnSubs(renders, name, { crf = '18' } = {}) {
  const mp4 = path.join(renders, `${name}.mp4`), srt = path.join(renders, `${name}.srt`);
  if (!fs.existsSync(mp4) || !fs.existsSync(srt)) throw new Error(`eksik: ${!fs.existsSync(mp4) ? mp4 : srt}`);
  if (!fs.readFileSync(srt, 'utf8').trim()) { console.log(`${name}.srt boş, altyazılı sürüm atlandı`); return null; }
  const out = `${name}-altyazili.mp4`;
  // run inside renders/ so the filter gets a plain relative path (Windows drive letters break its escaping)
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-stats', '-i', `${name}.mp4`,
    '-vf', `subtitles=${name}.srt:charenc=UTF-8:force_style='${STYLE}'`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', crf, '-pix_fmt', 'yuv420p',
    '-c:a', 'copy', '-movflags', '+faststart', out], { cwd: renders, stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg altyazı basımı başarısız');
  return path.join(renders, out);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
  const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
  if (!slug) { console.log('kullanım: npm run subs -- <slug> [--name <dosya adı>] [--crf 18]'); process.exit(1); }
  const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = findAnimation(slug).dir;
  const out = burnSubs(path.join(dir, 'renders'), opt('name', slug), { crf: opt('crf', '18') });
  if (out) console.log(`→ ${path.relative(ROOT, out)}`);
}
