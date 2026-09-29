// Where films live. Two homes, same layout (<category>/<slug>/, category folders in English):
//   youtube/      the YouTube channel's films: everything made from now on
//   animations/   the lab: earlier experiments and tests, kept as they are
// Every tool finds a film by its slug alone; slugs stay unique across both homes and all categories,
// and the published site keeps flat addresses (…/animasyon-lab/<slug>/).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const ANIM = path.join(ROOT, 'animations');
export const CHANNEL = path.join(ROOT, 'youtube');
// collection id → folder; 'channel' films are listed on the site's /channel/ page, 'lab' ones on the front page
export const COLLECTIONS = { channel: { dir: CHANNEL, folder: 'youtube', tr: 'Kanal' }, lab: { dir: ANIM, folder: 'animations', tr: 'Denemeler' } };

// category folder → label on the site and on YouTube covers
export const CATEGORIES = {
  biology: { tr: 'Biyoloji', cover: 'BİYOLOJİ' },
  history: { tr: 'Tarih', cover: 'TARİH' },
  geography: { tr: 'Coğrafya', cover: 'COĞRAFYA' },
  physics: { tr: 'Fizik', cover: 'FİZİK' },
  chemistry: { tr: 'Kimya', cover: 'KİMYA' },
  math: { tr: 'Matematik', cover: 'MATEMATİK' },
  space: { tr: 'Uzay', cover: 'UZAY' },
  technology: { tr: 'Teknoloji', cover: 'TEKNOLOJİ' },
  software: { tr: 'Yazılım', cover: 'YAZILIM' },
  philosophy: { tr: 'Felsefe', cover: 'FELSEFE' },
  economy: { tr: 'Ekonomi', cover: 'EKONOMİ' },
  documentary: { tr: 'Belgesel', cover: 'BELGESEL' },
  short: { tr: 'Kısa Film', cover: 'KISA FİLM' },
};

// all films: [{ slug, category, dir, collection }] (folders starting with "_" are skipped)
export function listAnimations() {
  const out = [];
  for (const [collection, { dir: home }] of Object.entries(COLLECTIONS)) {
    if (!fs.existsSync(home)) continue;
    for (const cat of fs.readdirSync(home, { withFileTypes: true })) {
      if (!cat.isDirectory() || cat.name.startsWith('_')) continue;
      const cdir = path.join(home, cat.name);
      for (const a of fs.readdirSync(cdir, { withFileTypes: true })) {
        if (a.isDirectory() && !a.name.startsWith('_') && fs.existsSync(path.join(cdir, a.name, 'animation.json')))
          out.push({ slug: a.name, category: cat.name, dir: path.join(cdir, a.name), collection });
      }
    }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// the folder of one animation, by slug (or "category/slug"); exits with a clear message if missing
export function findAnimation(ref, { exit = true } = {}) {
  const slug = String(ref || '').split('/').pop();
  const hit = listAnimations().find(a => a.slug === slug);
  if (hit) return hit;
  if (exit) {
    console.log(`film bulunamadı: ${ref}\nvar olanlar: ${listAnimations().map(a => `${COLLECTIONS[a.collection].folder}/${a.category}/${a.slug}`).join(', ')}`);
    process.exit(1);
  }
  return null;
}
