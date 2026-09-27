// ---------------------------------------------------------------------------------------------
// 8. Kopyanın kopyası: yazı neredeyse aynı, fotoğraf harelerle dolu. Neden: iki ızgara. Fotoğraf
// ayarı, sertleşen tonlar, kuşak kuşak kopyalar; yazı direnir.
// ---------------------------------------------------------------------------------------------
const moireProg = compile(`
uniform vec2 uRes;
uniform sampler2D uPhoto;
uniform vec4 uRect;
uniform float uStage;   // 0 asıl noktalar, 1 tarayıcı ızgarası + örnekleme, 2 yeniden noktalama
uniform float uP1, uA1, uGrid, uP2, uA2, uScale, uGridLines;
uniform vec2 uC;        // görüntü merkezinin fotoğraftaki yeri
float spot(vec2 p, float ang, float pitch){ vec2 q = rot(ang) * p / pitch; return (cos(6.2831853*q.x) + cos(6.2831853*q.y)) * .25 + .5; }
float gray(vec2 p){ vec2 uv = uC + p / vec2(${PHOTO_W}., ${PHOTO_H}.) * .9; return texture(uPhoto, vec2(uv.x, 1. - uv.y)).r; }
float orig(vec2 p){ return step(gray(p), spot(p, uA1, uP1)) ; }
void main(){
  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 l = sp - uRect.xy;
  if (l.x < 0. || l.y < 0. || l.x > uRect.z || l.y > uRect.w) { outColor = vec4(0.); return; }
  vec2 p = (l - uRect.zw * .5) / uScale;           // görüntü birimi (px, ölçeklenmiş)
  float mpp = 1. / uScale;
  // asıl yarım ton (kenar yumuşatmalı)
  float v = spot(p, uA1, uP1); float t = gray(p); float aa = fwidth(v) + .001;
  float ink0 = smoothstep(t - aa, t + aa, v);
  // tarayıcı: hücre ortalaması
  vec2 cell = floor(p / uGrid);
  float s = 0.;
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) s += orig((cell + (vec2(float(i), float(j)) + .5) / 4.) * uGrid);
  s /= 16.;
  // yeniden noktalama
  float v2 = spot(p, uA2, uP2); float aa2 = fwidth(v2) + .001;
  float ink2 = smoothstep(1. - s - aa2, 1. - s + aa2, v2);
  float ink = uStage < 1. ? ink0 : uStage < 2. ? mix(ink0, s, clamp(uStage - 1., 0., 1.) * 0. + .0) : ink2;
  vec3 paper = vec3(.95, .935, .9), toner = vec3(.07, .07, .08);
  vec3 col = mix(paper, toner, ink);
  if (uStage >= 1. && uStage < 2.) {
    // hücrelerin gri değeri, üstte asıl noktalar silikçe
    float k = clamp(uStage - 1., 0., 1.);
    col = mix(col, mix(paper, toner, s), k * .85);
  }
  // ızgara çizgileri
  vec2 f = abs(fract(p / uGrid) - .5);
  float gl = smoothstep(.5 - mpp * 1.2 / uGrid, .5, max(f.x, f.y));
  col = mix(col, vec3(.2, .55, .95), gl * uGridLines * .8);
  outColor = vec4(col, 1.);
}`);
{
  const A = '08-kopya';
  const tw = (w, n) => T(A, w, n);
  const COPY_X = 240;

  // ---- 8A: asıl ve kopya
  const line1 = { x: 40, y: 70.5 };
  const faceP = { x: PHOTO_R[0] + PHOTO_R[2] * .64, y: PHOTO_R[1] + PHOTO_R[3] * .5 };
  const skyP = { x: PHOTO_R[0] + PHOTO_R[2] * .2, y: PHOTO_R[1] + PHOTO_R[3] * .28 };
  const camA = [
    [S[A] - .5, COPY_X / 2, 0, 2.9],
    [tw('Yaz') + .6, COPY_X + faceP.x - 105, faceP.y - 148.5, 6.5, 1.8],
    [tw('dalgalar') + .2, COPY_X + faceP.x - 105, faceP.y - 148.5, 7.5, 1.5],
    [tw('halkalar') + .3, COPY_X + skyP.x - 105, skyP.y - 148.5, 7, 1.5],
  ];
  scene(S[A] - .5, tw('Neden') + .5, (g, t) => {
    deskBg(g, .1);
    const textCmp = win(t, tw('Yaz') - .3, tw('Ama') + .2, .4, .5);
    if (textCmp < 1) {
      let cam = camPath(camA, t);
      if (t < tw('Ama')) cam = { x: COPY_X / 2, y: 0, s: 2.9 };
      else cam = camPath(camA.map((k, i) => i === 1 ? [tw('dönmüş') + .3, k[1], k[2], k[3], 1.6] : k), t);
      const cin = eramp(t, tw('Kopya') - .4, tw('çıkıyor') + .4);
      const c0 = [W / 2 + (0 - cam.x) * cam.s, H / 2 + (0 - cam.y) * cam.s];
      const c1 = [W / 2 + (COPY_X - cam.x) * cam.s, H / 2 + (0 - cam.y) * cam.s + (1 - cin) * 1000];
      const a = pageCorners(c0[0], c0[1], cam.s), b = pageCorners(c1[0], c1[1], cam.s, (1 - cin) * .1);
      pageShadow(g, a, .5, 40, 16); drawPage(g, a, {});
      if (cin > 0) { pageShadow(g, b, .5, 40, 16); drawPage(g, b, { gen: 1 }); }
      const kl = win(t, tw('Asıl') - .2, tw('Yaz') - .2, .4, .4);
      if (kl > 0) {
        text(g, 'asıl sayfa', c0[0], c0[1] + PH / 2 * cam.s + 44, { size: 30, weight: 500, align: 'center', color: C.dim, alpha: kl, spacing: 2 });
        if (cin > 0) text(g, 'kopya', c1[0], c1[1] + PH / 2 * cam.s + 44, { size: 30, weight: 500, align: 'center', color: C.gold, alpha: kl * cin, spacing: 2 });
      }
      const kd = win(t, tw('dalgalar') - .3, tw('Neden') + .5, .3, .4);
      if (kd > 0) text(g, t < tw('gökyüzünde') ? 'yüzün üstünde dalgalar' : 'gökyüzünde halkalar', W / 2, H - 70, { size: 44, weight: 300, align: 'center', alpha: kd, shadow: 'rgba(0,0,0,.95)', blur: 26 });
    }
    if (textCmp > 0) {
      // yazının karşılaştırması: üst yarı asıl, alt yarı kopya
      g.save(); g.globalAlpha = textCmp;
      g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, W, H);
      const s = 58;
      const drift = (t - tw('Yaz')) * .25;
      g.save(); g.beginPath(); g.rect(0, 0, W, H / 2 - 3); g.clip();
      drawPage(g, pageCorners(W / 2, H / 4, s, 0, line1.x + 8 + drift, line1.y - 1.2), {});
      g.restore();
      g.save(); g.beginPath(); g.rect(0, H / 2 + 3, W, H / 2); g.clip();
      drawPage(g, pageCorners(W / 2, H * 3 / 4, s, 0, line1.x + 8 + drift, line1.y - 1.2), { gen: 1 });
      g.restore();
      g.fillStyle = 'rgba(232,179,90,.9)'; g.fillRect(0, H / 2 - 3, W, 6);
      text(g, 'asıl', 60, 90, { size: 36, weight: 600, color: '#16161a' });
      text(g, 'kopya', 60, H / 2 + 80, { size: 36, weight: 600, color: '#8a5a10' });
      const k1 = sramp(t, tw('Harfler') - .2, tw('kalınlaşmış') + .3), k2 = sramp(t, tw('kenarları') - .2, tw('tırtıklanmış') + .3);
      text(g, 'harfler biraz kalınlaşmış', W - 60, H / 2 + 80, { size: 34, weight: 400, align: 'right', color: '#16161a', alpha: k1 });
      text(g, 'kenarları tırtıklanmış', W - 60, H / 2 + 130, { size: 34, weight: 400, align: 'right', color: '#16161a', alpha: k2 });
      g.restore();
    }
  }, { fi: .6, fo: .5 });

  // ---- 8B: neden? iki ızgara
  scene(tw('Neden') - .3, (tw('yüzden') - .1) + .5, (g, t) => {
    g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, W, H);
    const rect = [160, 170, W - 320, 760];
    const tul = win(t, tw('tül') - .4, (tw('yüzden') - .1) + .6, .5, .5);
    if (tul < 1) {
      const st1 = sramp(t, tw('noktalarını') - .3, tw('görüyor') + .5);      // örnekleme
      const st2 = sramp(t, tw('ızgarasıyla') - .3, tw('noktalıyor') + .2);
      const zo = eramp(t, tw('İki') - .2, tw('biniyor') + .8);
      const scale = Math.exp(lerp(Math.log(3.2), Math.log(.62), zo));
      run(moireProg, { uPhoto: PHOTO.tex, uRect: rect, uStage: st2 > 0 ? 2 : 1 + st1, uP1: 14, uA1: PI / 4, uGrid: 9.3, uP2: 13.3, uA2: PI / 4 + .06,
        uScale: scale, uGridLines: sramp(t, tw('Makine') - .2, tw('görmüyor') + .2) * (1 - st2) * (1 - zo), uC: [.62, .46] }, null);
      g.save(); g.globalAlpha = 1 - tul; g.drawImage(glc, rect[0], rect[1], rect[2], rect[3], rect[0], rect[1], rect[2], rect[3]); g.restore();
      const caps = [
        [tw('Makine') - .2, tw('Yarım') - .1, 'makine bir fotoğraf görmez'],
        [tw('Yarım') - .1, tw('Sonra') - .1, 'yarım ton noktalarını görür; her kareyi bir griye çevirir'],
        [tw('Sonra') - .1, tw('İki') - .1, 'sonra kendi ızgarasıyla yeniden noktalar'],
        [tw('İki') - .1, tw('tül') - .2, 'iki ızgara üst üste biner'],
      ];
      for (const [a, b, s] of caps) { const k = win(t, a, b, .3, .3) * (1 - tul); if (k > 0) text(g, s, W / 2, 110, { size: 40, weight: 300, align: 'center', alpha: k }); }
    }
    if (tul > 0) {
      // iki tül: ince çizgi ızgaraları, biri hafifçe döner
      g.save(); g.globalAlpha = tul;
      g.fillStyle = '#e9e3d6'; g.fillRect(rect[0], rect[1], rect[2], rect[3]);
      g.beginPath(); g.rect(rect[0], rect[1], rect[2], rect[3]); g.clip();
      const cx = W / 2, cy = rect[1] + rect[3] / 2;
      const drawGrid = (ang, col) => {
        g.save(); g.translate(cx, cy); g.rotate(ang); g.strokeStyle = col; g.lineWidth = 5;
        g.beginPath();
        for (let x = -1400; x <= 1400; x += 13) { g.moveTo(x, -1000); g.lineTo(x, 1000); }
        for (let y = -1000; y <= 1000; y += 13) { g.moveTo(-1400, y); g.lineTo(1400, y); }
        g.stroke(); g.restore();
      };
      drawGrid(0, 'rgba(30,30,36,.55)');
      const k2 = sramp(t, tw('ikinci') - .4, tw('tülün') + .3);
      if (k2 > 0) drawGrid(lerp(.3, .07, eramp(t, tw('ikinci') - .4, tw('dalgalar', 1) + .3)) + .01 * Math.sin(t * .8), `rgba(30,30,36,${.55 * k2})`);
      g.restore();
      text(g, 'bir tül perdenin önünde ikinci bir tül', W / 2, 110, { size: 40, weight: 300, align: 'center', alpha: tul * (1 - sramp(t, tw('Bunun') - .2, tw('Bunun') + .3)) });
      const kh = sramp(t, tw('Bunun') - .1, tw('Hare') + .3) * tul;
      if (kh > 0) {
        g.save(); g.globalAlpha = kh; g.fillStyle = 'rgba(10,12,15,.72)'; g.fillRect(W / 2 - 330, H / 2 - 140, 660, 250); g.restore();
        revealText(g, 'hare', W / 2, H / 2 + 20, eramp(t, tw('Hare') - .4, tw('Hare') + .3), { size: 150, align: 'center', font: `italic 400 150px ${SERIF}` });
        text(g, 'moiré', W / 2, H / 2 + 80, { size: 32, weight: 300, align: 'center', color: C.dim, alpha: kh });
      }
    }
  }, { fi: .5, fo: .5 });

  // ---- 8C: fotoğraf ayarı
  scene((tw('yüzden') - .1) - .3, tw('sorun') + .4, (g, t) => {
    deskBg(g, .1);
    const s = 7.2;
    const fx = faceP.x - 20, fy = faceP.y - 12;
    const half = W / 2;
    const k = sramp(t, tw('yumuşatıyor') - .4, tw('basıyor') + .2);
    g.save(); g.beginPath(); g.rect(0, 0, half - 4, H); g.clip();
    drawPage(g, pageCorners(half / 2, H / 2 + 20, s, 0, fx, fy), { gen: 1 });
    g.restore();
    g.save(); g.beginPath(); g.rect(half + 4, 0, half, H); g.clip();
    drawPage(g, pageCorners(half * 1.5, H / 2 + 20, s, 0, fx, fy), { gen: k > .5 ? 'photo' : 1 });
    if (k > 0 && k < 1) { g.fillStyle = `rgba(255,250,235,${Math.sin(k * PI) * .5})`; g.fillRect(half, 0, half, H); }
    g.restore();
    g.fillStyle = 'rgba(232,179,90,.9)'; g.fillRect(half - 3, 0, 6, H);
    // düğme
    const bx = half + 60, by = 70;
    const pressed = sramp(t, tw('ayarı') - .7, tw('ayarı') + .1);
    g.save(); g.fillStyle = pressed > .5 ? 'rgba(232,179,90,.95)' : 'rgba(30,34,40,.9)'; rrect(g, bx, by, 250, 64, 32); g.fill();
    g.strokeStyle = 'rgba(232,179,90,.9)'; g.lineWidth = 2; rrect(g, bx, by, 250, 64, 32); g.stroke(); g.restore();
    text(g, 'FOTOĞRAF', bx + 125, by + 43, { size: 26, weight: 700, align: 'center', color: pressed > .5 ? '#1a1206' : C.text, spacing: 3 });
    text(g, 'normal kopya', 60, 110, { size: 36, weight: 500, shadow: 'rgba(0,0,0,.9)' });
    const kk = sramp(t, tw('Önce') - .2, tw('yumuşatıyor') + .2);
    text(g, 'önce noktalar yumuşatılır, sonra yeniden basılır', half * 1.5, H - 70, { size: 32, weight: 400, align: 'center', alpha: kk, shadow: 'rgba(0,0,0,.95)', blur: 20 });
  }, { fi: .5, fo: .5 });

  // ---- 8D: koyu daha koyu, açık daha açık
  scene(tw('sorun') - .3, tw('Şimdi', 1) + .5, (g, t) => {
    g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, W, H);
    const c = eramp(t, tw('koyuyu') - .3, tw('açık') + .4);
    // eğri
    const ox = 170, oy = 820, sz = 560;
    g.strokeStyle = 'rgba(236,232,223,.35)'; g.lineWidth = 2; g.strokeRect(ox, oy - sz, sz, sz);
    g.strokeStyle = C.gold; g.lineWidth = 5; g.beginPath();
    for (let i = 0; i <= 100; i++) {
      const x = i / 100; let y = clamp((x - .5) * lerp(1, 2.6, c) + .5); y = lerp(y, y * y * (3 - 2 * y), c * .5);
      const px = ox + x * sz, py = oy - y * sz; i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
    text(g, 'asıl sayfadaki ton', ox + sz / 2, oy + 50, { size: 26, align: 'center', color: C.dim });
    g.save(); g.translate(ox - 30, oy - sz / 2); g.rotate(-PI / 2); text(g, 'kopyadaki ton', 0, 0, { size: 26, align: 'center', color: C.dim }); g.restore();
    text(g, 'yazı okunaklı kalsın diye', ox, oy - sz - 50, { size: 36, weight: 300, alpha: sramp(t, tw('yazıyı') - .3, tw('okunaklı') + .3) });
    // gri şeritler
    const bx = ox, by = oy + 110, bw = sz;
    for (let i = 0; i < 40; i++) {
      const x = i / 39; let y = clamp((x - .5) * lerp(1, 2.6, c) + .5); y = lerp(y, y * y * (3 - 2 * y), c * .5);
      const v1 = 240 - x * 225, v2 = 240 - y * 225;
      g.fillStyle = `rgb(${v1},${v1},${v1})`; g.fillRect(bx + i * bw / 40, by, bw / 40 + 1, 30);
      g.fillStyle = `rgb(${v2},${v2},${v2})`; g.fillRect(bx + i * bw / 40, by + 36, bw / 40 + 1, 30);
    }
    // fotoğraf: ara tonlar kaybolur
    const pk = sramp(t, tw('tonlarını') - 1.1, tw('sertleşiyor') + .3);
    const s = 3.6, cx = 1330, cy = 520;
    const cr = pageCorners(cx, cy, s, 0, PHOTO_R[0] + PHOTO_R[2] / 2, PHOTO_R[1] + PHOTO_R[3] / 2);
    g.save(); g.beginPath(); g.rect(cx - PHOTO_R[2] * s / 2 - 10, cy - PHOTO_R[3] * s / 2 - 10, PHOTO_R[2] * s + 20, PHOTO_R[3] * s + 20); g.clip();
    drawPage(g, cr, { gen: pk > .5 ? 3 : 'photo' });
    g.restore();
    text(g, pk > .5 ? 'ara tonlar kayboldu; fotoğraf sertleşti' : 'fotoğraf ayarlı kopya', cx, cy + PHOTO_R[3] * s / 2 + 60, { size: 32, weight: 300, align: 'center' });
    revealText(g, 'koyu daha koyu, açık daha açık', W / 2, 110, eramp(t, tw('koyuyu') - .3, tw('açık') + .3), { size: 44, weight: 300, align: 'center', color: C.gold });
  }, { fi: .5, fo: .5 });

  // ---- 8E: kuşaklar
  const gap = 240;
  const camE = [
    [tw('Şimdi', 1) - .5, gap * 1.2, 0, 1.6],
    [tw('kopuyor') + .2, gap * 3, 0, 1.6, 5],
    [tw('Yüz') + .6, gap * 5 + faceP.x - 105, faceP.y - 148.5, 6.2, 1.8],
    [tw('Yaz', 1) + .3, gap * 5 + faceP.x - 105, faceP.y - 148.5, 6.2],
    [tw('direniyor') + .6, gap * 5 + line1.x - 105 + 30, line1.y - 148.5 + 12, 9, 1.7],
    [tw('Toz') - .2, gap * 5 + line1.x - 105 + 30, line1.y - 148.5 + 12, 9],
    [tw('boşluk') + .5, gap * 5 + 20.4 - 105, 40.2 - 148.5, 900, 1.6],
  ];
  scene(tw('Şimdi', 1) - .3, lineEnd(A) + 1.2, (g, t) => {
    deskBg(g, .1);
    const cam = camPath(camE, t);
    for (let i = 0; i < 6; i++) {
      const appear = sramp(t, tw('Şimdi', 1) - .3 + i * 1.2 - (i === 0 ? 1 : 0), tw('Şimdi', 1) + .4 + i * 1.2);
      if (appear <= 0) continue;
      const px = gap * i;
      const c = [W / 2 + (px - cam.x) * cam.s, H / 2 + (0 - cam.y) * cam.s - (1 - appear) * 200];
      const cr = pageCorners(c[0], c[1], cam.s, (i % 2 ? .01 : -.01));
      if (Math.max(cr[0], cr[2], cr[4], cr[6]) < -50 || Math.min(cr[0], cr[2], cr[4], cr[6]) > W + 50) continue;
      pageShadow(g, cr, .5 * appear, 30, 12);
      drawPage(g, cr, { gen: i + 1, alpha: appear, macro: i === 5 ? sramp(Math.log(cam.s), Math.log(120), Math.log(600)) : 0, gloss: [-.6, -.5] });
      if (cam.s < 2) text(g, `${i + 1}. kopya`, c[0], c[1] + PH / 2 * cam.s + 40, { size: 28, weight: 500, align: 'center', color: C.dim, alpha: appear });
    }
    const k1 = win(t, tw('Yüz') - .2, tw('Yaz', 1) + .2, .4, .4);
    if (k1 > 0) text(g, 'yüz: düz lekelerden bir afiş', W / 2, H - 70, { size: 44, weight: 300, align: 'center', alpha: k1, shadow: 'rgba(0,0,0,.95)', blur: 26 });
    const k2 = win(t, tw('Yaz', 1) - .1, tw('Toz') - .1, .4, .4);
    if (k2 > 0) text(g, 'yazı direnir', W / 2, H - 70, { size: 44, weight: 300, align: 'center', alpha: k2, shadow: 'rgba(0,0,0,.95)', blur: 26 });
    const k3 = win(t, tw('Toz') - .2, lineEnd(A) + 1.2, .4, .5);
    if (k3 > 0) {
      text(g, 'toz', W * .72, H / 2, { size: 64, weight: 300, align: 'center', color: '#f1ece1', alpha: k3, shadow: 'rgba(0,0,0,.9)' });
      text(g, 've boşluk', W * .28, H / 2, { size: 64, weight: 300, align: 'center', color: '#1b1b20', alpha: k3 * sramp(t, tw('boşluk') - .2, tw('boşluk') + .3) });
    }
  }, { fi: .5, fo: .8 });
}
