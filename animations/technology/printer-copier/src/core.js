'use strict';
// ---------------------------------------------------------------------------------------------
// Çekirdek: tuval, matematik, zaman çizelgesi (anlatımın kelime zamanları), yazı ve ışık araçları.
// Her şey t'nin saf işlevidir: aynı t her zaman aynı kare.
// ---------------------------------------------------------------------------------------------
const W = 1920, H = 1080;
const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

const PI = Math.PI, TAU = PI * 2;
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, k) => a + (b - a) * k;
const mix = lerp;
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const smooth = k => k * k * (3 - 2 * k);
const sramp = (t, a, b) => smooth(ramp(t, a, b));
const easeIO = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const easeO = k => 1 - Math.pow(1 - k, 3);
const easeI = k => k * k * k;
const expoO = k => k >= 1 ? 1 : 1 - Math.pow(2, -10 * k);
const eramp = (t, a, b, f = easeIO) => f(ramp(t, a, b));
// görünme penceresi: a'da belirir, b'de kaybolur
const win = (t, a, b, fi = .5, fo = .5) => Math.min(sramp(t, a - fi * 0, a + fi), 1 - sramp(t, b - fo, b));
const fract = x => x - Math.floor(x);

// belirlenimci gürültü
function hash1(n) { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); }
function hash2(a, b) { const n = Math.sin(a * 127.1 + b * 311.7 + 74.7) * 43758.5453; return n - Math.floor(n); }
function mulberry(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function vnoise(x) { const i = Math.floor(x), f = x - i; const u = f * f * (3 - 2 * f); return lerp(hash1(i), hash1(i + 1), u); }
function vnoise2(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(ix, iy), hash2(ix + 1, iy), ux), lerp(hash2(ix, iy + 1), hash2(ix + 1, iy + 1), ux), uy);
}

// ---------------------------------------------------------------------------------------------
// Zaman çizelgesi: bölümler arka arkaya, aralarında nefes payı
// ---------------------------------------------------------------------------------------------
const LINES = ['01-sicak', '02-kagit', '03-tambur', '04-lazer', '05-toner', '06-yarim-ton', '07-fotokopi', '08-kopya', '09-final'];
const LEAD = [4.5, 6.0, 2.4, 2.2, 2.2, 2.8, 2.8, 3.0, 3.0];   // her kaydın öncesindeki boşluk
const TAIL = 7.5;
const S = {};
{
  let t = 0;
  LINES.forEach((id, i) => { t += LEAD[i]; S[id] = +t.toFixed(3); t += MANIFEST[id].dur; });
  S.end = t + TAIL;
}
const DURATION = +S.end.toFixed(3);
const lineEnd = id => S[id] + MANIFEST[id].dur;

const norm = s => s.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');
// T('04-lazer', 'süpürüyor') → kelimenin filmdeki başlangıç anı; nth: kaçıncı geçiş.
// Ses tanıma bazı kelimeleri farklı yazmış olabilir (ör. "Kopiyadaki"); önce önek, sonra benzerlikle aranır.
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const T_CACHE = {};
function T(id, word, nth = 0, end = false) {
  const ck = id + '|' + word + '|' + nth + '|' + end;
  if (ck in T_CACHE) return T_CACHE[ck];
  const ws = MANIFEST[id].words, key = norm(word);
  let k = 0, hit = null;
  for (const w of ws) if (norm(w[2]) === key) { if (k++ === nth) { hit = w; break; } }
  if (!hit) { k = 0; for (const w of ws) if (norm(w[2]).startsWith(key)) { if (k++ === nth) { hit = w; break; } } }
  if (!hit) {
    (globalThis.__fuzzy = globalThis.__fuzzy || []).push(id + ' ' + word + ' #' + nth);
    k = 0;
    for (const w of ws) {
      const n = norm(w[2]).slice(0, Math.max(key.length, 2));
      if (1 - lev(n, key) / Math.max(n.length, key.length) >= .6) { if (k++ === nth) { hit = w; break; } }
    }
  }
  if (!hit) throw new Error(`kelime yok: ${id} / ${word} #${nth}`);
  return (T_CACHE[ck] = S[id] + (end ? hit[1] : hit[0]));
}
const TE = (id, word, nth = 0) => T(id, word, nth, true);

