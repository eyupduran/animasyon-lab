// ---------------------------------------------------------------------------------------------
// 4. Lazer: sayfa noktalar haritasına döner; sabit bir lazer, dönen çokgen aynayla tamburu satır
// satır tarar; ışığın değdiği yerde yük boşalır: görünmez bir yazı.
// ---------------------------------------------------------------------------------------------
{
  const A = '04-lazer';
  const tw = (w, n) => T(A, w, n);

  // harf ızgarası: "a" (Georgia), GN x GN hücre
  const GN = 24;
  const GLYPH = (() => {
    const c = makeCanvas(GN * 20, GN * 20), g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = `400 ${GN * 20 * 1.12}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.fillText('a', GN * 10, GN * 20 * .9);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    const cells = [];
    for (let j = 0; j < GN; j++) { cells.push([]); for (let i = 0; i < GN; i++) {
      let s = 0; for (let y = 0; y < 20; y += 2) for (let x = 0; x < 20; x += 2) s += d[((j * 20 + y) * c.width + i * 20 + x) * 4];
      cells[j].push(s / 100 / 255 > .45 ? 1 : 0);
    } }
    const dark = makeCanvas(c.width, c.height), dg = dark.getContext('2d');
    dg.drawImage(c, 0, 0); dg.globalCompositeOperation = 'source-in'; dg.fillStyle = '#141418'; dg.fillRect(0, 0, c.width, c.height);
    return { c, dark, cells };
  })();

  globalThis.GLYPH_A = GLYPH;
  // ---- 4A: sayfa → harf → noktalar haritası
  const aHead = (() => { const g = TEXT_MASK_CANVAS.getContext('2d'); g.font = `700 ${15.5 * DPMM}px ${SERIF}`; return { x: 18 - .6 + g.measureText('Işıkl').width / DPMM + g.measureText('a').width / DPMM / 2, y: 43 - 3.6 }; })();
  scene(S[A] - .6, tw('Bu') + .6, (g, t) => {
    const kPage = 1 - sramp(t, tw('noktalar') - .6, tw('noktalar') + .1);
    const grid = sramp(t, tw('noktalar') - .3, tw('haritasına') + .4);
    if (kPage > 0) {
      deskBg(g, .1);
      const z = Math.exp(lerp(Math.log(2.6), Math.log(60), eramp(t, S[A] + .2, tw('noktalar') + .1, easeI)));
      const cx = lerp(105, aHead.x, eramp(t, S[A] + .2, tw('noktalar') - .5));
      const cy = lerp(148.5, aHead.y, eramp(t, S[A] + .2, tw('noktalar') - .5));
      const cr = pageCorners(W / 2, H / 2, z, 0, cx, cy);
      pageShadow(g, cr, .5, 40, 14);
      drawPage(g, cr, { alpha: 1 });
      text(g, 'bilgisayardan gelen sayfa', W / 2, H - 90, { size: 30, weight: 300, align: 'center', alpha: win(t, S[A] + .3, tw('noktalar') - .8, .5, .4), shadow: 'rgba(0,0,0,.9)' });
    }
    if (kPage < 1) {
      g.save(); g.globalAlpha = 1 - kPage;
      g.fillStyle = '#efe9dc'; g.fillRect(0, 0, W, H);
      const cs = 36, gx = W / 2 - GN * cs / 2, gy = H / 2 - GN * cs / 2 + 10;
      const fill = eramp(t, tw('harf') - .1, tw('boş') + .2);
      const outline = 1 - sramp(t, tw('ibaret') - .2, tw('ibaret') + .6);
      // dolu hücreler: yukarıdan aşağı dolar
      for (let j = 0; j < GN; j++) for (let i = 0; i < GN; i++) {
        const on = GLYPH.cells[j][i];
        const k = clamp(fill * (GN + 6) - j - (i % 3) * .2);
        if (on && k > 0) { g.fillStyle = `rgba(16,16,19,${k})`; g.fillRect(gx + i * cs + 1, gy + j * cs + 1, cs - 2, cs - 2); }
        if (!on && k > 0 && t > tw('boş') - .3 && t < tw('ibaret') + .8) { g.fillStyle = `rgba(40,90,160,${.10 * win(t, tw('boş') - .3, tw('ibaret') + .8, .3, .4)})`; g.fillRect(gx + i * cs + 1, gy + j * cs + 1, cs - 2, cs - 2); }
      }
      // yumuşak harf silueti
      if (outline > 0) {
        g.save(); g.globalAlpha = outline * (fill > 0 ? .3 : .92);
        g.drawImage(GLYPH.dark, gx, gy, GN * cs, GN * cs);
        g.restore();
      }
      // ızgara
      g.strokeStyle = `rgba(60,70,85,${.35 * grid})`; g.lineWidth = 1;
      g.beginPath();
      for (let i = 0; i <= GN; i++) { g.moveTo(gx + i * cs, gy); g.lineTo(gx + i * cs, gy + GN * cs); g.moveTo(gx, gy + i * cs); g.lineTo(gx + GN * cs, gy + i * cs); }
      g.stroke();
      // etiketler
      const lk = win(t, tw('dolu') - .2, tw('inçte') - .2, .3, .5);
      if (lk > 0) {
        text(g, 'dolu: toner', gx - 60, gy + 300, { size: 38, weight: 400, align: 'right', color: '#16161a', alpha: sramp(t, tw('dolu') - .2, tw('dolu') + .3) * lk });
        text(g, 'boş: kâğıt', gx - 60, gy + 360, { size: 38, weight: 400, align: 'right', color: '#44607f', alpha: sramp(t, tw('boş') - .2, tw('boş') + .3) * lk });
      }
      const dk = win(t, tw('inçte') - .3, tw('Bu') + 1, .4, .5);
      if (dk > 0) {
        revealText(g, '600 nokta / inç', gx + GN * cs + 70, gy + 330, eramp(t, tw('inçte') - .3, tw('600') + .4), { size: 56, weight: 300, color: '#16161a' });
        text(g, '1 inç = 25,4 mm', gx + GN * cs + 70, gy + 390, { size: 30, color: '#55504a', alpha: dk * sramp(t, tw('600') + .1, tw('600') + .6) });
        text(g, 'bir nokta ≈ 0,04 mm', gx + GN * cs + 70, gy + 436, { size: 30, color: '#55504a', alpha: dk * sramp(t, tw('600') + .3, tw('600') + .9) });
      }
      g.restore();
    }
  }, { fi: .6, fo: .6 });

  // ---- 4B: lazer tarayıcı: sabit diyot, dönen ayna, tambur üstünde satırlar
  const tSlow = tw('Her') - .2, tSlowEnd = tw('süpürüyor') + .4;
  const tFast = tw('Lazer', 2) - .3;
  // tarama evresi (0..1 bir satır içinde) ve yazılan satır sayısı
  function scanState(t) {
    if (t < tSlow) return { u: -1, lines: 0 };
    if (t < tSlowEnd) return { u: ramp(t, tSlow + .4, tSlowEnd - .2), lines: 0 };
    const t2 = tw('satır', 1) - .3;           // ikinci satır
    if (t < t2) return { u: -1, lines: 1 };
    if (t < t2 + .9) return { u: ramp(t, t2, t2 + .8), lines: 1 };
    if (t < tFast) return { u: -1, lines: 2 };
    const rate = lerp(1.4, 9, sramp(t, tFast, tFast + 2.5));   // satır / saniye (gösterim hızı)
    const n = (t - tFast) * rate + .5 * (t - tFast) * (rate - 1.4) * 0;
    return { u: fract(n), lines: 2 + Math.floor(n), fast: sramp(t, tFast, tFast + 2.5) };
  }
  const LINE_V = 8;   // bir satırın dokudaki yüksekliği (gösterim için kalın)
  scene(tw('Bu') - .4, tw('Lazer', 2) + 2.4, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const st = scanState(t);
    // tambur
    const R = 170, len = 1360, dx = (W - len) / 2 - 40, dy = 690;
    const aw = -PI / 2 + .45;                                              // yazma çizgisinin açısı
    const rot = TAU * (TEXT_V0 + 420 - st.lines * LINE_V) / UT_H - aw;     // yazılan satır bu açıda
    paintUT({ latentShow: .9, written: st.lines * LINE_V, fromBottom: true });
    drawCylinder(g, dx, dy, len, R, rot);
    const writeY = dy + R + R * Math.sin(-PI / 2 - .45 + .0) ; // yazma çizgisi
    const wy = dy + R - R * Math.cos(.45);
    // mercek çubuğu
    g.save();
    const lensY = 470;
    g.fillStyle = 'rgba(150,200,240,.16)'; g.strokeStyle = 'rgba(190,225,250,.55)'; g.lineWidth = 2;
    rrect(g, dx + 60, lensY - 16, len - 120, 32, 16); g.fill(); g.stroke();
    g.restore();
    // çokgen ayna (altıgen prizma, yukarıdan eğik bakış)
    const mx = W / 2 - 40, my = 230, mr = 105;
    const spin = st.u >= 0 ? st.u * TAU / 6 : 0;
    const polyA = (st.fast ? (t * 40) : 0) + spin + (st.lines) * TAU / 6;
    g.save();
    // gövde
    g.fillStyle = '#1b2026'; g.beginPath(); g.ellipse(mx, my + 56, mr * 1.05, mr * .42, 0, 0, TAU); g.fill();
    const pts = [];
    for (let i = 0; i < 6; i++) { const a = polyA + i * TAU / 6; pts.push([mx + Math.cos(a) * mr, my + Math.sin(a) * mr * .4]); }
    for (let i = 0; i < 6; i++) {
      const p = pts[i], q = pts[(i + 1) % 6];
      const nz = Math.sin(polyA + (i + .5) * TAU / 6);
      if (nz < 0) continue;
      const shade = .35 + .65 * nz;
      const fg = g.createLinearGradient(p[0], p[1], q[0], q[1]);
      fg.addColorStop(0, `rgba(${200 * shade},${212 * shade},${226 * shade},1)`); fg.addColorStop(1, `rgba(${150 * shade},${160 * shade},${175 * shade},1)`);
      g.fillStyle = fg; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.lineTo(q[0], q[1] + 48); g.lineTo(p[0], p[1] + 48); g.closePath(); g.fill();
    }
    g.fillStyle = '#cfd7e0'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill();
    g.fillStyle = '#39414b'; g.beginPath(); g.ellipse(mx, my, 12, 5, 0, 0, TAU); g.fill();
    g.restore();
    // diyot
    const lx = 1560, ly = 238;
    g.fillStyle = '#2a3038'; rrect(g, lx - 10, ly - 26, 90, 52, 8); g.fill();
    g.fillStyle = '#c9a15a'; g.fillRect(lx - 16, ly - 7, 10, 14);
    // ışın
    const on = st.u >= 0;
    if (on) {
      const bx = dx + 40 + st.u * (len - 80);
      const blink = st.fast ? (hash1(Math.floor(t * 240)) > .35 ? 1 : .15) : 1;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      const path = [[lx - 16, ly], [mx + 20, my + 10], [lerp(mx, bx, .55), lensY], [bx, wy]];
      for (const [w, al] of [[16, .08], [6, .25], [2, 1]]) {
        g.strokeStyle = `rgba(255,40,60,${al * blink})`; g.lineWidth = w;
        g.beginPath(); path.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
      }
      glowDot(g, bx, wy, 60, '255,50,70', .9 * blink);
      // tarama izi
      g.strokeStyle = 'rgba(255,80,90,.55)'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(dx + 40, wy); g.lineTo(bx, wy); g.stroke();
      // hızlı taramada yelpaze
      if (st.fast > 0) {
        const fg = g.createLinearGradient(0, my, 0, wy);
        fg.addColorStop(0, `rgba(255,40,60,${.10 * st.fast})`); fg.addColorStop(1, `rgba(255,40,60,${.03 * st.fast})`);
        g.fillStyle = fg; g.beginPath(); g.moveTo(mx, my + 10); g.lineTo(dx + len - 40, wy); g.lineTo(dx + 40, wy); g.closePath(); g.fill();
      }
      g.restore();
    } else {
      glowDot(g, lx - 16, ly, 30, '255,50,70', .4);
    }
    // etiketler
    const k1 = win(t, tw('lazer') - .2, tw('Hareket') + .3, .4, .5);
    if (k1 > 0) label(g, lx + 30, ly + 30, lx - 40, ly + 170, 'lazer: yerinden kıpırdamaz', k1, { size: 34, side: -1 });
    const k2 = win(t, tw('Hareket') - .1, (tw('satır') - .15) + 0, .4, .5);
    if (k2 > 0) label(g, mx - 60, my + 30, mx - 380, my + 150, 'dönen çok yüzlü ayna', k2, { size: 34, side: -1 });
    const k3 = win(t, (tw('satır') - .15) - .1, tw('Lazer', 2) + .4, .3, .4);
    if (k3 > 0) {
      text(g, st.lines >= 2 ? 'bir satır daha' : 'bir satır', dx + 40, wy - 40, { size: 36, weight: 300, alpha: k3, shadow: 'rgba(0,0,0,.9)' });
    }
    const k4 = win(t, tw('tambur') - .3, tw('dönüyor') + .8, .3, .4);
    if (k4 > 0) text(g, '↓ tambur azıcık döner', dx + len - 40, dy + 2 * R + 60, { size: 30, weight: 300, align: 'right', alpha: k4, color: C.dim });
  }, { fi: .5, fo: .6 });

  // ---- 4C: yakından: yanıp sönen ışık, boşalan yük
  scene(tw('Lazer', 2) + 1.8, tw('Sonunda') + .6, (g, t) => {
    g.fillStyle = '#081210'; g.fillRect(0, 0, W, H);
    const cs = 58, cols = 26, rows = 12;
    const gx = W / 2 - cols * cs / 2, gy = 250;
    const t0 = tw('Lazer', 2) + 1.8;
    const rate = 34;                     // hücre / saniye (gösterim)
    const n = (t - t0) * rate;
    const rowNow = Math.floor(n / cols), colNow = Math.floor(n % cols);
    // yeşil yüzey
    const bg = g.createLinearGradient(0, gy - 40, 0, gy + rows * cs + 40);
    bg.addColorStop(0, '#16493a'); bg.addColorStop(1, '#0f3328');
    g.fillStyle = bg; g.fillRect(gx - 40, gy - 40, cols * cs + 80, rows * cs + 80);
    // hücreler: harfin satırları (ızgaranın ortasına oturtulmuş)
    const off = Math.floor((cols - GN) / 2);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const gj = j + 8, gi = i - off;
      const on = gi >= 0 && gi < GN && gj < GN ? GLYPH.cells[gj][gi] : 0;
      const done = j < rowNow || (j === rowNow && i < colNow);
      const x = gx + i * cs + cs / 2, y = gy + j * cs + cs / 2;
      if (on && done) {
        const age = (n - (j * cols + i)) / rate;
        if (age < .25) glowDot(g, x, y, 40, '255,80,90', .7 * (1 - age / .25));
        continue;       // yük boşaldı
      }
      glowDot(g, x, y, 22, '88,199,255', .18);
      minus(g, x, y, 22, C.charge, .95);
    }
    // lazer noktası
    if (rowNow < rows) {
      const gi = colNow - off, gj = rowNow + 8;
      const on = gi >= 0 && gi < GN && gj < GN ? GLYPH.cells[gj][gi] : 0;
      const x = gx + colNow * cs + cs / 2, y = gy + rowNow * cs + cs / 2;
      g.save(); g.globalCompositeOperation = 'lighter';
      if (on) { glowDot(g, x, y, 90, '255,40,60', .95); g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 6, 0, TAU); g.fill(); }
      else { g.strokeStyle = 'rgba(255,80,90,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 18, 0, TAU); g.stroke(); }
      g.restore();
    }
    revealText(g, 'saniyede milyonlarca kez yanar, söner', W / 2, 150, eramp(t, tw('saniyede') - .2, tw('sönüyor') + .3), { size: 44, weight: 300, align: 'center' });
    const k1 = win(t, tw('Işığın') - .2, tw('Sonunda') + .5, .4, .4);
    text(g, 'ışık değdi: yük boşaldı', gx, gy + rows * cs + 90, { size: 34, weight: 400, color: '#ff9aa2', alpha: k1 });
    const k2 = win(t, (tw('değmeyen') - .3) - .2, tw('Sonunda') + .5, .4, .4);
    text(g, 'ışık değmedi: yük kaldı', gx + cols * cs, gy + rows * cs + 90, { size: 34, weight: 400, align: 'right', color: C.charge, alpha: k2 });
  }, { fi: .5, fo: .5 });

  // ---- 4D: görünmez yazı
  scene(tw('Sonunda') - .2, lineEnd(A) + 1.2, (g, t) => {
    g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
    const R = 300, len = 1500, x = (W - len) / 2 - 30, y = H / 2 - R;
    const vis = 1 - sramp(t, (tw('göremezsiniz') - .5) - .1, tw('göremezsiniz') + .2);
    const bandOn = sramp(t, tw('Yalnızca') - .3, tw('Yalnızca') + .3);
    const bx = lerp(x - 200, x + len + 200, ramp(t, tw('Yalnızca'), lineEnd(A) + .6));
    const bandUT = (bx - x) / len * UT_W;
    paintUT({ latentShow: Math.max(vis, bandOn), written: 420, bandX: vis < 1 ? bandUT : null, bandMin: vis / Math.max(vis, bandOn, 1e-3), band: X => Math.max(vis, bandOn * Math.exp(-Math.pow((X - bandUT) / 200, 2))) / Math.max(vis, bandOn, 1e-3) });
    drawCylinder(g, x, y, len, R, TAU * (TEXT_V0 + 210) / UT_H - .02);
    if (bandOn > 0) {
      g.save(); g.globalCompositeOperation = 'lighter';
      const bg = g.createLinearGradient(bx - 160, 0, bx + 160, 0);
      bg.addColorStop(0, 'rgba(88,199,255,0)'); bg.addColorStop(.5, `rgba(88,199,255,${.10 * bandOn})`); bg.addColorStop(1, 'rgba(88,199,255,0)');
      g.fillStyle = bg; g.fillRect(bx - 160, y - 20, 320, 2 * R + 40);
      g.restore();
    }
    revealText(g, 'tamburun üstünde bir yazı var', 170, 150, eramp(t, tw('Sonunda') - .1, tw('var') + .3), { size: 44, weight: 300 });
    revealText(g, 'ama görünmez: yalnızca yükten', 170, 210, eramp(t, (tw('göremezsiniz') - .5) - .1, tw('yükünden') + .3), { size: 44, weight: 300, color: C.charge });
  }, { fi: .5, fo: .8 });
}
