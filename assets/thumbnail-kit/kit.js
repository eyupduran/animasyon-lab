// Şimdi Anladım kapak kiti: kanalın bütün YouTube kapaklarında aynı kalan kimlik.
//
// TARZ: "BÜYÜK NESNE, KISA DEV YAZI"
//   • Ana görsel konunun KENDİSİ olan tek, büyük, parlak, net bir nesnedir (yazıcı, arı, diş, sunucu…).
//     Bir bakışta "bu video X hakkında" dedirtmeli. Filmden soyut bir kare yetmiyorsa nesneyi kapak için
//     ayrıca çizin (Canvas, WebGL, SVG; filmin kendi kodundan parça alınabilir). Canlı renk, sert ışık,
//     yüksek kontrast; nesne arka plandan net ayrılsın.
//   • Başlık konuyu DOĞRUDAN söyler, 2–3 kelime: "YAZICI NASIL ÇALIŞIR?", "ARININ BİR GÜNÜ".
//     Konuyu söylemeyen zekice başlık ("GRİ YOK") yasak.
//   • Küçük yazı yok. Kanal işareti dışında ekranda yalnızca dev başlık bulunur; accent satırı yalnızca
//     eski sayfalar içindir.
//   • Sınama: kapağı 168×94'e küçültün. Nesne tanınıyor ve başlık okunuyor mu? Değilse büyütün, sadeleştirin.
//
// DÜZEN
//   Film kendi thumbnail.html'inde ana görseli çizer (1280×720 #root, tam kadraj), sonra kit.brand() kanal
//   katmanını ekler, en sonda await kit.ready() yazılar yüklenip yerine oturana kadar bekler.
//   Araç: npm run thumbnail -- <slug>  (tools/thumbnail.mjs; kit /_kit/kit.js adresinden gelir).
//
//     import * as kit from '/_kit/kit.js';
//     const g = kit.layer(1);                                        // ya da kendi WebGL tuvaliniz
//     ...büyük nesneyi SAĞ yarıya çizin...
//     kit.brand({ title: 'YAZICI NASIL *ÇALIŞIR?*', category: 'technology' });
//     await kit.ready();
//     window.__thumbs = { count, list: [{ id, title }] }; window.__thumbReady = true;
//
// SERİ SİSTEMİ (brand() hepsini kendisi uygular, film yalnızca görseli ve başlığı verir)
//   • Izgara: 1280×720, kenar payı 56 px. Başlık solda (varsayılan: sol orta), genişliği en çok 640 px.
//     Nesne sağ yarıda, büyük; kadrajdan taşabilir. Sağ alt köşe (SAFE.badge) BOŞ kalır: YouTube'un süre
//     rozeti orada. Sağ üst de sade kalsın (izle-sonra düğmeleri). ?guides=1 bu alanları gösterir.
//   • Kanal işareti: sol üstte "ŞİMDİ [ANLADIM]" yazı işareti (BRAND.name; son kelime kutuda). Her kapakta aynı yer, aynı boy.
//   • Kategori rengi: sol kenarda tam boy şerit ve başlıktaki *vurgulu* kelime. Renkler CATEGORIES
//     tablosunda (anahtarlar tools/lib/animations.mjs → CATEGORIES ile aynı). Kategori adı yazılmaz.
//   • Başlık: Archivo 900, büyük harf, 2–3 kelime, en çok 3 satır; beyaz, sert gölgeli. *kelime* kategori
//     renginde (box: true ise kategori renginde kutunun içinde koyu). Boyut kendiliğinden ayarlanır
//     (180 → 100 px; sığmazsa harfler daraltılır).
//   • Işık: başlığın arkasında hafif perde (scrim), kenar kararması, canlılığı artıran renk işlemi, ince gren.
//
// brand(seçenekler)
//   title     (şart) büyük harfle başlık; *...* vurgulanır; satırı elle bölmek için \n. Türkçe İ/I'yı çağıran doğru yazar.
//   category  'technology' | 'software' | 'history' | … (renk buradan). Verilmezse topic'ten bulunur.
//   box       true: vurgulu kelime kategori renginde bir kutuda koyu yazılır (daha "YouTube" bir görünüm).
//   scrim     başlık arkasındaki perdenin koyuluğu 0–1 (varsayılan 0.55). Arka plan zaten koyuysa düşürün.
//   size      başlığın en büyük punto değeri (varsayılan 180).
//   width     başlık bloğunun en büyük genişliği (varsayılan 640).
//   lines     en çok satır (varsayılan 3).
//   valign    'middle' (varsayılan) | 'bottom' | 'top'.
//   color     kategori rengini elle ezmek için (#rrggbb).   tint: başlık arkasındaki ışığın rengi.
//   grade     false: renk işlemini kapatır.
//   label     true: kategori adını başlığın üstüne yazar (önerilmez).
//   accent, topic, minutes: eski sayfalar için kabul edilir. accent küçük bir satır olarak yine çizilir ama
//     yeni kapaklarda kullanmayın; minutes yok sayılır.
//
// Diğer araçlar: layer(z), off(w,h), hero(ctx,img,o), html(s,css,z), bloom, depthOfField, bokeh,
// homography, drawQuad, rand(seed), lerp, SAFE. W/H 1280×720, DPR 2 (araç ?dpr=2 ile açar, çıktı 1920×1080).
export const W = 1280, H = 720;
export const DPR = Math.min(2, Number(new URLSearchParams(location.search).get('dpr')) || 2);

