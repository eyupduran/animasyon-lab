// ---------------------------------------------------------------------------------------------
// 7. Fotokopi: camın altından geçen ışık çubuğu, sensör satırı, sayılar; tarayıcı + yazıcı.
// Tarih: Carlson, Astoria, 22 Ekim 1938; 1959; 1971'de lazer. Işık beyazı yazar / siyahı yazar.
// ---------------------------------------------------------------------------------------------
{
  const A = '07-fotokopi';
  const tw = (w, n) => T(A, w, n);

  // fotoğrafın ve yazının CPU kopyası (tarama grafiği için)
  const photoPix = (() => { const b = new Uint8Array(PHOTO_W * PHOTO_H * 4); gl.bindFramebuffer(gl.FRAMEBUFFER, PHOTO.fb); gl.readPixels(0, 0, PHOTO_W, PHOTO_H, gl.RGBA, gl.UNSIGNED_BYTE, b); gl.bindFramebuffer(gl.FRAMEBUFFER, null); return b; })();
  const maskPix = TEXT_MASK_CANVAS.getContext('2d').getImageData(0, 0, TEXT_MASK_CANVAS.width, TEXT_MASK_CANVAS.height).data;
  function reflect(x, y) {       // sayfanın mm noktasında yansıyan ışık (0 siyah .. 1 beyaz)
    const mw = TEXT_MASK_CANVAS.width;
    const m = maskPix[(Math.floor(y * DPMM) * mw + Math.floor(x * DPMM)) * 4] / 255;
    let r = 1 - m;
    const [px, py, pw, ph] = PHOTO_R;
    if (x > px && x < px + pw && y > py && y < py + ph) {
      const u = (x - px) / pw, v = 1 - (y - py) / ph;
      r = Math.min(r, photoPix[(Math.floor(v * (PHOTO_H - 1)) * PHOTO_W + Math.floor(u * (PHOTO_W - 1))) * 4] / 255);
    }
    return .08 + .9 * r;
  }

  // ---- 7A: camın altından tarama
  scene(S[A] - .6, tw('Sonra') + .5, (g, t) => {
    g.fillStyle = '#06080b'; g.fillRect(0, 0, W, H);
    const s = 2.95, cx = 560, cy = 545;
    const cr = pageCorners(cx, cy, s);
    const barY = lerp(-20, PH + 20, ramp(t, tw('Camın') - .3, tw('Sonra') + .3));   // mm
    const inBar = barY > 0 && barY < PH;
    // cam
    g.save();
    g.fillStyle = 'rgba(150,190,220,.06)'; g.fillRect(cx - PW * s / 2 - 40, cy - PH * s / 2 - 40, PW * s + 80, PH * s + 80);
    g.strokeStyle = 'rgba(170,210,240,.35)'; g.lineWidth = 2; g.strokeRect(cx - PW * s / 2 - 40, cy - PH * s / 2 - 40, PW * s + 80, PH * s + 80);
    g.restore();
    drawPage(g, cr, { lit: [.22, .23, .26] });
    // ışık çubuğunun aydınlattığı şerit
    if (inBar) {
      const yy = cy - PH * s / 2 + barY * s;
      g.save(); g.beginPath(); g.rect(0, yy - 70, W, 140); g.clip();
      drawPage(g, cr, { lit: [1.05, 1.03, .98] });
      g.restore();
      // yumuşak geçiş
      const fg = g.createLinearGradient(0, yy - 90, 0, yy + 90);
      fg.addColorStop(0, 'rgba(6,8,11,1)'); fg.addColorStop(.22, 'rgba(6,8,11,0)'); fg.addColorStop(.78, 'rgba(6,8,11,0)'); fg.addColorStop(1, 'rgba(6,8,11,1)');
      g.save(); g.globalAlpha = .75; g.fillStyle = fg; g.fillRect(cx - PW * s / 2, yy - 90, PW * s, 180); g.restore();
      g.save(); g.globalCompositeOperation = 'lighter';
      const bg = g.createLinearGradient(0, yy - 12, 0, yy + 12);
      bg.addColorStop(0, 'rgba(200,230,255,0)'); bg.addColorStop(.5, 'rgba(230,245,255,.8)'); bg.addColorStop(1, 'rgba(200,230,255,0)');
      g.fillStyle = bg; g.fillRect(cx - PW * s / 2 - 60, yy - 12, PW * s + 120, 24);
      g.restore();
      // sensör sırası
      const sk = sramp(t, tw('sensör') - .4, tw('sensör') + .2);
      if (sk > 0) {
        for (let i = 0; i < 64; i++) {
          const x = cx - PW * s / 2 + (i + .5) * PW * s / 64;
          const v = reflect((i + .5) * PW / 64, clamp(barY, 0, PH - 1));
          g.fillStyle = `rgba(${40 + 200 * v},${60 + 190 * v},${90 + 160 * v},${sk})`;
          g.fillRect(x - 3.5, yy + 18, 7, 12);
        }
      }
      // grafik: bu satırın parlaklığı
      const gk = sramp(t, tw('sensör') - .2, tw('okuyor') + .3);
      const gx = 1060, gy = 300, gw = 760, gh = 220;
      if (gk > 0) {
        g.save(); g.globalAlpha = gk;
        g.strokeStyle = 'rgba(236,232,223,.25)'; g.lineWidth = 1; g.strokeRect(gx, gy, gw, gh);
        g.beginPath(); g.strokeStyle = '#bfe3ff'; g.lineWidth = 2.5;
        for (let i = 0; i <= 300; i++) { const v = reflect(i / 300 * (PW - .1), clamp(barY, 0, PH - 1)); const x = gx + i / 300 * gw, y = gy + gh - v * gh; i ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.stroke();
        g.restore();
        text(g, 'bu satırdan yansıyan ışık', gx, gy - 24, { size: 28, weight: 400, color: C.dim, alpha: gk });
        text(g, 'beyaz kâğıt: çok ışık', gx + gw, gy + 28, { size: 26, align: 'right', color: '#dff2ff', alpha: gk * sramp(t, tw('Beyaz') - .2, tw('Beyaz') + .4) });
        text(g, 'siyah toz: az ışık', gx + gw, gy + gh - 12, { size: 26, align: 'right', color: '#8fa0b0', alpha: gk * sramp(t, tw('Siyah') - .2, tw('Siyah') + .4) });
      }
      // sayılar
      const nk = sramp(t, tw('Her') - .3, tw('dönüşüyor') + .2);
      if (nk > 0) {
        g.save(); g.font = font(28, 400, MONO); g.fillStyle = '#9fd0ff';
        for (let r = 0; r < 9; r++) {
          const yrow = clamp(barY - r * 3.5, 0, PH - 1);
          let line = '';
          for (let i = 0; i < 12; i++) line += String(Math.round(reflect(8 + i * 16, yrow) * 255)).padStart(4, ' ');
          g.globalAlpha = nk * (1 - r / 9);
          g.fillText(line, gx - 10, gy + gh + 70 + r * 40);
        }
        g.restore();
      }
    }
    const k0 = win(t, S[A] - .3, tw('Camın') + .3, .4, .4);
    if (k0 > 0) text(g, 'sayfa camın üstünde, yüzü aşağıda', 1060, 250, { size: 32, weight: 300, alpha: k0 });
    const k1 = win(t, tw('ışık') - .2, tw('Sayfadan') + .4, .4, .4);
    if (k1 > 0) text(g, 'ışık çubuğu', 1060, 250, { size: 36, weight: 300, alpha: k1, color: '#dff2ff' });
    const k2 = win(t, tw('Satır') - .2, tw('Beyaz') + .1, .3, .3);
    if (k2 > 0) text(g, 'satır satır', 1060, 250, { size: 36, weight: 300, alpha: k2 });
  }, { fi: .5, fo: .5 });

  // ---- 7B: tarayıcı + yazıcı
  const camB = [[tw('Sonra') - .5, 222, 110, 2.35]];
  scene(tw('Sonra') - .3, tw('Ama') + .4, (g, t) => {
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const cam = camPath(camB, t);
    applyCam(g, cam);
    // tarayıcı modülü (yazıcının üstünde)
    g.save();
    g.fillStyle = '#0e1114'; rrect(g, -6, -118, 452, 100, 12); g.fill();
    g.strokeStyle = 'rgba(160,175,190,.3)'; g.lineWidth = 1.2; rrect(g, -6, -118, 452, 100, 12); g.stroke();
    // cam ve sayfa
    g.fillStyle = 'rgba(160,200,230,.35)'; g.fillRect(40, -104, 360, 3);
    g.fillStyle = '#efe9dc'; g.fillRect(70, -106.5, 297, 1.6);
    // ışık çubuğu arabası
    const cx = 60 + 330 * fract((t - tw('Sonra')) * .35);
    g.fillStyle = '#2a3038'; g.fillRect(cx - 8, -98, 16, 10);
    glowDot(g, cx, -100, 14, '220,240,255', .8);
    // aynalar, mercek, sensör
    g.strokeStyle = 'rgba(220,240,255,.35)'; g.lineWidth = .8;
    g.beginPath(); g.moveTo(cx, -100); g.lineTo(cx, -60); g.lineTo(60, -60); g.lineTo(200, -45); g.stroke();
    g.fillStyle = 'rgba(160,200,230,.35)'; g.beginPath(); g.ellipse(200, -45, 2.5, 9, 0, 0, TAU); g.fill();
    g.fillStyle = '#39414a'; g.fillRect(250, -52, 12, 14);
    g.restore();
    drawMachine(g, { t, drumAng: t * .8, rollerAng: t * 1.2, laser: .8 + .2 * Math.sin(t * 30), heat: .7, heads: [{ s: S_TRANSFER + 40 + fract((t - tw('Sonra')) * .12) * 360, o: {} }], polyAng: t * 20 });
    // sayılar sensörden lazere akar
    const fk = win(t, tw('sayılar') - .3, tw('Ama') + .4, .4, .4);
    if (fk > 0) {
      g.font = font(5, 600, MONO);
      for (let i = 0; i < 10; i++) {
        const ph = fract((t * .5) + i / 10);
        const x = lerp(262, M.diode.x + 6, ph), y = lerp(-45, M.diode.y, ph) + Math.sin(ph * PI) * -20;
        g.fillStyle = `rgba(159,208,255,${fk * Math.sin(ph * PI)})`;
        g.fillText(String(Math.floor(hash1(i * 13 + Math.floor(t * .5)) * 255)), x, y);
      }
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    const kt = sramp(t, tw('tarayıcı') - .3, tw('tarayıcı') + .3), ky = sramp(t, tw('yazıcı') - .3, tw('yazıcı') + .3);
    const [ax, ay] = w2s(cam, 446, -68), [bx, by] = w2s(cam, 446, 150);
    if (kt > 0) { text(g, 'tarayıcı', ax + 40, ay + 14, { size: 46, weight: 300, alpha: kt, color: '#dff2ff' }); }
    if (ky > 0) { text(g, 'yazıcı', bx + 40, by + 14, { size: 46, weight: 300, alpha: ky, color: C.gold }); }
    const k0 = win(t, tw('Sonra') - .2, tw('Bugünkü') + .1, .4, .4);
    if (k0 > 0) text(g, 'sayılar lazere gider; sayfa baştan yazılır', W / 2, H - 50, { size: 34, weight: 300, align: 'center', alpha: k0 });
  }, { fi: .5, fo: .5 });

  // ---- 7C: tarih (sepya, kâğıt üstüne çizim)
  const INK = '#3a2a1a', SEP = '#d9c9a6';
  function sepiaBg(g) {
    const bg = g.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * .75);
    bg.addColorStop(0, '#e6d8b9'); bg.addColorStop(1, '#a8926b');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = .06; g.drawImage(grainTiles[0], 0, 0, W, H); g.restore();
  }
  function stext(g, s, x, y, o = {}) { text(g, s, x, y, { color: INK, ...o }); }
  const years = [1930, 1975];
  const yx = y => lerp(200, W - 200, (y - years[0]) / (years[1] - years[0]));
  function timeline(g, t, marks) {
    const ty = H - 110;
    g.strokeStyle = 'rgba(58,42,26,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(180, ty); g.lineTo(W - 180, ty); g.stroke();
    for (let y = 1930; y <= 1975; y += 5) { g.beginPath(); g.moveTo(yx(y), ty - 6); g.lineTo(yx(y), ty + 6); g.stroke(); stext(g, String(y), yx(y), ty + 36, { size: 20, align: 'center', alpha: .6 }); }
    for (const [y0, y1, k, lab] of marks) {
      if (k <= 0) continue;
      g.fillStyle = `rgba(150,40,30,${k})`;
      if (y1 > y0) g.fillRect(yx(y0), ty - 4, (yx(y1) - yx(y0)) * k, 8);
      else { g.beginPath(); g.arc(yx(y0), ty, 9 * k, 0, TAU); g.fill(); }
      stext(g, lab, yx(y0) + (y1 > y0 ? (yx(y1) - yx(y0)) / 2 : 0), ty - 22, { size: 26, weight: 600, align: 'center', alpha: k, color: '#8a2a1e' });
    }
  }
  function flame(g, x, y, s, t, seed) {
    for (let k = 0; k < 3; k++) {
      const h = s * (1 - k * .28) * (.85 + .15 * Math.sin(t * 13 + seed + k));
      g.fillStyle = ['rgba(210,90,30,.85)', 'rgba(240,160,40,.9)', 'rgba(255,235,150,.95)'][k];
      g.beginPath(); g.moveTo(x - h * .35, y);
      g.quadraticCurveTo(x - h * .4, y - h * .5, x + Math.sin(t * 9 + seed) * h * .1, y - h);
      g.quadraticCurveTo(x + h * .4, y - h * .5, x + h * .35, y); g.closePath(); g.fill();
    }
  }
  scene(tw('Ama') - .2, tw('fark') + .6, (g, t) => {
    sepiaBg(g);
    const a = tw('Ama'), bC = tw('Chester') - .3, bK = tw('Mutfağında') - .3, bA = tw('Sonunda') - .2, bR = tw('20') - .3, b59 = tw('fikirden') - .3, bX = tw('Adı', 1) - .2, b71 = tw('12') - .3;
    const tl = [
      [1930, 1940, sramp(t, tw('1930') - .3, tw('1930') + .6), '1930’lar'],
      [1938, 1938, sramp(t, tw('22') - .3, tw('22') + .5), '1938'],
      [1959, 1959, sramp(t, tw('59') - .3, tw('59') + .5), '1959'],
      [1971, 1971, sramp(t, tw('12') - .2, tw('12') + .6), '1971'],
    ];
    timeline(g, t, tl);
    // (a) önce fotokopi
    let k = win(t, a, bC, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      stext(g, 'tarih tersinden işledi', W / 2, 330, { size: 60, weight: 300, align: 'center', fam: SERIF, font: `italic 400 60px ${SERIF}` });
      const sw = eramp(t, tw('Önce') - .2, tw('vardı') + .4);
      stext(g, 'önce fotokopi', lerp(W / 2 + 260, W / 2 - 260, sw), 500, { size: 46, align: 'center', weight: 600 });
      stext(g, 'sonra lazer yazıcı', lerp(W / 2 - 260, W / 2 + 260, sw), 500, { size: 46, align: 'center', weight: 300 });
      g.restore();
    }
    // (b) Carlson: patent uzmanı, daktilo ve karbon kâğıdı
    k = win(t, bC, bK, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      stext(g, 'Chester Carlson', 200, 300, { size: 72, fam: SERIF, font: `400 72px ${SERIF}` });
      stext(g, 'patent uzmanı', 204, 360, { size: 36, weight: 300, alpha: sramp(t, tw('patent') - .3, tw('patent') + .3) });
      stext(g, 'belgelerin kopyası: daktilo ve karbon kâğıdıyla, tek tek', 204, 420, { size: 30, weight: 300, alpha: sramp(t, tw('belgelerin') - .3, tw('kopyasını') + .3) });
      // daktilo
      const dx = 1250, dy = 560;
      g.strokeStyle = INK; g.lineWidth = 3; g.fillStyle = 'rgba(58,42,26,.12)';
      rrect(g, dx - 220, dy, 440, 170, 24); g.fill(); g.stroke();
      for (let r = 0; r < 3; r++) for (let i = 0; i < 10 - r; i++) { g.beginPath(); g.arc(dx - 170 + r * 18 + i * 38, dy + 50 + r * 38, 12, 0, TAU); g.stroke(); }
      // kâğıt ve karbon
      const up = eramp(t, tw('kopyasını') - .5, tw('arıyor') + .5);
      g.fillStyle = '#f3ead6'; g.fillRect(dx - 130, dy - 200 + (1 - up) * 120, 260, 220);
      g.fillStyle = 'rgba(30,30,40,.8)'; g.fillRect(dx - 124, dy - 194 + (1 - up) * 120, 260, 6);
      g.strokeStyle = 'rgba(58,42,26,.4)'; g.lineWidth = 2;
      for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(dx - 110, dy - 160 + i * 26 + (1 - up) * 120); g.lineTo(dx + 60 + hash1(i) * 50, dy - 160 + i * 26 + (1 - up) * 120); g.stroke(); }
      g.fillStyle = 'rgba(58,42,26,.9)'; g.fillRect(dx - 240, dy - 10, 480, 18);
      g.restore();
    }
    // (c) mutfak: kükürt kaplı levha, yangınlar
    k = win(t, bK, bA, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      stext(g, 'mutfakta deneyler', 200, 300, { size: 60, fam: SERIF, font: `italic 400 60px ${SERIF}` });
      const px = W / 2 - 300, py = 480;
      g.fillStyle = '#8b8f94'; g.fillRect(px, py, 600, 300);
      g.fillStyle = '#d9c03a'; g.fillRect(px + 20, py + 20, 560, 260);
      g.strokeStyle = INK; g.lineWidth = 3; g.strokeRect(px, py, 600, 300);
      stext(g, 'kükürt kaplı çinko levha', px + 300, py + 350, { size: 32, align: 'center', weight: 400, alpha: sramp(t, tw('kükürt') - .3, tw('levhalarla') + .2) });
      const fk = sramp(t, tw('yangın') - .4, tw('yangın') + .2);
      if (fk > 0) for (let i = 0; i < 5; i++) flame(g, px + 90 + i * 110, py + 80 + (i % 2) * 120, 90 * fk, t, i * 3);
      stext(g, 'sık sık yangın', px + 660, py + 120, { size: 40, weight: 600, color: '#8a2a1e', alpha: fk });
      g.restore();
    }
    // (d) Astoria: 22 Ekim 1938, ilk kopya
    k = win(t, bA, bR, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      // tabela
      const sk = 1 - sramp(t, tw('38') - .6, tw('38') + .2);
      if (sk > 0) {
        g.globalAlpha = k * sk;
        g.fillStyle = '#1f4a34'; rrect(g, W / 2 - 360, 340, 720, 180, 14); g.fill();
        g.strokeStyle = '#efe6cf'; g.lineWidth = 5; rrect(g, W / 2 - 348, 352, 696, 156, 10); g.stroke();
        text(g, 'ASTORIA', W / 2, 450, { size: 86, weight: 700, align: 'center', color: '#efe6cf', spacing: 8 });
        text(g, 'QUEENS · NEW YORK', W / 2, 496, { size: 26, weight: 600, align: 'center', color: '#efe6cf', spacing: 4 });
        stext(g, 'bir oda kiralıyor', W / 2, 600, { size: 40, weight: 300, align: 'center', alpha: sramp(t, tw('oda') - .3, tw('oda') + .3) });
        g.globalAlpha = k;
      }
      const ck = sramp(t, tw('38') - .4, tw('38') + .3);
      if (ck > 0) {
        g.globalAlpha = k * ck;
        // cam lam
        const sx = 260, sy = 360;
        g.fillStyle = 'rgba(200,225,235,.45)'; g.strokeStyle = 'rgba(58,42,26,.6)'; g.lineWidth = 2;
        g.fillRect(sx, sy, 560, 150); g.strokeRect(sx, sy, 560, 150);
        stext(g, '10.-22.-38 ASTORIA.', sx + 280, sy + 92, { size: 52, align: 'center', fam: MONO, font: `700 52px ${MONO}` });
        stext(g, 'mürekkeple yazılmış cam lam', sx + 280, sy + 196, { size: 28, align: 'center', weight: 300 });
        // ok
        g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.moveTo(sx + 600, sy + 75); g.lineTo(sx + 740, sy + 75); g.lineTo(sx + 720, sy + 62); g.moveTo(sx + 740, sy + 75); g.lineTo(sx + 720, sy + 88); g.stroke();
        // ilk kopya: toz görüntüsü, bulanık
        const ik = sramp(t, tw('ilk') - .3, tw('alıyor') + .2);
        if (ik > 0) {
          const qx = 1060, qy = 360;
          g.globalAlpha = k * ik;
          g.fillStyle = '#efe4c4'; g.fillRect(qx, qy, 600, 150);
          g.save(); g.filter = 'blur(2.2px)';
          text(g, '10.-22.-38 ASTORIA.', qx + 300, qy + 92, { size: 52, align: 'center', color: 'rgba(40,35,30,.8)', font: `700 52px ${MONO}` });
          g.restore();
          for (let i = 0; i < 260; i++) { g.fillStyle = 'rgba(40,35,30,.35)'; g.fillRect(qx + hash1(i) * 600, qy + hash1(i + 50) * 150, 2, 2); }
          stext(g, 'ilk kserografik kopya', qx + 300, qy + 196, { size: 28, align: 'center', weight: 300 });
          // tarih ve yer
          const uk = sramp(t, tw('tarih', 1) - .3, tw('adı') + .2);
          if (uk > 0) {
            g.fillStyle = 'rgba(150,40,30,.85)';
            g.fillRect(sx + 34, sy + 108, 250 * uk, 5);
            g.fillRect(sx + 300, sy + 108, 230 * sramp(t, tw('semt') - .3, tw('adı') + .2), 5);
            stext(g, 'bir tarih', sx + 150, sy + 260, { size: 34, weight: 600, align: 'center', color: '#8a2a1e', alpha: uk });
            stext(g, 'bir semt adı', sx + 420, sy + 260, { size: 34, weight: 600, align: 'center', color: '#8a2a1e', alpha: sramp(t, tw('semt') - .3, tw('adı') + .2) });
          }
        }
      }
      g.restore();
    }
    // (e) yirmiden fazla şirket geri çevirdi
    k = win(t, bR, b59, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      for (let i = 0; i < 21; i++) {
        const x = 460 + (i % 7) * 150, y = 300 + Math.floor(i / 7) * 150;
        const ki = sramp(t, tw('20') - .3 + i * .06, tw('20') + i * .06);
        if (ki <= 0) continue;
        g.globalAlpha = k * ki;
        g.fillStyle = '#f1e6c9'; g.strokeStyle = INK; g.lineWidth = 2;
        g.fillRect(x, y, 110, 76); g.strokeRect(x, y, 110, 76);
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 55, y + 42); g.lineTo(x + 110, y); g.stroke();
        const xk = sramp(t, tw('geri') - .5 + i * .03, tw('geri') - .1 + i * .03);
        if (xk > 0) { g.strokeStyle = `rgba(150,40,30,${xk})`; g.lineWidth = 5; g.beginPath(); g.moveTo(x + 10, y + 10); g.lineTo(x + 100, y + 66); g.moveTo(x + 100, y + 10); g.lineTo(x + 10, y + 66); g.stroke(); }
      }
      g.globalAlpha = k;
      stext(g, 'yirmiden fazla şirket: “hayır”', W / 2, 800, { size: 44, weight: 400, align: 'center', alpha: sramp(t, tw('şirket') - .3, tw('geri') + .3) });
      g.restore();
    }
    // (f) 1959: otomatik fotokopi makinesi
    k = win(t, b59, bX, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      const mx = W / 2 - 380, my = 330;
      g.strokeStyle = INK; g.lineWidth = 4; g.fillStyle = 'rgba(58,42,26,.1)';
      rrect(g, mx, my + 80, 760, 360, 18); g.fill(); g.stroke();
      rrect(g, mx + 40, my + 20, 680, 70, 10); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(mx + 760, my + 300); g.lineTo(mx + 900, my + 280); g.lineTo(mx + 900, my + 300); g.lineTo(mx + 760, my + 330); g.stroke();
      for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(mx + 90 + i * 40, my + 150, 10, 0, TAU); g.stroke(); }
      stext(g, '1959', mx + 380, my + 300, { size: 110, weight: 200, align: 'center' });
      stext(g, 'ilk otomatik fotokopi makinesi tanıtılıyor (Xerox 914)', W / 2, my + 520, { size: 34, weight: 400, align: 'center', alpha: sramp(t, tw('59') - .2, tw('tanıtılıyor') + .2) });
      g.restore();
    }
    // (g) kserografi = kuru yazı
    k = win(t, bX, b71, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      const k1 = sramp(t, tw('Kuru') - .4, tw('Kuru') + .2), k2 = sramp(t, tw('yazı') - .2, tw('yazı') + .3), k3 = sramp(t, tw('Kserografi') - .3, tw('Kserografi') + .4);
      stext(g, 'ξηρός', W / 2 - 330, 400, { size: 90, align: 'center', fam: SERIF, font: `italic 400 90px ${SERIF}`, alpha: k1 });
      stext(g, 'kseros · kuru', W / 2 - 330, 460, { size: 32, align: 'center', weight: 300, alpha: k1 });
      stext(g, '+', W / 2, 400, { size: 70, align: 'center', weight: 200, alpha: k2 });
      stext(g, 'γραφή', W / 2 + 330, 400, { size: 90, align: 'center', fam: SERIF, font: `italic 400 90px ${SERIF}`, alpha: k2 });
      stext(g, 'grafi · yazı', W / 2 + 330, 460, { size: 32, align: 'center', weight: 300, alpha: k2 });
      stext(g, 'KSEROGRAFİ', W / 2, 640, { size: 100, align: 'center', weight: 300, spacing: 16, alpha: k3 });
      g.restore();
    }
    // (h) 1971: lazer fotokopi makinesinin içine
    k = win(t, b71, tw('fark') + .6, .4, .4);
    if (k > 0) {
      g.save(); g.globalAlpha = k;
      const k1 = sramp(t, tw('12') - .2, tw('sonra', 1) + .3);
      stext(g, '12 yıl sonra', 200, 290, { size: 44, weight: 300, alpha: k1 });
      stext(g, 'Gary Starkweather', 200, 370, { size: 72, fam: SERIF, font: `400 72px ${SERIF}`, alpha: sramp(t, tw('adında', 1) - .6, tw('adında', 1)) });
      stext(g, 'mühendis, Xerox', 204, 424, { size: 32, weight: 300, alpha: sramp(t, tw('mühendis') - .3, tw('mühendis') + .3) });
      const mx = 1060, my = 420;
      g.strokeStyle = INK; g.lineWidth = 4; g.fillStyle = 'rgba(58,42,26,.1)';
      rrect(g, mx, my, 560, 300, 16); g.fill(); g.stroke();
      const lk = sramp(t, tw('içine') - .4, tw('yerleştiriyor') + .2);
      if (lk > 0) {
        g.save(); g.globalAlpha = k * lk;
        g.strokeStyle = 'rgba(200,30,40,.9)'; g.lineWidth = 5; g.beginPath(); g.moveTo(mx + 520, my + 60); g.lineTo(mx + 200, my + 60); g.lineTo(mx + 200, my + 220); g.stroke();
        g.fillStyle = 'rgba(200,30,40,.9)'; g.beginPath(); g.arc(mx + 200, my + 220, 10, 0, TAU); g.fill();
        g.restore();
      }
      const ik = sramp(t, tw('İlk', 1) - .3, tw('doğuyor') + .2);
      stext(g, 'ilk lazer yazıcı, 1971', mx + 280, my + 380, { size: 40, weight: 600, align: 'center', alpha: ik, color: '#8a2a1e' });
      g.restore();
    }
  }, { fi: .6, fo: .6 });

  // ---- 7D: ışık beyazı yazar / ışık siyahı yazar
  scene(tw('fark') + .2, S['08-kopya'] + 1.4, (g, t) => {
    g.fillStyle = '#06080b'; g.fillRect(0, 0, W, H);
    const GL = globalThis.GLYPH_A;
    const cs = 23, n = 24;
    const panels = [[W / 4 + 20, 'eski fotokopi', 'ışık beyazı yazar', tw('Eski') - .2, tw('yazıyordu') - .3, false], [W * 3 / 4 - 20, 'lazer yazıcı', 'ışık siyahı yazar', tw('Lazer') - .3, tw('siyahı') - .2, true]];
    for (const [cx, name, cap, ta, tc, laser] of panels) {
      const k = sramp(t, ta, ta + .6);
      if (k <= 0) continue;
      g.save(); g.globalAlpha = k;
      const gx = cx - n * cs / 2, gy = 240;
      g.fillStyle = '#12382c'; g.fillRect(gx - 16, gy - 16, n * cs + 32, n * cs + 32);
      const lit = eramp(t, ta + .6, ta + 2.2);
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const on = GL.cells[j][i];
        const hitByLight = laser ? on : !on;
        const x = gx + i * cs + cs / 2, y = gy + j * cs + cs / 2;
        const gone = hitByLight && lit > (j / n) ;
        if (!gone) minus(g, x, y, 12, C.charge, .95);
        else if (lit < 1 && lit - j / n < .08) glowDot(g, x, y, 18, laser ? '255,60,70' : '255,240,200', .6);
      }
      // ışık tarzı
      text(g, name, cx, gy - 60, { size: 40, weight: 500, align: 'center', color: laser ? '#ff8f98' : '#ffe9c7' });
      text(g, laser ? 'lazer yalnızca yazının noktalarını boşaltır' : 'kâğıdın beyazından yansıyan ışık boşaltır', cx, gy + n * cs + 70, { size: 28, weight: 300, align: 'center', color: C.dim });
      revealText(g, cap, cx, gy + n * cs + 150, eramp(t, tc, tc + .7), { size: 50, weight: 300, align: 'center', color: laser ? '#ff8f98' : '#ffe9c7' });
      g.restore();
    }
  }, { fi: .5, fo: .8 });
}