// ---------------------------------------------------------------------------------------------
// Renkler ve yazı
// ---------------------------------------------------------------------------------------------
const C = {
  bg: '#07090c', ink: '#101114', paper: '#f3eee3', paperShade: '#d8d1c2',
  text: '#ece8df', dim: 'rgba(236,232,223,.55)', faint: 'rgba(236,232,223,.22)',
  laser: '#ff2d3d', laserGlow: 'rgba(255,40,60,', charge: '#58c7ff', heat: '#ff8a2a',
  drum: '#1f5a48', drumHi: '#4f9c7e', steel: '#9aa3ad', toner: '#0c0c0e', gold: '#e8b35a',
};
const SANS = '"Segoe UI Variable Display", "Segoe UI", system-ui, sans-serif';
const SANS_TEXT = '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'Consolas, "Cascadia Mono", monospace';

function font(size, weight = 400, fam = SANS) { return `${weight} ${size}px ${fam}`; }

function text(g, s, x, y, o = {}) {
  g.save();
  g.font = o.font || font(o.size || 28, o.weight || 400, o.fam || SANS);
  g.fillStyle = o.color || C.text;
  g.textAlign = o.align || 'left';
  g.textBaseline = o.base || 'alphabetic';
  if (o.spacing) g.letterSpacing = o.spacing + 'px';
  g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur || 18; }
  g.fillText(s, x, y);
  g.restore();
}

// harf harf beliren yazı (daktilo değil: yumuşak, soldan sağa açılan)
function revealText(g, s, x, y, k, o = {}) {
  if (k <= 0) return;
  g.save();
  g.font = o.font || font(o.size || 28, o.weight || 400, o.fam || SANS);
  if (o.spacing) g.letterSpacing = o.spacing + 'px';
  const w = g.measureText(s).width;
  const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
  const edge = x0 + (w + 80) * k;
  const grd = g.createLinearGradient(edge - 80, 0, edge, 0);
  const col = o.color || C.text;
  grd.addColorStop(0, col); grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = k >= 1 ? col : grd;
  g.textAlign = 'left'; g.textBaseline = o.base || 'alphabetic';
  g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur || 18; }
  g.fillText(s, x0, y);
  g.restore();
}

// etiket: bir noktadan çıkan ince çizgi ve yazı
function label(g, ax, ay, bx, by, s, k, o = {}) {
  if (k <= 0) return;
  const a = clamp(k * 3), b = clamp(k * 2 - .4), c = clamp(k * 1.6 - .5);
  g.save();
  g.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  g.strokeStyle = o.line || 'rgba(236,232,223,.7)';
  g.fillStyle = o.dot || C.text;
  g.lineWidth = o.lw || 1.6;
  g.beginPath(); g.arc(ax, ay, 4.5 * a, 0, TAU); g.fill();
  const mx = lerp(ax, bx, b), my = lerp(ay, by, b);
  g.beginPath(); g.moveTo(ax, ay); g.lineTo(mx, my); g.stroke();
  const right = o.side ? o.side > 0 : bx >= ax;
  if (b > 0) {
    const ex = bx + (right ? 1 : -1) * (o.tail == null ? 26 : o.tail) * c;
    g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, by); g.stroke();
  }
  g.restore();
  revealText(g, s, bx + (right ? 36 : -36), by + (o.size || 26) * .36, c, {
    size: o.size || 26, weight: o.weight || 500, align: right ? 'left' : 'right', color: o.color || C.text, spacing: o.spacing == null ? .4 : o.spacing,
    alpha: o.alpha, shadow: 'rgba(0,0,0,.8)', blur: 10,
  });
  if (o.sub) text(g, o.sub, bx + (right ? 36 : -36), by + (o.size || 26) * .36 + 30, {
    size: 20, weight: 400, align: right ? 'left' : 'right', color: C.dim, alpha: c * (o.alpha == null ? 1 : o.alpha),
  });
}

function rrect(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

function glowDot(g, x, y, r, color, a = 1) {
  const grd = g.createRadialGradient(x, y, 0, x, y, r);
  grd.addColorStop(0, `rgba(${color},${a})`); grd.addColorStop(.25, `rgba(${color},${a * .45})`); grd.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}

// eksi işareti (elektrik yükü)
function minus(g, x, y, s, col = C.charge, a = 1) {
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = Math.max(1, s * .28); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s * .5, y); g.lineTo(x + s * .5, y); g.stroke(); g.restore();
}
function plus(g, x, y, s, col = '#ffb86b', a = 1) {
  g.save(); g.globalAlpha *= a; g.strokeStyle = col; g.lineWidth = Math.max(1, s * .28); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - s * .5, y); g.lineTo(x + s * .5, y); g.moveTo(x, y - s * .5); g.lineTo(x, y + s * .5); g.stroke(); g.restore();
}

