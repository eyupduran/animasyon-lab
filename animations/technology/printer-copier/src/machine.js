// ---------------------------------------------------------------------------------------------
// Lazer yazıcının kesiti (dünya birimi: mm, y aşağı). Kâğıt yolu, tambur ve çevresindeki
// istasyonlar gerçek sırayla: yükleme → pozlama → geliştirme → aktarma → temizleme; sonra ısıtıcı.
// ---------------------------------------------------------------------------------------------
const M = {
  drum: { x: 230, y: 131, r: 23 },
  transfer: { x: 230, y: 165, r: 11 },
  chargeA: 215 * PI / 180, laserA: 270 * PI / 180, devA: 0, transferA: 90 * PI / 180, cleanA: 168 * PI / 180,
  dev: { x: 262.5, y: 131, r: 9.5 },
  hopper: { x: 273, y: 96, w: 62, h: 52 },
  lsu: { x: 150, y: 34, w: 250, h: 50 },
  poly: { x: 322, y: 59, r: 11 },
  diode: { x: 384, y: 59 },
  fold: { x: 230, y: 59 },
  heat: { x: 122, y: 142, r: 12 },
  press: { x: 122, y: 166, r: 12 },
  pick: { x: 290, y: 249.6, r: 12.6 },
  feed: { x: 336, y: 250.6, r: 11.6 },
  exitR: { x: 112, y: 14, r: 7 },
};
M.charge = { x: M.drum.x + (M.drum.r + 8) * Math.cos(M.chargeA), y: M.drum.y + (M.drum.r + 8) * Math.sin(M.chargeA), r: 8 };

// kâğıt yolu: parçalar (doğru ve yay), yay uzunluğu ile konum
const PATH = (() => {
  const segs = [];
  const line = (x0, y0, x1, y1) => segs.push({ type: 'l', x0, y0, x1, y1, len: Math.hypot(x1 - x0, y1 - y0) });
  const arc = (cx, cy, r, a0, a1) => segs.push({ type: 'a', cx, cy, r, a0, a1, len: Math.abs(a1 - a0) * r });
  line(60, 262, 340, 262);
  arc(340, 208, 54, PI / 2, -PI / 2);
  line(340, 154, 82, 154);
  arc(82, 84, 70, PI / 2, PI * 1.5);
  line(82, 14, 400, 14);
  let acc = 0; for (const s of segs) { s.s0 = acc; acc += s.len; }
  return { segs, len: acc };
})();
function pathAt(s) {
  s = clamp(s, 0, PATH.len);
  for (const g of PATH.segs) {
    if (s <= g.s0 + g.len + 1e-6) {
      const k = (s - g.s0) / g.len;
      if (g.type === 'l') return { x: lerp(g.x0, g.x1, k), y: lerp(g.y0, g.y1, k), a: Math.atan2(g.y1 - g.y0, g.x1 - g.x0) };
      const a = lerp(g.a0, g.a1, k);
      const dir = g.a1 > g.a0 ? 1 : -1;
      return { x: g.cx + g.r * Math.cos(a), y: g.cy + g.r * Math.sin(a), a: a + dir * PI / 2 };
    }
  }
  const z = PATH.segs[PATH.segs.length - 1]; return { x: z.x1, y: z.y1, a: 0 };
}
// yol üzerindeki önemli noktalar (s değerleri)
const S_TRANSFER = PATH.segs[2].s0 + (340 - 230);
const S_FUSER = PATH.segs[2].s0 + (340 - 122);
const S_PICK = 290 - 60;
const S_EXIT = PATH.segs[4].s0 + (112 - 82);

// sayfanın satır satır toner yoğunluğu (0..1), kesitte kâğıdın üstündeki toz için
const ROW_COV = (() => {
  const c = TEXT_MASK_CANVAS, g = c.getContext('2d');
  const all = g.getImageData(0, 0, c.width, c.height).data;
  const rowData = y => all.subarray(y * c.width * 4, (y + 1) * c.width * 4);
  const out = new Float32Array(PH);
  const w = c.width, rowH = Math.round(DPMM);
  for (let mm = 0; mm < PH; mm++) {
    const y0 = Math.floor(mm * DPMM);
    const d = rowData(y0);
    let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i];
    out[mm] = s / (w / 4) / 255;
  }
  for (let mm = PHOTO_R[1]; mm < PHOTO_R[1] + PHOTO_R[3]; mm++) out[mm] = Math.max(out[mm], .45);
  return out;
})();

