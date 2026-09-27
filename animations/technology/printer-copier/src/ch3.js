// ---------------------------------------------------------------------------------------------
// 3. Tambur: ışığa duyarlı kaplama; karanlıkta yük kalır, ışıkta akar. Yükleme silindiri (ya da
// korona teli) tamburu baştan sona yükler.
// ---------------------------------------------------------------------------------------------
{
  const A = '03-tambur';
  const tw = (w, n) => T(A, w, n);
  const DRUM_W = 0.9;  // tamburun açısal hızı (rad/sn), bu bölümde

  // ---- 3A: tambura yaklaşma, kaplama
  const camK = [
    [S[A] - .6, 222, 150, 3.3],
    [tw('tambur') + .2, 226, 128, 17, 2.6],
    [tw('kaplama') + .6, 222, 126, 22, 1.8],
  ];
  scene(S[A] + .6, tw('Karanlıkta') + .4, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camK, t);
    applyCam(g, cam);
    drawMachine(g, { t, drumAng: t * DRUM_W * .5, rollerAng: t * .6, heat: .3, hl: { drum: win(t, S[A], tw('tambur') + 1.5, .5, 1) } });
    // kaplamanın parıltısı
    const kc = win(t, tw('kaplama') - .4, tw('Karanlıkta') + 1, .5, .5);
    if (kc > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      g.strokeStyle = `rgba(120,255,190,${.5 * kc})`; g.lineWidth = 1.6; g.shadowColor = 'rgba(120,255,190,.9)'; g.shadowBlur = 20;
      g.beginPath(); g.arc(M.drum.x, M.drum.y, M.drum.r - .4, 0, TAU); g.stroke();
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const kt = win(t, tw('tambur') - .3, tw('Karanlıkta') + 1, .5, .5);
    if (kt > 0) { const [px, py] = w2s(cam, M.drum.x - 16, M.drum.y + 16); label(g, px, py, px - 330, py + 190, 'tambur', kt, { size: 36, color: C.gold }); }
    if (kc > 0) {
      const [px, py] = w2s(cam, M.drum.x + 22.5 * Math.cos(-2.5), M.drum.y + 22.5 * Math.sin(-2.5));
      label(g, px, py, 520, 190, 'ışığa duyarlı kaplama', kc, { size: 36, side: -1 });
      const [qx, qy] = w2s(cam, M.drum.x + 21 * Math.cos(2.4), M.drum.y + 21 * Math.sin(2.4));
      label(g, qx, qy, 480, 900, 'alüminyum boru', kc * sramp(t, tw('kaplama') + .2, tw('kaplama') + 1), { size: 30, side: -1, color: C.dim });
    }
  }, { fi: .8, fo: .7 });

  // ---- 3B: ilke: karanlıkta yük kalır, ışıkta akar
  scene(tw('Karanlıkta') - .4, tw('Önce') + .5, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const y0 = 600, layerH = 170, baseH = 170;
    const x0 = 0, x1 = W;
    // alüminyum taban
    const bg = g.createLinearGradient(0, y0 + layerH, 0, y0 + layerH + baseH);
    bg.addColorStop(0, '#8d949e'); bg.addColorStop(.25, '#5b626b'); bg.addColorStop(1, '#23272c');
    g.fillStyle = bg; g.fillRect(x0, y0 + layerH, x1, baseH);
    // kaplama
    const lg = g.createLinearGradient(0, y0, 0, y0 + layerH);
    lg.addColorStop(0, 'rgba(90,190,145,.95)'); lg.addColorStop(1, 'rgba(30,95,72,.95)');
    g.fillStyle = lg; g.fillRect(x0, y0, x1, layerH);
    g.fillStyle = 'rgba(210,255,235,.35)'; g.fillRect(x0, y0, x1, 2);
    // ışık
    const tl = tw('ışık') - .3, tdrain = tw('noktadaki') - .2, tgone = tw('gidiyor') + .5;
    const L = win(t, tl, tw('dayanıyor') + .6, .35, .8);
    const cx = W / 2, spot = 150;
    if (L > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const cg = g.createLinearGradient(0, 0, 0, y0);
      cg.addColorStop(0, `rgba(255,245,225,0)`); cg.addColorStop(1, `rgba(255,245,225,${.32 * L})`);
      g.fillStyle = cg; g.beginPath(); g.moveTo(cx - 40, 0); g.lineTo(cx + 40, 0); g.lineTo(cx + spot, y0); g.lineTo(cx - spot, y0); g.closePath(); g.fill();
      const sg = g.createRadialGradient(cx, y0, 10, cx, y0, spot * 1.4);
      sg.addColorStop(0, `rgba(255,250,235,${.55 * L})`); sg.addColorStop(1, 'rgba(255,250,235,0)');
      g.fillStyle = sg; g.fillRect(cx - spot * 1.5, y0 - spot, spot * 3, spot * 2);
      g.restore();
    }
    // yükler
    const n = 22, sp = W / n;
    for (let i = 0; i < n; i++) {
      const x = sp * (i + .5);
      const inSpot = Math.abs(x - cx) < spot * .9;
      const jit = Math.sin(t * 3 + i * 1.7) * 1.5;
      if (!inSpot) { glowDot(g, x, y0 - 34 + jit, 34, '88,199,255', .35); minus(g, x, y0 - 34 + jit, 40, C.charge, 1); continue; }
      // ışıkta: yük kaplamanın içinden tabana akar
      const k = eramp(t, tdrain + Math.abs(x - cx) / spot * .5, tgone + Math.abs(x - cx) / spot * .3);
      if (k >= 1) continue;
      const yy = lerp(y0 - 34, y0 + layerH + 24, easeI(k));
      glowDot(g, x, yy + jit, 34, '88,199,255', .35 * (1 - k));
      minus(g, x, yy + jit, 40, C.charge, 1 - sramp(k, .8, 1));
    }
    // topraklama işareti
    g.strokeStyle = 'rgba(236,232,223,.5)'; g.lineWidth = 2;
    const gx = 1700, gy = y0 + layerH + baseH;
    g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx, gy + 40); g.moveTo(gx - 26, gy + 40); g.lineTo(gx + 26, gy + 40); g.moveTo(gx - 16, gy + 50); g.lineTo(gx + 16, gy + 50); g.moveTo(gx - 7, gy + 60); g.lineTo(gx + 7, gy + 60); g.stroke();
    // etiketler
    const k1 = sramp(t, tw('Karanlıkta') - .2, tw('Karanlıkta') + .8);
    text(g, 'kaplama', 60, y0 + layerH / 2 + 12, { size: 34, color: 'rgba(230,255,240,.8)', alpha: k1 });
    text(g, 'alüminyum', 60, y0 + layerH + baseH / 2 + 12, { size: 34, color: 'rgba(20,24,28,.85)', alpha: k1 });
    revealText(g, 'karanlıkta: yük yerinde kalır', 90, 200, eramp(t, tw('Karanlıkta') - .1, tw('tutuyor') + .3), { size: 44, weight: 300 });
    revealText(g, 'ışık düşünce: yük akıp gider', W - 90, 200, eramp(t, tw('Üstüne') - .1, tw('gidiyor') + .2), { size: 44, weight: 300, align: 'right', color: '#ffe9c7' });
    const kb = win(t, tw('Bütün') - .1, tw('Önce') + .5, .5, .4);
    if (kb > 0) text(g, 'fotoiletken: ışık onu iletken yapar', W / 2, 330, { size: 30, weight: 400, align: 'center', color: C.gold, alpha: kb, spacing: 1 });
  }, { fi: .6, fo: .6 });

  // ---- 3C–3D: yükleme silindiri, korona teli, "yüzlerce volt", kazak benzetmesi
  const tCharge = tw('Tamburun') - .6;
  const ang = t => t * DRUM_W;
  const chargedInfo = t => a => {
    // yüzeydeki nokta, yükleme noktasından geçeli ne kadar oldu?
    const since = ((a - M.chargeA) % TAU + TAU) % TAU;
    const traveled = ang(t) - ang(tCharge);
    return { charge: since <= traveled ? 1 : 0, toner: 0 };
  };
  const camC = [
    [tw('Önce') - .5, 218, 120, 16],
    [tw('seriyor') + .3, 225, 126, 18.5, 2.4],
    [(tw('Yüzlerce') + .5) + .3, 222, 128, 15, 1.5],
  ];
  scene(tw('Önce') - .4, tw('Kışın') + .3, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camC, t);
    applyCam(g, cam);
    const wire = win(t, tw('tel') - .3, tw('silindir', 1) - .1, .3, .4);
    drawMachine(g, { t, drumAng: ang(t), rollerAng: t * .6, heat: .3, drumInfo: t > tCharge ? chargedInfo(t) : null, hl: { charge: win(t, tw('silindir', 1) - .2, tw('seriyor') + .6, .4, .6) } });
    if (wire > 0) {
      // korona teli: kalkan içinde ince tel ve mor ışıma
      const { x, y } = M.charge;
      g.save(); g.globalAlpha = wire;
      g.fillStyle = '#0e1114'; g.beginPath(); g.arc(x, y, 9.5, 0, TAU); g.fill();
      g.strokeStyle = '#8b939c'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, 9, PI * .15 + M.chargeA - PI, PI * 1.85 + M.chargeA - PI); g.stroke();
      g.globalCompositeOperation = 'lighter';
      const fl = .7 + .3 * Math.sin(t * 40) * Math.sin(t * 23);
      glowDot(g, x, y, 7, '170,140,255', .9 * fl);
      g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, .5, 0, TAU); g.fill();
      g.restore();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (wire > 0) { const [px, py] = w2s(cam, M.charge.x - 6, M.charge.y - 6); label(g, px, py, Math.max(420, px - 260), py - 150, 'korona teli', wire, { size: 36 }); }
    const kr = win(t, tw('silindir', 1) - .1, (tw('Yüzlerce') + .5) + .5, .4, .5);
    if (kr > 0) { const [px, py] = w2s(cam, M.charge.x - 6, M.charge.y - 6); label(g, px, py, Math.max(480, px - 260), py - 150, 'yükleme silindiri', kr, { size: 36 }); }
    const kv = win(t, tw('Yüzlerce') - .2, tw('Kışın') + .4, .4, .4);
    if (kv > 0) {
      const [px, py] = w2s(cam, M.drum.x + 20, M.drum.y - 16);
      revealText(g, '− yüzlerce volt', px + 90, py - 60, eramp(t, tw('Yüzlerce') - .2, (tw('Yüzlerce') + .5) + .3), { size: 58, weight: 300, color: C.charge, shadow: 'rgba(0,0,0,.8)' });
    }
  }, { fi: .6, fo: .5 });

  // kazak benzetmesi: saçlar kalkar
  scene(tw('Kışın') - .2, tw('Tambur', 1) + .3, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const k = eramp(t, tw('kazağınızı'), tw('kabartan') + .4);
    const cx = W / 2, cy = 640;
    g.save();
    // baş
    g.strokeStyle = 'rgba(236,232,223,.85)'; g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, 110, 0, TAU); g.stroke();
    // omuzlar
    g.beginPath(); g.moveTo(cx - 280, cy + 330); g.bezierCurveTo(cx - 260, cy + 190, cx - 140, cy + 170, cx - 60, cy + 150); g.lineTo(cx + 60, cy + 150); g.bezierCurveTo(cx + 140, cy + 170, cx + 260, cy + 190, cx + 280, cy + 330); g.stroke();
    // yukarı çekilen kazak
    const sy = lerp(cy + 150, cy - 330, k);
    g.fillStyle = 'rgba(160,60,60,.85)'; g.strokeStyle = 'rgba(255,170,160,.6)';
    g.beginPath(); g.moveTo(cx - 170, sy); g.quadraticCurveTo(cx, sy - 60, cx + 170, sy); g.lineTo(cx + 150, sy - 70); g.quadraticCurveTo(cx, sy - 130, cx - 150, sy - 70); g.closePath(); g.fill(); g.stroke();
    for (let i = 0; i < 7; i++) { g.strokeStyle = 'rgba(255,190,180,.25)'; g.beginPath(); g.moveTo(cx - 150 + i * 50, sy - 70 + Math.abs(i - 3) * 4); g.lineTo(cx - 160 + i * 53, sy); g.stroke(); }
    // saçlar
    const n = 34;
    for (let i = 0; i < n; i++) {
      const a = -PI + .25 + (PI - .5) * i / (n - 1);
      const bx = cx + Math.cos(a) * 108, by = cy + Math.sin(a) * 108;
      const lift = k * (.6 + .4 * hash1(i));
      const tx = lerp(bx + Math.cos(a) * 60, bx + (cx - bx) * .1 + Math.cos(a) * 40, lift);
      const ty = lerp(by + Math.sin(a) * 40 + 50 * Math.abs(Math.cos(a)), sy + 20 + Math.sin(a) * 10 + (1 - lift) * 100, lift * .9);
      g.strokeStyle = `rgba(232,200,150,${.8})`; g.lineWidth = 2;
      g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(lerp(bx, tx, .5) + Math.sin(i + t * 4) * 6 * lift, lerp(by, ty, .5) - 20 * (1 - lift), tx, ty); g.stroke();
    }
    // kıvılcımlar
    if (k > .3) {
      g.strokeStyle = 'rgba(160,200,255,.9)'; g.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const f = Math.floor(t * 12 + i * 3);
        if (hash1(f * 7 + i) < .45) continue;
        const x = cx + (hash1(f + i * 11) - .5) * 300, y = sy + 30 + hash1(f * 3 + i) * 60;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 10); g.lineTo(x - 4, y + 16); g.lineTo(x + 6, y + 28); g.stroke();
      }
    }
    g.restore();
    revealText(g, 'durgun elektrik', cx + 330, 420, eramp(t, tw('elektrikle') - .3, tw('türden') + .2), { size: 48, weight: 300, color: C.charge });
  }, { fi: .4, fo: .5 });

  // ---- 3E: tambur baştan sona yüklü, ama boş; sonra ışık
  scene(tw('Tambur', 1) - .3, lineEnd(A) + .9, (g, t) => {
    g.fillStyle = '#06080b'; g.fillRect(0, 0, W, H);
    const rot = t * .35;
    const show = sramp(t, tw('yüklü') - .6, tw('yüklü') + .4);
    const ghost = win(t, tw('yazı') - .3, lineEnd(A) + 1, .6, .6);
    paintUT({ latentShow: show, ghost: 0 });
    const R = 300, len = 1500, x = (W - len) / 2 - 30, y = H / 2 - R;
    drawCylinder(g, x, y, len, R, rot);
    // hayali yazı: silinecek yerler
    if (ghost > 0) {
      g.save(); g.globalAlpha = ghost * (.75 + .25 * Math.sin(t * 5));
      g.setLineDash([10, 9]);
      g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.shadowColor = 'rgba(255,255,255,.6)'; g.shadowBlur = 10;
      g.font = `700 250px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.translate(x + len / 2, H / 2 + 10); g.scale(-1, 1); g.strokeText('Işıkla', 0, 0);
      g.restore();
    }
    revealText(g, 'baştan sona yüklü', 170, 150, eramp(t, tw('baştan') - .2, tw('yüklü') + .4), { size: 46, weight: 300, color: C.charge });
    revealText(g, 've tamamen boş', 170, 210, eramp(t, tw('Ve') - .1, tw('boş') + .3), { size: 46, weight: 300 });
    // lazer noktası belirir
    const lz = sramp(t, tw('ışık', 1) - .6, tw('ışık', 1) + .1);
    if (lz > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      glowDot(g, x + 60, y + R * .55, 140 * lz, '255,40,60', .9 * lz);
      g.fillStyle = `rgba(255,220,220,${lz})`; g.beginPath(); g.arc(x + 60, y + R * .55, 5, 0, TAU); g.fill();
      g.restore();
    }
    const out = sramp(t, lineEnd(A) + .2, lineEnd(A) + .9);
    if (out > 0) { g.fillStyle = `rgba(6,8,11,${out})`; g.fillRect(0, 0, W, H); }
  }, { fi: .5, fo: .2 });
}
