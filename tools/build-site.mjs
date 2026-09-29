// Builds the whole site: runs every film's own build and collects the results.
//   node tools/build-site.mjs            → dist/index.html + dist/channel/index.html + dist/<slug>/...
//   node tools/build-site.mjs <slug>     → only that film (plus the two list pages)
// Films live in youtube/<category>/<slug>/ (the channel) and animations/<category>/<slug>/ (the lab); the site
// keeps flat addresses (dist/<slug>/). The channel's films are listed on their own page, dist/channel/; the front
// page lists the lab. Each film declares in its animation.json how it is built ("build") and where the output
// lands ("output"). Folders starting with "_" (templates) are skipped.
// A film that answers the minimal contract (window.__film) is published inside the site player
// (tools/player): dist/<slug>/index.html plays dist/<slug>/film/ like a video, with the narration clips
// and the film's own sound (soundtrack.m4a from npm run soundtrack; without it the narration clips go to
// dist/<slug>/voice/ and the player mixes live) and the subtitles. Older pages with their own player stay as they are.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { listAnimations, CATEGORIES } from './lib/animations.mjs';
import { readNarration, clipCues, CUE } from './lib/film.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };

const planFile = path.join(ROOT, 'channel', 'plan.json');
const plan = fs.existsSync(planFile) ? JSON.parse(fs.readFileSync(planFile, 'utf8')) : { channel: {}, videos: [] };
const planned = Object.fromEntries((plan.videos || []).map(v => [v.slug, v]));
const CHANNEL_NAME = (plan.channel && plan.channel.name) || 'Kanal filmleri';

const only = process.argv[2];
const items = [];
for (const { slug, category, dir, collection } of listAnimations()) {
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'animation.json'), 'utf8'));
  if (!cfg.build) { console.log(`${slug}: animation.json → build boş, atlandı`); continue; }
  if (!only || only === slug) {
    const pkg = fs.existsSync(path.join(dir, 'package.json')) ? JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) : null;
    // packages the build needs (e.g. Vite) go in "dependencies"; "devDependencies" are local-only tools (video etc.)
    if (pkg && pkg.dependencies && Object.keys(pkg.dependencies).length && !fs.existsSync(path.join(dir, 'node_modules'))) execSync('npm install --omit=dev', { cwd: dir, stdio: 'inherit' });
    execSync(cfg.build || 'node build.mjs', { cwd: dir, stdio: 'inherit' });
    fs.rmSync(path.join(DIST, slug), { recursive: true, force: true });
    const built = path.join(dir, cfg.output || 'dist');
    if (usesFilm(built)) { copyDir(built, path.join(DIST, slug, 'film')); writePlayer(slug, dir, cfg, collection); }
    else copyDir(built, path.join(DIST, slug));
  }
  // the site card shows <slug>/poster.jpg: publish the animation's poster next to its page
  const posterSrc = path.join(dir, 'poster.jpg'), posterDst = path.join(DIST, slug, 'poster.jpg');
  if (fs.existsSync(posterSrc) && fs.existsSync(path.join(DIST, slug)) && !fs.existsSync(posterDst)) fs.copyFileSync(posterSrc, posterDst);
  items.push({ ...cfg, slug, category, collection, poster: fs.existsSync(path.join(dir, 'poster.jpg')) });
}