// --- çizim yardımcıları -----------------------------------------------------------------------
function roller(g, x, y, r, ang, o = {}) {
  // gövde
  const grd = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  grd.addColorStop(0, o.hi || '#5b6069'); grd.addColorStop(.7, o.mid || '#2c3037'); grd.addColorStop(1, o.lo || '#15181c');
  g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  // dönüşü gösteren izler
  g.save(); g.strokeStyle = o.tick || 'rgba(255,255,255,.14)'; g.lineWidth = Math.max(.25, r * .05);
  const n = o.ticks || 8;
  for (let i = 0; i < n; i++) {
    const a = ang + i * TAU / n;
    g.beginPath(); g.moveTo(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55); g.lineTo(x + Math.cos(a) * r * .9, y + Math.sin(a) * r * .9); g.stroke();
  }
  g.restore();
  // mil
  g.fillStyle = o.axle || '#8d949e'; g.beginPath(); g.arc(x, y, r * .18, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = .4; g.beginPath(); g.arc(x, y, r, PI * 1.05, PI * 1.6); g.stroke();
}

function drumBody(g, t, ang, o = {}) {
  const { x, y, r } = M.drum;
  // arkadaki dişli flanş (dönüşü gösterir)
  g.save();
  g.fillStyle = '#1b1f24'; g.beginPath(); g.arc(x, y, r - 1, 0, TAU); g.fill();
  g.strokeStyle = '#2c323a'; g.lineWidth = 1.4;
  for (let i = 0; i < 36; i++) { const a = ang + i * TAU / 36; g.beginPath(); g.moveTo(x + Math.cos(a) * (r - 6), y + Math.sin(a) * (r - 6)); g.lineTo(x + Math.cos(a) * (r - 3.4), y + Math.sin(a) * (r - 3.4)); g.stroke(); }
  g.fillStyle = '#101316'; g.beginPath(); g.arc(x, y, r - 6.5, 0, TAU); g.fill();
  const hub = g.createRadialGradient(x - 2, y - 2, .5, x, y, 6); hub.addColorStop(0, '#9aa1ab'); hub.addColorStop(1, '#2d3339');
  g.fillStyle = hub; g.beginPath(); g.arc(x, y, 5.5, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = .5;
  for (let i = 0; i < 3; i++) { const a = ang + i * TAU / 3; g.beginPath(); g.moveTo(x + Math.cos(a) * 2, y + Math.sin(a) * 2); g.lineTo(x + Math.cos(a) * 5, y + Math.sin(a) * 5); g.stroke(); }
  // alüminyum boru duvarı
  g.lineWidth = 2.2; const al = g.createLinearGradient(x - r, y - r, x + r, y + r); al.addColorStop(0, '#9ea6b0'); al.addColorStop(.5, '#4a5058'); al.addColorStop(1, '#7c848e');
  g.strokeStyle = al; g.beginPath(); g.arc(x, y, r - 1.9, 0, TAU); g.stroke();
  // yeşil ışığa duyarlı kaplama
  const oc = g.createLinearGradient(x - r, y - r, x + r, y + r); oc.addColorStop(0, '#6cc39c'); oc.addColorStop(.5, '#1f5f48'); oc.addColorStop(1, '#3f8f6f');
  g.strokeStyle = oc; g.lineWidth = 1.3; g.beginPath(); g.arc(x, y, r - .45, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(210,255,235,.35)'; g.lineWidth = .35; g.beginPath(); g.arc(x, y, r - .1, PI * 1.08, PI * 1.55); g.stroke();
  g.restore();
}

// tamburun yüzeyindeki durum: yük ve toz, dönüş açısına göre
// info(φ) → { charge: 0..1, toner: 0..1 } ; φ yüzeyin şu anki açısı
function drumSurface(g, info, o = {}) {
  const { x, y, r } = M.drum;
  const step = o.step || 3.2 * PI / 180;
  for (let a = 0; a < TAU; a += step) {
    const s = info(a);
    if (s.charge > .02) minus(g, x + Math.cos(a) * (r + 1.5), y + Math.sin(a) * (r + 1.5), .95, C.charge, s.charge * (o.chargeAlpha == null ? 1 : o.chargeAlpha));
    if (s.toner > .02) {
      g.fillStyle = `rgba(8,8,10,${s.toner})`;
      for (let k = 0; k < 3; k++) {
        const aa = a + (k - 1) * step / 3, rr = r + .5 + hash1(a * 100 + k) * .5;
        g.beginPath(); g.arc(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr, .55, 0, TAU); g.fill();
      }
    }
  }
}

// kesitte bir tabaka kâğıt: head = baş kenarının yol üzerindeki yeri
function sheet(g, head, o = {}) {
  const s0 = Math.max(0, head - PH), s1 = Math.min(PATH.len, head);
  if (s1 <= s0) return;
  g.save();
  g.lineCap = 'butt'; g.lineJoin = 'round';
  const pts = [];
  for (let s = s0; s <= s1 + .01; s += 1.5) { const q = pathAt(Math.min(s, s1)); if (o.dy && s < 280) q.y += o.dy; pts.push(q); }
  // gölge
  g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2.6;
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y + .8) : g.moveTo(p.x, p.y + .8)); g.stroke();
  g.strokeStyle = o.color || '#efe9dc'; g.lineWidth = o.thick || 1.3;
  g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke();
  if (o.glow) { g.strokeStyle = `rgba(255,150,70,${o.glow})`; g.lineWidth = 3.5; g.globalCompositeOperation = 'lighter'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.stroke(); g.globalCompositeOperation = 'source-over'; }
  // üst yüzdeki toz: u = baştan uzaklık
  if (o.toner !== false) {
    for (let s = s0; s <= s1; s += .9) {
      const u = head - s;
      if (s < S_TRANSFER - (o.preTransfer ? 1e9 : 0) && !o.allToner) continue;
      const cov = ROW_COV[Math.floor(clamp(u, 0, PH - 1))];
      if (cov < .02) continue;
      const fused = s <= S_FUSER || o.allFused;
      const p = pathAt(s), nx = Math.sin(p.a), ny = -Math.cos(p.a);  // yolun "üst" normali (sol taraf)
      const side = o.side || 1;
      if (hash1(s * 13.1 + 7) > cov * 1.6) continue;
      g.fillStyle = fused ? 'rgba(10,10,12,.95)' : 'rgba(18,18,20,.9)';
      if (fused) g.fillRect(p.x - .45, p.y - .45 + side * ny * .9 - .3, .9, .7);
      else { g.beginPath(); g.arc(p.x + nx * side * 1.1, p.y + ny * side * 1.1, .42, 0, TAU); g.fill(); }
    }
  }
  g.restore();
}

// kesiti bütünüyle çiz
// st: { t, drumAng, rollerAng, heads:[s...], charges:fn|null, laser:0..1, heat:0..1, hl:{name:k}, dim }
function drawMachine(g, st) {
  const t = st.t, dim = st.dim || 0;
  const ang = st.drumAng || 0, ra = st.rollerAng == null ? ang * 2 : st.rollerAng;
  // gövde
  g.save();
  g.fillStyle = '#0e1114';
  rrect(g, -6, -10, 452, 316, 14); g.fill();
  g.strokeStyle = 'rgba(160,175,190,.25)'; g.lineWidth = 1.2; rrect(g, -6, -10, 452, 316, 14); g.stroke();
  g.strokeStyle = 'rgba(160,175,190,.10)'; g.lineWidth = .6; rrect(g, -1, -5, 442, 306, 11); g.stroke();
  // iç ışık
  const il = g.createRadialGradient(230, 150, 20, 230, 150, 260);
  il.addColorStop(0, 'rgba(60,80,95,.30)'); il.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = il; g.fillRect(-6, -10, 452, 316);

  // kâğıt kasedi
  g.fillStyle = '#171b20'; g.strokeStyle = 'rgba(150,165,180,.35)'; g.lineWidth = .8;
  g.beginPath(); g.moveTo(40, 240); g.lineTo(40, 292); g.lineTo(352, 292); g.lineTo(352, 272); g.stroke();
  g.fillStyle = '#1c2127'; g.fillRect(40, 286, 312, 6);
  // yığın
  const stackTop = st.stackTop || 263;
  for (let i = 0; i < 26; i++) { const yy = stackTop + 1.1 + i * .85; g.fillStyle = i % 2 ? '#d9d2c3' : '#cfc7b6'; g.fillRect(60, yy, 280, .6); }
  // ayırma pedi
  g.fillStyle = '#8a6d4a'; g.beginPath(); g.moveTo(326, 263.2); g.lineTo(346, 263.2); g.lineTo(344, 270); g.lineTo(328, 270); g.closePath(); g.fill();
  g.fillStyle = '#2a2320'; g.fillRect(326, 270, 20, 3);

  // yol kılavuzları (ince çizgiler)
  g.strokeStyle = 'rgba(150,165,180,.12)'; g.lineWidth = .7;
  g.beginPath(); g.arc(340, 208, 60, -PI / 2, PI / 2); g.stroke();
  g.beginPath(); g.arc(82, 84, 76, PI / 2, PI * 1.5); g.stroke();

  // lazer tarayıcı kutusu
  const L = M.lsu;
  g.fillStyle = '#12161a'; rrect(g, L.x, L.y, L.w, L.h, 4); g.fill();
  g.strokeStyle = 'rgba(150,165,180,.3)'; g.lineWidth = .8; rrect(g, L.x, L.y, L.w, L.h, 4); g.stroke();
  // diyot
  g.fillStyle = '#39414a'; rrect(g, M.diode.x - 4, M.diode.y - 5, 12, 10, 1.5); g.fill();
  g.fillStyle = '#c9a15a'; g.fillRect(M.diode.x - 5.5, M.diode.y - 1.5, 2, 3);
  // çokgen ayna
  {
    const a = st.polyAng || 0, P = M.poly;
    g.save(); g.translate(P.x, P.y); g.rotate(a);
    g.beginPath(); for (let i = 0; i < 6; i++) { const q = i * TAU / 6; g[i ? 'lineTo' : 'moveTo'](Math.cos(q) * P.r, Math.sin(q) * P.r); } g.closePath();
    const mg = g.createLinearGradient(-P.r, -P.r, P.r, P.r); mg.addColorStop(0, '#dfe6ee'); mg.addColorStop(.5, '#7b8591'); mg.addColorStop(1, '#c3ccd6');
    g.fillStyle = mg; g.fill(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = .5; g.stroke();
    g.fillStyle = '#2a3038'; g.beginPath(); g.arc(0, 0, 3, 0, TAU); g.fill();
    g.restore();
  }
  // mercek ve katlama aynası
  g.fillStyle = 'rgba(160,200,230,.25)'; g.strokeStyle = 'rgba(190,220,240,.5)'; g.lineWidth = .5;
  g.beginPath(); g.ellipse(278, 59, 3.2, 14, 0, 0, TAU); g.fill(); g.stroke();
  g.save(); g.translate(M.fold.x, M.fold.y); g.rotate(-PI / 4);
  g.fillStyle = '#cfd8e2'; g.fillRect(-10, -1.2, 20, 2.4); g.restore();
  // pencere
  g.fillStyle = 'rgba(160,200,230,.2)'; g.fillRect(222, L.y + L.h - 1.5, 16, 1.5);

  // toner haznesi
  const Hp = M.hopper;
  g.fillStyle = '#15191e'; rrect(g, Hp.x, Hp.y, Hp.w, Hp.h, 5); g.fill();
  g.strokeStyle = 'rgba(150,165,180,.3)'; g.lineWidth = .8; rrect(g, Hp.x, Hp.y, Hp.w, Hp.h, 5); g.stroke();
  // toz yığını
  g.save(); rrect(g, Hp.x + 1, Hp.y + 1, Hp.w - 2, Hp.h - 2, 4); g.clip();
  g.fillStyle = '#060607';
  g.beginPath(); g.moveTo(Hp.x, Hp.y + Hp.h);
  for (let xx = 0; xx <= Hp.w; xx += 2) g.lineTo(Hp.x + xx, Hp.y + 22 + Math.sin(xx * .2 + t * 1.2) * 1.2 + vnoise(xx * .3) * 3);
  g.lineTo(Hp.x + Hp.w, Hp.y + Hp.h); g.closePath(); g.fill();
  // karıştırıcı
  const ag = (st.agitAng != null ? st.agitAng : ang * .7);
  g.strokeStyle = '#4b535c'; g.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) { const a = ag + i * PI; g.beginPath(); g.moveTo(305, 124); g.lineTo(305 + Math.cos(a) * 20, 124 + Math.sin(a) * 20); g.stroke(); }
  g.restore();
  // geliştirme silindiri (üstünde ince toz tabakası)
  roller(g, M.dev.x, M.dev.y, M.dev.r, -ra * 1.3, { hi: '#6a6f76', mid: '#2e3238', lo: '#14161a' });
  g.strokeStyle = 'rgba(5,5,6,.95)'; g.lineWidth = 1.1; g.beginPath(); g.arc(M.dev.x, M.dev.y, M.dev.r + .5, PI * .6, PI * 1.45); g.stroke();
  // temizleme bıçağı ve atık kutusu
  {
    const a = M.cleanA, px = M.drum.x + Math.cos(a) * M.drum.r, py = M.drum.y + Math.sin(a) * M.drum.r;
    g.fillStyle = '#15191e'; rrect(g, 176, 126, 26, 24, 3); g.fill();
    g.strokeStyle = 'rgba(150,165,180,.3)'; g.lineWidth = .6; rrect(g, 176, 126, 26, 24, 3); g.stroke();
    g.save(); g.translate(px, py); g.rotate(a + PI * .62);
    g.fillStyle = '#b89a55'; g.fillRect(-1, -.6, 13, 1.4); g.restore();
    // atık toz
    g.fillStyle = '#070708'; g.fillRect(178, 142, 22, 6);
  }

  // tambur, yükleme silindiri, aktarma silindiri
  drumBody(g, t, ang);
  if (st.drumInfo) drumSurface(g, st.drumInfo, { chargeAlpha: st.chargeAlpha });
  roller(g, M.charge.x, M.charge.y, M.charge.r, -ang * (M.drum.r / M.charge.r), { hi: '#6d7580', mid: '#353b43', lo: '#16191d', ticks: 6 });
  roller(g, M.transfer.x, M.transfer.y, M.transfer.r, -ang * (M.drum.r / M.transfer.r), { hi: '#5a6068', mid: '#25292f', lo: '#101215', ticks: 6 });

  // ısıtıcı
  {
    const h = st.heat == null ? .6 : st.heat;
    g.fillStyle = '#15191e'; rrect(g, 100, 120, 44, 66, 6); g.fill();
    g.strokeStyle = 'rgba(150,165,180,.3)'; g.lineWidth = .7; rrect(g, 100, 120, 44, 66, 6); g.stroke();
    roller(g, M.heat.x, M.heat.y, M.heat.r, -ra, { hi: `rgb(${lerp(110, 255, h)},${lerp(110, 150, h)},${lerp(115, 80, h)})`, mid: `rgb(${lerp(55, 190, h)},${lerp(58, 70, h)},${lerp(62, 30, h)})`, lo: '#2a1510', ticks: 6 });
    g.fillStyle = '#0e0f11'; g.beginPath(); g.arc(M.heat.x, M.heat.y, M.heat.r - 2.5, 0, TAU); g.fill();
    // lamba
    glowDot(g, M.heat.x, M.heat.y, 9, '255,170,80', .9 * h);
    g.strokeStyle = `rgba(255,${lerp(120, 230, h)},${lerp(60, 160, h)},${.3 + .7 * h})`; g.lineWidth = .8;
    g.beginPath(); for (let i = -4; i <= 4; i++) g.lineTo(M.heat.x + i * .9, M.heat.y + (i % 2 ? 1 : -1)); g.stroke();
    roller(g, M.press.x, M.press.y, M.press.r, ra, { hi: '#5c5f63', mid: '#2a2c2f', lo: '#121314', ticks: 6 });
  }
  // besleme ve çıkış silindirleri
  const pickA = st.pickAng == null ? 0 : st.pickAng;
  roller(g, M.pick.x, M.pick.y, M.pick.r, pickA, { hi: '#4a4d52', mid: '#232528', lo: '#0f1011', tick: 'rgba(255,255,255,.2)', ticks: 10 });
  roller(g, M.feed.x, M.feed.y, M.feed.r, st.feedAng || 0, { hi: '#4a4d52', mid: '#232528', lo: '#0f1011', ticks: 10 });
  roller(g, M.exitR.x, M.exitR.y - 7, M.exitR.r, -ra * 2, { ticks: 6 });
  roller(g, M.exitR.x, M.exitR.y + 7, M.exitR.r, ra * 2, { ticks: 6 });

  // kâğıtlar
  for (const h of (st.heads || [])) sheet(g, h.s == null ? h : h.s, h.o || { toner: st.sheetToner !== false });

  // lazer ışını (yan kesitte: diyot → ayna → mercek → katlama aynası → tambur)
  if (st.laser > 0) {
    const a = st.laser;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    const pts = [[M.diode.x - 5, M.diode.y], [M.poly.x + 9.5, M.poly.y], [M.fold.x, M.fold.y], [M.drum.x, M.drum.y - M.drum.r]];
    for (const [w, al] of [[5, .12], [2, .35], [.6, 1]]) {
      g.strokeStyle = `rgba(255,40,60,${al * a})`; g.lineWidth = w;
      g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
    }
    glowDot(g, M.drum.x, M.drum.y - M.drum.r, 6, '255,60,70', a);
    g.restore();
  }
  // vurgular: istasyonların çevresinde yumuşak halka
  if (st.hl) for (const [name, k] of Object.entries(st.hl)) {
    if (k <= 0) continue;
    const P = { drum: [M.drum.x, M.drum.y, 34], charge: [M.charge.x, M.charge.y, 13], dev: [M.dev.x + 20, M.dev.y - 6, 42], transfer: [M.transfer.x, M.transfer.y - 5, 18],
      fuser: [122, 154, 30], lsu: [275, 59, 70], clean: [190, 138, 18], tray: [200, 268, 150], pick: [313, 252, 30] }[name];
    if (!P) continue;
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createRadialGradient(P[0], P[1], P[2] * .4, P[0], P[1], P[2] * 1.3);
    gr.addColorStop(0, `rgba(232,179,90,${.16 * k})`); gr.addColorStop(1, 'rgba(232,179,90,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(P[0], P[1], P[2] * 1.3, 0, TAU); g.fill();
    g.restore();
  }
  if (dim > 0) { g.fillStyle = `rgba(7,9,12,${dim})`; g.fillRect(-20, -20, 480, 340); }
  g.restore();
}

// dünya → ekran
const w2s = (cam, x, y) => [W / 2 + (x - cam.x) * cam.s, H / 2 + (y - cam.y) * cam.s];

// ---------------------------------------------------------------------------------------------
// Tamburun yakın görünüşü: yatay bir silindir; yüzeyi açılmış bir dokudan (UT) şerit şerit çizilir
// ---------------------------------------------------------------------------------------------
const UT_W = 1600, UT_H = 1200;           // açılmış yüzey: genişlik = tambur boyu, yükseklik = çevre
const UT = makeCanvas(UT_W, UT_H), utg = UT.getContext('2d');
const UT2 = makeCanvas(UT_W, UT_H), ut2g = UT2.getContext('2d');
// yazının aynası (tamburdaki görüntü kâğıttakinin aynasıdır)
const DRUM_TEXT = makeCanvas(UT_W, 420);
{
  const g = DRUM_TEXT.getContext('2d');
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 250px ${SERIF}`;
  g.save(); g.translate(UT_W / 2, 210); g.scale(-1, 1); g.fillText('Işıkla', 0, 10); g.restore();
}
const DRUM_TEXT_DATA = DRUM_TEXT.getContext('2d').getImageData(0, 0, UT_W, 420).data;
const drumTextAt = (x, y) => { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= UT_W || y >= 420) return 0; return DRUM_TEXT_DATA[(y * UT_W + x) * 4] / 255; };
const TEXT_V0 = 380;   // yazının dokudaki başlangıç satırı

// yüzey dokusunu hazırla: st = { charge: 0..1 (her yer), written: satır sınırı (lazerin yazdığı), latentShow, toner, ghost, t }
function paintUT(st) {
  const g = utg;
  g.setTransform(1, 0, 0, 1, 0, 0);
  const bg = g.createLinearGradient(0, 0, UT_W, 0);
  bg.addColorStop(0, '#1d5443'); bg.addColorStop(.5, '#24634f'); bg.addColorStop(1, '#1d5443');
  g.fillStyle = bg; g.fillRect(0, 0, UT_W, UT_H);
  // ince üretim izleri
  g.fillStyle = 'rgba(255,255,255,.025)';
  for (let y = 0; y < UT_H; y += 7) g.fillRect(0, y, UT_W, 1);
  const step = 34;
  const chargeAt = (x, y) => {
    let c = st.charge == null ? 1 : (typeof st.charge === 'function' ? st.charge(y) : st.charge);
    if (c <= 0) return 0;
    const ty = y - TEXT_V0;
    if (st.written != null && ty >= 0 && ty < 420 && (st.fromBottom ? ty >= 420 - st.written : ty < st.written)) c *= 1 - drumTextAt(x, ty);
    return c;
  };
  // yük görüşü: yüklü yüzey hafifçe mavi parlar, boşalmış harfler karanlık kalır
  if (st.latentShow > 0) {
    const g2 = ut2g; g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, UT_W, UT_H);
    g2.fillStyle = 'rgba(70,170,255,.30)';
    if (st.chargeRows) g2.fillRect(0, st.chargeRows[0], UT_W, st.chargeRows[1] - st.chargeRows[0]); else g2.fillRect(0, 0, UT_W, UT_H);
    if (st.written != null && st.written > 0) {
      g2.save(); g2.globalCompositeOperation = 'destination-out';
      const r0 = st.fromBottom ? 420 - st.written : 0, r1 = st.fromBottom ? 420 : st.written;
      g2.beginPath(); g2.rect(0, TEXT_V0 + r0, UT_W, r1 - r0); g2.clip();
      g2.drawImage(DRUM_TEXT, 0, TEXT_V0); g2.restore();
    }
    if (st.bandX != null) {
      g2.save(); g2.globalCompositeOperation = 'destination-in';
      const bgr = g2.createLinearGradient(st.bandX - 260, 0, st.bandX + 260, 0);
      const v = st.bandMin || 0;
      bgr.addColorStop(0, `rgba(0,0,0,${v})`); bgr.addColorStop(.5, 'rgba(0,0,0,1)'); bgr.addColorStop(1, `rgba(0,0,0,${v})`);
      g2.fillStyle = bgr; g2.fillRect(0, 0, UT_W, UT_H); g2.restore();
    }
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = st.latentShow; g.drawImage(UT2, 0, 0); g.restore();
  }
  // yük: mavi eksi işaretleri (yalnızca "yük görüşü" açıkken)
  if (st.latentShow > 0) {
    g.save();
    g.strokeStyle = C.charge; g.lineCap = 'round'; g.lineWidth = 3;
    for (let y = step / 2; y < UT_H; y += step) for (let x = step / 2; x < UT_W; x += step) {
      const jx = x + (hash2(x, y) - .5) * 6, jy = y + (hash2(y, x) - .5) * 6;
      const c = chargeAt(jx, jy);
      if (c <= .05) continue;
      g.globalAlpha = c * st.latentShow * (st.band ? st.band(jx) : 1);
      g.beginPath(); g.moveTo(jx - 8, jy); g.lineTo(jx + 8, jy); g.stroke();
    }
    g.restore();
  }
  // hayali çerçeve: silinmesi gereken yerler
  if (st.ghost > 0) {
    g.save(); g.globalAlpha = st.ghost * .5; g.globalCompositeOperation = 'lighter';
    g.drawImage(DRUM_TEXT, 0, TEXT_V0);
    g.globalCompositeOperation = 'source-atop';
    g.restore();
    g.save(); g.globalAlpha = st.ghost; g.setLineDash([8, 10]); g.strokeStyle = 'rgba(255,255,255,.0)'; g.restore();
  }
  // toner
  if (st.toner > 0) {
    g.save(); g.globalAlpha = st.toner;
    const L = layer(3), lg = L.g;
    lg.clearRect(0, 0, W, H);
    lg.drawImage(DRUM_TEXT, 0, 0);
    lg.globalCompositeOperation = 'source-in'; lg.fillStyle = '#0b0b0d'; lg.fillRect(0, 0, UT_W, 420);
    lg.globalCompositeOperation = 'source-over';
    const rows = st.tonerRows == null ? 420 : st.tonerRows;
    g.drawImage(L.c, 0, 0, UT_W, rows, 0, TEXT_V0, UT_W, rows);
    g.restore();
  }
}

// silindiri çiz: sol üst (x, y), boy len, yarıçap R (px), dönüş rot (radyan)
function drawCylinder(g, x, y, len, R, rot, o = {}) {
  const cy = y + R;
  const N = 140;
  for (let i = 0; i < N; i++) {
    const a0 = -PI / 2 + PI * i / N, a1 = -PI / 2 + PI * (i + 1) / N;
    const y0 = cy + R * Math.sin(a0), y1 = cy + R * Math.sin(a1);
    const vm = (((a0 + a1) / 2 + rot) / TAU) % 1;
    const v = ((vm < 0 ? vm + 1 : vm) * UT_H);
    const dv = Math.max(1, (a1 - a0) / TAU * UT_H);
    const sv = Math.min(v, UT_H - dv);
    g.drawImage(UT, 0, sv, UT_W, dv, x, y0, len, y1 - y0 + .6);
  }
  // gölgeleme
  const sh = g.createLinearGradient(0, y, 0, y + 2 * R);
  sh.addColorStop(0, 'rgba(0,0,0,.85)'); sh.addColorStop(.18, 'rgba(0,0,0,.25)'); sh.addColorStop(.32, 'rgba(255,255,255,.10)');
  sh.addColorStop(.4, 'rgba(255,255,255,.02)'); sh.addColorStop(.75, 'rgba(0,0,0,.35)'); sh.addColorStop(1, 'rgba(0,0,0,.9)');
  g.fillStyle = sh; g.fillRect(x, y, len, 2 * R);
  // uçlar: dişli ve flanş
  g.save();
  const ex = x + len;
  g.fillStyle = '#2a2f36'; g.beginPath(); g.ellipse(ex, cy, R * .16, R * 1.02, 0, -PI / 2, PI / 2); g.fill();
  g.fillStyle = '#c8b27a'; g.beginPath(); g.ellipse(ex + R * .05, cy, R * .12, R * .9, 0, -PI / 2, PI / 2); g.fill();
  g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const a = rot * 2 + i * PI / 9; const s = Math.sin(a); if (Math.cos(a) < 0) continue; g.beginPath(); g.moveTo(ex + R * .05 + Math.cos(a) * R * .12 * .6, cy + s * R * .9); g.lineTo(ex + R * .05 + Math.cos(a) * R * .12, cy + s * R * .9); g.stroke(); }
  g.fillStyle = '#1a1e23'; g.fillRect(x - 10, y + R * .1, 10, R * 1.8);
  g.restore();
}
