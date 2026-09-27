// ---------------------------------------------------------------------------------------------
// Sayfa: A4 (210 × 297 mm). Yazı bir maske dokusunda, fotoğraf yarım tonla basılır.
// Fotokopi gerçekten benzetilir: basılı sayfa taranır (ışık çubuğu + sensör satırı, optik bulanıklık,
// camda hafif eğik duran sayfa, merceğin küçük bozulması), sonra makinenin kendi ızgarasıyla
// yeniden yarım tonlanır. Hare desenleri bu iki ızgaranın gerçek girişiminden doğar.
// ---------------------------------------------------------------------------------------------
const PW = 210, PH = 297, DPMM = 300 / 25.4;
const PHOTO_R = [18, 101, 174, 115];                   // mm: x, y, w, h
const ORIG_SCREEN = [PI / 4, 1.0];                      // açı, adım (mm): asıl sayfanın yarım tonu
const COPY_SCREEN = [PI / 4 + 0.02, 0.96];             // fotokopi makinesinin kendi ızgarası

const PAGE_TEXT = {
  kicker: 'TEKNOLOJİ',
  head: 'Işıkla Yazmak',
  deck: 'Lazer yazıcı sayfayı mürekkeple değil; ışık, elektrik ve tozla yazar.',
  body1: 'Işığa duyarlı bir tambur, karanlıkta durgun elektrik yükü taşır. Lazerin değdiği noktalarda bu yük boşalır. Toner denen kuru plastik tozu yalnızca bu noktalara tutunur, kâğıda aktarılır ve ısıyla eritilip liflere bağlanır. Sayfa bu yüzden yazıcıdan sıcak çıkar.',
  caption: 'Bu fotoğrafta gri yok: bütün tonlar, büyüklüğü değişen siyah noktalardan oluşur.',
  body2: 'Yöntemin adı kserografi; Yunanca kuru ve yazı sözcüklerinden gelir. Chester Carlson ilk görüntüsünü 22 Ekim 1938’de New York’un Astoria semtinde elde etti. İlk lazer yazıcı ise 1971’de, bir fotokopi makinesinin içine lazer yerleştirilerek yapıldı.',
  foot: 'Bir Sayfanın Yolculuğu',
};

// yazının yerleşimi (mm); başka sahneler de kullanır (ör. başlık harfinin yeri)
const PAGE_LAYOUT = {};
function buildTextMask() {
  const c = makeCanvas(Math.round(PW * DPMM), Math.round(PH * DPMM));
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#fff'; g.textBaseline = 'alphabetic';
  const k = DPMM, L = 18, R = 192;
  const wrap = (s, x, y, size, lh, f, maxW, justify) => {
    g.font = f(size * k);
    const words = s.split(' '); let line = [], lines = [];
    for (const w of words) { const test = [...line, w].join(' '); if (g.measureText(test).width > maxW * k && line.length) { lines.push(line); line = [w]; } else line.push(w); }
    lines.push(line);
    lines.forEach((ln, i) => {
      const yy = (y + i * lh) * k;
      if (justify && i < lines.length - 1 && ln.length > 1) {
        const tw = ln.reduce((a, w) => a + g.measureText(w).width, 0);
        const gap = (maxW * k - tw) / (ln.length - 1); let xx = x * k;
        for (const w of ln) { g.fillText(w, xx, yy); xx += g.measureText(w).width + gap; }
      } else g.fillText(ln.join(' '), x * k, yy);
    });
    return y + (lines.length - 1) * lh;
  };
  // üst künye
  g.font = `600 ${3.1 * k}px ${SANS}`; g.letterSpacing = `${0.9 * k}px`;
  g.fillText(PAGE_TEXT.kicker, L * k, 22 * k);
  g.letterSpacing = '0px';
  g.fillRect(L * k, 25 * k, (R - L) * k, 0.3 * k);
  // başlık
  g.font = `700 ${15.5 * k}px ${SERIF}`;
  g.fillText(PAGE_TEXT.head, (L - 0.6) * k, 43 * k);
  PAGE_LAYOUT.head = { x: L, y: 43, size: 15.5, w: g.measureText(PAGE_TEXT.head).width / k };
  // spot
  let y = wrap(PAGE_TEXT.deck, L, 52.5, 4.6, 6, s => `italic 400 ${s}px ${SERIF}`, R - L, false);
  // gövde 1
  y = wrap(PAGE_TEXT.body1, L, y + 9, 3.55, 5.3, s => `400 ${s}px ${SERIF}`, R - L, true);
  PAGE_LAYOUT.body1End = y;
  // fotoğraf altı
  const [px, py, pw, ph] = PHOTO_R;
  y = wrap(PAGE_TEXT.caption, L, py + ph + 6, 3.1, 4.5, s => `italic 400 ${s}px ${SERIF}`, R - L, false);
  // gövde 2
  y = wrap(PAGE_TEXT.body2, L, y + 9, 3.55, 5.3, s => `400 ${s}px ${SERIF}`, R - L, true);
  // alt bilgi
  g.fillRect(L * k, 281 * k, (R - L) * k, 0.25 * k);
  g.font = `500 ${2.8 * k}px ${SANS}`; g.letterSpacing = `${0.4 * k}px`;
  g.fillText(PAGE_TEXT.foot.toLocaleUpperCase('tr'), L * k, 286.5 * k);
  g.letterSpacing = '0px';
  return c;
}
const TEXT_MASK_CANVAS = buildTextMask();
const TEXT_TEX = texFromCanvas(TEXT_MASK_CANVAS, { mip: true });