// ---------------------------------------------------------------------------------------------
// Katmanlar (geçişler için ekran dışı tuvaller)
// ---------------------------------------------------------------------------------------------
const layers = [];
function layer(i) {
  if (!layers[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; layers[i] = { c, g: c.getContext('2d') }; }
  const L = layers[i]; L.g.setTransform(1, 0, 0, 1, 0, 0); L.g.globalAlpha = 1; L.g.globalCompositeOperation = 'source-over';
  L.g.clearRect(0, 0, W, H); return L;
}
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// film greni ve kenar kararması
const grainTiles = [];
{
  const r = mulberry(7);
  for (let k = 0; k < 6; k++) {
    const c = makeCanvas(256, 256), g = c.getContext('2d'), im = g.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 90; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); grainTiles.push(c);
  }
}
function finish(g, t, o = {}) {
  // kenar kararması
  const v = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * 1.05);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${o.vignette == null ? .55 : o.vignette})`);
  g.fillStyle = v; g.fillRect(0, 0, W, H);
  // gren
  const f = Math.floor(t * 24), tile = grainTiles[f % grainTiles.length];
  const ox = Math.floor(hash1(f) * 256), oy = Math.floor(hash1(f + 91) * 256);
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = o.grain == null ? .07 : o.grain;
  g.translate(-ox, -oy);
  for (let y = 0; y < H + 256; y += 256) for (let x = 0; x < W + 256; x += 256) g.drawImage(tile, x, y);
  g.restore();
}

// bölüm işareti: köşede kısa süre görünen numara ve ad
function chapterMark(g, t, t0, num, title) {
  const k = win(t, t0, t0 + 4.8, .9, 1.1);
  if (k <= 0) return;
  g.save(); g.globalAlpha = k;
  text(g, num, 96, 104, { size: 22, weight: 600, color: C.gold, spacing: 3 });
  g.fillStyle = 'rgba(232,179,90,.8)'; g.fillRect(96, 116, 36 * eramp(t, t0, t0 + 1), 2);
  revealText(g, title, 96, 156, eramp(t, t0 + .2, t0 + 1.4), { size: 34, weight: 300, spacing: 1.5 });
  g.restore();
}

// kamera: dünya koordinatlarını ekrana taşıyan dönüşüm
function applyCam(g, cam) {
  g.setTransform(cam.s, 0, 0, cam.s, W / 2 - cam.x * cam.s, H / 2 - cam.y * cam.s);
  if (cam.r) { g.translate(cam.x, cam.y); g.rotate(cam.r); g.translate(-cam.x, -cam.y); }
}
// anahtar karelerden kamera: [[t, x, y, s], ...] ölçek logaritmik aradeğerlenir
function camPath(keys, t, f = easeIO) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], s: keys[0][3] };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1], b = keys[i];
    if (t <= b[0]) {
      if (t < (b[4] == null ? a[0] : b[0] - b[4])) return { x: a[1], y: a[2], s: a[3] };
      const st = b[4] == null ? a[0] : b[0] - b[4];
      const k = f(ramp(t, st, b[0]));
      const ls = lerp(Math.log(a[3]), Math.log(b[3]), k);
      const s = Math.exp(ls);
      // yakınlaşırken hedef nokta ekranda kaymasın: konum 1/ölçek ile aradeğerlenir
      let w = k;
      if (Math.abs(a[3] - b[3]) / Math.max(a[3], b[3]) > .05) w = (1 / a[3] - 1 / s) / (1 / a[3] - 1 / b[3]);
      return { x: lerp(a[1], b[1], w), y: lerp(a[2], b[2], w), s };
    }
  }
  const z = keys[keys.length - 1]; return { x: z[1], y: z[2], s: z[3] };
}

// sahne listesi: her bölüm kendi sahnelerini ekler
const SCENES = [], OVERLAYS = [];
function scene(a, b, draw, o = {}) { SCENES.push({ a, b, draw, fi: o.fi == null ? .6 : o.fi, fo: o.fo == null ? .6 : o.fo, z: o.z || 0 }); }

// karanlık masa / stüdyo zemini
function deskBg(g, warm = 0, o = {}) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, W, H);
  const cx = o.cx == null ? W * .5 : o.cx, cy = o.cy == null ? H * .38 : o.cy;
  const r = g.createRadialGradient(cx, cy, 50, cx, cy, W * .75);
  r.addColorStop(0, `rgba(${lerp(40, 70, warm)},${lerp(46, 48, warm)},${lerp(56, 40, warm)},1)`);
  r.addColorStop(.55, `rgba(${lerp(18, 28, warm)},${lerp(21, 20, warm)},${lerp(26, 18, warm)},1)`);
  r.addColorStop(1, '#07080a');
  g.fillStyle = r; g.fillRect(0, 0, W, H);
  g.restore();
}
