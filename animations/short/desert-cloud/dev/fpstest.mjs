// Real playback frame rate: node dev/fpstest.mjs "<query>" [seconds] [startT] [WxH]
import { serve, browser } from './lib.mjs';
const [query = '', secs = 15, from = 36, size = '1600x900'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const s = await serve();
const { b, page } = await browser(W, H);
await page.goto(`http://127.0.0.1:${s.address().port}/index.html?t=${from}&${query}`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction('window.__ok === true', { timeout: 240000 });
await page.click('#go');
const r = await page.evaluate(secs => new Promise(done => {
  const t0 = performance.now(); let n = 0, last = t0, worst = 0, slow = 0; const at = [];
  const step = () => { const now = performance.now(); const d = now - last; last = now; n++; if (n > 3) { if (d > worst) worst = d; if (d > 50) { slow++; at.push(window.__player.t.toFixed(1) + ':' + d.toFixed(0)); } } if (now - t0 < secs * 1000) requestAnimationFrame(step); else done({ fps: +(n / secs).toFixed(1), worst: +worst.toFixed(0), slow, tier: document.body.dataset.tier, at: at.slice(0, 12).join(' ') }); };
  requestAnimationFrame(step);
}), +secs);
console.log(query || 'auto', size, JSON.stringify(r));
await b.close(); s.close();