// ---------------------------------------------------------------------------------------------
// GLSL: basılı bir noktanın toner örtüsü (0 boş kâğıt, 1 toner)
// ---------------------------------------------------------------------------------------------
const INK_GLSL = `
uniform vec2 uRes;
uniform sampler2D uText;      // yazı maskesi
uniform sampler2D uPhoto;     // sürekli tonlu fotoğraf
uniform sampler2D uG;         // kopyanın taranmış gri görüntüsü (koyuluk)
uniform sampler2D uPK;        // kopyanın basılı örtüsü (mip'li; uzaktan bakış için)
uniform int uSrc;             // 0 asıl sayfa, 1 kopya
uniform vec4 uPhotoR;
uniform vec2 uOrigScr, uCopyScr;
uniform vec3 uTone;           // kopya ton eğrisi: alt, üst, sertlik
uniform float uSeed;
const vec2 PS = vec2(${PW}., ${PH}.);

float spot(vec2 p, float ang, float pitch){
  vec2 q = rot(ang) * p / pitch;
  return (cos(6.2831853*q.x) + cos(6.2831853*q.y)) * .25 + .5;   // hücre ortasında 1
}
// örtü → eşik: kosinüs nokta işlevinin alan eğrisini yaklaşık düzelt
float thr(float cov){ cov = clamp(cov, 0., 1.); return 1. - (cov + .18*sin(6.2831853*cov)*.0) ; }
float halftone(vec2 p, float cov, float ang, float pitch, float mmpp){
  float v = spot(p, ang, pitch);
  float t = 1. - cov;
  float aa = max(fwidth(v), 1e-4) * .8 + mmpp * 1.5 / pitch;
  float ink = smoothstep(t - aa, t + aa, v);
  float px = pitch / max(mmpp, 1e-6);
  return mix(cov, ink, smoothstep(2.2, 5.5, px));
}
float halftoneSharp(vec2 p, float cov, float ang, float pitch){ // tarama için (aa'sız, üst örnekleme ile)
  return step(1. - cov, spot(p, ang, pitch));
}
float photoGray(vec2 p){
  vec2 l = (p - uPhotoR.xy) / uPhotoR.zw;
  return texture(uPhoto, vec2(l.x, 1. - l.y)).r;
}
bool inPhoto(vec2 p, float m){ return p.x > uPhotoR.x - m && p.y > uPhotoR.y - m && p.x < uPhotoR.x + uPhotoR.z + m && p.y < uPhotoR.y + uPhotoR.w + m; }
float textMask(vec2 p, float mmpp){
  vec2 uv = vec2(p.x / PS.x, 1. - p.y / PS.y);
  float texmm = 1. / ${DPMM.toFixed(5)};
  float m0 = textureLod(uText, uv, 0.).r;
  float aa = max(fwidth(m0), 1e-3);
  float crisp = smoothstep(.5 - aa, .5 + aa, m0);
  float avg = texture(uText, uv).r;
  return mix(crisp, avg, smoothstep(.6, 1.6, mmpp / texmm));
}
float tone(float c){ c = clamp((c - uTone.x) / (uTone.y - uTone.x), 0., 1.); return mix(c, c*c*(3.-2.*c), uTone.z); }

// asıl sayfa
float inkOrig(vec2 p, float mmpp, bool sharp){
  float ink = textMask(p, mmpp);
  if (inPhoto(p, 0.)) {
    float cov = 1. - photoGray(p);
    float h = sharp ? halftoneSharp(p, cov, uOrigScr.x, uOrigScr.y) : halftone(p, cov, uOrigScr.x, uOrigScr.y, mmpp);
    // fotoğraf kenarı: ince çerçeve yok, yumuşak değil; kesik
    ink = max(ink, h);
  }
  return ink;
}
// kopya: taranmış griden yeniden basım
float inkCopy(vec2 p, float mmpp, bool sharp){
  vec2 gs = vec2(textureSize(uG, 0));
  vec2 uv = p / PS;
  if (inPhoto(p, .8)) {
    float c = tone(texture(uG, uv).r);
    return sharp ? halftoneSharp(p, c, uCopyScr.x, uCopyScr.y) : halftone(p, c, uCopyScr.x, uCopyScr.y, mmpp);
  }
  // yazı bölgesi: eşikleme; kenarlar biraz kalınlaşır ve toner saçılmasıyla tırtıklanır
  float g = texture(uG, uv).r;
  float n = (fbm(p * 14. + uSeed) - .5) * .30 + (hash12(floor(p / .025) + uSeed) - .5) * .12;
  float v = tone(g) + n * smoothstep(.05, .3, g) * (1. - smoothstep(.7, .95, g));
  float th = .40;
  if (sharp) return step(th, v);
  float aa = max(fwidth(v), 1e-3);
  return smoothstep(th - aa, th + aa, v);
}
float inkAt(vec2 p, float mmpp, bool sharp){
  if (p.x < 0. || p.y < 0. || p.x > PS.x || p.y > PS.y) return 0.;
  return uSrc == 0 ? inkOrig(p, mmpp, sharp) : inkCopy(p, mmpp, sharp);
}
`;

