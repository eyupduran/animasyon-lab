// Builds the whole site: runs every animation's own build and collects the results.
//   node tools/build-site.mjs            → dist/index.html + dist/<slug>/...
//   node tools/build-site.mjs <slug>     → only that animation (plus the index)
// Each animation declares in its animation.json how it is built ("build") and where the output lands ("output").
// Folders starting with "_" (templates) are skipped.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANIM = path.join(ROOT, 'animations'), DIST = path.join(ROOT, 'dist');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };

const only = process.argv[2];
const all = fs.readdirSync(ANIM).filter(d => !d.startsWith('_') && fs.existsSync(path.join(ANIM, d, 'animation.json'))).sort();
const items = [];
for (const slug of all) {
  const dir = path.join(ANIM, slug);
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'animation.json'), 'utf8'));
  if (!only || only === slug) {
    const pkg = fs.existsSync(path.join(dir, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) : null;
    if (pkg && pkg.dependencies && Object.keys(pkg.dependencies).length && !fs.existsSync(path.join(dir, 'node_modules'))) execSync('npm install --omit=dev', { cwd: dir, stdio: 'inherit' });
    execSync(cfg.build || 'node build.mjs', { cwd: dir, stdio: 'inherit' });
    fs.rmSync(path.join(DIST, slug), { recursive: true, force: true });
    copyDir(path.join(dir, cfg.output || 'dist'), path.join(DIST, slug));
  }
  items.push({ slug, ...cfg, poster: fs.existsSync(path.join(dir, 'poster.jpg')) });
}

const cards = items.map(a => `<a class="card" href="./${a.slug}/">${a.poster ? `<img src="./${a.slug}/poster.jpg" alt="" loading="lazy">` : '<div class="ph"></div>'}<div class="txt"><b>${esc(a.title)}</b><span>${esc(a.description)}</span>${a.tech ? `<i>${esc(a.tech)}</i>` : ''}</div></a>`).join('\n');
fs.mkdirSync(DIST, { recursive: true });
fs.writeFileSync(path.join(DIST, 'index.html'), `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animasyon Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
:root{color-scheme:dark;--ink:#0A0407;--text:#F5ECE7;--muted:#C4A9AE;--dim:#8A6F75;--line:rgba(255,226,214,.16);--gold:#FFC54D;--rose:#F4A3BF}
*{box-sizing:border-box}body{margin:0;background:var(--ink);color:var(--text);font-family:'IBM Plex Sans',system-ui,sans-serif;padding:clamp(24px,6vw,72px) 16px}
main{max-width:1040px;margin:0 auto}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold)}
h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:clamp(40px,6vw,72px);line-height:.95;margin:.3em 0 .3em}
h1 em{font-style:italic;font-weight:400;color:var(--rose)}
p{color:var(--muted);max-width:60ch;line-height:1.55;margin:0 0 2.2em}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:4px;overflow:hidden;text-decoration:none;color:inherit;background:#12080b;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--gold);transform:translateY(-2px)}
.card img,.card .ph{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#1d0f14}
.txt{padding:14px 16px 16px;display:grid;gap:6px}.txt b{font-size:17px}.txt span{font-size:13.5px;color:var(--muted);line-height:1.45}
.txt i{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim)}
</style></head>
<body><main>
<div class="eyebrow">Tarayıcıda eğitim animasyonları</div>
<h1>Animasyon <em>Lab</em></h1>
<p>Her animasyon tarayıcıda, kodla çiziliyor. Bir karta tıklayıp izlemeye başlayın; ses için hoparlörü açın.</p>
<div class="grid">
${cards}
</div>
</main></body></html>
`);
console.log(`site → dist/index.html (${items.length} animasyon)`);
