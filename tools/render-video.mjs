// Renders an animation to an MP4 for YouTube, frame by frame in headless Chrome.
//   npm run video -- <slug> [--subs burn] [--fps 30] [--size 1920x1080] [--from 0] [--to 60] [--crf 18]
// Output (renders/ is not in git):
//   animations/<kategori>/<slug>/renders/<slug>.mp4             picture + soundtrack (narration and effects)
//   animations/<kategori>/<slug>/renders/<slug>-altyazili.mp4   the same video with the subtitles drawn in (npm run subs)
//   animations/<kategori>/<slug>/renders/<slug>.srt             subtitles to upload to YouTube (viewers turn them on/off)
//   animations/<kategori>/<slug>/renders/<slug>-chapters.txt    chapter list for the YouTube description
// With --subs burn an older page (window.__video) draws its own subtitles instead; then no second copy is made.
//
// The film opts in by answering to ?video=1 with the minimal contract (tools/lib/film.mjs):
//   window.__film = { duration, renderAt(t), narration?: [{ id, at }], chapters?: [{ t, title }], sound?(from, to) → AudioBuffer }
// The tool makes the subtitles (from narration/lines.json + manifest.json), mixes the narration
// clips over the film's own sound and writes the chapter list. Nothing else is asked of the film.
// Older animations answer with window.__video (duration, renderAt, prepareSound, soundChunk, srt, chapters); still supported.
import fs from 'fs';
import path from 'path';
import http from 'http';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer-core';
import { findAnimation } from './lib/animations.mjs';
import { readNarration, makeSrt, mixArgs, WAV_IN_PAGE } from './lib/film.mjs';
import { burnSubs } from './burn-subs.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--') && !/^\d/.test(a));
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
if (!slug) { console.log('kullanım: npm run video -- <slug> [--subs burn] [--fps 30] [--size 1920x1080] [--from s] [--to s]'); process.exit(1); }
const dir = findAnimation(slug).dir;
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'animation.json'), 'utf8'));
const fps = Number(opt('fps', 30));
const [W, H] = opt('size', '1920x1080').split('x').map(Number);
const burn = opt('subs', 'none') === 'burn';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

console.log(`${slug}: derleniyor…`);
execSync(cfg.build, { cwd: dir, stdio: 'inherit' });
const out = path.join(dir, cfg.output || 'dist');

// static server for the built animation
const types = { '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.glb': 'model/gltf-binary', '.wasm': 'application/wasm' };
const server = http.createServer((req, res) => {
  const p = path.join(out, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(out) || !fs.existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(0);

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: 'new',
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', `--window-size=${W},${H}`, '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
page.on('pageerror', e => console.log('[sayfa hatası]', e.message));
await page.goto(`http://localhost:${server.address().port}/index.html?video=1&subs=${burn ? 1 : 0}`, { waitUntil: 'load' });
await page.waitForFunction('(window.__video && window.__ready === true) || (window.__film && window.__film.duration > 0)', { timeout: 180000 });
const FILM = await page.evaluate(() => !!window.__film);
const V = FILM ? '__film' : '__video';
const duration = await page.evaluate(v => window[v].duration, V);
const from = Number(opt('from', 0)), to = Math.min(duration, Number(opt('to', duration)));
const len = to - from;

const renders = path.join(dir, 'renders');
fs.mkdirSync(renders, { recursive: true });
const part = from > 0 || to < duration ? `-${Math.round(from)}-${Math.round(to)}s` : '';
const base = path.join(renders, `${slug}${burn ? '-altyazili' : ''}${part}`);

// soundtrack
console.log(`ses hazırlanıyor (${len.toFixed(1)} sn)…`);
const wavFile = `${base}.wav`;
let chapters;
if (FILM) {
  // the film's own sound (optional), rendered offline inside the page
  const own = `${base}-film.wav`;
  const hasSound = await page.evaluate(() => typeof window.__film.sound === 'function');
  if (hasSound) {
    const n = await page.evaluate(`(${WAV_IN_PAGE})(${from}, ${to})`);
    const fd = fs.openSync(own, 'w');
    for (let i = 0; i < n; i++) fs.writeSync(fd, Buffer.from(await page.evaluate(k => window.__wav[k], i), 'base64'));
    fs.closeSync(fd);
  }
  // narration clips laid over it; subtitles from the written text
  const narr = readNarration(dir) || {};
  const placed = (await page.evaluate(() => window.__film.narration || [])).filter(p => narr[p.id]);
  const hasVoice = placed.length > 0;
  execSync(['ffmpeg', '-y', '-v', 'error', ...mixArgs({ base: hasSound ? own : null, narr, placed, from, len, musicDb: hasVoice ? Number(opt('music', -8)) : 0 }), wavFile]
    .map(a => /[\s;\[\]=]/.test(a) ? `"${a}"` : a).join(' '), { stdio: 'inherit' });
  fs.rmSync(own, { force: true });
  fs.writeFileSync(`${base}.srt`, makeSrt(narr, placed, from, to), 'utf8');
  chapters = (await page.evaluate(() => window.__film.chapters || [])).filter(c => c.t >= from - 0.01 && c.t < to).map(c => ({ t: Math.max(0, c.t - from), title: c.title }));
} else {
  const chunks = await page.evaluate((a, b) => window.__video.prepareSound(a, b), from, to);
  const fd = fs.openSync(wavFile, 'w');
  for (let i = 0; i < chunks; i++) fs.writeSync(fd, Buffer.from(await page.evaluate(k => window.__video.soundChunk(k), i), 'base64'));
  fs.closeSync(fd);
  fs.writeFileSync(`${base}.srt`, await page.evaluate((a, b) => window.__video.srt(a, b), from, to), 'utf8');
  chapters = await page.evaluate(a => window.__video.chapters(a), from);
}
const stamp = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
fs.writeFileSync(`${base}-chapters.txt`, chapters.map(c => `${stamp(c.t)} ${c.title}`).join('\n') + '\n', 'utf8');

// frames → ffmpeg
const mp4 = `${base}.mp4`;
const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', wavFile,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', opt('crf', '18'), '-pix_fmt', 'yuv420p', '-r', String(fps),
  '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
const frames = Math.round(len * fps);
const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  await page.evaluate((v, t) => window[v].renderAt(t), V, from + i / fps);
  const img = await page.screenshot({ type: 'jpeg', quality: 93, optimizeForSpeed: true });
  if (!ff.stdin.write(img)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 60 === 0 || i === frames - 1) {
    const el = (Date.now() - t0) / 1000, eta = el / (i + 1) * (frames - i - 1);
    process.stdout.write(`\rkare ${i + 1}/${frames} · ${Math.round((i + 1) / frames * 100)}% · kalan ~${Math.ceil(eta / 60)} dk   `);
  }
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
server.close();
fs.rmSync(wavFile, { force: true });
// second copy with the subtitles drawn into the picture (for places where the .srt cannot be attached)
if (!burn) console.log('\naltyazılı sürüm hazırlanıyor…');
const subbed = burn ? null : burnSubs(renders, path.basename(base), { crf: opt('crf', '18') });
console.log(`\n→ ${path.relative(ROOT, mp4)}${subbed ? `\n→ ${path.relative(ROOT, subbed)} (altyazı görüntüye basılı)` : ''}\n→ ${path.relative(ROOT, base)}.srt (YouTube: Altyazılar → Dosya yükle → Zamanlamalı)\n→ ${path.relative(ROOT, base)}-chapters.txt (açıklamaya yapıştırın)`);
