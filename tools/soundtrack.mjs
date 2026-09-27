// The site player's sound: narration and the film's own sound mixed into one small file, the same mix as the video.
//   npm run soundtrack -- <slug> [--kbps 128]
// → animations/<kategori>/<slug>/soundtrack.m4a (committed; tools/build-site.mjs publishes it next to the player).
// Run it again whenever the film's sound or narration changes.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { findAnimation } from './lib/animations.mjs';
import { readNarration, mixArgs, WAV_IN_PAGE } from './lib/film.mjs';
import { openFilm } from './lib/page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!slug) { console.log('kullanım: npm run soundtrack -- <slug> [--kbps 128]'); process.exit(1); }
const dir = findAnimation(slug).dir;

console.log(`${slug}: film açılıyor…`);
const f = await openFilm(dir);
const { duration, hasSound, placed } = await f.page.evaluate(() => ({
  duration: window.__film.duration, hasSound: typeof window.__film.sound === 'function', placed: window.__film.narration || [],
}));
const tmp = fs.mkdtempSync(path.join(dir, '.soundtrack-'));
const own = path.join(tmp, 'film.wav'), mix = path.join(tmp, 'mix.wav');
try {
  if (hasSound) {
    console.log(`filmin sesi üretiliyor (${duration.toFixed(1)} sn)…`);
    const n = await f.page.evaluate(`(${WAV_IN_PAGE})(0, ${duration})`);
    const fd = fs.openSync(own, 'w');
    for (let i = 0; i < n; i++) fs.writeSync(fd, Buffer.from(await f.page.evaluate(k => window.__wav[k], i), 'base64'));
    fs.closeSync(fd);
  }
  await f.close();
  const narr = readNarration(dir) || {};
  const voiced = placed.filter(p => narr[p.id]);
  if (!hasSound && !voiced.length) { console.log('filmde ses yok; soundtrack üretilmedi.'); process.exit(0); }
  const q = a => /[\s;\[\]=]/.test(a) ? `"${a}"` : a;
  execSync(['ffmpeg', '-y', '-v', 'error', ...mixArgs({ base: hasSound ? own : null, narr, placed: voiced, from: 0, len: duration, musicDb: voiced.length ? -8 : 0 }), mix].map(q).join(' '), { stdio: 'inherit' });
  const out = path.join(dir, 'soundtrack.m4a');
  execSync(['ffmpeg', '-y', '-v', 'error', '-i', mix, '-c:a', 'aac', '-b:a', `${opt('kbps', '128')}k`, '-movflags', '+faststart', out].map(q).join(' '), { stdio: 'inherit' });
  console.log(`→ ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1048576).toFixed(1)} MB)`);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
