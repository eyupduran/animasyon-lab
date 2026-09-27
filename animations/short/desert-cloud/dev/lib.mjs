// Shared by the dev scripts: a static server for dist/ and a headless Chrome page.
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import puppeteer from '../../../../node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';
export const HERE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(HERE, 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png' };
export function serve(port = 0) {
  return new Promise(r => {
    const s = http.createServer((req, res) => {
      const p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
      if (!p.startsWith(DIST) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    }).listen(port, '127.0.0.1', () => r(s));
  });
}
export async function browser(w = 1600, h = 900) {
  const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required', `--window-size=${w},${h}`, '--hide-scrollbars'] });
  const page = await b.newPage(); await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('[sayfa hatası]', e.message));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning' || t.includes('[kalite]')) console.log('[konsol]', t.slice(0, 400)); });
  return { b, page };
}
