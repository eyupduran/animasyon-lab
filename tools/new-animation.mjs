// Starts a new animation from animations/_template.
//   node tools/new-animation.mjs <slug> "<Başlık>"
// slug: lowercase letters, digits and dashes (e.g. kalbin-bir-atimi)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [, , slug, ...titleParts] = process.argv;
const title = titleParts.join(' ').trim();
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !title) {
  console.log('usage: node tools/new-animation.mjs <slug> "<Başlık>"\n  örnek: node tools/new-animation.mjs kalbin-bir-atimi "Kalbin Bir Atımı"');
  process.exit(1);
}
const src = path.join(ROOT, 'animations', '_template'), dst = path.join(ROOT, 'animations', slug);
if (fs.existsSync(dst)) { console.log(`animations/${slug} zaten var.`); process.exit(1); }
// (fs.cpSync fails on Windows when the path has non-ASCII letters such as "ü", so copy by hand)
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };
copyDir(src, dst);
const cfgPath = path.join(dst, 'animation.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
cfg.slug = slug; cfg.title = title; cfg.page.start.titleHtml = title;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
const readme = path.join(dst, 'README.md');
fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replaceAll('{{title}}', title).replaceAll('{{slug}}', slug));
console.log(`animations/${slug} oluşturuldu.\n  derle:   npm run build -- ${slug}\n  aç:      dist/${slug}/index.html`);
