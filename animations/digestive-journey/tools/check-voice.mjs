// Plays the page in real time and checks the narration: no sentence cut short by the next one,
// no mid-sentence skips, with artificial hitches thrown in.
//   node tools/check-voice.mjs [--from 0] [--secs 90]
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? Number(args[i + 1]) : d; };
const from = opt('from', 0), secs = opt('secs', 90);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' };
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
await page.evaluateOnNewDocument(() => {
  window.__seeks = [];
  const d = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', { get() { return d.get.call(this); }, set(v) { window.__seeks.push([d.get.call(this), v]); d.set.call(this, v); } });
});
await page.goto(`http://localhost:${server.address().port}/index.html`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__dig && !document.getElementById('b-start').disabled, { timeout: 120000 });
await page.click('#b-start');
if (from) await page.evaluate(f => { document.getElementById('timeline').dispatchEvent(new PointerEvent('pointerdown', { clientX: 0, bubbles: true })); }, from);
const t0 = Date.now();
let hitches = 0, spoken = new Set(), silentSec = 0;
while (Date.now() - t0 < secs * 1000) {
  await new Promise(r => setTimeout(r, 250));
  if (Math.random() < 0.06) { hitches++; await page.evaluate(() => { const e = performance.now() + 300; while (performance.now() < e); }); }
  const s = await page.evaluate(() => ({ key: window.__dig.VOICE.key, sp: window.__dig.VOICE.speaking, T: window.__dig.T() }));
  if (s.sp) spoken.add(s.key); else silentSec += 0.25;
}
const r = await page.evaluate(() => ({ cuts: window.__dig.cuts, seeks: window.__seeks.filter(([a, b]) => a > 0.05 && Math.abs(a - b) > 0.3), T: window.__dig.T() }));
console.log(`${secs} sn oynatıldı (T → ${r.T.toFixed(1)}), ${hitches} yapay takılma, ${spoken.size} cümle seslendirildi, sessiz ${silentSec.toFixed(0)} sn`);
console.log(`yarıda kesilen cümle: ${r.cuts.length}`, r.cuts.slice(0, 8));
console.log(`cümle ortasında atlatma: ${r.seeks.length}`);
await browser.close(); server.close();
