// ---------------------------------------------------------------------------------------------
// Sahneler ve film sözleşmesi
// ---------------------------------------------------------------------------------------------
function renderAt(t) {
  t = clamp(t, 0, DURATION);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const act = [];
  for (const sc of SCENES) {
    const a = sc.fi > 0 ? sramp(t, sc.a, sc.a + sc.fi) : (t >= sc.a ? 1 : 0);
    const b = sc.fo > 0 ? 1 - sramp(t, sc.b - sc.fo, sc.b) : (t < sc.b ? 1 : 0);
    const k = Math.min(a, b);
    if (k > 0 && t >= sc.a && t <= sc.b) act.push([sc, k]);
  }
  act.sort((p, q) => p[0].z - q[0].z);
  for (const [sc, k] of act) {
    if (k >= .999) { ctx.save(); sc.draw(ctx, t); ctx.restore(); }
    else {
      const L = layer(0);
      L.g.save(); sc.draw(L.g, t); L.g.restore();
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = k; ctx.drawImage(L.c, 0, 0); ctx.restore();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  for (const o of OVERLAYS) o(ctx, t);
  finish(ctx, t);
}

const CHAPTERS = [
  { t: 0, title: 'Sıcak bir sayfa' },
  { t: S['02-kagit'] - .5, title: 'Kâğıt' },
  { t: S['03-tambur'] - .5, title: 'Tambur' },
  { t: S['04-lazer'] - .5, title: 'Lazer' },
  { t: S['05-toner'] - .5, title: 'Toz ve ısı' },
  { t: S['06-yarim-ton'] - .5, title: 'Yarım ton' },
  { t: S['07-fotokopi'] - .5, title: 'Fotokopi' },
  { t: S['08-kopya'] - .5, title: 'Kopyanın kopyası' },
  { t: S['09-final'] - .5, title: 'Bir anlık ışık' },
];
OVERLAYS.push((g, t) => {
  CHAPTERS.forEach((c, i) => { if (i > 0) chapterMark(g, t, c.t + 1.2, String(i + 1).padStart(2, '0'), c.title); });
});

window.__film = {
  duration: DURATION,
  renderAt,
  narration: LINES.map(id => ({ id, at: S[id] })),
  chapters: CHAPTERS.map(c => ({ t: +c.t.toFixed(2), title: c.title })),
  sound: (from, to) => renderSound(from, to),
};

// ?video=1 olmadan açıldığında: sessiz, döngülü önizleme
if (!/[?&]video=1/.test(location.search)) {
  const fit = () => { const k = Math.min(innerWidth / W, innerHeight / H); canvas.style.width = W * k + 'px'; canvas.style.height = H * k + 'px'; };
  addEventListener('resize', fit); fit();
  const t0 = performance.now();
  const q = location.search.match(/[?&]t=([\d.]+)/); const off = q ? +q[1] : 0;
  const loop = () => { renderAt((off + (performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
} else { canvas.style.width = W + 'px'; canvas.style.height = H + 'px'; }
