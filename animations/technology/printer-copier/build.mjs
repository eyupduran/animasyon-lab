// Filmi tek bir dist/index.html dosyasına derler: src/ altındaki betikler sırayla içeri gömülür,
// anlatımın kelime zamanları (narration/manifest.json) da sayfaya veri olarak eklenir.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(dir, 'src');
const order = ['core.js', 'gl.js', 'photo.js', 'page.js', 'machine.js', 'sound.js',
  'ch1.js', 'ch2.js', 'ch3.js', 'ch4.js', 'ch5.js', 'ch6.js', 'ch7.js', 'ch8.js', 'ch9.js', 'main.js'];
const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'narration', 'manifest.json'), 'utf8'));
const words = {};
for (const [id, l] of Object.entries(manifest.lines)) words[id] = { dur: l.dur, words: l.words };
let js = `const MANIFEST = ${JSON.stringify(words)};\n`;
for (const f of order) {
  const p = path.join(src, f);
  if (fs.existsSync(p)) js += `\n// ---- ${f} ----\n` + fs.readFileSync(p, 'utf8');
}
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8').replace('/*SCRIPT*/', () => js);
fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
fs.writeFileSync(path.join(dir, 'dist', 'index.html'), html);
console.log(`dist/index.html (${(html.length / 1024).toFixed(0)} KB)`);
