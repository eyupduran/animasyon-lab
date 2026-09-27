// Opens a built animation in headless Chrome with ?video=1 and waits for window.__film.
//   const f = await openFilm(dir); await f.page.evaluate(...); await f.close();
// Used by the small tools (poster, subtitles); the video renderer has its own copy tuned for long runs.
import fs from 'fs';
import path from 'path';
import http from 'http';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';

const TYPES = { '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };

export async function openFilm(dir, { build = true, W = 1920, H = 1080 } = {}) {
  const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'animation.json'), 'utf8'));
  if (build) execSync(cfg.build, { cwd: dir, stdio: 'inherit' });
  const out = path.join(dir, cfg.output || 'dist');
  const server = http.createServer((req, res) => {
    const p = path.join(out, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
    if (!p.startsWith(out) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
    fs.createReadStream(p).pipe(res);
  }).listen(0);
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new',
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`, '--hide-scrollbars'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('[sayfa hatası]', e.message));
  await page.goto(`http://localhost:${server.address().port}/index.html?video=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.__film && window.__film.duration > 0', { timeout: 180000 });
  return { page, close: async () => { await browser.close(); server.close(); } };
}