export const CATEGORIES = {
  technology: { label: 'TEKNOLOJİ', color: '#FF5A36' },
  software: { label: 'YAZILIM', color: '#4FD8F0' },
  history: { label: 'TARİH', color: '#E0A956' },
  geography: { label: 'COĞRAFYA', color: '#3CC7A0' },
  biology: { label: 'BİYOLOJİ', color: '#A5DB4F' },
  physics: { label: 'FİZİK', color: '#5B8CFF' },
  chemistry: { label: 'KİMYA', color: '#E774D8' },
  math: { label: 'MATEMATİK', color: '#FFD04A' },
  space: { label: 'UZAY', color: '#A48BFF' },
  philosophy: { label: 'FELSEFE', color: '#F4A6C8' },
  economy: { label: 'EKONOMİ', color: '#35E08A' },
  documentary: { label: 'BELGESEL', color: '#E9DCC4' },
  short: { label: 'KISA FİLM', color: '#FF6F8E' },
};
export const BRAND = { ink: '#07080B', white: '#FFFFFF', name: 'ŞİMDİ ANLADIM', yellow: '#FFD04A' };
// korunacak alanlar: süre rozeti (sağ alt) ve izle-sonra düğmeleri (sağ üst)
export const SAFE = { margin: 56, badge: { x: 1280 - 250, y: 720 - 110, w: 250, h: 110 }, topRight: { x: 1280 - 170, y: 0, w: 170, h: 120 } };
const GUIDES = new URLSearchParams(location.search).get('guides') === '1';

