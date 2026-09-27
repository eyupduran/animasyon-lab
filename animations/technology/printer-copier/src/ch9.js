// ---------------------------------------------------------------------------------------------
// 9. Bir anlık ışık: yolun özeti; karanlıkta yüklü bir silindir ve bir anlık ışık.
// ---------------------------------------------------------------------------------------------
{
  const A = '09-final';
  const tw = (w, n) => T(A, w, n);
  const cuts = [tw('ışığın') - .7, tw('Elektrik', 1) - .3, tw('Sıcaklık') - .3, tw('Fotoğrafı') - .3, tw('Fotokopi') - .3, tw('Her') - .3, tw('kopyası') - .9, tw('ofiste') - .7, tw('Karanlıkta') - .4];
  const R = 280, len = 1500, cx0 = (W - len) / 2 - 30, cy0 = H / 2 - R;

  // a: ışık yükü siler
  scene(S[A] - 1.2, cuts[1] + .4, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const w = clamp((t - cuts[0]) / 2.6) * 420;
    paintUT({ latentShow: 1, written: w });
    drawCylinder(g, cx0, cy0, len, R, TAU * (TEXT_V0 + 210) / UT_H - .02);
    const bx = cx0 + 60 + fract(t * 2.2) * (len - 120);
    g.save(); g.globalCompositeOperation = 'lighter'; glowDot(g, bx, cy0 + R * .35, 90, '255,40,60', .9); g.restore();
  }, { fi: .8, fo: .4 });
  // b: elektrik tozu yerine çeker
  scene(cuts[1] - .2, cuts[2] + .4, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const k = sramp(t, cuts[1], cuts[1] + 1.2);
    paintUT({ latentShow: .5 * (1 - k), written: 420, toner: k });
    drawCylinder(g, cx0, cy0, len, R, TAU * (TEXT_V0 + 210) / UT_H - .02 + (t - cuts[1]) * .05);
  }, { fi: .4, fo: .4 });
  // c: sıcaklık mühürler
  scene(cuts[2] - .2, cuts[3] + .4, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = { x: 124, y: 154, s: lerp(14, 17, ramp(t, cuts[2], cuts[3])) };
    applyCam(g, cam);
    drawMachine(g, { t, drumAng: t * .6, rollerAng: t * 1.8, heat: 1, heads: [{ s: S_FUSER + 40 + (t - cuts[2]) * 20, o: { allToner: true, glow: .2 } }] });
  }, { fi: .4, fo: .4 });
  // d: fotoğrafı göz tamamlar
  scene(cuts[3] - .2, cuts[4] + .4, (g, t) => {
    deskBg(g, .1);
    const s = Math.exp(lerp(Math.log(40), Math.log(3.4), eramp(t, cuts[3], cuts[4] + .2)));
    drawPage(g, pageCorners(W / 2, H / 2, s, 0, PHOTO_R[0] + PHOTO_R[2] * .62, PHOTO_R[1] + PHOTO_R[3] * .45), {});
  }, { fi: .4, fo: .4 });
  // e: fotokopi kendi noktalarını ekler
  scene(cuts[4] - .2, cuts[5] + .4, (g, t) => {
    deskBg(g, .1);
    const s = lerp(3.3, 4.2, ramp(t, cuts[4], cuts[5]));
    const a = pageCorners(W / 2 - 115 * s, H / 2 + 40, s, -.01, 105, 160), b = pageCorners(W / 2 + 115 * s, H / 2 + 40, s, .01, 105, 160);
    pageShadow(g, a, .5, 30, 12); drawPage(g, a, {});
    pageShadow(g, b, .5, 30, 12); drawPage(g, b, { gen: 1 });
  }, { fi: .4, fo: .4 });
  // f: her kopya biraz daha makinenin eseri
  scene(cuts[5] - .2, cuts[6] + .4, (g, t) => {
    deskBg(g, .1);
    const s = lerp(4.6, 5.2, ramp(t, cuts[5], cuts[6]));
    const cr = pageCorners(W / 2, H / 2 + 60, s, .015, 105, 150);
    pageShadow(g, cr, .5, 30, 12); drawPage(g, cr, { gen: 6 });
  }, { fi: .4, fo: .4 });
  // g: Carlson'un ilk kopyası
  scene(cuts[6] - .2, cuts[7] + .4, (g, t) => {
    const bg = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .7);
    bg.addColorStop(0, '#e6d8b9'); bg.addColorStop(1, '#8f7a55');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const qx = W / 2 - 520, qy = H / 2 - 120, k = ramp(t, cuts[6], cuts[7]);
    g.save(); g.translate(W / 2, H / 2); g.scale(1 + k * .08, 1 + k * .08); g.translate(-W / 2, -H / 2);
    g.fillStyle = '#efe4c4'; g.fillRect(qx, qy, 1040, 240);
    g.save(); g.filter = 'blur(3px)';
    text(g, '10.-22.-38 ASTORIA.', W / 2, qy + 150, { size: 92, align: 'center', color: 'rgba(40,35,30,.8)', font: `700 92px ${MONO}` });
    g.restore();
    for (let i = 0; i < 500; i++) { g.fillStyle = 'rgba(40,35,30,.3)'; g.fillRect(qx + hash1(i) * 1040, qy + hash1(i + 50) * 240, 2, 2); }
    g.restore();
    text(g, 'Carlson’un ilk kopyası, 1938', W / 2, qy + 340, { size: 36, weight: 300, align: 'center', color: '#3a2a1a' });
  }, { fi: .4, fo: .5 });
  // h: bugün her ofiste
  scene(cuts[7] - .2, cuts[8] + .6, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = { x: 222, y: 150, s: lerp(3.5, 3.2, ramp(t, cuts[7], cuts[8])) };
    applyCam(g, cam);
    const base = (t - cuts[7]) * 110;
    const heads = [0, 1, 2, 3].map(i => ({ s: ((base + i * 330) % 1300) - 60, o: {} })).filter(h => h.s > 0);
    drawMachine(g, { t, drumAng: t * 4, rollerAng: t * 6, laser: .9, heat: .9, heads, polyAng: t * 30 });
  }, { fi: .4, fo: .8 });
  // i: karanlıkta bekleyen silindir ve bir anlık ışık
  const tL = tw('ışık') - .15;
  scene(cuts[8] - .2, DURATION, (g, t) => {
    g.fillStyle = '#020304'; g.fillRect(0, 0, W, H);
    const dimK = sramp(t, cuts[8], cuts[8] + 1.2) * (1 - sramp(t, tL + .5, tL + 2));
    paintUT({ latentShow: .25 + .1 * Math.sin(t * 2) });
    g.save(); g.globalAlpha = dimK * .7; drawCylinder(g, cx0, cy0, len, R, t * .08); g.restore();
    g.fillStyle = 'rgba(2,3,4,.35)'; g.fillRect(0, 0, W, H);
    const f = ramp(t, tL - .25, tL + .15);
    if (f > 0 && f < 1) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const x = lerp(cx0, cx0 + len, f);
      glowDot(g, x, cy0 + R * .45, 220, '255,40,60', 1);
      g.fillStyle = 'rgba(255,60,70,.6)'; g.fillRect(cx0, cy0 + R * .45 - 2, x - cx0, 4);
      g.restore();
    }
    const flash = t > tL ? Math.max(0, 1 - Math.abs(t - (tL + .2)) / .35) : 0;
    if (flash > 0) { g.fillStyle = `rgba(255,245,240,${flash})`; g.fillRect(0, 0, W, H); }
    const kt = win(t, lineEnd(A) + 1.2, DURATION - .2, 1.2, 1.4);
    if (kt > 0) {
      text(g, 'Bir Sayfanın Yolculuğu', W / 2, H / 2 + 10, { size: 96, align: 'center', font: `italic 400 96px ${SERIF}`, color: '#ece6d8', alpha: kt });
      text(g, 'YAZICI  VE  FOTOKOPİ', W / 2, H / 2 + 90, { size: 26, weight: 600, align: 'center', spacing: 10, color: C.dim, alpha: kt });
    }
  }, { fi: .4, fo: 0 });
}
