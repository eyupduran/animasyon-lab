// ---------------------------------------------------------------------------------------------
// 2. Kâğıt: A4'ün ölçüleri ve √2 oranı, katlama, ağırlık; kasetten tek tabakanın çekilişi.
// ---------------------------------------------------------------------------------------------
{
  const A = '02-kagit';
  const tw = (w, n) => T(A, w, n);
  const t0 = S[A];

  // düz bir kâğıt dikdörtgeni (2B), gölgeli
  function paperRect(g, x, y, w, h, o = {}) {
    g.save();
    if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 40; g.shadowOffsetY = 16; }
    const gr = g.createLinearGradient(x, y, x + w, y + h);
    gr.addColorStop(0, o.back ? '#d9d2c4' : '#f4efe4'); gr.addColorStop(1, o.back ? '#c3bba9' : '#e3dccd');
    g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.restore();
  }
  function dimLine(g, x0, y0, x1, y1, lab, k, side = -1) {
    if (k <= 0) return;
    g.save(); g.globalAlpha = clamp(k * 2);
    g.strokeStyle = C.gold; g.fillStyle = C.gold; g.lineWidth = 2;
    const mx = lerp(x0, x1, .5), my = lerp(y0, y1, .5);
    const e = easeO(clamp(k * 1.4));
    const ax = lerp(mx, x0, e), ay = lerp(my, y0, e), bx = lerp(mx, x1, e), by = lerp(my, y1, e);
    g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    const vx = x1 - x0, vy = y1 - y0, L = Math.hypot(vx, vy), nx = -vy / L * 12, ny = vx / L * 12;
    for (const [px, py] of [[ax, ay], [bx, by]]) { g.beginPath(); g.moveTo(px - nx, py - ny); g.lineTo(px + nx, py + ny); g.stroke(); }
    g.restore();
    const vert = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    text(g, lab, mx + (vert ? side * 26 : 0), my + (vert ? 12 : side * 24), { size: 40, weight: 300, align: vert ? (side < 0 ? 'right' : 'left') : 'center', color: C.text, alpha: clamp(k * 1.6 - .4) });
  }

  // ---- 2A–2C: kâğıdın kendisi
  scene(S[A] - .5, tw('Makine') + .6, (g, t) => {
    deskBg(g, .2);
    const s = 2.9, w = PW * s, h = PH * s;
    const cx = 760, cy = 540;
    const x = cx - w / 2, y = cy - h / 2;
    const fold = eramp(t, tw('Kağıdı') + .1, tw('katlayın') + .9);       // 0..1 katlama
    const turn = eramp(t, tw('katlayın') + 1.0, tw('küçük') - .1);       // katlanmış yarının dönüşü
    const nest = eramp(t, tw('küçük') - .1, tw('olur') + .4);           // A-serisi bölünmesi
    const enter = eramp(t, S[A] - .4, S[A] + 1.6);
    g.save();
    g.globalAlpha = enter;
    const lift = (1 - enter) * 120;
    if (fold <= 0) {
      const corners = pageCorners(cx, cy + lift, s, (1 - enter) * .1);
      pageShadow(g, corners, .55, 40, 16);
      drawPage(g, corners, { blank: true });
    } else if (turn <= 0) {
      // üst yarı sabit, alt yarı orta çizgi etrafında döner
      const th = fold * PI;
      paperRect(g, x, y, w, h / 2, { shadow: true });
      const fh = (h / 2) * Math.cos(th), grow = 1 + .12 * Math.sin(th);
      const my = y + h / 2;
      const back = th > PI / 2;
      const fw = w * grow;
      g.save();
      g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 30 * Math.sin(th); g.shadowOffsetY = 20 * Math.sin(th);
      const gr = g.createLinearGradient(0, my, 0, my + fh);
      const shade = .75 + .25 * Math.abs(Math.cos(th));
      gr.addColorStop(0, back ? `rgb(${210 * shade},${203 * shade},${188 * shade})` : `rgb(${244 * shade},${239 * shade},${228 * shade})`);
      gr.addColorStop(1, back ? `rgb(${190 * shade},${182 * shade},${166 * shade})` : `rgb(${226 * shade},${219 * shade},${205 * shade})`);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x, my); g.lineTo(x + w, my); g.lineTo(cx + fw / 2, my + fh); g.lineTo(cx - fw / 2, my + fh); g.closePath(); g.fill();
      g.restore();
      // katlama çizgisi
      g.strokeStyle = `rgba(120,110,95,${.5 * fold})`; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, my); g.lineTo(x + w, my); g.stroke();
    } else {
      // katlanmış A5, 90° döner ve A4'ün yanına oturur
      const a5w = w, a5h = h / 2;
      const rot = turn * PI / 2;
      const tx = lerp(cx, cx + 560, turn), ty = lerp(y + a5h / 2, cy, turn);
      // A4'ün hayali çerçevesi yerinde kalır
      g.save(); g.setLineDash([10, 10]); g.strokeStyle = `rgba(236,232,223,${.35 * (1 - nest)})`; g.lineWidth = 1.5; g.strokeRect(x, y, w, h); g.restore();
      g.save(); g.translate(tx, ty); g.rotate(rot);
      paperRect(g, -a5w / 2, -a5h / 2, a5w, a5h, { back: true });
      g.restore();
      if (turn >= 1) {
        // aynı biçim: A5 çerçevesi büyütülünce A4'e oturur
        const k = eramp(t, tw('aynı') - .2, tw('biçimde') + .6);
        if (k > 0) {
          const sc = lerp(1, Math.SQRT2, easeIO(k));
          g.save(); g.strokeStyle = `rgba(232,179,90,${.9 * (1 - nest)})`; g.lineWidth = 2;
          g.strokeRect(lerp(tx, cx, k) - a5h / 2 * sc, lerp(ty, cy, k) - a5w / 2 * sc, a5h * sc, a5w * sc); g.restore();
        }
      }
    }
    g.restore();
    // ölçüler
    const kd = win(t, tw('210') - .3, tw('Kağıdı') - .1, .6, .6);
    dimLine(g, x, y - 34, x + w, y - 34, '210 mm', kd * eramp(t, tw('210') - .3, tw('210') + .5), -1);
    dimLine(g, x - 34, y, x - 34, y + h, '297 mm', kd * eramp(t, tw('297') - .3, tw('297') + .5), -1);
    // oran
    {
      const k = win(t, tw('Garip') - .2, tw('Kağıdı') + .5, .6, .6);
      if (k > 0) {
        const X = 1310;
        revealText(g, '297 ÷ 210 = 1,414…', X, 470, eramp(t, tw('Garip') - .2, tw('Garip') + .8), { size: 60, weight: 300 });
        revealText(g, '≈ √2', X, 560, eramp(t, tw('sırları') - .1, tw('sırları') + .7), { size: 84, weight: 300, color: C.gold });
        g.save(); g.globalAlpha = k; g.fillStyle = 'rgba(0,0,0,0)'; g.restore();
        if (k < 1) { g.save(); g.globalAlpha = 1 - k; g.restore(); }
      }
    }
    // A serisi: A4 → A5 → A6 → A7 → A8
    if (nest > 0) {
      g.save();
      let rx = x, ry = y, rw = w, rh = h;
      const names = ['A4', 'A5', 'A6', 'A7', 'A8'];
      for (let i = 0; i < 5; i++) {
        const k = clamp(nest * 5 - i);
        if (k <= 0) break;
        g.strokeStyle = `rgba(232,179,90,${.85 * k})`; g.lineWidth = 2;
        g.strokeRect(rx, ry, rw, rh);
        text(g, names[i], rx + rw / 2, ry + rh / 2 + 14 * (1 - i * .12), { size: 44 - i * 7, weight: 300, align: 'center', color: C.gold, alpha: k });
        // yarıya böl
        if (i < 4) {
          if (rh > rw) { rh = rh / 2; ry = ry + rh; } else { rw = rw / 2; rx = rx + rw; }
        }
      }
      g.restore();
    }
    // ağırlık
    {
      const k = win(t, tw('Tabakanın') - .2, tw('Makine') + .6, .5, .5);
      if (k > 0) {
        const X = 1310;
        revealText(g, '≈ 5 gram', X, 420, eramp(t, tw('5') - .3, tw('5') + .5), { size: 110, weight: 200 });
        text(g, 'A0 = 1 m²  →  A4 = 1/16 m²', X, 520, { size: 32, weight: 400, color: C.dim, alpha: k * sramp(t, tw('5') + .2, tw('5') + .9) });
        text(g, '80 g/m² × 1/16 m² = 5 g', X, 570, { size: 32, weight: 400, color: C.dim, alpha: k * sramp(t, tw('5') + .5, tw('5') + 1.2) });
      }
    }
  }, { fi: .5, fo: .8 });

  // ---- 2D–2E: kasetten çekiliş
  const tPick = tw('kauçuk') - .2, tGo = tw('Tek') - .1;
  const head1 = t => {
    let h = 297;
    h += 14 * eramp(t, tPick, tw('çekiyor') + .4);                        // teker ilk ittiriş
    h += (S_TRANSFER - 30 - 311) * eramp(t, tGo, lineEnd(A) + 1.6, k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    return h;
  };
  const head2 = t => 297 + 7 * eramp(t, tw('ikinci') - .2, tw('ikinci') + .7) - 1.5 * eramp(t, tw('engelliyor'), tw('engelliyor') + .4);
  const camK = [
    [0, 300, 256, 7.2],
    [tw('Hemen') + .2, 318, 258, 11, 1.4],
    [tw('Tek') + .2, 318, 258, 11],
    [tw('içeri') + 1.2, 330, 210, 5.2, 2],
    [lineEnd(A) + .4, 222, 150, 3.3, 3],
  ];
  scene(tw('Makine') - .4, S['03-tambur'] + 1.2, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camK, t);
    applyCam(g, cam);
    const pickA = (head1(t) - 297) / M.pick.r * .5 + eramp(t, tPick, tw('çekiyor') + .4) * 1.2;
    drawMachine(g, {
      t, drumAng: t * .3, rollerAng: t * .6,
      heads: [{ s: head2(t), o: { toner: false, color: '#c9c1b1', dy: 1.4 } }, { s: head1(t), o: { toner: false } }],
      pickAng: pickA, feedAng: -pickA * 1.1, stackTop: 263.8,
      heat: .35, hl: { drum: win(t, tw('başka') - .2, lineEnd(A) + 1, .6, .8), pick: win(t, tw('kauçuk'), tw('çekiyor') + .8, .4, .4) * .8 },
    });
    g.setTransform(1, 0, 0, 1, 0, 0);
    // etiketler
    const kp = win(t, tw('kauçuk') - .1, tw('Hemen') + .4, .5, .5);
    if (kp > 0) { const [px, py] = w2s(cam, M.pick.x - 6, M.pick.y - 9); label(g, px, py, px - 220, py - 170, 'kauçuk teker', kp, { size: 32 }); }
    const ks = win(t, tw('sürtünmeli') - .1, tw('Tek') + .2, .5, .5);
    if (ks > 0) { const [px, py] = w2s(cam, 338, 268); label(g, px, py, px + 160, py + 120, 'sürtünmeli ped', ks, { size: 32, side: 1 }); }
    const k2 = win(t, tw('ikinci') + .2, tw('Tek') + .2, .4, .4);
    if (k2 > 0) { const [px, py] = w2s(cam, 330, 264); label(g, px, py, px - 380, py + 150, 'ikinci tabaka burada kalır', k2, { size: 28, color: C.dim }); }
    const kd = win(t, tw('başka') - .1, lineEnd(A) + 1.2, .6, .6);
    if (kd > 0) { const [px, py] = w2s(cam, M.drum.x - 18, M.drum.y - 18); label(g, px, py, Math.max(300, px - 240), py - 200, 'tambur', kd, { size: 34, color: C.gold }); }
  }, { fi: .8, fo: .8 });
}