// ---- site player ----------------------------------------------------------------------------------------
function usesFilm(out) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).some(e => e.isDirectory() ? walk(path.join(d, e.name)) : /\.(html|js|mjs)$/.test(e.name) && fs.readFileSync(path.join(d, e.name), 'utf8').includes('__film'));
  return fs.existsSync(out) && walk(out);
}
function copyPlayerAssets() {
  const to = path.join(DIST, '_player'); fs.mkdirSync(to, { recursive: true });
  for (const f of ['player.js', 'player.css']) fs.copyFileSync(path.join(ROOT, 'tools', 'player', f), path.join(to, f));
  fs.copyFileSync(path.join(ROOT, 'assets', 'fonts', 'Inter-Medium.ttf'), path.join(to, 'Inter-Medium.ttf'));
}
function writePlayer(slug, dir, cfg, collection) {
  const narr = readNarration(dir) || {}, clips = {};
  const soundtrack = fs.existsSync(path.join(dir, 'soundtrack.m4a'));
  if (soundtrack) fs.copyFileSync(path.join(dir, 'soundtrack.m4a'), path.join(DIST, slug, 'soundtrack.m4a'));
  else console.log(`${slug}: soundtrack.m4a yok (npm run soundtrack -- ${slug}); oynatıcı sesi tarayıcıda karıştıracak`);
  for (const [id, n] of Object.entries(narr)) {
    if (!fs.existsSync(n.file)) continue;
    clips[id] = { cues: clipCues(n) };
    if (soundtrack) continue;
    const name = path.basename(n.file);
    fs.mkdirSync(path.join(DIST, slug, 'voice'), { recursive: true });
    fs.copyFileSync(n.file, path.join(DIST, slug, 'voice', name));
    clips[id].file = `voice/${encodeURIComponent(name)}`;
  }
  const data = { title: cfg.title, soundtrack: soundtrack ? 'soundtrack.m4a' : undefined, musicDb: -8, cue: { gap: CUE.gap, reveal: CUE.reveal }, clips };
  const hasPoster = fs.existsSync(path.join(dir, 'poster.jpg'));
  fs.writeFileSync(path.join(DIST, slug, 'index.html'), `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(cfg.title)} · ${esc(collection === 'channel' ? CHANNEL_NAME : 'Animasyon Lab')}</title>
<meta name="description" content="${esc(cfg.description)}">
<meta property="og:title" content="${esc(cfg.title)}"><meta property="og:description" content="${esc(cfg.description)}">${hasPoster ? '<meta property="og:image" content="poster.jpg">' : ''}
<meta name="theme-color" content="#000000"><link rel="icon" href="data:,">
<link rel="stylesheet" href="../_player/player.css">
</head><body>
<div class="pl" id="pl">
  <div class="pl-video">
    <iframe class="pl-film" src="film/index.html?video=1" title="${esc(cfg.title)}" scrolling="no" tabindex="-1" allow="autoplay"></iframe>
    ${hasPoster ? '<img class="pl-poster" src="poster.jpg" alt="">' : ''}
    <div class="pl-sub" aria-live="off"><div class="pl-subin"></div></div>
  </div>
  <div class="pl-hit"></div>
  <div class="pl-top">${collection === 'channel' ? `<a href="../channel/">← ${esc(CHANNEL_NAME)}</a>` : '<a href="../">← Animasyon Lab</a>'}<b>${esc(cfg.title)}</b></div>
  <button class="pl-big" aria-label="Oynat"></button>
  <div class="pl-hint">Sesi açık izleyin</div>
  <div class="pl-load"></div>
  <div class="pl-bar">
    <div class="pl-track" role="slider" aria-label="Zaman"><div class="pl-rail"><div class="pl-fill"></div></div><div class="pl-knob"></div><div class="pl-tip"></div></div>
    <div class="pl-row">
      <button class="pl-btn pl-play" aria-label="Oynat"></button>
      <button class="pl-btn pl-mute" aria-label="Sesi kapat"></button>
      <div class="pl-time"></div>
      <div class="pl-sp"></div>
      <button class="pl-btn pl-cc" aria-label="Altyazı"><span>CC</span></button>
      <button class="pl-btn pl-fs" aria-label="Tam ekran"></button>
    </div>
  </div>
</div>
<script>window.__PLAYER = ${JSON.stringify(data).replace(/</g, '\\u003c')};</script>
<script src="../_player/player.js"></script>
</body></html>
`);
}
copyPlayerAssets();

// ---- list pages ------------------------------------------------------------------------------------------
// the front page lists the lab (experiments), /channel/ lists the channel's films; cards are filtered by category
function label(c) { return (CATEGORIES[c] && CATEGORIES[c].tr) || c; }

