// ---------------------------------------------------------------------------------------------
// 5. Toner ve ısı: kuru plastik tozu; yüklü yerler iter, boşalmış yerler tutar; kâğıda aktarma;
// ısıtıcıda erime; temizleme ve yeniden yükleme.
// ---------------------------------------------------------------------------------------------
{
  const A = '05-toner';
  const tw = (w, n) => T(A, w, n);

  function tonerBall(g, x, y, r, o = {}) {
    const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .05, x, y, r);
    gr.addColorStop(0, o.hi || '#5a5d66'); gr.addColorStop(.35, '#1d1e22'); gr.addColorStop(1, '#050506');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    if (o.rim) { g.strokeStyle = `rgba(190,210,255,${o.rim})`; g.lineWidth = Math.max(1, r * .08); g.beginPath(); g.arc(x, y, r * .95, -PI * .9, -PI * .35); g.stroke(); }
  }

  // ---- 5A: toz, tanecik, saç teli
  const P = []; { const r = mulberry(55); for (let i = 0; i < 520; i++) P.push({ x: r(), y: r(), z: r(), s: .5 + r(), ph: r() * TAU }); }
  scene(S[A] - .6, tw('Tanecikler') + .2, (g, t) => {
    // stüdyo zemini
    const bg = g.createRadialGradient(W * .5, H * .45, 60, W * .5, H * .5, W * .7);
    bg.addColorStop(0, '#3a3c42'); bg.addColorStop(.6, '#1a1b1f'); bg.addColorStop(1, '#0a0a0c');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const zoom = eramp(t, tw('Rengini') - .3, tw('karbon') + .2);          // tek taneciğe yaklaş
    const hair = win(t, tw('Tek') - .2, tw('Bu') + .2, .6, .6);
    const name = win(t, tw('Bu') - .1, tw('Tanecikler') + .3, .5, .4);
    // bulut
    const cloudA = (1 - zoom) * (1 - hair);
    if (cloudA > 0) {
      g.save(); g.globalAlpha = cloudA;
      for (const p of P) {
        const depth = .4 + p.z * 1.2;
        const x = ((p.x * W * 1.2 + t * 14 * depth + Math.sin(t * .4 + p.ph) * 20) % (W * 1.2)) - W * .1;
        const y = ((p.y * H * 1.2 + t * 6 * depth + Math.cos(t * .3 + p.ph) * 14) % (H * 1.2)) - H * .1;
        const r = (3 + p.s * 7) * depth;
        if (depth > 1.35) { g.save(); g.filter = 'blur(4px)'; tonerBall(g, x, y, r); g.restore(); }
        else tonerBall(g, x, y, r, { rim: .25 * depth });
      }
      g.restore();
    }
    // tek tanecik: kesit
    if (zoom > 0 && hair < 1 && name < 1) {
      g.save(); g.globalAlpha = zoom * (1 - hair) * (1 - name);
      const cx = W / 2, cy = H / 2, R = 300;
      const cut = eramp(t, tw('karbon') - .5, tw('siyahı') + .4);
      tonerBall(g, cx, cy, R, { rim: .4 });
      if (cut > 0) {
        // yarım küre kesiti: saydam reçine içinde karbon siyahı
        g.save(); g.beginPath(); g.moveTo(cx, cy - R); g.arc(cx, cy, R, -PI / 2, PI / 2); g.closePath(); g.clip();
        g.globalAlpha *= cut;
        const rg = g.createRadialGradient(cx + 60, cy - 40, 20, cx, cy, R);
        rg.addColorStop(0, '#caa46a'); rg.addColorStop(1, '#6b4a22');
        g.fillStyle = rg; g.fillRect(cx, cy - R, R, 2 * R);
        const r2 = mulberry(9);
        for (let i = 0; i < 260; i++) {
          const a = r2() * PI - PI / 2, d = Math.sqrt(r2()) * R * .95;
          const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
          if (x < cx + 4) continue;
          g.fillStyle = '#0a0a0b'; g.beginPath(); g.arc(x, y, 3 + r2() * 6, 0, TAU); g.fill();
        }
        g.restore();
        g.strokeStyle = `rgba(255,235,200,${.6 * cut})`; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy - R); g.lineTo(cx, cy + R); g.stroke();
      }
      g.restore();
      const kl = win(t, tw('karbon') - .1, tw('Tek') + .2, .4, .5) * (1 - hair);
      if (kl > 0) {
        label(g, W / 2 + 160, H / 2 - 150, W / 2 + 420, H / 2 - 300, 'plastik (reçine)', kl, { size: 36, side: 1 });
        label(g, W / 2 + 200, H / 2 + 120, W / 2 + 440, H / 2 + 280, 'karbon siyahı', kl * sramp(t, tw('siyahı') - .2, tw('siyahı') + .4), { size: 36, side: 1 });
      }
    }
    // saç teli ve tanecik
    if (hair > 0) {
      g.save(); g.globalAlpha = hair;
      const hw = 520, hy = H / 2 - hw / 2 - 20;
      const hg = g.createLinearGradient(0, hy, 0, hy + hw);
      hg.addColorStop(0, '#1d140d'); hg.addColorStop(.3, '#6b4a2e'); hg.addColorStop(.45, '#8e6a48'); hg.addColorStop(.7, '#4a3120'); hg.addColorStop(1, '#130d08');
      g.fillStyle = hg; g.fillRect(-20, hy, W + 40, hw);
      // pullar
      g.strokeStyle = 'rgba(20,12,6,.35)'; g.lineWidth = 3;
      for (let x = -40; x < W + 60; x += 70) { g.beginPath(); g.moveTo(x, hy + 4); g.bezierCurveTo(x + 30, hy + hw * .3, x + 10, hy + hw * .7, x + 36, hy + hw - 4); g.stroke(); }
      const tr = hw / 20;
      const tx = W / 2 + 380 * (1 - eramp(t, tw('Tek') - .2, tw('tanecik') + .5)), ty = hy + hw + 90;
      tonerBall(g, W / 2, hy + hw + 90, tr, { rim: .5 });
      g.restore();
      // ölçü
      const kd = sramp(t, tw('kalınlığının') - .3, tw('onda') + .2) * hair;
      if (kd > 0) {
        g.save(); g.globalAlpha = kd; g.strokeStyle = C.gold; g.lineWidth = 2;
        g.beginPath(); g.moveTo(300, hy); g.lineTo(300, hy + hw); g.moveTo(285, hy); g.lineTo(315, hy); g.moveTo(285, hy + hw); g.lineTo(315, hy + hw); g.stroke();
        g.beginPath(); g.moveTo(W / 2 + 60, hy + hw + 90 - tr); g.lineTo(W / 2 + 60, hy + hw + 90 + tr); g.stroke();
        g.restore();
        text(g, 'saç teli', 330, hy + hw / 2 + 12, { size: 40, weight: 300, alpha: kd, shadow: 'rgba(0,0,0,.8)' });
        text(g, 'toner taneciği: saç telinin onda biri', W / 2 + 90, hy + hw + 102, { size: 34, weight: 300, alpha: kd * sramp(t, tw('onda') - .2, tw('onda') + .5) });
      }
    }
    // yazılar
    const k1 = win(t, tw('Un') - .2, tw('Rengini') + .2, .4, .4);
    revealText(g, 'un kadar ince', 150, 300, k1 * eramp(t, tw('Un') - .2, tw('ince') + .5), { size: 52, weight: 300, alpha: k1 });
    revealText(g, 'kuru plastik tozu', 150, 370, k1 * eramp(t, tw('kuru') - .2, tw('tozu', 1) + .4), { size: 52, weight: 300, alpha: k1, color: C.gold });
    if (name > 0) {
      g.save(); g.globalAlpha = name; g.fillStyle = 'rgba(8,8,10,.55)'; g.fillRect(0, 0, W, H); g.restore();
      revealText(g, 'TONER', W / 2, H / 2 + 60, eramp(t, tw('toza') - .1, tw('deniyor') + .3), { size: 190, weight: 200, align: 'center', spacing: 30, alpha: name });
    }
  }, { fi: .6, fo: .5 });

  // ---- 5B: geliştirme: iten yük, tutan boşluk
  const dev = (() => { const r = mulberry(77); const a = []; for (let i = 0; i < 150; i++) a.push({ x: r(), row: Math.floor(r() * 2), s: .8 + r() * .4, d: r() }); return a; })();
  scene(tw('Tanecikler') - .3, tw('Şimdi') + .5, (g, t) => {
    const bgd = g.createLinearGradient(0, 0, 0, H);
    bgd.addColorStop(0, '#2c323b'); bgd.addColorStop(1, '#3b414a');
    g.fillStyle = bgd; g.fillRect(0, 0, W, H);
    const drumY = 250, devY = 830;
    const gap0 = 760, gap1 = 1160;      // boşalmış bölge (harfin kesiti)
    // tambur yüzeyi
    const dg = g.createLinearGradient(0, drumY - 150, 0, drumY);
    dg.addColorStop(0, '#0f3a2d'); dg.addColorStop(1, '#2c7a5e');
    g.fillStyle = dg; g.fillRect(0, drumY - 150, W, 150);
    g.fillStyle = 'rgba(210,255,235,.4)'; g.fillRect(0, drumY - 1, W, 2);
    // geliştirme silindiri
    const rg = g.createLinearGradient(0, devY, 0, devY + 160);
    rg.addColorStop(0, '#6b7079'); rg.addColorStop(.3, '#3a3e45'); rg.addColorStop(1, '#16181c');
    g.fillStyle = rg; g.fillRect(0, devY, W, 160);
    // tamburdaki yükler
    for (let x = 30; x < W; x += 60) {
      if (x > gap0 && x < gap1) continue;
      glowDot(g, x, drumY + 26, 26, '88,199,255', .25); minus(g, x, drumY + 26, 30, C.charge, 1);
    }
    text(g, 'yüklü', 180, drumY - 60, { size: 34, weight: 300, color: C.charge, alpha: .9 });
    text(g, 'ışığın boşalttığı yer', (gap0 + gap1) / 2, drumY - 60, { size: 34, weight: 300, align: 'center', color: '#ffd9b0', alpha: sramp(t, tw('Işığın') - .3, tw('Işığın') + .4) });
    text(g, 'yüklü', W - 180, drumY - 60, { size: 34, weight: 300, align: 'right', color: C.charge, alpha: .9 });
    text(g, 'geliştirme silindiri', 60, devY + 110, { size: 30, color: 'rgba(236,232,223,.7)' });
    // tanecikler
    const chargeK = sramp(t, tw('elektrikle') - .3, tw('yüklü') + .2);
    const pushT = tw('Tamburun') - .1, acceptT = tw('kabul') - .6;
    for (const p of dev) {
      const x = 40 + p.x * (W - 80);
      const y0 = devY - 16 - p.row * 30;
      const r = 20 * p.s;
      const inGap = x > gap0 + 10 && x < gap1 - 10;
      let y = y0;
      if (!inGap) {
        // zıplar, itilir, geri düşer
        const k = ramp(t, pushT + p.d * 1.2, pushT + p.d * 1.2 + 1.3);
        y = y0 - Math.sin(k * PI) * 240;
        if (k > 0 && k < 1 && k > .35 && k < .65) {
          g.strokeStyle = 'rgba(88,199,255,.5)'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(x, y - r - 8); g.lineTo(x, y - r - 40); g.moveTo(x - 8, y - r - 18); g.lineTo(x, y - r - 8); g.lineTo(x + 8, y - r - 18); g.stroke();
        }
      } else {
        const k = eramp(t, acceptT + p.d * 1.6, acceptT + p.d * 1.6 + .9, easeIO);
        const stackY = drumY + r + 2 + (p.row * 22 + p.d * 14);
        y = lerp(y0, stackY, k);
      }
      tonerBall(g, x, y, r, { rim: .5, hi: '#7a7e88' });
      if (chargeK > 0) minus(g, x, y, r * 1.1, '#9fdcff', chargeK);
    }
    const kt = win(t, tw('Toz', 1) - .1, tw('Şimdi') + .5, .4, .4);
    revealText(g, 'toz, lazerin çizdiği yere tutunur', W / 2, H - 70, kt * eramp(t, tw('Toz', 1) - .1, tw('tutunuyor') + .3), { size: 44, weight: 300, align: 'center' });
    const ki = win(t, tw('Tamburun') - .2, tw('Işığın') + .2, .4, .4);
    if (ki > 0) text(g, 'aynı yükler birbirini iter', W / 2, H - 70, { size: 44, weight: 300, align: 'center', color: C.charge, alpha: ki });
  }, { fi: .5, fo: .5 });

  // ---- 5C: aktarma (kesit) ve kâğıtta gevşek toz
  const V = 26;   // bu sahnede kâğıt hızı (mm/sn)
  const tSheet = tw('Şimdi') - 1.2;
  const headAt = t => S_TRANSFER - 60 + Math.max(0, t - tSheet) * V;
  const drumAngAt = t => Math.max(0, t - tSheet) * V / M.drum.r;
  const transferInfo = t => a => {
    // tonerli yüzey: geliştirme noktasından (0) aktarma noktasına (π/2) kadar; kâğıt geldikten sonra aktarılır
    const d = ((a - M.devA) % TAU + TAU) % TAU;
    const toner = d < PI / 2 ? (hash1(Math.floor(a * 60)) > .35 ? .95 : 0) : 0;
    const charge = d > PI * 1.2 || d < PI / 2 ? (toner > 0 ? 0 : 1) : 0;
    return { charge: charge * .8, toner };
  };
  const camT = [
    [tSheet, 240, 145, 11],
    [tw('Arkasından') + .2, 232, 158, 17, 1.5],
    [tw('çekiyor') + .4, 232, 158, 17],
  ];
  scene(tw('Şimdi') - .4, tw('Yaz') + .3, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camT, t);
    applyCam(g, cam);
    const tp = win(t, tw('Arkasından') - .2, tw('Yaz') + .5, .4, .4);
    drawMachine(g, { t, drumAng: drumAngAt(t), rollerAng: drumAngAt(t) * 1.4, heat: .6, heads: [{ s: headAt(t), o: {} }], drumInfo: transferInfo(t), chargeAlpha: .8, hl: { transfer: tp } });
    // aktarma silindirindeki artı yük
    if (tp > 0) {
      for (let i = 0; i < 9; i++) {
        const a = -PI * .85 + i * PI * .7 / 8;
        plus(g, M.transfer.x + Math.cos(a) * (M.transfer.r + 1.4), M.transfer.y + Math.sin(a) * (M.transfer.r + 1.4), 1.3, '#ffb86b', tp);
      }
      // sıçrayan tanecikler (tamburdan kâğıda)
      const jk = sramp(t, tw('tozu', 1) - .3, tw('tozu', 1) + .2);
      if (jk > 0) for (let i = 0; i < 14; i++) {
        const ph = fract(t * 1.6 + hash1(i));
        const x = M.drum.x - 2.5 + hash1(i + 4) * 5, y = lerp(M.drum.y + M.drum.r + .4, 153.2, ph);
        g.fillStyle = `rgba(10,10,12,${jk})`; g.beginPath(); g.arc(x - ph * 1.5, y, .45, 0, TAU); g.fill();
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (tp > 0) {
      const [px, py] = w2s(cam, M.transfer.x + 6, M.transfer.y + 8);
      label(g, px, py, px + 260, py + 150, 'aktarma silindiri: daha güçlü, zıt yük', tp, { size: 32, side: 1 });
    }
    const kk = win(t, tw('kağıt') - .2, tw('Arkasından') + .3, .3, .4);
    if (kk > 0) { const [px, py] = w2s(cam, M.drum.x + 50, 154); label(g, px, py, px + 120, py - 190, 'kâğıt', kk, { size: 34, side: 1 }); }
  }, { fi: .5, fo: .5 });

  // kâğıtta gevşek toz ve parmak izi
  scene(tw('Yaz') - .2, tw('Onu') + .5, (g, t) => {
    deskBg(g, .15);
    const s = 16, cx = 70, cy = 38;
    const cr = pageCorners(W / 2, H / 2 + 40, s, -.03, cx, cy);
    pageShadow(g, cr, .5, 40, 16);
    drawPage(g, cr, { powder: 1 });
    // sürtme izi
    const sk = eramp(t, tw('parmağınızı') - .1, tw('dağılır') + .3, easeIO);
    if (sk > 0) {
      const x0 = 420, x1 = 1600, y = 600;
      const xe = lerp(x0, x1, sk);
      g.save();
      g.globalCompositeOperation = 'source-over';
      // silinen toz: kâğıt rengi, uçlarda saydam
      const eg = g.createLinearGradient(x0, 0, xe, 0);
      eg.addColorStop(0, 'rgba(236,230,217,.0)'); eg.addColorStop(.12, 'rgba(236,230,217,.92)'); eg.addColorStop(1, 'rgba(236,230,217,.8)');
      g.fillStyle = eg; g.beginPath(); g.ellipse((x0 + xe) / 2, y, (xe - x0) / 2 + 1, 95, -.03, 0, TAU); g.fill();
      // sürüklenen gri toz
      g.globalCompositeOperation = 'multiply';
      const sg = g.createLinearGradient(x0, 0, xe + 60, 0);
      sg.addColorStop(0, 'rgba(120,120,125,0)'); sg.addColorStop(.5, 'rgba(110,110,115,.7)'); sg.addColorStop(1, 'rgba(50,50,55,.95)');
      g.fillStyle = sg; g.filter = 'blur(6px)';
      g.beginPath(); g.ellipse((x0 + xe) / 2 + 30, y + 4, (xe - x0) / 2 + 30, 80, -.03, 0, TAU); g.fill();
      g.filter = 'none';
      g.restore();
    }
    { const bb = g.createLinearGradient(0, H - 200, 0, H); bb.addColorStop(0, 'rgba(0,0,0,0)'); bb.addColorStop(1, 'rgba(0,0,0,.75)'); g.fillStyle = bb; g.fillRect(0, H - 200, W, 200); }
    revealText(g, sk > .05 ? 'parmakla sürülünce dağılır' : 'yazı kâğıtta, ama henüz yalnızca toz', W / 2, H - 80, eramp(t, tw('Yaz') - .1, tw('kağıtta') + .4), { size: 44, weight: 300, align: 'center', shadow: 'rgba(0,0,0,.9)' });
  }, { fi: .4, fo: .5 });

  // ---- 5D: ısıtıcı ve erime
  const tF = tw('Onu') - .6;
  const headF = t => S_FUSER - 40 + Math.max(0, t - tF) * 14;
  const camF = [
    [tF, 150, 150, 9],
    [tw('arası') + .2, 124, 154, 17, 1.8],
  ];
  scene(tw('Onu') - .3, tw('Plastik', 1) + .2, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camF, t);
    applyCam(g, cam);
    const heat = .6 + .4 * sramp(t, tw('Biri') - .3, tw('200') + .4) + .05 * Math.sin(t * 6);
    drawMachine(g, { t, drumAng: t * .6, rollerAng: (t - tF) * 14 / M.heat.r, heat, heads: [{ s: headF(t), o: { allToner: true, glow: sramp(t, tw('Biri'), tw('Biri') + 1) * .15 } }], hl: { fuser: win(t, tw('iki') - .3, tw('Plastik', 1), .4, .4) } });
    g.setTransform(1, 0, 0, 1, 0, 0);
    const kl = win(t, tw('iki') - .2, tw('Plastik', 1) + .3, .4, .4);
    if (kl > 0) {
      const [ax, ay] = w2s(cam, M.heat.x - 9, M.heat.y - 6);
      label(g, ax, ay, Math.max(440, ax - 300), ay - 170, 'ısıtma silindiri', kl, { size: 34 });
      const [bx, by] = w2s(cam, M.press.x - 9, M.press.y + 6);
      label(g, bx, by, Math.max(440, bx - 300), by + 170, 'baskı silindiri', kl, { size: 34 });
    }
    const kt = win(t, tw('Biri') - .2, tw('Plastik', 1) + .3, .4, .4);
    if (kt > 0) {
      const [px, py] = w2s(cam, M.heat.x + 10, M.heat.y - 10);
      revealText(g, '≈ 200 °C', px + 140, py - 90, eramp(t, tw('200') - .3, tw('dereceye') + .3), { size: 90, weight: 200, color: '#ffb070', shadow: 'rgba(0,0,0,.8)' });
      text(g, 'iki yüz dereceye yakın', px + 146, py - 36, { size: 28, weight: 400, color: C.dim, alpha: kt * sramp(t, tw('yakın') - .3, tw('yakın') + .3) });
    }
  }, { fi: .5, fo: .5 });

  // erime yakın çekimi (yan kesit): tanecikler yumuşar, liflere işler, donar
  const fib = (() => { const r = mulberry(31); const a = []; for (let i = 0; i < 70; i++) a.push({ x: r() * W, y: 640 + r() * 360, rx: 60 + r() * 140, ry: 14 + r() * 16, a: (r() - .5) * .5, c: r() }); return a; })();
  const grainsF = (() => { const r = mulberry(12); const a = []; for (let i = 0; i < 90; i++) a.push({ x: 360 + r() * 1200, y: 628 - r() * 60, r: 16 + r() * 12 }); return a; })();
  scene(tw('Plastik', 1) - .3, tw('Tambur') + .4, (g, t) => {
    const mb = g.createLinearGradient(0, 0, 0, H); mb.addColorStop(0, '#3a332c'); mb.addColorStop(1, '#1a1612');
    g.fillStyle = mb; g.fillRect(0, 0, W, H);
    const melt = eramp(t, tw('eriyor') - .4, tw('liflerine') + .3);
    const sink = eramp(t, tw('liflerine') - .2, tw('işliyor') + .4);
    const freeze = sramp(t, tw('donuyor') - .3, tw('donuyor') + .4);
    const heat = win(t, tw('Plastik', 1) - .3, tw('donuyor') + .2, .5, .8);
    // ısı ışıması
    if (heat > 0) {
      const hg = g.createLinearGradient(0, 0, 0, 700);
      hg.addColorStop(0, `rgba(255,120,40,${.25 * heat})`); hg.addColorStop(1, 'rgba(255,120,40,0)');
      g.fillStyle = hg; g.fillRect(0, 0, W, 700);
    }
    // lifler
    for (const f of fib) {
      const c = 150 + f.c * 60;
      g.save(); g.translate(f.x, f.y); g.rotate(f.a);
      const fg = g.createLinearGradient(0, -f.ry, 0, f.ry);
      fg.addColorStop(0, `rgb(${c + 40},${c + 34},${c + 20})`); fg.addColorStop(1, `rgb(${c - 50},${c - 56},${c - 70})`);
      g.fillStyle = fg; g.beginPath(); g.ellipse(0, 0, f.rx, f.ry, 0, 0, TAU); g.fill();
      g.restore();
    }
    // toner: önce ayrı tanecikler, sonra kaynaşmış tabaka
    g.save();
    g.fillStyle = '#0b0b0d';
    for (const p of grainsF) {
      const r = p.r * (1 + melt * .7), ry = p.r * (1 - melt * .5);
      const y = p.y + melt * 22 + sink * 40;
      g.beginPath(); g.ellipse(p.x, y, r, ry, 0, 0, TAU); g.fill();
    }
    if (melt > 0) {
      g.globalAlpha = sramp(melt, .3, 1);
      const top = 612 + melt * 16 + sink * 40, bot = 650 + sink * 60;
      g.beginPath(); g.moveTo(360, top + 10);
      for (let x = 360; x <= 1560; x += 20) g.lineTo(x, top + Math.sin(x * .013) * 5);
      for (let x = 1560; x >= 360; x -= 20) g.lineTo(x, bot + sink * 30 * vnoise(x * .02 + 3));
      g.closePath(); g.fill();
    }
    g.restore();
    // tanecik parıltıları / donmuş yüzeyin parlaklığı
    if (melt < .5) for (const p of grainsF) { const y = p.y + melt * 22; g.fillStyle = `rgba(200,210,230,${.35 * (1 - melt * 2)})`; g.beginPath(); g.arc(p.x - p.r * .35, y - p.r * .4, p.r * .22, 0, TAU); g.fill(); }
    if (freeze > 0) { g.strokeStyle = `rgba(210,220,240,${.35 * freeze})`; g.lineWidth = 3; g.beginPath(); for (let x = 380; x < 1540; x += 30) g.lineTo(x, 596 + sink * 44 + melt * 18 - 8 + Math.sin(x * .02) * 3); g.stroke(); }
    revealText(g, 'plastik erir', 150, 170, eramp(t, tw('Plastik', 1) - .1, tw('eriyor') + .4), { size: 50, weight: 300, color: '#ffb070' });
    revealText(g, 'kâğıdın liflerine işler', 150, 240, eramp(t, tw('kağıdın') - .1, tw('işliyor') + .4), { size: 50, weight: 300 });
    revealText(g, 've orada donar', 150, 310, eramp(t, tw('ve') - .1, tw('donuyor') + .4), { size: 50, weight: 300, color: '#bcd6ff' });
    text(g, 'kâğıt lifleri', W - 150, H - 80, { size: 30, align: 'right', color: C.dim });
    const kb = win(t, tw('Baştaki') - .2, tw('Tambur') + .4, .4, .3);
    if (kb > 0) revealText(g, 'baştaki sıcaklık buradan', W - 150, 170, kb * eramp(t, tw('Baştaki') - .2, tw('geliyor', 1) + .3), { size: 50, weight: 300, align: 'right', color: '#ffb070' });
  }, { fi: .5, fo: .5 });

  // ---- 5E: temizleme, yeniden yükleme; döngü
  const tC = tw('Tambur') - .4;
  const camE = [
    [tC, 212, 128, 14],
    [tw('yükleniyor') + .1, 212, 128, 14],
    [tw('hazır') + .2, 222, 148, 3.3, 1.8],
  ];
  const stations = [
    ['1', 'yükleme', () => [M.charge.x - 12, M.charge.y - 12]],
    ['2', 'lazer', () => [M.drum.x, M.lsu.y + M.lsu.h - 8]],
    ['3', 'geliştirme', () => [M.dev.x + 30, M.dev.y - 40]],
    ['4', 'aktarma', () => [M.transfer.x + 16, M.transfer.y + 10]],
    ['5', 'ısıtma', () => [M.heat.x - 26, M.heat.y + 12]],
    ['6', 'temizleme', () => [188, 150]],
  ];
  scene(tw('Tambur') - .5, lineEnd(A) + 1.4, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camE, t);
    applyCam(g, cam);
    const ang = (t - tC) * .8;
    const clean = t - tC;
    const info = a => {
      const since = ((a - M.cleanA) % TAU + TAU) % TAU;           // temizlemeden geçeli
      const passed = since <= ang;
      const toner = !passed && (((a - M.transferA) % TAU + TAU) % TAU) < (M.cleanA - M.transferA) ? (hash1(Math.floor(a * 50)) > .75 ? .6 : 0) : 0;
      const charged = ((a - M.chargeA) % TAU + TAU) % TAU <= Math.max(0, ang - (M.chargeA - M.cleanA));
      return { charge: charged ? 1 : 0, toner };
    };
    drawMachine(g, { t, drumAng: ang, rollerAng: ang * 1.4, heat: .5, drumInfo: info, hl: { clean: win(t, tw('temizleniyor') - .3, tw('yeniden') + .2, .3, .4), charge: win(t, tw('yeniden') - .2, (tw('sonraki') - .1) + .2, .3, .4) } });
    // bıçaktan dökülen tozlar
    const fk = win(t, tw('temizleniyor') - .4, (tw('sonraki') - .1), .3, .4);
    if (fk > 0) for (let i = 0; i < 16; i++) {
      const ph = fract(t * 1.3 + hash1(i));
      const x = 199 - ph * 6 + hash1(i + 3) * 3, y = 136 + ph * 10;
      g.fillStyle = `rgba(8,8,10,${fk * (1 - ph)})`; g.beginPath(); g.arc(x, y, .35, 0, TAU); g.fill();
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const kc = win(t, tw('temizleniyor') - .3, tw('yeniden') + .4, .3, .4);
    if (kc > 0) { const [px, py] = w2s(cam, 196, 140); label(g, px, py, px - 260, py + 200, 'temizleme bıçağı', kc, { size: 34 }); }
    const kr = win(t, tw('yeniden') - .2, (tw('sonraki') - .1) + .4, .3, .4);
    if (kr > 0) { const [px, py] = w2s(cam, M.charge.x - 6, M.charge.y - 6); label(g, px, py, px - 260, py - 170, 'yeniden yükleme', kr, { size: 34 }); }
    // döngü: istasyon numaraları sırayla yanar
    const ks = sramp(t, (tw('sonraki') - .1) - .2, tw('hazır') + .2);
    if (ks > 0) stations.forEach(([n, name, pos], i) => {
      const k = clamp(ks * 7 - i);
      if (k <= 0) return;
      const [wx, wy] = pos(); const [x, y] = w2s(cam, wx, wy);
      g.save(); g.globalAlpha = k;
      g.fillStyle = 'rgba(232,179,90,.95)'; g.beginPath(); g.arc(x, y, 22, 0, TAU); g.fill();
      text(g, n, x, y + 8, { size: 24, weight: 700, align: 'center', color: '#15110a' });
      text(g, name, x, y + 50, { size: 24, weight: 500, align: 'center', color: C.text, shadow: 'rgba(0,0,0,.9)' });
      g.restore();
    });
  }, { fi: .5, fo: .6 });
}
