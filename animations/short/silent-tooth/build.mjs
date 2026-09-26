// No bundler: copies the page, its modules and three.module.js into dist/ (an import map resolves "three").
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'dist');
// three comes from this folder's own package.json (the site build installs it); the repo root is a fallback
const threeDir = [path.join(here, 'node_modules/three'), path.resolve(here, '../../../node_modules/three')].find(d => fs.existsSync(d));
if (!threeDir) { console.log('three bulunamadı: bu klasörde "npm install" çalıştırın'); process.exit(1); }
const three = path.join(threeDir, 'build/three.module.min.js');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'src'), { recursive: true });
fs.mkdirSync(path.join(out, 'lib'), { recursive: true });
fs.copyFileSync(path.join(here, 'index.html'), path.join(out, 'index.html'));
for (const f of fs.readdirSync(path.join(here, 'src'))) fs.copyFileSync(path.join(here, 'src', f), path.join(out, 'src', f));
fs.copyFileSync(three, path.join(out, 'lib', 'three.module.js'));
fs.mkdirSync(path.join(out, 'lib', 'addons'), { recursive: true });
fs.copyFileSync(path.join(threeDir, 'examples/jsm/geometries/RoundedBoxGeometry.js'), path.join(out, 'lib', 'addons', 'RoundedBoxGeometry.js'));
if (fs.existsSync(path.join(here, 'poster.jpg'))) fs.copyFileSync(path.join(here, 'poster.jpg'), path.join(out, 'poster.jpg'));
console.log('dist/ hazır');