function writeList({ file, base, list, title, eyebrow, heading, lead, order, more = '' }) {
  const cats = [...new Set([...Object.keys(CATEGORIES), ...list.map(a => a.category)])].filter(c => list.some(a => a.category === c));
  const card = a => `<a class="card" data-c="${a.category}" href="${base}${a.slug}/">${a.poster ? `<img src="${base}${a.slug}/poster.jpg" alt="" loading="lazy">` : '<div class="ph"></div>'}<div class="txt"><em>${esc(label(a.category))}</em><b>${esc(a.title)}</b><span>${esc(a.description)}</span>${a.tech ? `<i>${esc(a.tech)}</i>` : ''}</div></a>`;
  const chips = cats.length > 1 ? `<nav class="chips"><button class="on" data-c="">Tümü</button>${cats.map(c => `<button data-c="${c}">${esc(label(c))}</button>`).join('')}</nav>` : '';
  const sorted = [...list].sort(order || ((a, b) => cats.indexOf(a.category) - cats.indexOf(b.category) || a.title.localeCompare(b.title, 'tr')));
  const grid = list.length ? `<div class="grid">\n${sorted.map(card).join('\n')}\n</div>` : '<p>Henüz film yok.</p>';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
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
p a{color:var(--gold)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px}
.card{display:flex;flex-direction:column;border:1px solid var(--line);border-radius:4px;overflow:hidden;text-decoration:none;color:inherit;background:#12080b;transition:border-color .2s,transform .2s}
.card:hover{border-color:var(--gold);transform:translateY(-2px)}
.card img,.card .ph{width:100%;aspect-ratio:16/9;object-fit:cover;display:block;background:#1d0f14}
.txt{padding:14px 16px 16px;display:grid;gap:6px}.txt b{font-size:17px}.txt span{font-size:13.5px;color:var(--muted);line-height:1.45}
.card[hidden]{display:none}.txt em{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 30px}.chips button{font:600 14px 'IBM Plex Sans',sans-serif;color:var(--muted);background:transparent;border:1px solid var(--line);border-radius:30px;padding:7px 14px;cursor:pointer}
.chips button.on,.chips button:hover{color:var(--ink);background:var(--gold);border-color:var(--gold)}
.txt i{font-style:normal;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--dim)}
</style></head>
<body><main>
<div class="eyebrow">${esc(eyebrow)}</div>
<h1>${heading}</h1>
<p>${esc(lead)}${more}</p>
${chips}
${grid}
</main>
<script>document.querySelectorAll('.chips button').forEach(b => b.onclick = () => { document.querySelectorAll('.chips button').forEach(x => x.classList.toggle('on', x === b)); document.querySelectorAll('.card[data-c]').forEach(c => { c.hidden = !!b.dataset.c && c.dataset.c !== b.dataset.c; }); });</script>
</body></html>
`);
}

const lab = items.filter(a => a.collection !== 'channel'), channel = items.filter(a => a.collection === 'channel');
// "Şimdi Anladım" → Şimdi <em>Anladım</em>, the same two-tone heading as the front page
function twoTone(s) { const w = s.split(' '); return w.length < 2 ? esc(s) : `${esc(w.slice(0, -1).join(' '))} <em>${esc(w[w.length - 1])}</em>`; }
writeList({
  file: path.join(DIST, 'index.html'), base: './', list: lab, title: 'Animasyon Lab',
  eyebrow: 'Tarayıcıda eğitim animasyonları', heading: 'Animasyon <em>Lab</em>',
  lead: 'Denemeler ve ilk çalışmalar. Her animasyon tarayıcıda, kodla çiziliyor. Bir karta tıklayıp izlemeye başlayın; ses için hoparlörü açın.',
  more: channel.length ? ` YouTube kanalının filmleri ayrı bir sayfada: <a href="./channel/">${esc(CHANNEL_NAME)}</a>.` : '',
});
// newest first: by the date in the publishing schedule when the film is on it
const when = a => (planned[a.slug] && planned[a.slug].date) || '';
writeList({
  file: path.join(DIST, 'channel', 'index.html'), base: '../', list: channel, title: CHANNEL_NAME,
  eyebrow: 'Kodla çizilmiş belgeseller', heading: twoTone(CHANNEL_NAME),
  lead: 'YouTube kanalında yayınlanan filmler. Her biri tarayıcıda, kodla çiziliyor. Bir karta tıklayıp izlemeye başlayın; ses için hoparlörü açın.',
  order: (a, b) => when(b).localeCompare(when(a)) || a.title.localeCompare(b.title, 'tr'),
});
console.log(`site → dist/index.html (${lab.length} deneme) · dist/channel/index.html (${channel.length} kanal filmi)`);