// tarama: basılı sayfayı sensör ızgarasında oku → gri (koyuluk)
const scanProg = compile(INK_GLSL + `
uniform vec3 uPlace;     // camdaki yerleşim: dönme (rad), kayma x, y (mm)
uniform vec2 uScale;     // tarama ölçeği (x: sensör satırı, y: ışık çubuğunun hızı)
uniform vec3 uLens;      // mercek bozulması: merkez x, y (mm), katsayı
uniform float uBlur;     // optik bulanıklık yarıçapı (mm)
vec2 placeMap(vec2 u){
  // merceğin yerel büyütme farkı (küçük, ama iki ızgaranın uyumunu bozmaya yeter)
  vec2 d = u - uLens.xy; float r2 = dot(d, d) / (38. * 38.);
  u = uLens.xy + d * (1. + uLens.z * exp(-r2));
  vec2 c = PS * .5;
  return rot(uPlace.x) * ((u - c) * uScale) + c + uPlace.yz;
}
void main(){
  vec2 u = gl_FragCoord.xy / uRes * PS;          // çıkış sayfasında mm
  vec2 cell = PS / uRes;
  float s = 0., wsum = 0.;
  for (int j = -3; j <= 3; j++) for (int i = -3; i <= 3; i++) {
    vec2 o = vec2(float(i), float(j)) / 3.5;       // -0.86..0.86 hücre
    vec2 q = u + o * max(cell, vec2(inPhoto(u, 3.) ? uBlur : .12));
    float w = exp(-dot(o, o) * 1.6);
    s += inkAt(placeMap(q), 0.001, true) * w; wsum += w;
  }
  float d = s / wsum;
  outColor = vec4(d, d, d, 1.);
}`);

// basım: gri görüntüden toner örtüsü (üst örneklemeli), uzaktan bakışta ortalama olarak kullanılır
const printProg = compile(INK_GLSL + `
void main(){
  vec2 u = gl_FragCoord.xy / uRes * PS;
  vec2 cell = PS / uRes;
  float s = 0.;
  for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
    vec2 q = u + (vec2(float(i), float(j)) + .5 - 2.) / 4. * cell;
    s += inkAt(q, 0.001, true);
  }
  s /= 16.;
  outColor = vec4(s, s, s, 1.);
}`);

