// ---------------------------------------------------------------------------------------------
// 1. Sıcak sayfa: yazıcıdan çıkan sayfa, mürekkep sanılan şeyin aslında toz olduğu, fotoğraftaki
// noktalar ve fotokopinin getireceği desenlerin ilk görüntüsü. Ardından başlık: lazerle yazılır.
// ---------------------------------------------------------------------------------------------
{
  const A = '01-sicak';
  const tw = (w, n) => T(A, w, n);

  // başlık harflerinden örnek noktalar (toz tanecikleri buraya konar) ve "Y" harfinin kenarı
  const maskData = (() => { const c = TEXT_MASK_CANVAS; return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; })();
  const MW = TEXT_MASK_CANVAS.width;
  const inkMM = (x, y) => maskData[(Math.floor(y * DPMM) * MW + Math.floor(x * DPMM)) * 4] > 127;
  const grains = [];
  { const r = mulberry(21); let n = 0;
    while (grains.length < 420 && n++ < 200000) { const x = 17 + r() * 150, y = 30 + r() * 15; if (inkMM(x, y)) grains.push({ x, y, a: r() * TAU, sp: .6 + r() * .8, d: r() }); } }
  // "Y" harfinin sol kolunun dış kenarı
  const headY = (() => {
    const g = TEXT_MASK_CANVAS.getContext('2d'); g.font = `700 ${15.5 * DPMM}px ${SERIF}`;
    const xY = 18 - .6 + g.measureText('Işıkla ').width / DPMM;
    const y = 36.2; let x = xY;
    while (x < xY + 12 && !inkMM(x, y)) x += .01;
    return { x, y };
  })();
  const cheek = { x: PHOTO_R[0] + PHOTO_R[2] * .63, y: PHOTO_R[1] + PHOTO_R[3] * .56 };
  const sky = { x: PHOTO_R[0] + PHOTO_R[2] * .22, y: PHOTO_R[1] + PHOTO_R[3] * .3 };

  // bakış açısı: kâğıt çıkış yuvasından ileri doğru uzanan zemin
  const persp = (X, z) => { const D = 600, A2 = 1105300, yh = -1082, fx = 2343; return [W / 2 + fx * X / (D + z), yh + A2 / (D + z)]; };
  function emergeCorners(e) {
    const z0 = e * PH;
    return [...persp(-PW / 2, z0), ...persp(PW / 2, z0), ...persp(PW / 2, z0 - PH), ...persp(-PW / 2, z0 - PH)];
  }
  function printerFront(g, t) {
    g.save();
    // ön gövde
    const top = 760;
    const gr = g.createLinearGradient(0, top, 0, H);
    gr.addColorStop(0, '#2a2e34'); gr.addColorStop(.06, '#1a1d21'); gr.addColorStop(1, '#0b0c0e');
    g.fillStyle = gr; g.beginPath(); g.moveTo(-10, top + 20); g.lineTo(W + 10, top + 20); g.lineTo(W + 10, H); g.lineTo(-10, H); g.fill();
    // yuva
    g.fillStyle = '#050506'; g.fillRect(W / 2 - 520, top - 4, 1040, 26);
    const glow = g.createLinearGradient(0, top - 4, 0, top + 22);
    glow.addColorStop(0, 'rgba(255,170,90,0)'); glow.addColorStop(.5, `rgba(255,160,80,${.25 + .1 * Math.sin(t * 3)})`); glow.addColorStop(1, 'rgba(255,170,90,0)');
    g.fillStyle = glow; g.fillRect(W / 2 - 520, top - 4, 1040, 26);
    g.fillStyle = 'rgba(210,220,235,.22)'; g.fillRect(W / 2 - 540, top + 22, 1080, 1.5);
    // üst kapak kenarı
    g.fillStyle = '#30353c'; g.fillRect(-10, top + 20, W + 20, 3);
    // havalandırma çizgileri
    g.fillStyle = 'rgba(255,255,255,.035)';
    for (let i = 0; i < 18; i++) g.fillRect(170 + i * 22, 900, 10, 110);
    // durum ışığı
    const led = .6 + .4 * Math.sin(t * 2.2);
    glowDot(g, 1650, 880, 40, '90,255,150', .5 * led);
    g.fillStyle = `rgba(150,255,190,${.6 + .4 * led})`; g.beginPath(); g.arc(1650, 880, 5, 0, TAU); g.fill();
    g.restore();
  }
  // ısı: buhar kıvrımları
  function steam(g, t, k, x0, x1, y0, y1) {
    if (k <= 0) return;
    g.save(); g.filter = 'blur(14px)'; g.globalCompositeOperation = 'screen';
    for (let i = 0; i < 16; i++) {
      const ph = (t * .16 + hash1(i)) % 1;
      const x = lerp(x0, x1, hash1(i + 10)) + Math.sin(t * .7 + i) * 25;
      const y = lerp(y1, y0, hash1(i + 30)) - ph * 260;
      const a = Math.sin(ph * PI) * .075 * k;
      g.strokeStyle = `rgba(245,240,232,${a})`; g.lineWidth = 26 + 30 * ph;
      g.beginPath(); g.moveTo(x, y + 80);
      g.bezierCurveTo(x + 50 * Math.sin(t * .8 + i), y + 30, x - 50 * Math.cos(t * .7 + i), y - 30, x + 30 * Math.sin(t * 1.1 + i), y - 100);
      g.stroke();
    }
    g.restore();
  }

  // sayfa kamerası (masa mm'si: asıl sayfa merkezi 0,0; kopya 240,0)
  const COPY_X = 240;
  const camKeys = [
    [0, 0, 0, 3.2],
    [tw('Bu', 0) + .2, 0, 0, 3.2],
    [tw('plastik') + .6, headY.x - 105, headY.y - 148.5, 1500, 2.1],
    [tw('fotoğrafta') + .3, cheek.x - 105, cheek.y - 148.5, 7, 1.6],
    [tw('nokta') + .6, cheek.x - 105 + .4, cheek.y - 148.5, 62, 1.5],
    [tw('makinenin') + .6, 0, 0, 3.2, 2.0],
    [tw('fotokopiye') + 1.2, COPY_X / 2, 0, 3.0, 2.0],
    [tw('desenlerle') + .2, COPY_X + sky.x - 105 + 20, sky.y - 148.5 + 10, 6.5, 2.6],
    [tw('anlatıyor') + .4, COPY_X / 2, 0, 2.2, 2.4],
  ];

  scene(0, lineEnd(A) + .2, (g, t) => {
    deskBg(g, .6 + .4 * sramp(t, 6.5, 8));
    const tilt = eramp(t, 8.4, 10.4);           // bakış açısından tepeden bakışa
    const e = eramp(t, 1.7, 6.6, k => 1 - Math.pow(1 - k, 2));
    const heat = sramp(t, 6.7, 7.5) * (1 - sramp(t, 9.8, 12.5));
    const cam = camPath(camKeys, t);
    const center = (dx, dy) => [W / 2 + (dx - cam.x) * cam.s, H / 2 + (dy - cam.y) * cam.s];
    const fade0 = sramp(t, .2, 2.2);

    // ---- asıl sayfa
    const flat = pageCorners(...center(0, 0), cam.s);
    let corners = flat;
    if (tilt < 1) {
      const pc = emergeCorners(e);
      corners = pc.map((v, i) => lerp(v, flat[i], tilt));
    }
    // kâğıt yatağı (yalnızca bakış açısında)
    if (tilt < 1) {
      g.save(); g.globalAlpha = (1 - tilt) * fade0;
      const tr = [...persp(-150, 360), ...persp(150, 360), ...persp(150, 0), ...persp(-150, 0)];
      const gr = g.createLinearGradient(0, tr[1], 0, tr[5]);
      gr.addColorStop(0, '#15181c'); gr.addColorStop(1, '#262a30');
      g.fillStyle = gr; g.beginPath(); g.moveTo(tr[0], tr[1]); g.lineTo(tr[2], tr[3]); g.lineTo(tr[4], tr[5]); g.lineTo(tr[6], tr[7]); g.closePath(); g.fill();
      g.restore();
    }
    const copyIn = eramp(t, tw('Sonra') + .3, tw('Kopyadaki') + .2);
    if (e > 0) {
      if (tilt > .5) pageShadow(g, corners, .55 * fade0, 50, 18);
      drawPage(g, corners, { heat: heat * .32, shimmer: heat * (1 - tilt * .6), time: t, alpha: fade0,
        macro: sramp(Math.log(cam.s), Math.log(120), Math.log(700)), gloss: [-.6, -.5],
        lit: [1, .98 - .03 * heat, .95 - .06 * heat] });
    }
    // ---- kopya
    if (copyIn > 0) {
      const cc = center(COPY_X, 0);
      const cy = cc[1] + (1 - copyIn) * 900;
      const cr = pageCorners(cc[0], cy, cam.s, (1 - copyIn) * .12);
      pageShadow(g, cr, .5, 50, 18);
      drawPage(g, cr, { gen: 1, alpha: 1 });
      // taze kopyanın üstünden geçen ışık izi
      const sw = ramp(t, tw('Sonra') + .3, tw('Kopyadaki') + .6);
      if (sw > 0 && sw < 1) {
        const yy = lerp(cr[1], cr[5], sw);
        const lg = g.createLinearGradient(0, yy - 40, 0, yy + 40);
        lg.addColorStop(0, 'rgba(255,255,255,0)'); lg.addColorStop(.5, 'rgba(255,250,235,.25)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.fillRect(cr[0], yy - 40, cr[2] - cr[0], 80); g.restore();
      }
    }
    if (tilt < 1) { g.save(); g.globalAlpha = (1 - tilt) * fade0; printerFront(g, t); g.restore(); }

    // ısı: buhar
    steam(g, t, heat * fade0 * (1 - sramp(Math.log(cam.s), Math.log(4), Math.log(12))), corners[0] + 40, corners[2] - 40, corners[1], Math.min(corners[5], 760));

    // ---- mürekkep damlası → kuru toz
    const td = tw('mürekkep') - .4, tsh = tw('sıvı') - .2;
    if (t > td && t < tsh + 1.8) {
      const target = center(-40, -110);
      const fall = eramp(t, td, tsh, k => 1 - Math.pow(1 - k, 2.2));
      const dx = target[0], dy = lerp(-160, target[1] - 150, fall);
      const burst = ramp(t, tsh, tsh + .35);
      if (burst < 1) {
        g.save(); g.globalAlpha = 1 - burst; g.translate(dx, dy);
        const s = 2.1 * (1 + burst * .6), wob = Math.sin(t * 9) * .04;
        g.scale(s * (1 + wob), s * (1 - wob));
        const dg = g.createRadialGradient(-10, 10, 4, 0, 18, 46);
        dg.addColorStop(0, '#3b4a78'); dg.addColorStop(.6, '#101830'); dg.addColorStop(1, '#05070d');
        g.fillStyle = dg;
        g.beginPath(); g.moveTo(0, -48); g.bezierCurveTo(14, -18, 34, 4, 34, 22); g.arc(0, 22, 34, 0, PI); g.bezierCurveTo(-34, 4, -14, -18, 0, -48); g.fill();
        g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-12, 14, 5, 9, -.4, 0, TAU); g.fill();
        g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(14, 34, 9, 4, .3, 0, TAU); g.fill();
        g.restore();
      }
      if (t > tsh) {
        // tanecikler: patlar, sonra başlık harflerine iner
        const k1 = ramp(t, tsh, tsh + .5), k2 = eramp(t, tsh + .35, tsh + 1.5, easeIO);
        for (let i = 0; i < grains.length; i++) {
          const q = grains[i];
          const bx = dx + Math.cos(q.a) * 140 * q.sp * easeO(k1), by = dy + 30 + Math.sin(q.a) * 110 * q.sp * easeO(k1) - 40 * k1;
          const tx = W / 2 + (q.x - 105 - cam.x) * cam.s, ty = H / 2 + (q.y - 148.5 - cam.y) * cam.s;
          const kk = clamp((k2 - q.d * .3) / .7);
          const x = lerp(bx, tx, easeIO(kk)), y = lerp(by, ty, easeIO(kk)) - Math.sin(kk * PI) * 60;
          const a = 1 - sramp(kk, .85, 1);
          if (a <= 0) continue;
          g.fillStyle = `rgba(12,12,14,${a})`; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill();
          g.fillStyle = `rgba(255,255,255,${.5 * a})`; g.beginPath(); g.arc(x - .8, y - .8, .9, 0, TAU); g.fill();
        }
      }
    }
    // ---- etiketler
    {
      const k = win(t, tw('plastik') + .1, tw('Üstündeki') + .2, .9, .5);
      if (k > 0) {
        const p = center(headY.x - 105, headY.y - 148.5);
        label(g, p[0] - 40, p[1] + 60, p[0] - 420, p[1] - 180, 'erimiş plastik', k, { size: 34, weight: 400 });
        text(g, 'toner: karbon siyahıyla boyanmış kuru plastik tozu', p[0] - 456, p[1] - 128, { size: 22, color: C.dim, align: 'right', alpha: k });
      }
      const k2 = win(t, tw('nokta') + .4, tw('Bir', 1) + .6, .8, .5);
      if (k2 > 0) text(g, 'yalnızca siyah noktalar', W / 2, H - 120, { size: 34, weight: 300, align: 'center', alpha: k2, shadow: 'rgba(0,0,0,.9)', blur: 24 });
      const k3 = win(t, tw('Kopyadaki') + .2, tw('Nedenini') + .2, .6, .6);
      if (k3 > 0) {
        const a = center(0, 162), b = center(COPY_X, 162);
        text(g, 'asıl sayfa', a[0], a[1], { size: 26, weight: 500, align: 'center', color: C.dim, alpha: k3 * (1 - sramp(t, tw('fotoğraf', 1), tw('fotoğraf', 1) + .5)), spacing: 2 });
        text(g, 'fotokopisi', b[0], b[1], { size: 26, weight: 500, align: 'center', color: C.gold, alpha: k3 * (1 - sramp(t, tw('fotoğraf', 1), tw('fotoğraf', 1) + .5)), spacing: 2 });
      }
    }
    // kararma: sayfalar geri çekilirken
    const out = sramp(t, tw('doğuşu'), lineEnd(A) + .2);
    if (out > 0) { g.fillStyle = `rgba(5,6,8,${out})`; g.fillRect(0, 0, W, H); }
    const inn = 1 - sramp(t, 0, 1.2);
    if (inn > 0) { g.fillStyle = `rgba(0,0,0,${inn})`; g.fillRect(0, 0, W, H); }
  }, { fi: 0, fo: 0 });

  // ---- başlık: lazer satır satır yazar
  const tA = lineEnd(A) + .3, tB = S['02-kagit'] - .3;
  const titleCanvas = makeCanvas(W, 400);
  {
    const g = titleCanvas.getContext('2d');
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = `italic 400 124px ${SERIF}`; g.fillText('Bir Sayfanın Yolculuğu', W / 2, 190);
    g.font = `600 30px ${SANS}`; g.letterSpacing = '12px'; g.fillText('YAZICI  VE  FOTOKOPİ', W / 2 + 6, 290);
  }
  scene(tA, tB, (g, t) => {
    g.fillStyle = '#050608'; g.fillRect(0, 0, W, H);
    const y0 = 340, k = eramp(t, tA + .3, tA + 3.4, k => k);
    const rows = 400;
    const yy = rows * k;
    // yazılmış bölge: önce mavi (yük), sonra ısınıp açık renk olur
    const Lt = layer(1), lg2 = Lt.g;
    lg2.save();
    lg2.beginPath(); lg2.rect(0, y0, W, yy); lg2.clip();
    lg2.drawImage(titleCanvas, 0, y0);
    lg2.globalCompositeOperation = 'source-atop';
    const cg = lg2.createLinearGradient(0, y0 + yy - 120, 0, y0 + yy);
    cg.addColorStop(0, 'rgba(236,230,215,1)'); cg.addColorStop(1, 'rgba(120,200,255,1)');
    lg2.fillStyle = cg; lg2.fillRect(0, y0, W, yy);
    lg2.restore();
    g.drawImage(Lt.c, 0, 0);
    // lazer çizgisi
    if (k > 0 && k < 1) {
      const ly = y0 + yy;
      const sweep = fract(t * 7.3);
      g.save(); g.globalCompositeOperation = 'lighter';
      const lg = g.createLinearGradient(0, ly - 8, 0, ly + 8);
      lg.addColorStop(0, 'rgba(255,40,60,0)'); lg.addColorStop(.5, 'rgba(255,60,70,.55)'); lg.addColorStop(1, 'rgba(255,40,60,0)');
      g.fillStyle = lg; g.fillRect(300, ly - 8, W - 600, 16);
      glowDot(g, lerp(300, W - 300, sweep), ly, 50, '255,60,70', .9);
      g.restore();
    }
    const f = 1 - sramp(t, tB - 1.2, tB);
    if (f < 1) { g.fillStyle = `rgba(5,6,8,${1 - f})`; g.fillRect(0, 0, W, H); }
  }, { fi: .4, fo: 0 });
}
