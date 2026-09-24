// Builds animations into dist/.
//   node tools/build.mjs <slug>     one animation → dist/<slug>/index.html (+ artifact.html)
//   node tools/build.mjs --all      every animation + dist/index.html (the site GitHub Pages serves)
// Each page is a single self-contained HTML file: engine + scenes + embedded assets.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const THREE_VERSION = '0.170.0';
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), 'utf8');
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const HEADER = `import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as BGU from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
`;

export function listAnimations() {
  return fs.readdirSync(path.join(ROOT, 'animations'))
    .filter(d => !d.startsWith('_') && fs.existsSync(path.join(ROOT, 'animations', d, 'animation.json')))
    .sort();
}

// {{key.path}} → escaped text, {{{key.path}}} → raw HTML
function fill(tpl, data) {
  const get = k => k.split('.').reduce((o, p) => (o == null ? o : o[p]), data);
  return tpl
    .replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, k) => get(k) ?? '')
    .replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => esc(get(k) ?? ''));
}

export function build(slug) {
  const dir = path.join(ROOT, 'animations', slug);
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'animation.json'), 'utf8'));
  const missing = cfg.scenes.filter(f => !fs.existsSync(path.join(dir, 'scenes', f)));
  if (missing.length) throw new Error(`${slug}: missing scene files: ${missing.join(', ')}`);
  const embeds = Object.entries(cfg.embed || {}).map(([name, file]) => `const ${name} = "${fs.readFileSync(path.join(dir, file)).toString('base64')}";`);
  const js = [
    HEADER,
    `const PAGE = ${JSON.stringify(cfg.page || {})};`,
    ...embeds,
    ...['core.js', 'engine.js'].map(f => `// ---- engine/${f}\n` + read('engine', f)),
    ...cfg.scenes.map(f => `// ---- animations/${slug}/scenes/${f}\n` + fs.readFileSync(path.join(dir, 'scenes', f), 'utf8')),
  ].join('\n');
  const body = fill(read('engine', 'shell.html'), { title: cfg.title, ...cfg.page })
    .replaceAll('@0.170.0/', `@${THREE_VERSION}/`)
    .replace('/*SCRIPT*/', () => js);
  const out = path.join(ROOT, 'dist', slug);
  fs.mkdirSync(out, { recursive: true });
  // artifact.html: body only (claude.ai artifact wraps it); index.html: a complete standalone page
  fs.writeFileSync(path.join(out, 'artifact.html'), body);
  const cut = body.indexOf('</style>') + '</style>'.length;
  fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="${cfg.lang || 'tr'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="${esc(cfg.description || '')}">
${body.slice(0, cut)}
</head>
<body>
${body.slice(cut).trim()}
</body>
</html>
`);
  if (fs.existsSync(path.join(dir, 'poster.jpg'))) fs.copyFileSync(path.join(dir, 'poster.jpg'), path.join(out, 'poster.jpg'));
  const kb = (fs.statSync(path.join(out, 'index.html')).size / 1024).toFixed(0);
  console.log(`built ${slug} → dist/${slug}/index.html (${kb} KB)`);
  return { slug, title: cfg.title, description: cfg.description || '', poster: fs.existsSync(path.join(dir, 'poster.jpg')) };
}

function buildIndex(items) {
  const cards = items.map(a => `<a class="card" href="./${a.slug}/">${a.poster ? `<img src="./${a.slug}/poster.jpg" alt="" loading="lazy">` : '<div class="ph"></div>'}<div class="txt"><b>${esc(a.title)}</b><span>${esc(a.description)}</span></div></a>`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'dist', 'index.html'), `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Animasyon Lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
:root{color-scheme:dark;--ink:#0A0407;--text:#F5ECE7;--muted:#C4A9AE;--line:rgba(255,226,214,.16);--gold:#FFC54D;--rose:#F4A3BF}
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
</style></head>
<body><main>
<div class="eyebrow">Tarayıcıda 3D eğitim animasyonları</div>
<h1>Animasyon <em>Lab</em></h1>
<p>Her animasyon tarayıcıda, kodla çiziliyor. Bir karta tıklayıp izlemeye başlayın; ses için hoparlörü açın.</p>
<div class="grid">
${cards}
</div>
</main></body></html>
`);
  console.log(`built index → dist/index.html (${items.length} animation${items.length === 1 ? '' : 's'})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const arg = process.argv[2];
  if (!arg) { console.log('usage: node tools/build.mjs <slug> | --all\nanimations: ' + listAnimations().join(', ')); process.exit(1); }
  if (arg === '--all') buildIndex(listAnimations().map(build));
  else build(arg);
}