// "fotoğraf ayarı": noktaları yumuşat (ayrılabilir Gauss)
const blurProg = compile(`
uniform vec2 uRes; uniform sampler2D uTex; uniform vec2 uDir; uniform vec4 uPhotoR; uniform float uOnlyPhoto;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = uv * vec2(${PW}., ${PH}.);
  bool inP = p.x > uPhotoR.x - 2. && p.y > uPhotoR.y - 2. && p.x < uPhotoR.x + uPhotoR.z + 2. && p.y < uPhotoR.y + uPhotoR.w + 2.;
  if (uOnlyPhoto > .5 && !inP) { outColor = texture(uTex, uv); return; }
  float s = 0., w = 0.;
  for (int i = -12; i <= 12; i++) { float k = exp(-float(i*i) / 50.); s += texture(uTex, uv + uDir * float(i) / uRes).r * k; w += k; }
  s /= w; outColor = vec4(s, s, s, 1.);
}`);

const G_W = 1400, G_H = 1980;    // tarayıcı ızgarası (0,15 mm)
const PK_W = 1750, PK_H = 2475;  // basılı örtü (0,12 mm)
function mipTarget(w, h) {
  const t = makeTarget(w, h);
  gl.bindTexture(gl.TEXTURE_2D, t.tex);
  return t;
}
function genMips(t) {
  gl.bindTexture(gl.TEXTURE_2D, t.tex);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
}

const inkBase = () => ({ uText: TEXT_TEX, uPhoto: PHOTO.tex, uPhotoR: PHOTO_R, uOrigScr: ORIG_SCREEN, uCopyScr: COPY_SCREEN });
// kopya kuşakları: { G, PK, tone, seed }
const COPIES = [];
const DUMMY = makeTarget(4, 4);
const ORIGINAL = { src: 0, G: DUMMY, PK: DUMMY, tone: [0, 1, 0], seed: 0 };
function blurG(G) {
  const tmp = makeTarget(G_W, G_H), G2 = makeTarget(G_W, G_H);
  run(blurProg, { uTex: G.tex, uDir: [1, 0], uPhotoR: PHOTO_R, uOnlyPhoto: 1 }, tmp);
  run(blurProg, { uTex: tmp.tex, uDir: [0, 1], uPhotoR: PHOTO_R, uOnlyPhoto: 1 }, G2);
  gl.deleteTexture(tmp.tex); gl.deleteFramebuffer(tmp.fb);
  return G2;
}
// bir kopya çıkar: prev basılı sayfası camda, pl ayarlarıyla
function makeCopy(prev, pl, seed) {
  const G = makeTarget(G_W, G_H);
  run(scanProg, { ...inkBase(), uSrc: prev.src, uG: prev.G.tex, uPK: prev.PK.tex, uTone: prev.tone, uSeed: prev.seed,
    uPlace: pl.place, uScale: pl.scale || [1, 1], uLens: pl.lens, uBlur: pl.blur || 0.1 }, G);
  const Gs = pl.photo ? blurG(G) : G;
  const PK = makeTarget(PK_W, PK_H);
  const cur = { src: 1, G: Gs, Graw: G, PK, tone: pl.tone, seed };
  run(printProg, { ...inkBase(), uSrc: 1, uG: Gs.tex, uTone: cur.tone, uSeed: cur.seed }, PK);
  genMips(PK);
  return cur;
}
const COPY_PLAN = [
  { place: [0.004, 0, 0], scale: [1, 1.01], lens: [52, 122, 0.05], blur: 0.42, photo: false, tone: [0.08, 0.92, 0.35] },  // 1. kopya (normal)
  { place: [-0.003, -0.2, 0.2], lens: [140, 150, 0.0], photo: true, tone: [0.02, 0.98, 0.2] },  // 2. kuşak: fotoğraf ayarı + sertleşme
  { place: [0.003, 0.2, 0.2], lens: [80, 140, 0.0], photo: true, tone: [0.03, 0.97, 0.28] },
  { place: [-0.002, -0.2, -0.2], lens: [120, 130, 0.0], photo: true, tone: [0.05, 0.95, 0.36] },
  { place: [0.003, 0.2, 0.1], lens: [90, 150, 0.0], photo: true, tone: [0.07, 0.93, 0.45] },
  { place: [-0.003, -0.1, 0.2], lens: [110, 140, 0.0], photo: true, tone: [0.09, 0.91, 0.55] },
];
{
  let prev = ORIGINAL;
  COPY_PLAN.forEach((pl, i) => { const c = makeCopy(prev, pl, 11 + i * 7); COPIES.push(c); prev = c; });
  // 1. kopyanın "fotoğraf ayarlı" hâli: aynı tarama, önce yumuşatılmış
  const G2 = blurG(COPIES[0].Graw);
  const PK = makeTarget(PK_W, PK_H);
  const cur = { src: 1, G: G2, PK, tone: [0.06, 0.94, 0.3], seed: 5 };
  run(printProg, { ...inkBase(), uSrc: 1, uG: G2.tex, uTone: cur.tone, uSeed: cur.seed }, PK);
  genMips(PK);
  COPIES.photo = cur;
}

