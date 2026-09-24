// Local check of the live player: narration stays in sync and the settings panel works.
//   node tools/check-player.mjs <outDir>
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const out = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(DIST, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--autoplay-policy=no-user-gesture-required', '--window-size=1600,900'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900 });
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?ch=charge&t=0.3&play=1`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 60000 });
for (let i = 0; i < 6; i++) {
  await new Promise(r => setTimeout(r, 1500));
  const s = await page.evaluate(() => { const n = window.__narr, T = window.__T(), q = window.__tl.cueAt(T); return { T: T.toFixed(2), cue: q ? `${q.say.slice(0, 28)}… @${q.start.toFixed(2)}` : null, src: n.el.src.split('/').pop(), audio: n.el.currentTime.toFixed(2), expect: q ? (T - q.start).toFixed(2) : '-', paused: n.el.paused }; });
  console.log(JSON.stringify(s));
}
await page.click('#bSettings');
await new Promise(r => setTimeout(r, 400));
fs.mkdirSync(out, { recursive: true });
await page.screenshot({ path: path.join(out, 'settings.png') });
await page.click('[data-pref="subSize"][data-val="l"]');
await page.keyboard.press('Escape');
await page.mouse.click(400, 300);
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: path.join(out, 'large-subs.png') });
await page.keyboard.press('c');
await new Promise(r => setTimeout(r, 300));
console.log('subs visible after C:', await page.evaluate(() => getComputedStyle(document.getElementById('subtitle')).display));
await browser.close(); server.close();
