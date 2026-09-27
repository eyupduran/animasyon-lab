// Frame cost of parts of the scene: node dev/cost.mjs "<query>" t1,t2,...  (median ms of __probe at 1600×900)
import { serve, browser } from './lib.mjs';
const [query = '', list = '10,40,44,50,58'] = process.argv.slice(2);
const s = await serve();
const { b, page } = await browser(1600, 900);
await page.goto(`http://127.0.0.1:${s.address().port}/index.html?${query}`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction('window.__ok === true', { timeout: 240000 });
const out = [];
for (const t of list.split(',').map(Number)) {
  const ms = await page.evaluate(t => { const r = []; for (let i = 0; i < 7; i++) r.push(window.__probe(t + i * 0.01)); r.sort((a, b) => a - b); return r[3]; }, t);
  out.push(`${t}:${ms.toFixed(1)}`);
}
console.log((query || 'auto').padEnd(34), out.join('  '));
await b.close(); s.close();