// ---------------------------------------------------------------------------------------------
// Sayfayı ekrana çizen gölgelendirici
// ---------------------------------------------------------------------------------------------
const pageProg = compile(INK_GLSL + `
uniform mat3 uM;          // ekran pikseli → sayfa mm
uniform float uAlpha;
uniform vec3 uLit;        // ışık çarpanı
uniform float uHeat;      // sıcaklık parıltısı
uniform float uReveal;    // basılmış bölgenin alt sınırı (mm); 1e3 = hepsi
uniform float uMacro;     // yakın çekim ayrıntısı
uniform float uTime;
uniform float uShimmer;   // sıcak hava titreşimi
uniform float uBlank;     // 1: yalnızca kâğıt
uniform vec2 uGloss;      // parlaklık yönü
uniform float uPowder;    // erimemiş, gevşek toz

// erimiş tonerin yüzeyi: kafessiz, yumuşak dalgalar
float meltH(vec2 p){
  float h = 0.;
  h += sin(dot(p, vec2(21.3, 9.1)) + .9 * sin(dot(p, vec2(-7.7, 15.2)))) * .5;
  h += sin(dot(p, vec2(-12.4, 26.8)) + 1.1 * sin(dot(p, vec2(18.3, 5.9)) + 1.)) * .35;
  h += sin(dot(p, vec2(33.1, -19.7)) + .7 * sin(dot(p, vec2(9.4, 28.2)) + 2.)) * .22;
  h += sin(dot(p, vec2(-41.6, -30.3)) + 1.3 * sin(dot(p, vec2(25.1, -12.2)) + 4.)) * .12;
  return h;
}
float fiber(vec2 p){
  // kâğıt lifleri: yönü rastgele hücrelerde uzun ince izler
  vec2 c = floor(p / .35);
  float s = 0.;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 cc = c + vec2(i, j);
    float a = hash12(cc) * 6.2831;
    vec2 o = (cc + vec2(hash12(cc + 7.), hash12(cc + 13.))) * .35;
    vec2 d = rot(a) * (p - o);
    float len = .25 + .3 * hash12(cc + 3.);
    float wdt = .012 + .012 * hash12(cc + 5.);
    float f = smoothstep(wdt, 0., abs(d.y)) * smoothstep(len, len * .6, abs(d.x));
    s = max(s, f * (.5 + .5 * hash12(cc + 9.)));
  }
  return s;
}
void main(){
  vec2 sp = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  if (uShimmer > 0.) {
    sp.x += uShimmer * (vnoise(vec2(sp.y * .02, uTime * 2.3)) - .5) * 6.;
    sp.y += uShimmer * (vnoise(vec2(sp.x * .015 + 40., uTime * 1.9)) - .5) * 4.;
  }
  vec3 h = uM * vec3(sp, 1.);
  vec2 p = h.xy / h.z;
  float mmpp = length(fwidth(p)) * .7071;
  // sayfa kenarı
  float ex = min(min(p.x, PS.x - p.x), min(p.y, PS.y - p.y));
  float a = smoothstep(-mmpp * .7, mmpp * .7, ex);
  if (a <= 0.) { outColor = vec4(0.); return; }

  float ink = uBlank > .5 ? 0. : inkAt(p, mmpp, false);
  if (uSrc == 1 && uBlank < .5) {
    // uzaktan: basılı örtünün ortalaması (hare burada görünür); yakından: keskin noktalar
    float far = texture(uPK, p / PS).r;
    float px = uCopyScr.y / mmpp;
    float blend = inPhoto(p, .8) ? smoothstep(2.2, 5.5, px) : smoothstep(.12, .3, .15 / mmpp);
    ink = mix(far, ink, blend);
  }
  if (uPowder > 0.) {
    // gevşek toz: benekli, seyrek; harflerin çevresine saçılmış tanecikler
    vec2 cc = floor(p / .045);
    float gr = hash12(cc);
    ink *= mix(1., .45 + .55 * step(.3, gr), uPowder);
    float near = textureLod(uText, vec2(p.x / PS.x, 1. - p.y / PS.y), 3.5).r;
    float spk = step(.93, hash12(cc + 7.)) * smoothstep(.02, .25, near) * (1. - step(.6, near));
    ink = max(ink, spk * uPowder * .9);
  }
  if (p.y > uReveal) ink = 0.;

  // yakın çekim: tonerin erimiş plastik tanecikleri ve kâğıt lifleri
  float gloss = 0., occ = 0.;
  if (uMacro > 0.) {
    vec2 q = p / .008; vec2 ci = floor(q);
    float field = 0.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 c = ci + vec2(float(i), float(j));
      vec2 cp = (c + vec2(hash12(c), hash12(c + 3.7))) * .008;
      float mc = uSrc == 0 ? textureLod(uText, vec2(cp.x / PS.x, 1. - cp.y / PS.y), 0.).r : inkAt(cp, .001, true);
      float pres = step(hash12(c + 11.3) * .5 + .25, mc + (hash12(c + 17.) - .5) * .35);
      float r = .0034 + .0016 * hash12(c + 5.1);
      float d = length(p - cp);
      field += pres * exp(-d * d / (r * r));
    }
    float m = uSrc == 0 ? textureLod(uText, vec2(p.x / PS.x, 1. - p.y / PS.y), 0.).r : ink;
    float inner = smoothstep(.6, .95, m);
    field += inner * 1.3;
    float tn = smoothstep(.35, .55, field);
    ink = mix(ink, max(tn, uSrc == 0 ? 0. : ink * step(.95, m)), uMacro);
    // erimiş yüzey: içeride tanecikler kaynaşıp pürüzsüzleşir, yalnızca yumuşak dalgalar kalır
    float hgt = field * (1. - inner);
    vec2 gr = vec2(dFdx(hgt), dFdy(hgt)) * 2.2;
    // içerideki yumuşak dalgalar: türev yerine iki örnekle
    float e0 = .004;
    vec2 gi = vec2(meltH(p + vec2(e0, 0.)) - meltH(p - vec2(e0, 0.)), meltH(p + vec2(0., e0)) - meltH(p - vec2(0., e0))) / (2. * e0) * .011;
    gr = mix(gr, gi, smoothstep(.25, .6, inner));
    vec3 N = normalize(vec3(-gr, 1.));
    vec3 Hh = normalize(normalize(vec3(uGloss, .9)) + vec3(0., 0., 1.));
    gloss = (pow(max(dot(N, Hh), 0.), 26.) * .9 + pow(max(dot(N, Hh), 0.), 4.) * .08) * tn * uMacro;
    occ = smoothstep(.12, .42, field) * (1. - tn) * uMacro;
  }
  float fib = 0., fibH = 0.;
  if (uMacro > 0.) {
    // selüloz lifleri: üst üste binen ince tüpler
    vec2 c0 = floor(p / .3);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) for (int k = 0; k < 2; k++) {
      vec2 c = c0 + vec2(float(i), float(j)) + float(k) * 31.7;
      vec2 o = (c0 + vec2(float(i), float(j)) + vec2(hash12(c), hash12(c + 1.3))) * .3;
      float a = hash12(c + 2.9) * 3.14159;
      vec2 d = vec2(cos(a), sin(a));
      float len = .18 + .22 * hash12(c + 4.1);
      float wd = .007 + .010 * hash12(c + 6.7);
      vec2 r = p - o;
      float along = clamp(dot(r, d), -len, len);
      vec2 cl = o + d * along + vec2(-d.y, d.x) * sin(along * 9. + hash12(c) * 6.) * .012;
      float dist = length(p - cl);
      float h = sqrt(max(0., 1. - dist * dist / (wd * wd))) * (1. - smoothstep(len * .5, len, abs(dot(r, d))));
      float layer = .3 + .7 * hash12(c + 8.8);
      if (h * layer > fibH) { fibH = h * layer; fib = h; }
    }
    fib *= uMacro;
  }
  fib += fiber(p) * (1. - uMacro);
  float mott = (fbm(p * .6) * .06 + fbm(p * 8.) * .05) * (1. - uMacro * .85);
  vec3 paper = vec3(.955, .94, .905) * (1. - mott) * (1. - .09 * fib * (1. - uMacro)) * (1. - .1 * uMacro * (vnoise(p * 20.) - .4));
  if (uMacro > 0.) { paper *= 1. - uMacro * .07 * smoothstep(0., .3, fib) * (1. - smoothstep(.3, .8, fib)); paper += uMacro * vec3(.035, .033, .03) * smoothstep(.4, 1., fib); paper *= 1. - uMacro * .05 * (1. - smoothstep(0., .2, fibH)); }
  paper *= 1. - occ * .35;
  vec3 toner = vec3(.07, .07, .08);
  vec3 col = mix(paper, toner, ink);
  col += gloss * vec3(.85, .88, 1.) * .9;
  // sıcaklık: sayfanın üstünde turuncu bir soluk
  col = mix(col, col * vec3(1.12, .9, .72) + vec3(.10, .03, 0.) * (1. - ink), uHeat);
  // basım çizgisi
  if (uReveal < 900.) { float d = abs(p.y - uReveal); col += vec3(1., .45, .15) * exp(-d * d / 4.) * .35; }
  col *= uLit;
  outColor = vec4(col * a * uAlpha, a * uAlpha);
}`);

