// Starts a new animation by copying a template or an existing animation.
//   node tools/new-animation.mjs <slug> "<Başlık>"                          (from _template-threejs)
//   node tools/new-animation.mjs <slug> "<Başlık>" --from lokumun-yolculugu  (from any animation)
// slug: lowercase letters, digits and dashes (e.g. kalbin-bir-atimi)
// Build output, installed packages and rendered videos are not copied.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const from = fromIdx >= 0 ? args.splice(fromIdx, 2)[1] : '_template-threejs';
const [slug, ...titleParts] = args;
const title = titleParts.join(' ').trim();
const usage = () => { console.log('usage: npm run new -- <slug> "<Başlık>" [--from <kaynak-animasyon>]\n  kaynaklar: ' + fs.readdirSync(path.join(ROOT, 'animations')).join(', ')); process.exit(1); };
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !title) usage();
const src = path.join(ROOT, 'animations', from), dst = path.join(ROOT, 'animations', slug);
if (!fs.existsSync(path.join(src, 'animation.json'))) { console.log(`kaynak bulunamadı: animations/${from}`); usage(); }
if (fs.existsSync(dst)) { console.log(`animations/${slug} zaten var.`); process.exit(1); }

// (fs.cpSync fails on Windows when the path has non-ASCII letters such as "ü", so copy by hand)
const SKIP = new Set(['node_modules', 'dist', 'renders']);
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { if (SKIP.has(e.name)) continue; const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };
copyDir(src, dst);

const cfgPath = path.join(dst, 'animation.json');
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
cfg.slug = slug; cfg.title = title;
if (cfg.page?.start) cfg.page.start.titleHtml = title;
fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
const pkgPath = path.join(dst, 'package.json');
if (fs.existsSync(pkgPath)) { const p = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); p.name = slug; fs.writeFileSync(pkgPath, JSON.stringify(p, null, 2) + '\n'); }
fs.rmSync(path.join(dst, 'package-lock.json'), { force: true });
fs.rmSync(path.join(dst, 'poster.jpg'), { force: true });
const readme = path.join(dst, 'README.md');
if (from.startsWith('_')) fs.writeFileSync(readme, fs.readFileSync(readme, 'utf8').replaceAll('{{title}}', title).replaceAll('{{slug}}', slug));
else fs.writeFileSync(readme, `# ${title}\n\n\`animations/${from}\` kopyalanarak başlatıldı. Bu dosyayı animasyonun kendi anlatımıyla güncelleyin.\n`);
console.log(`animations/${slug} oluşturuldu (kaynak: ${from}).\n  cd animations/${slug}\n  node build.mjs          → dist/index.html`);
