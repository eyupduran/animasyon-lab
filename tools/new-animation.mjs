// Opens an empty folder for a new film, with animation.json and README.md only.
//   node tools/new-animation.mjs youtube/<category>/<slug> "<Başlık>"   a channel film (youtube/…)
//   node tools/new-animation.mjs <category>/<slug> "<Başlık>"           a lab experiment (animations/…)
// category: an English folder name (history, geography, technology, philosophy, space, documentary, short…)
// slug: lowercase letters, digits and dashes, unique across the whole repo (the site address is …/<slug>/)
// Nothing is copied from other films on purpose: every film chooses its own technique,
// packages, engine and visual style for what it has to show. Fill in "tech" and "build" once decided.
import fs from 'fs';
import path from 'path';
import { COLLECTIONS, CATEGORIES, findAnimation } from './lib/animations.mjs';

const [ref, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();
// youtube/<category>/<slug> opens a channel film; <category>/<slug> opens a lab experiment under animations/
const segs = String(ref || '').split('/');
const home = segs.length === 3 ? segs.shift() : 'animations';
const collection = Object.keys(COLLECTIONS).find(k => COLLECTIONS[k].folder === home);
const [category, slug] = segs.length === 2 ? segs : [null, null];
const okName = s => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s || '');
if (!collection || !okName(category) || !okName(slug) || !title) {
  console.log('kullanım: npm run new -- youtube/<kategori>/<slug> "<Başlık>"   (kanal filmi, ör. youtube/history/conquest-of-istanbul "İstanbul Nasıl Fethedildi?")');
  console.log('          npm run new -- <kategori>/<slug> "<Başlık>"           (deneme, animations/ altına)');
  console.log('kategoriler: ' + Object.keys(CATEGORIES).join(', ') + ' (yeni bir İngilizce ad da olur)');
  process.exit(1);
}
if (findAnimation(slug, { exit: false })) { console.log(`"${slug}" adında bir film zaten var (slug bütün depoda tek olmalı).`); process.exit(1); }
if (['kanal', '_player'].includes(slug)) { console.log(`"${slug}" sitenin kendi adresi; başka bir slug seçin.`); process.exit(1); }
if (!CATEGORIES[category]) console.log(`not: "${category}" yeni bir kategori; tools/lib/animations.mjs → CATEGORIES listesine Türkçe adını ekleyin.`);
const dir = path.join(COLLECTIONS[collection].dir, category, slug);
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
console.log(`${home}/${category}/${slug} oluşturuldu (boş).
  animation.json → description, tech ve build alanlarını doldurun; build komutu output klasörüne index.html üretmeli.`);