const css = document.createElement('link');
css.rel = 'stylesheet';
css.href = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@600;700&display=swap';
const cssLoaded = new Promise(r => { css.onload = r; css.onerror = r; });
document.head.appendChild(css);
const style = document.createElement('style');
style.textContent = `
html,body{margin:0;background:#000;overflow:hidden}
#root{position:relative;width:${W}px;height:${H}px;overflow:hidden;font-family:Archivo,'Segoe UI',sans-serif;background:${BRAND.ink}}
#root canvas{position:absolute;inset:0;width:${W}px;height:${H}px}
#root.kit-graded canvas{filter:contrast(1.07) saturate(1.12)}
#root .t{position:absolute;white-space:nowrap}
.kit-fx{position:absolute;inset:0;pointer-events:none}
.kit-grain{position:absolute;inset:0;pointer-events:none;opacity:.06;mix-blend-mode:overlay;z-index:90;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.kit-spine{position:absolute;left:0;top:0;bottom:0;width:12px;z-index:96}
.kit-mark{position:absolute;left:56px;top:44px;z-index:96;display:flex;align-items:center;gap:9px;
 font:800 17px/1 Archivo,sans-serif;letter-spacing:.24em;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)}
.kit-mark b{font-weight:800;color:${BRAND.ink};background:#fff;padding:5px 3px 4px 7px;letter-spacing:.2em;text-shadow:none}
.kit-block{position:absolute;left:56px;z-index:96;display:flex;flex-direction:column;align-items:flex-start}
.kit-cat{display:flex;align-items:center;gap:12px;font:700 17px/1 'JetBrains Mono',monospace;letter-spacing:.2em;margin-bottom:18px;
 text-shadow:0 1px 10px rgba(0,0,0,.7)}
.kit-cat i{display:block;width:34px;height:4px}
.kit-title{font-family:Archivo,sans-serif;font-weight:900;color:#fff;line-height:.92;letter-spacing:-.018em;white-space:pre-line;
 text-shadow:0 .045em 0 rgba(4,6,14,.55),0 .08em .25em rgba(0,0,0,.55)}
.kit-title em{font-style:normal}
.kit-title em.box{display:inline-block;color:${BRAND.ink};padding:.04em .1em 0;margin:.05em 0 .03em -.04em;line-height:.96;
 text-shadow:none;box-shadow:0 .05em 0 rgba(4,6,14,.45)}
.kit-accent{margin-top:20px;font:700 26px/1.15 Archivo,sans-serif;color:rgba(255,255,255,.88);white-space:nowrap;
 text-shadow:0 2px 14px rgba(0,0,0,.8)}
.kit-guide{position:absolute;z-index:99;outline:2px dashed #0ff;background:rgba(0,255,255,.12);pointer-events:none}
`;
document.head.appendChild(style);

export const root = document.getElementById('root');
export const rand = seed => { let x = seed >>> 0 || 1; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); };
export const lerp = (a, b, u) => a + (b - a) * u;

// tam boy çizim katmanı (yüksek çözünürlük) / ekran dışı tuval
export function layer(z = 1) {
  const c = document.createElement('canvas');
  c.width = W * DPR; c.height = H * DPR; c.style.zIndex = z;
  root.appendChild(c);
  const ctx = c.getContext('2d'); ctx.scale(DPR, DPR);
  return ctx;
}
export function off(w = W, h = H) {
  const c = document.createElement('canvas'); c.width = w * DPR; c.height = h * DPR;
  const ctx = c.getContext('2d'); ctx.scale(DPR, DPR); return ctx;
}
export function html(s, css2, z = 60) {
  const d = document.createElement('div'); d.className = 't'; d.innerHTML = s; Object.assign(d.style, { zIndex: z }, css2); root.appendChild(d); return d;
}

// Bir kareyi/görseli kadraja yerleştirir (cover). focus: görseldeki odak noktası (0–1), kadrajın
// at noktasına (varsayılan [0.66, 0.5]: sağ yarı) gelir; zoom > 1 yaklaştırır. Boş kalan yer fill ile dolar
// (varsayılan: görselin sol üst köşesinin rengi).
export function hero(ctx, img, { focus = [0.5, 0.5], at = [0.66, 0.5], zoom = 1, fill = null } = {}) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const k = Math.max(W / iw, H / ih) * zoom;
  if (!fill) { const p = off(2, 2); p.drawImage(img, 0, 0, 8, 8, 0, 0, 2, 2); const d = p.getImageData(0, 0, 1, 1).data; fill = `rgb(${d[0]},${d[1]},${d[2]})`; }
  ctx.fillStyle = fill; ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, at[0] * W - focus[0] * iw * k, at[1] * H - focus[1] * ih * k, iw * k, ih * k);
}