// sayfayı çiz: corners = sol üst, sağ üst, sağ alt, sol alt (ekran px); o: gen, ışık, vb.
function drawPage(g, corners, o = {}) {
  const gen = o.gen || 0;
  const cp = gen === 'photo' ? COPIES.photo : gen > 0 ? COPIES[gen - 1] : null;
  const u = {
    ...inkBase(),
    uM: screenToPageMat(corners, PW, PH),
    uSrc: cp ? 1 : 0,
    uG: cp ? cp.G.tex : PHOTO.tex,
    uPK: cp ? cp.PK.tex : PHOTO.tex,
    uTone: cp ? cp.tone : [0, 1, 0],
    uSeed: cp ? cp.seed : 0,
    uAlpha: o.alpha == null ? 1 : o.alpha,
    uLit: o.lit || [1, 1, 1],
    uHeat: o.heat || 0,
    uReveal: o.reveal == null ? 1e4 : o.reveal,
    uMacro: o.macro || 0,
    uTime: o.time || 0,
    uShimmer: o.shimmer || 0,
    uBlank: o.blank ? 1 : 0,
    uGloss: o.gloss || [-.5, -.6],
    uPowder: o.powder || 0,
  };
  run(pageProg, u, null);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(glc, 0, 0); g.restore();
}
// düz yerleşim yardımcıları: sayfanın mm noktası (px, py) ekranda (sx, sy)'de, s px/mm, açı r
function pageCorners(cx, cy, s, r = 0, ax = PW / 2, ay = PH / 2) {
  const c = Math.cos(r), sn = Math.sin(r);
  const P = (x, y) => { const dx = (x - ax) * s, dy = (y - ay) * s; return [cx + dx * c - dy * sn, cy + dx * sn + dy * c]; };
  return [...P(0, 0), ...P(PW, 0), ...P(PW, PH), ...P(0, PH)];
}
function pageShadow(g, corners, a = .5, blur = 40, off = 14) {
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.shadowColor = `rgba(0,0,0,${a})`; g.shadowBlur = blur; g.shadowOffsetY = off;
  g.fillStyle = 'rgba(0,0,0,1)'; g.beginPath();
  g.moveTo(corners[0], corners[1]); g.lineTo(corners[2], corners[3]); g.lineTo(corners[4], corners[5]); g.lineTo(corners[6], corners[7]); g.closePath();
  g.fill(); g.restore();
}
