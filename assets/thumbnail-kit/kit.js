// Animasyon Lab kapak kiti: kanalın bütün YouTube kapaklarında aynı kalan kimlik.
//
// DÜZEN
//   Film kendi thumbnail.html'inde ana görseli çizer (1280×720 #root, tam kadraj), sonra kit.brand() kanal
//   katmanını ekler, en sonda await kit.ready() yazılar yüklenip yerine oturana kadar bekler.
//   Araç: npm run thumbnail -- <slug>  (tools/thumbnail.mjs; kit /_kit/kit.js adresinden gelir).
//
//     import * as kit from '/_kit/kit.js';
//     const g = kit.layer(1);
//     kit.hero(g, img, { focus: [0.62, 0.45], zoom: 1.1 });        // ya da kendi çiziminiz
//     kit.brand({ title: '*GRİ* YOK', category: 'technology', accent: 'Yazıcı bir fotoğrafı nasıl basar?' });
//     await kit.ready();
//     window.__thumbs = { count, list: [{ id, title }] }; window.__thumbReady = true;
//
// SERİ SİSTEMİ (brand() hepsini kendisi uygular, film yalnızca görseli ve başlığı verir)
//   • Izgara: 1280×720, kenar payı 56 px. Yazı bloğu sol altta, genişliği en çok 660 px (sol yarı).
//     Sağ alt köşe BOŞ kalır (YouTube'un süre rozeti orada), sağ üst de boş (izle-sonra düğmeleri).
//     Ana görselin odağını sağ yarıya koyun; sol yarı koyulaştırılır.
//   • Kanal işareti: sol üstte "ANİMASYON [LAB]" yazı işareti. Her kapakta aynı yer, aynı boy.
//   • Kategori sırtı: sol kenarda tam boy, kategori renginde ince şerit + başlığın üstünde kategori adı.
//     Renkler CATEGORIES tablosunda (anahtarlar tools/lib/animations.mjs → CATEGORIES ile aynı).
//   • Başlık: Archivo 800, büyük harf, 2–4 kelime, en çok 2 satır. *kelime* kategori renginde yazılır.
//     Boyut kendiliğinden ayarlanır (148 → 92 px; sığmazsa harfler daraltılır). 168×94 mobil önizlemede
//     de okunacak kadar büyük kalır; uzun cümle yazmayın, onu accent satırına koyun.
//   • Işık ve renk: solda koyu perde, altta hafif karartma, kenar kararması, başlığın arkasında kategori
//     renginde çok hafif bir ışık, hafif kontrast ve ince gren. Her kapak aynı işlemden geçer.
//
// brand(seçenekler)
//   title     (şart) büyük harfle yazılmış başlık; *...* vurgulanır. Türkçe İ/I'yı çağıran doğru yazar.
//   category  'technology' | 'software' | 'history' | … (renk ve etiket buradan). Verilmezse topic'ten bulunur.
//   topic     etiket metni (eski sayfalar 'TEKNOLOJİ' gibi verir); category varsa onun etiketi kullanılır.
//   accent    başlığın altındaki kısa açıklama satırı (isteğe bağlı; mobilde okunmaz, süs değil bilgi olsun).
//   color     kategori rengini elle ezmek için (#rrggbb).
//   tint      başlık arkasındaki ışığın rengi (varsayılan: kategori rengi).
//   scrim     sol perdenin koyuluğu 0–1 (varsayılan 0.86). Görsel zaten koyuysa düşürün.
//   size      başlığın en büyük punto değeri (varsayılan 148).
//   width     yazı bloğunun en büyük genişliği (varsayılan 660).
//   valign    'bottom' (varsayılan) | 'middle': blok sol altta ya da sol ortada.
//   grade     false: hafif kontrast işlemini kapatır.
//   minutes   eski sürümden kaldı; YOK SAYILIR (süre çıkartması artık yok).
//
// Diğer araçlar: layer(z), off(w,h), hero(ctx,img,o), html(s,css,z), bloom, depthOfField, bokeh,
// homography, drawQuad, rand(seed), lerp. W/H 1280×720, DPR 2 (araç ?dpr=2 ile açar, çıktı 1920×1080).
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
  documentary: { label: 'BELGESEL', color: '#E9DCC4' },
  short: { label: 'KISA FİLM', color: '#FF6F8E' },
};
export const BRAND = { ink: '#07080B', white: '#FFFFFF', name: 'ANİMASYON LAB', yellow: '#FFD04A' };

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
#root.kit-graded canvas{filter:contrast(1.06) saturate(1.05)}
#root .t{position:absolute;white-space:nowrap}
.kit-fx{position:absolute;inset:0;pointer-events:none}
.kit-grain{position:absolute;inset:0;pointer-events:none;opacity:.09;mix-blend-mode:overlay;z-index:90;
 background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.kit-spine{position:absolute;left:0;top:0;bottom:0;width:10px;z-index:96}
.kit-mark{position:absolute;left:56px;top:44px;z-index:96;display:flex;align-items:center;gap:9px;
 font:800 17px/1 Archivo,sans-serif;letter-spacing:.24em;color:#fff;text-shadow:0 1px 8px rgba(0,0,0,.6)}
.kit-mark b{font-weight:800;color:${BRAND.ink};background:#fff;padding:5px 3px 4px 7px;letter-spacing:.2em;text-shadow:none}
.kit-block{position:absolute;left:56px;z-index:96;display:flex;flex-direction:column;align-items:flex-start}
.kit-cat{display:flex;align-items:center;gap:12px;font:700 17px/1 'JetBrains Mono',monospace;letter-spacing:.2em;margin-bottom:20px;
 text-shadow:0 1px 10px rgba(0,0,0,.7)}
.kit-cat i{display:block;width:34px;height:4px}
.kit-title{font-family:Archivo,sans-serif;font-weight:800;color:#fff;line-height:.9;letter-spacing:-.012em;white-space:normal;
 text-shadow:0 4px 30px rgba(0,0,0,.45)}
.kit-title em{font-style:normal}
.kit-accent{margin-top:22px;font:600 27px/1.15 Archivo,sans-serif;color:rgba(255,255,255,.82);white-space:nowrap;
 text-shadow:0 2px 14px rgba(0,0,0,.8)}
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

export function brand({ title, accent = '', topic = '', category = null, color = null, tint = null, scrim = 0.86,
  size = null, width = 660, valign = 'bottom', grade = true, minutes = null } = {}) {
  void minutes; // süre çıkartması kaldırıldı: YouTube kendi rozetini sağ alta koyar
  const cat = findCategory(category, topic);
  const col = color || cat.color;
  const label = category && CATEGORIES[category] ? CATEGORIES[category].label : (topic || cat.label);
  const glow = tint || col;
  if (grade) root.classList.add('kit-graded');
  const fx = (bg, z, extra = {}) => { const d = document.createElement('div'); d.className = 'kit-fx'; d.style.background = bg; d.style.zIndex = z; Object.assign(d.style, extra); root.appendChild(d); return d; };
  const s = Math.max(0, Math.min(1, scrim));
  // sol perde: yazının durduğu koyu taraf
  fx(`linear-gradient(90deg, rgba(7,8,11,${s}) 0%, rgba(7,8,11,${s * 0.78}) 30%, rgba(7,8,11,${s * 0.3}) 50%, rgba(7,8,11,0) 66%)`, 80);
  // alt karartma ve kenar kararması
  fx(`linear-gradient(0deg, rgba(7,8,11,${0.55 * s + 0.1}) 0%, rgba(7,8,11,0) 42%)`, 80);
  fx('radial-gradient(ellipse 75% 85% at 58% 48%, rgba(0,0,0,0) 55%, rgba(0,0,0,.5) 100%)', 81);
  // başlığın arkasında kategori renginde çok hafif ışık
  fx(`radial-gradient(ellipse 46% 52% at 12% ${valign === 'middle' ? 52 : 78}%, ${hexA(glow, 0.16)} 0%, ${hexA(glow, 0)} 100%)`, 82, { mixBlendMode: 'screen' });
  const grain = document.createElement('div'); grain.className = 'kit-grain'; root.appendChild(grain);

  const spine = document.createElement('div'); spine.className = 'kit-spine'; spine.style.background = col; root.appendChild(spine);
  const mark = document.createElement('div'); mark.className = 'kit-mark';
  mark.innerHTML = '<span>ANİMASYON</span><b>LAB</b>';
  root.appendChild(mark);

  const block = document.createElement('div'); block.className = 'kit-block';
  if (valign === 'middle') { block.style.top = '50%'; block.style.transform = 'translateY(-46%)'; } else block.style.bottom = '58px';
  const catEl = document.createElement('div'); catEl.className = 'kit-cat'; catEl.style.color = col;
  catEl.innerHTML = `<i style="background:${col}"></i><span>${label}</span>`;
  const t = document.createElement('div'); t.className = 'kit-title';
  t.innerHTML = title.replace(/\*([^*]+)\*/g, `<em style="color:${col}">$1</em>`);
  block.append(catEl, t);
  let a = null;
  if (accent) { a = document.createElement('div'); a.className = 'kit-accent'; a.textContent = accent; block.appendChild(a); }
  root.appendChild(block);

  // en büyük punto: en çok 2 satır ve width içinde; 92'ye inip hâlâ sığmıyorsa harfleri daralt
  const fit = () => {
    const max = size || 148;
    let fs = max, stretch = 100;
    const apply = () => { t.style.fontSize = fs + 'px'; t.style.fontStretch = stretch + '%'; t.style.maxWidth = width + 'px'; };
    const over = () => t.scrollWidth > width + 1 || t.getBoundingClientRect().height > fs * 0.9 * 2 + 4;
    apply();
    while (over() && fs > 92) { fs -= 2; apply(); }
    while (over() && stretch > 70) { stretch -= 3; apply(); }
    if (a) { let as = 27; a.style.fontSize = as + 'px'; while (a.scrollWidth > width && as > 18) { as -= 1; a.style.fontSize = as + 'px'; } }
  };
  fit();
  fitters.push(fit);
  return { block, title: t, color: col };
}

export async function ready(fontsExtra = []) {
  await Promise.race([cssLoaded, new Promise(r => setTimeout(r, 4000))]);
  await Promise.race([
    Promise.all(['800 100px Archivo', '600 27px Archivo', '700 17px "JetBrains Mono"', ...fontsExtra].map(f => document.fonts.load(f))),
    new Promise(r => setTimeout(r, 6000)),
  ]);
  await document.fonts.ready;
  fitters.forEach(f => f());
}
