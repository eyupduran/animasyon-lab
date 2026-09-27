// ---------------------------------------------------------------------------------------------
// 6. Yarım ton: gri toz yok; noktaların büyüklüğü griyi taklit eder. Renkte dört ızgara, dört açı;
// aynı açıda durursa dalgalar.
// ---------------------------------------------------------------------------------------------
const htProg = compile(`
uniform vec2 uRes;
uniform sampler2D uPhoto;
uniform vec4 uRect;        // ekran px: x, y, w, h
uniform float uSource;     // 0 fotoğraf, 1 yatay geçiş
uniform float uThresh;     // 0 sürekli ton, 1 sert eşik
uniform float uHT;         // yarım ton miktarı
uniform float uPitch;      // px
uniform float uAngle;
uniform float uColor;      // 1: renkli (CMYK)
uniform vec4 uAngles;      // C, M, Y, K açıları
uniform float uLayer;      // -1 hepsi, 0..3 tek katman
uniform vec2 uZoom;        // görüntü içinde yakınlaştırma: ölçek, (merkez sabit)
uniform vec2 uZc;
float spot(vec2 p, float ang, float pitch){ vec2 q = rot(ang) * p / pitch; return (cos(6.2831853*q.x) + cos(6.2831853*q.y)) * .25 + .5; }
float ht(vec2 p, float cov, float ang, float pitch){ float v = spot(p, ang, pitch); float aa = max(fwidth(v), 1e-4); float px = pitch; return mix(cov, smoothstep(1. - cov - aa, 1. - cov + aa, v), smoothstep(2.2, 5., px)); }
void main(){
  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 l = (sp - uRect.xy) / uRect.zw;
  if (l.x < 0. || l.y < 0. || l.x > 1. || l.y > 1.) { outColor = vec4(0.); return; }
  vec2 lz = uZc + (l - .5) / uZoom.x;
  float g = uSource < .5 ? texture(uPhoto, vec2(lz.x, 1. - lz.y)).r : 1. - lz.x;
  vec2 hp = (sp - uRect.xy) / uZoom.x;   // yarım ton ızgarası görüntüye bağlı
  vec3 paper = vec3(.95, .935, .9);
  vec3 col;
  if (uColor < .5) {
    float cov = 1. - g;
    float th = step(.5, cov);
    float c = mix(cov, th, uThresh);
    c = mix(c, ht(hp, cov, uAngle, uPitch), uHT);
    col = mix(paper, vec3(.07, .07, .08), c);
  } else {
    // griden renkli bir görüntü: koyu mavi gökyüzü, sıcak mermer, açık sarı ışık
    vec3 rgb = mix(vec3(.08, .16, .38), vec3(.92, .52, .30), smoothstep(.18, .62, g));
    rgb = mix(rgb, vec3(1., .95, .75), smoothstep(.62, .98, g));
    rgb = mix(rgb, vec3(.45, .66, .9), smoothstep(.45, 1., 1. - lz.y) * (1. - smoothstep(.3, .7, lz.x)) * .5);
    vec3 cmy = 1. - rgb; float k = min(min(cmy.r, cmy.g), cmy.b) * .85; cmy = (cmy - k) / (1. - k + 1e-3);
    float cC = ht(hp, cmy.r, uAngles.x, uPitch), cM = ht(hp, cmy.g, uAngles.y, uPitch), cY = ht(hp, cmy.b, uAngles.z, uPitch), cK = ht(hp, k, uAngles.w, uPitch);
    vec3 C_ = vec3(0., .62, .93), M_ = vec3(.9, .1, .55), Y_ = vec3(1., .92, .0), K_ = vec3(.08);
    col = paper;
    if (uLayer < -.5 || uLayer == 0.) col *= mix(vec3(1.), C_, cC);
    if (uLayer < -.5 || uLayer == 1.) col *= mix(vec3(1.), M_, cM);
    if (uLayer < -.5 || uLayer == 2.) col *= mix(vec3(1.), Y_, cY);
    if (uLayer < -.5 || uLayer == 3.) col *= mix(vec3(1.), K_ * 1.2, cK);
    col = mix(col, rgb, 1. - uHT);
  }
  outColor = vec4(col, 1.);
}`);
function drawHT(g, rect, o = {}) {
  run(htProg, {
    uPhoto: PHOTO.tex, uRect: rect, uSource: o.source || 0, uThresh: o.thresh || 0, uHT: o.ht || 0, uPitch: o.pitch || 12,
    uAngle: o.angle == null ? PI / 4 : o.angle, uColor: o.color || 0, uAngles: o.angles || [15 * PI / 180, 75 * PI / 180, 0, 45 * PI / 180],
    uLayer: o.layer == null ? -1 : o.layer, uZoom: [o.zoom || 1, 0], uZc: o.zc || [.5, .5],
  }, null);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  if (o.transform) { g.setTransform(...o.transform); }
  g.globalAlpha = o.alpha == null ? 1 : o.alpha;
  g.drawImage(glc, rect[0], rect[1], rect[2], rect[3], o.dx == null ? rect[0] : o.dx, o.dy == null ? rect[1] : o.dy, rect[2], rect[3]);
  g.restore();
}
{
  const A = '06-yarim-ton';
  const tw = (w, n) => T(A, w, n);

  // ---- 6A: yazı kolay
  scene(S[A] - .6, tw('Peki') + .4, (g, t) => {
    g.fillStyle = '#efe9dc'; g.fillRect(0, 0, W, H);
    const GL = globalThis.GLYPH_A, cs = 30, gx = W / 2 - 24 * cs / 2, gy = H / 2 - 24 * cs / 2;
    for (let j = 0; j < 24; j++) for (let i = 0; i < 24; i++) if (GL.cells[j][i]) { g.fillStyle = '#141418'; g.fillRect(gx + i * cs + 1, gy + j * cs + 1, cs - 2, cs - 2); }
    g.strokeStyle = 'rgba(60,70,85,.25)'; g.lineWidth = 1; g.beginPath();
    for (let i = 0; i <= 24; i++) { g.moveTo(gx + i * cs, gy); g.lineTo(gx + i * cs, gy + 24 * cs); g.moveTo(gx, gy + i * cs); g.lineTo(gx + 24 * cs, gy + i * cs); }
    g.stroke();
    text(g, 'toz var', gx - 60, H / 2 - 20, { size: 44, weight: 300, align: 'right', color: '#141418', alpha: sramp(t, tw('alır') - .3, tw('alır') + .3) });
    text(g, 'toz yok', gx + 24 * cs + 60, H / 2 - 20, { size: 44, weight: 300, color: '#6a6458', alpha: sramp(t, tw('almaz') - .3, tw('almaz') + .3) });
  }, { fi: .6, fo: .5 });

  // ---- 6B: fotoğraf, gri yok
  scene(tw('Peki') - .2, tw('Hile') + .4, (g, t) => {
    deskBg(g, .2);
    const w = 1120, h = w * PHOTO_H / PHOTO_W, x = (W - w) / 2, y = 150;
    const th = sramp(t, tw('siyah') - .2, tw('var') + .3);
    g.save(); g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 40; g.shadowOffsetY = 16; g.fillStyle = '#000'; g.fillRect(x, y, w, h); g.restore();
    drawHT(g, [x, y, w, h], { thresh: th });
    // gri paleti
    const pk = sramp(t, tw('Yazıcının') - .3, tw('gri') + .2);
    if (pk > 0) {
      const n = 8, sw = 90, px = W / 2 - n * sw / 2, py = y + h + 60;
      for (let i = 0; i < n; i++) {
        const v = 235 - i * 220 / (n - 1);
        const keep = i === n - 1 ? 1 : 1 - sramp(t, tw('Tek') - .2 + i * .04, tw('siyah') + .2 + i * .04);
        g.globalAlpha = pk * keep;
        g.fillStyle = `rgb(${v},${v},${v * .98})`; g.fillRect(px + i * sw + 6, py, sw - 12, 60);
        if (i < n - 1 && keep < 1 && keep > 0) { g.strokeStyle = `rgba(255,90,90,${1 - keep})`; g.lineWidth = 3; g.beginPath(); g.moveTo(px + i * sw + 6, py + 60); g.lineTo(px + i * sw + sw - 6, py); g.stroke(); }
      }
      g.globalAlpha = 1;
      text(g, 'gri toz yok; tek bir siyah var', W / 2, py + 120, { size: 36, weight: 300, align: 'center', alpha: pk * sramp(t, tw('Tek') - .2, tw('var') + .3) });
    }
    const lk = win(t, tw('yüzün') - .2, tw('Yazıcının') + .2, .4, .4);
    if (lk > 0) {
      label(g, x + w * .66, y + h * .55, x + w + 60, y + h * .7, 'yüzün gölgesi', lk, { size: 32, side: 1 });
      label(g, x + w * .15, y + h * .2, x + 60, y - 50, 'gökyüzünde açıktan koyuya', lk * sramp(t, tw('gökyüzünün') - .2, tw('gökyüzünün') + .4), { size: 32, side: -1 });
    }
  }, { fi: .5, fo: .5 });

  // ---- 6C: noktaların büyüklüğü
  scene(tw('Hile') - .2, tw('Yakından') + .4, (g, t) => {
    g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, W, H);
    const pitch = lerp(110, 64, eramp(t, tw('Hile'), tw('büyüklüğünde') + 1));
    const rect = [80, 300, W - 160, 420];
    drawHT(g, rect, { source: 1, ht: 1, pitch, angle: PI / 4 });
    revealText(g, 'hile: noktaların büyüklüğü', W / 2, 190, eramp(t, tw('Hile') - .1, tw('büyüklüğünde') + .3), { size: 52, weight: 300, align: 'center' });
    const k1 = sramp(t, tw('Koyu') - .2, tw('değiyor') + .2);
    if (k1 > 0) label(g, 300, 720, 340, 860, 'koyu: noktalar şişer, birbirine değer', k1, { size: 34, side: 1 });
    const k2 = sramp(t, tw('Açık') - .2, tw('kayboluyor') + .2);
    if (k2 > 0) label(g, W - 300, 720, W - 340, 930, 'açık: küçülür, neredeyse kaybolur', k2, { size: 34, side: -1 });
  }, { fi: .5, fo: .5 });

  // ---- 6D: yakından ızgara, uzaktan gri (sayfanın kendi fotoğrafı)
  const face = { x: PHOTO_R[0] + PHOTO_R[2] * .62, y: PHOTO_R[1] + PHOTO_R[3] * .45 };
  const camD = [
    [tw('Yakından') - .4, face.x, face.y, 70],
    [tw('görürsünüz') + .3, face.x - 2, face.y + 1, 48, 2.6],
    [tw('uyduruyor') + .2, 105, 150, 2.6, 3.4],
  ];
  scene(tw('Yakından') - .3, tw('Renkli') + .4, (g, t) => {
    deskBg(g, .15);
    const cam = camPath(camD, t, k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
    const cr = pageCorners(W / 2, H / 2, cam.s, 0, cam.x, cam.y);
    pageShadow(g, cr, .5, 40, 16);
    drawPage(g, cr, {});
    const k1 = win(t, tw('Yakından') - .1, tw('Birkaç') + .3, .4, .4);
    if (k1 > 0) text(g, 'yakından: yalnızca bir nokta ızgarası', W / 2, H - 90, { size: 42, weight: 300, align: 'center', alpha: k1, shadow: 'rgba(0,0,0,.95)', blur: 26 });
    const k2 = win(t, tw('göz') - .2, tw('Matbaacılar') + .1, .4, .3);
    if (k2 > 0) text(g, 'uzaktan: gri tonları göz uydurur', W / 2, H - 60, { size: 42, weight: 300, align: 'center', alpha: k2, shadow: 'rgba(0,0,0,.95)', blur: 26 });
    const k3 = win(t, tw('Matbaacılar') - .1, tw('Renkli') + .4, .4, .4);
    if (k3 > 0) {
      g.fillStyle = `rgba(7,8,10,${.55 * k3})`; g.fillRect(0, 0, W, H);
      revealText(g, 'yarım ton', W / 2, H / 2 + 40, eramp(t, tw('yarım') - .3, tw('ton') + .4), { size: 150, weight: 200, align: 'center', fam: SERIF, font: `italic 400 150px ${SERIF}` });
    }
  }, { fi: .5, fo: .5 });

  // ---- 6E: renkli: dört toz, dört açı; aynı açıda dalgalar
  const names = [['camgöbeği', '15°', '#29a8e0'], ['macenta', '75°', '#e0328c'], ['sarı', '0°', '#f2d600'], ['siyah', '45°', '#bbbbbb']];
  scene(tw('Renkli') - .2, lineEnd(A) + 1.2, (g, t) => {
    g.fillStyle = '#0b0d10'; g.fillRect(0, 0, W, H);
    const merge = eramp(t, tw('çevrilmiş') - .2, tw('Açıda') + .1);
    const align = eramp(t, tw('Açıda') - .1, tw('binip') + .4);
    const base = [15, 75, 0, 45].map(a => a * PI / 180);
    const same = [45, 48, 42.3, 45.9].map(a => a * PI / 180);
    const angles = base.map((a, i) => lerp(a, same[i], align));
    const w = 760, h = w * PHOTO_H / PHOTO_W;
    const pitch = lerp(16, 9, merge);
    if (merge < 1) {
      const pw = 400, ph = pw * PHOTO_H / PHOTO_W, gap = 36, x0 = W / 2 - (4 * pw + 3 * gap) / 2, py = 330;
      for (let i = 0; i < 4; i++) {
        const ki = sramp(t, tw('dört') - .6 + i * .45, tw('dört') - .1 + i * .45) * (i < 3 ? 1 : sramp(t, tw('siyah', 1) - .5, tw('siyah', 1)));
        if (ki <= 0) continue;
        const x = x0 + i * (pw + gap);
        g.save(); g.globalAlpha = ki * (1 - merge);
        drawHT(g, [x, py, pw, ph], { color: 1, ht: 1, pitch: 12, angles, layer: i, zoom: 1, alpha: ki * (1 - merge) });
        g.restore();
        text(g, names[i][0], x + pw / 2, py + ph + 56, { size: 34, weight: 500, align: 'center', color: names[i][2], alpha: ki * (1 - merge) });
        text(g, names[i][1], x + pw / 2, py + ph + 100, { size: 30, weight: 300, align: 'center', color: C.text, alpha: ki * (1 - merge) * sramp(t, tw('Her') - .3, tw('açıya') + .2) });
      }
    }
    if (merge > 0) {
      const W2 = 1100, H2 = W2 * PHOTO_H / PHOTO_W;
      const zoom = lerp(1, 1.5, sramp(t, tw('Açıda') - .6, tw('dalgalı') + .2));
      drawHT(g, [W / 2 - W2 / 2, H / 2 - H2 / 2 + 30, W2, H2], { color: 1, ht: 1, pitch: 9 * zoom, angles, zoom, zc: [.35, .3], alpha: merge });
    }
    revealText(g, 'üç ana renk ve siyah', W / 2, 90, win(t, tw('Üç') - .2, tw('Açıda') - .2, .4, .4) * eramp(t, tw('Üç') - .2, tw('siyah', 1) + .4), { size: 44, weight: 300, align: 'center' });
    const k2 = win(t, tw('Açıda') - .1, lineEnd(A) + 1, .4, .5);
    if (k2 > 0) revealText(g, 'aynı açıda: dalgalı desenler', W / 2, 90, k2 * eramp(t, tw('Açıda') - .1, tw('dalgalı') + .4), { size: 44, weight: 300, align: 'center', color: C.gold });
    const k3 = win(t, tw('dalgaları') - .2, lineEnd(A) + 1, .4, .5);
    if (k3 > 0) text(g, 'bu dalgaları aklınızda tutun', W / 2, H - 60, { size: 36, weight: 300, align: 'center', alpha: k3, shadow: 'rgba(0,0,0,.9)' });
  }, { fi: .5, fo: .8 });
}
