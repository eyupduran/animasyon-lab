// ---------------------------------------------------------------------------------------------
// WebGL2: görüntü işleme motoru. Fotoğraf, yarım ton, tarama ve kopya benzetimi burada yapılır;
// sonuç 2B tuvale çizilir.
// ---------------------------------------------------------------------------------------------
const glc = makeCanvas(W, H);
const gl = glc.getContext('webgl2', { premultipliedAlpha: true, preserveDrawingBuffer: true, alpha: true, antialias: false });
if (!gl) throw new Error('WebGL2 yok');

const VS = `#version 300 es
in vec2 aPos; out vec2 vUv;
void main(){ vUv = aPos * .5 + .5; gl_Position = vec4(aPos, 0., 1.); }`;

const GLSL_COMMON = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv; out vec4 outColor;
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + 17.1; a *= .5; } return s; }
vec2 grad2(vec2 i){ float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453) * 6.2831853; return vec2(cos(a), sin(a)); }
float gnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*f*(f*(f*6.-15.)+10.);
  return mix(mix(dot(grad2(i), f), dot(grad2(i+vec2(1,0)), f-vec2(1,0)), u.x),
             mix(dot(grad2(i+vec2(0,1)), f-vec2(0,1)), dot(grad2(i+vec2(1,1)), f-vec2(1,1)), u.x), u.y) + .5; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
`;

const quad = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quad);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

function compile(fsSrc) {
  const mk = (type, src) => {
    const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      const lines = src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n');
      console.error(log + '\n' + lines);
      throw new Error('gölgelendirici: ' + log);
    }
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, mk(gl.VERTEX_SHADER, VS)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, GLSL_COMMON + fsSrc));
  gl.bindAttribLocation(p, 0, 'aPos'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  p.loc = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) { const u = gl.getActiveUniform(p, i); p.loc[u.name.replace(/\[0\]$/, '')] = { l: gl.getUniformLocation(p, u.name), type: u.type, size: u.size }; }
  return p;
}

function makeTex(w, h, opts = {}) {
  const t = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, opts.data || null);
  const f = opts.nearest ? gl.NEAREST : gl.LINEAR;
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  t.w = w; t.h = h;
  return t;
}
function texFromCanvas(c, opts = {}) {
  const t = makeTex(c.width, c.height, opts);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, c);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  if (opts.mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
  return t;
}
function makeTarget(w, h, opts) {
  const tex = makeTex(w, h, opts);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fb, w, h };
}

// bir gölgelendiriciyi hedefe (ya da ekrana) çalıştır
function run(prog, uniforms, target, clear = true) {
  gl.useProgram(prog);
  gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null);
  const w = target ? target.w : W, h = target ? target.h : H;
  gl.viewport(0, 0, w, h);
  if (clear) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  let unit = 0;
  for (const [name, v] of Object.entries(uniforms)) {
    const u = prog.loc[name]; if (!u) continue;
    const l = u.l;
    if (v && v.w && v.h && !(v instanceof Float32Array)) { // doku
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v); gl.uniform1i(l, unit); unit++;
    } else if (typeof v === 'number') {
      if (u.type === gl.INT || u.type === gl.BOOL) gl.uniform1i(l, v); else gl.uniform1f(l, v);
    } else if (u.type === gl.FLOAT_MAT3) gl.uniformMatrix3fv(l, false, v);
    else if (u.type === gl.FLOAT_VEC2) gl.uniform2fv(l, v);
    else if (u.type === gl.FLOAT_VEC3) gl.uniform3fv(l, v);
    else if (u.type === gl.FLOAT_VEC4) gl.uniform4fv(l, v);
    else if (u.type === gl.FLOAT) gl.uniform1fv(l, v);
  }
  gl.uniform2f(gl.getUniformLocation(prog, 'uRes'), w, h);
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// 3x3 izdüşüm: dört köşe eşlemesinden (kare → dörtgen) matris; ekran pikselinden sayfa mm'sine gitmek için tersi alınır
function squareToQuad(q) { // q: [x0,y0, x1,y1, x2,y2, x3,y3] (0,0)(1,0)(1,1)(0,1)
  const [x0, y0, x1, y1, x2, y2, x3, y3] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  let a, b, c, d, e, f, g, h;
  if (Math.abs(dx3) < 1e-9 && Math.abs(dy3) < 1e-9) { a = x1 - x0; b = x2 - x1; c = x0; d = y1 - y0; e = y2 - y1; f = y0; g = 0; h = 0; }
  else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den; h = (dx1 * dy3 - dx3 * dy1) / den;
    a = x1 - x0 + g * x1; b = x3 - x0 + h * x3; c = x0; d = y1 - y0 + g * y1; e = y3 - y0 + h * y3; f = y0;
  }
  return [a, b, c, d, e, f, g, h, 1]; // satır düzeninde: [a b c; d e f; g h 1]
}
function inv3(m) {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g;
  const det = a * A + b * B + c * Cc;
  return [A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, Cc / det, -(a * h - b * g) / det, (a * e - b * d) / det];
}
function mul3(m, n) {
  const r = new Array(9);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r[i * 3 + j] = m[i * 3] * n[j] + m[i * 3 + 1] * n[3 + j] + m[i * 3 + 2] * n[6 + j];
  return r;
}
// ekran köşeleri (sayfanın sol üst, sağ üst, sağ alt, sol alt köşesinin ekrandaki yeri) → ekran pikseli → sayfa mm matrisi (GLSL için sütun düzeni)
function screenToPageMat(corners, pw, ph) {
  const sq = squareToQuad(corners);           // birim kare → ekran
  const toScreen = mul3(sq, [1 / pw, 0, 0, 0, 1 / ph, 0, 0, 0, 1]); // mm → ekran
  const m = inv3(toScreen);                    // ekran → mm
  return new Float32Array([m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]]);
}
