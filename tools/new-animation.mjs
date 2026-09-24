// Opens an empty folder for a new animation: animations/<slug>/ with animation.json and README.md only.
//   node tools/new-animation.mjs <slug> "<Başlık>"
// slug: lowercase letters, digits and dashes (e.g. heartbeat)
// Nothing is copied from other animations on purpose: every animation chooses its own technique,
// packages, engine and visual style for what it has to show. Fill in "tech" and "build" once decided.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [slug, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();
if (!slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || !title) {
  console.log('usage: npm run new -- <slug> "<Başlık>"   (slug: küçük harf, rakam ve tire; ör. heartbeat)');
  process.exit(1);
}
const dir = path.join(ROOT, 'animations', slug);
if (fs.existsSync(dir)) { console.log(`animations/${slug} zaten var.`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });

fs.writeFileSync(path.join(dir, 'animation.json'), JSON.stringify({
  slug,
  title,
  description: '',
  tech: '',
  build: '',
  output: 'dist',
}, null, 2) + '\n');
fs.writeFileSync(path.join(dir, 'README.md'), `# ${title}

Ne anlattığı, bölümleri, nasıl derlendiği ve (varsa) video ya da model adımları.
`);
console.log(`animations/${slug} oluşturuldu (boş).
  animation.json → description, tech ve build alanlarını doldurun; build komutu output klasörüne index.html üretmeli.`);