// ışık: bulanık kopya üste eklenir
export function bloom(dst, src, blur, alpha = 1) {
  dst.save(); dst.setTransform(1, 0, 0, 1, 0, 0); dst.globalCompositeOperation = 'lighter'; dst.globalAlpha = alpha;
  dst.filter = `blur(${blur * DPR}px)`; dst.drawImage(src.canvas, 0, 0); dst.restore();
}
// alan derinliği: üst (uzak) kısım bulanık, y=from ile y=to arasında netleşir
export function depthOfField(ctx, from, to, blur) {
  const b = off();
  b.filter = `blur(${blur}px)`; b.drawImage(ctx.canvas, 0, 0, W, H); b.filter = 'none';
  b.globalCompositeOperation = 'destination-in';
  const g = b.createLinearGradient(0, from, 0, to); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  b.fillStyle = g; b.fillRect(0, 0, W, H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(b.canvas, 0, 0); ctx.restore();
}
export function bokeh(ctx, n, seed, colors, yMin, yMax, rMin, rMax, alpha) {
  const r = rand(seed);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = lerp(yMin, yMax, r()), rad = lerp(rMin, rMax, r() ** 2);
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const c = colors[Math.floor(r() * colors.length)];
    g.addColorStop(0, c + Math.round(alpha * 255 * (0.4 + r() * 0.6)).toString(16).padStart(2, '0'));
    g.addColorStop(0.7, c + '22'); g.addColorStop(1, c + '00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// perspektifli doku: bir görseli herhangi bir dörtgene çizer (tl, tr, br, bl); (u,v) → ekran eşlemesini döndürür
export function homography(q) {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}
function drawTri(ctx, img, s, d) {
  const [[sx0, sy0], [sx1, sy1], [sx2, sy2]] = s, [[dx0, dy0], [dx1, dy1], [dx2, dy2]] = d;
  const a11 = sx1 - sx0, a12 = sx2 - sx0, a21 = sy1 - sy0, a22 = sy2 - sy0, det = a11 * a22 - a12 * a21;
  const i11 = a22 / det, i12 = -a12 / det, i21 = -a21 / det, i22 = a11 / det;
  const b11 = dx1 - dx0, b12 = dx2 - dx0, b21 = dy1 - dy0, b22 = dy2 - dy0;
  const m11 = b11 * i11 + b12 * i21, m12 = b11 * i12 + b12 * i22, m21 = b21 * i11 + b22 * i21, m22 = b21 * i12 + b22 * i22;
  const e = dx0 - (m11 * sx0 + m12 * sy0), f = dy0 - (m21 * sx0 + m22 * sy0);
  const cx = (dx0 + dx1 + dx2) / 3, cy = (dy0 + dy1 + dy2) / 3, grow = p => [p[0] + (p[0] - cx) * 0.04, p[1] + (p[1] - cy) * 0.04];
  ctx.save();
  ctx.beginPath(); d.map(grow).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.clip();
  ctx.transform(m11, m21, m12, m22, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}
export function drawQuad(ctx, img, iw, ih, q, n = 22) {
  const Hm = homography(q);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    const s = [[u0 * iw, v0 * ih], [u1 * iw, v0 * ih], [u1 * iw, v1 * ih], [u0 * iw, v1 * ih]];
    const d = [Hm(u0, v0), Hm(u1, v0), Hm(u1, v1), Hm(u0, v1)];
    drawTri(ctx, img, [s[0], s[1], s[2]], [d[0], d[1], d[2]]);
    drawTri(ctx, img, [s[0], s[2], s[3]], [d[0], d[2], d[3]]);
  }
  return Hm;
}

// ---- kanal katmanı ----
const fitters = [];
const hexA = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
function findCategory(category, topic) {
  if (category && CATEGORIES[category]) return CATEGORIES[category];
  const t = (topic || '').toLocaleUpperCase('tr');
  return Object.values(CATEGORIES).find(c => c.label === t) || { label: t, color: CATEGORIES.technology.color };
}

export function brand({ title, accent = '', topic = '', category = null, color = null, tint = null, scrim = 0.55,
  size = null, width = 640, lines = 3, valign = 'middle', grade = true, box = false, label = false, minutes = null } = {}) {
  void minutes; // süre çıkartması kaldırıldı: YouTube kendi rozetini sağ alta koyar
  const cat = findCategory(category, topic);
  const col = color || cat.color;
  const labelText = category && CATEGORIES[category] ? CATEGORIES[category].label : (topic || cat.label);
  const glow = tint || col;
  if (grade) root.classList.add('kit-graded');
  const fx = (bg, z, extra = {}) => { const d = document.createElement('div'); d.className = 'kit-fx'; d.style.background = bg; d.style.zIndex = z; Object.assign(d.style, extra); root.appendChild(d); return d; };
  const s = Math.max(0, Math.min(1, scrim));
  const cy = valign === 'bottom' ? 72 : valign === 'top' ? 34 : 52;
  // başlığın arkasındaki perde: yalnızca yazının durduğu yeri koyulaştırır, nesneye pek dokunmaz
  fx(`radial-gradient(ellipse 50% 72% at 18% ${cy}%, rgba(5,7,14,${s}) 0%, rgba(5,7,14,${s * 0.6}) 45%, rgba(5,7,14,0) 100%)`, 80);
  fx('radial-gradient(ellipse 78% 88% at 55% 48%, rgba(0,0,0,0) 58%, rgba(0,0,0,.42) 100%)', 81);
  fx(`radial-gradient(ellipse 40% 50% at 14% ${cy}%, ${hexA(glow, 0.14)} 0%, ${hexA(glow, 0)} 100%)`, 82, { mixBlendMode: 'screen' });
  const grain = document.createElement('div'); grain.className = 'kit-grain'; root.appendChild(grain);

  const spine = document.createElement('div'); spine.className = 'kit-spine'; spine.style.background = col; root.appendChild(spine);
  const mark = document.createElement('div'); mark.className = 'kit-mark';
  const words = BRAND.name.split(' ');                          // the last word sits in the white box
  mark.innerHTML = `<span>${words.slice(0, -1).join(' ')}</span><b>${words[words.length - 1]}</b>`;
  root.appendChild(mark);

  const block = document.createElement('div'); block.className = 'kit-block';
  if (valign === 'bottom') block.style.bottom = '56px';
  else if (valign === 'top') block.style.top = '104px';
  else { block.style.top = '50%'; block.style.transform = 'translateY(-44%)'; }
  if (label) {
    const catEl = document.createElement('div'); catEl.className = 'kit-cat'; catEl.style.color = col;
    catEl.innerHTML = `<i style="background:${col}"></i><span>${labelText}</span>`;
    block.appendChild(catEl);
  }
  const t = document.createElement('div'); t.className = 'kit-title';
  t.innerHTML = title.replace(/\*([^*]+)\*/g, box ? `<em class="box" style="background:${col}">$1</em>` : `<em style="color:${col}">$1</em>`);
  block.appendChild(t);
  let a = null;
  if (accent) { a = document.createElement('div'); a.className = 'kit-accent'; a.textContent = accent; block.appendChild(a); }
  root.appendChild(block);

  if (GUIDES) for (const r of [SAFE.badge, SAFE.topRight]) {
    const g = document.createElement('div'); g.className = 'kit-guide';
    Object.assign(g.style, { left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' }); root.appendChild(g);
  }

  // en büyük punto: en çok `lines` satır ve width içinde; 100'e inip hâlâ sığmıyorsa harfleri daralt
  const fit = () => {
    const max = size || 180;
    let fs = max, stretch = 100;
    const apply = () => { t.style.fontSize = fs + 'px'; t.style.fontStretch = stretch + '%'; t.style.maxWidth = width + 'px'; };
    const over = () => t.scrollWidth > width + 1 || t.getBoundingClientRect().height > fs * 0.98 * lines + 6;
    apply();
    while (over() && fs > 100) { fs -= 2; apply(); }
    while (over() && stretch > 70) { stretch -= 3; apply(); }
    if (a) { let as = 26; a.style.fontSize = as + 'px'; while (a.scrollWidth > width && as > 18) { as -= 1; a.style.fontSize = as + 'px'; } }
  };
  fit();
  fitters.push(fit);
  return { block, title: t, color: col };
}

export async function ready(fontsExtra = []) {
  await Promise.race([cssLoaded, new Promise(r => setTimeout(r, 4000))]);
  await Promise.race([
    Promise.all(['900 100px Archivo', '800 100px Archivo', '700 26px Archivo', '700 17px "JetBrains Mono"', ...fontsExtra].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 6000)),
  ]);
  await document.fonts.ready;
  fitters.forEach(f => f());
}
