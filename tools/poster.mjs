// The site card and player poster: one frame of the film, drawn by the film itself.
//   npm run poster -- <slug> --t <saniye>      → animations/<kategori>/<slug>/poster.jpg (1920×1080)
//   npm run poster -- <slug> --pick 8          → renders/poster-candidates/ with 8 evenly spaced frames to choose from
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { findAnimation } from './lib/animations.mjs';
import { openFilm } from './lib/page.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const slug = args.find((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (!slug || (!opt('t') && !opt('pick'))) { console.log('kullanım: npm run poster -- <slug> --t <saniye> | --pick <adet>'); process.exit(1); }
const dir = findAnimation(slug).dir;
const f = await openFilm(dir);
const duration = await f.page.evaluate(() => window.__film.duration);
const shot = async (t, file) => {
  await f.page.evaluate(t => window.__film.renderAt(t), t);
  await new Promise(r => setTimeout(r, 150));
  await f.page.screenshot({ path: file, type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log(`→ ${path.relative(ROOT, file)} (t=${t.toFixed(1)})`);
};
if (opt('pick')) {
  const n = Number(opt('pick')), to = path.join(dir, 'renders', 'poster-candidates');
  fs.mkdirSync(to, { recursive: true });
  for (let i = 0; i < n; i++) { const t = duration * (i + 0.5) / n; await shot(t, path.join(to, `t${String(Math.round(t)).padStart(4, '0')}.jpg`)); }
} else await shot(Math.min(duration, Number(opt('t'))), path.join(dir, 'poster.jpg'));
await f.close();
