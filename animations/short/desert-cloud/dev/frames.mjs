// Stills of the film at given times, from the video path: node dev/frames.mjs <outDir> 1.5,10,41.6 [WxH] [query]
import fs from 'fs';
import path from 'path';
import { serve, browser } from './lib.mjs';
const [outDir, list, size = '1280x720', query = ''] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
fs.mkdirSync(outDir, { recursive: true });
const s = await serve();
const { b, page } = await browser(W, H);
await page.goto(`http://127.0.0.1:${s.address().port}/index.html?video=1&${query}`, { waitUntil: 'load' });
await page.waitForFunction('window.__ready === true', { timeout: 180000 });
for (const t of list.split(',').map(Number)) {
  await page.evaluate(tt => window.__video.renderAt(tt), t);
  const f = path.join(outDir, `f-${String(t.toFixed(2)).padStart(6, '0')}.jpg`);
  await page.screenshot({ path: f, type: 'jpeg', quality: 90 });
  console.log(f);
}
await b.close(); s.close();
