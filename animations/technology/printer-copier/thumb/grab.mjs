// Kapak için ana görsel kareleri: filmin kendi renderAt'ı ile, ekrandaki yazılar kapatılarak alınır.
//   node animations/technology/printer-copier/thumb/grab.mjs 19.5 121.5 ...   (önce: node build.mjs)
// Sayfa dokusundaki metin (ör. "Işıkla Yazmak") yüklemede çizilir ve kalır; etiketler, bölüm adları ve
// ara yazılar ise her karede çizildiği için fillText ve label/chapterMark boşa çıkarılınca kareye girmez.
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const times = process.argv.slice(2).map(Number).filter(n => !Number.isNaN(n));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage();
page.on('pageerror', e => console.log('[sayfa hatası]', e.message));
await page.setViewport({ width: 1920, height: 1080 });
await page.goto(pathToFileURL(path.join(here, '..', 'dist', 'index.html')).href + '?video=1', { waitUntil: 'load' });
await page.waitForFunction('window.__film');
// etiket çizgileri de gitsin: film betiği klasik betik, label/chapterMark küresel işlevler
await page.evaluate(() => {
  const P = CanvasRenderingContext2D.prototype; P.fillText = P.strokeText = function () {};
  window.label = window.chapterMark = function () {};
});
for (const t of times) {
  const data = await page.evaluate(t => { window.__film.renderAt(t); return document.getElementById('c').toDataURL('image/jpeg', 0.94); }, t);
  const file = path.join(here, `hero-${String(Math.round(t * 10)).padStart(4, '0')}.jpg`);
  fs.writeFileSync(file, Buffer.from(data.split(',')[1], 'base64'));
  console.log('→', path.basename(file));
}
await browser.close();
