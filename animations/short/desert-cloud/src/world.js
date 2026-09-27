// The valley: sky, red sandstone canyon, the wilted bud, the meadow that waits under the clay,
// rain, dust and the rain curtains of the storm. All motion is driven by uniforms set from time.
import * as THREE from 'three';
import { COMMON, VERT_WORLD } from './glsl.js';
import { mulberry, smooth, lerp, clamp } from './util.js';

// ---------------- height field (CPU; the mesh and the flower placement read it) ----------------
const h2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function vn(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz, u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
  return lerp(lerp(h2(ix, iz), h2(ix + 1, iz), u), lerp(h2(ix, iz + 1), h2(ix + 1, iz + 1), u), v) * 2 - 1;
}
function fbm(x, z, o = 4) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vn(x * f + i * 17.3, z * f); f *= 2.03; a *= 0.5; } return s; }
const terrace = (h, step) => { const k = h / step, i = Math.floor(k), f = k - i; return (i + smooth(0.5, 0.88, f)) * step; };

export function groundH(x, z) {
  const floor = fbm(x * 0.045, z * 0.045, 3) * 0.5 + fbm(x * 0.35, z * 0.35, 2) * 0.05;
  const wx = Math.abs(x + fbm(z * 0.018, 7.3, 3) * 16);
  const openRight = x > 0 ? 1 - smooth(-72, -100, z) : 1;
  const wall = smooth(32, 50, wx) * openRight;
  const wallH = 30 + fbm(x * 0.025, z * 0.025, 3) * 16;
  const ramp = smooth(-40, -112, z + fbm(x * 0.03, 3.1, 2) * 12) * (1 - smooth(42, 66, x));
  const mx = Math.abs(x + 14) + fbm(z * 0.04, 9.1, 3) * 18;
  const mesa = smooth(-106, -120, z) * (1 - smooth(56, 70, mx));
  const mesaH = 74 + fbm(x * 0.02, z * 0.02, 2) * 8;
  const far = smooth(-150, -185, z) * smooth(0.02, 0.18, fbm(x * 0.011 + 4, z * 0.011, 3));
  const farH = 50 + fbm(x * 0.01, z * 0.01, 2) * 34;
  let rock = Math.max(wall * wallH, ramp * 44, mesa * mesaH, far * farH);
  rock = terrace(rock + fbm(x * 0.06, z * 0.06, 2) * 1.5, 6.5);
  return floor * (1 - smooth(0.5, 4, rock)) + rock;
}
function slopeAt(x, z) {
  const e = 0.6, hx = groundH(x + e, z) - groundH(x - e, z), hz = groundH(x, z + e) - groundH(x, z - e);
  return Math.hypot(hx, hz) / (2 * e);
}

// ---------------- materials ----------------
export function makeUniforms() {
  return {
    uT: { value: 0 }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() },
    uSkyTop: { value: new THREE.Color() }, uSkyHor: { value: new THREE.Color() }, uCam: { value: new THREE.Vector3() },
    uAmb: { value: 1 }, uFlash: { value: 0 }, uWet: { value: 0 }, uRain: { value: 0 }, uRainbow: { value: 0 },
    uStars: { value: 0 }, uBloomR: { value: 0 }, uHaze: { value: 0 }, uCloud: { value: new THREE.Vector4(0, 5, 0, 1) },
  };
}
const mat = (U, vert, frag, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, ...(extra.uniforms || {}) }, vertexShader: COMMON + vert, fragmentShader: COMMON + frag, ...extra, uniforms: { ...U, ...(extra.uniforms || {}) } });

const TERRAIN_FRAG = /* glsl */`
varying vec3 vN;
vec2 vor(vec2 p) {            // distance to nearest cell edge (clay cracks)
  vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(x, y); vec2 o = vec2(h21(i + g), h21(i + g + 7.1)); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  return vec2(sqrt(d2) - sqrt(d1), d1);
}
void main() {
  vec3 n = normalize(vN);
  vec3 wp = vW;
  float dist = length(wp - uCam);
  float flat_ = smoothstep(.72, .92, n.y);
  // sandstone strata
  float band = wp.y * .55 + vn2(wp.xz * .03) * 2.2 + vn2(wp.xz * .11) * .5 + sin(wp.x * .05) * .4;
  float bi = floor(band);
  float r = h21(vec2(bi, 3.7));
  vec3 s1 = vec3(.74, .2, .08), s2 = vec3(.93, .45, .2), s3 = vec3(.48, .11, .06), s4 = vec3(.96, .64, .38);
  vec3 rock = r < .3 ? s1 : r < .55 ? s2 : r < .8 ? s3 : s4;
  rock = mix(rock, rock * (.8 + .4 * vn2(wp.xz * .6 + wp.y)), .5);
  rock *= .85 + .3 * smoothstep(.2, .8, fract(band));
  // the valley floor: baked clay with cracks
  vec3 clay = vec3(.86, .42, .19) * (.9 + .2 * vn2(wp.xz * .15));
  float crack = 0.;
  if (dist < 60. && flat_ > 0.) {
    vec2 cr = vor(wp.xz * 1.3);
    float crackW = mix(.05, .16, smoothstep(2., 40., dist));
    crack = (1. - smoothstep(.0, crackW, cr.x)) * (1. - smoothstep(18., 60., dist));
  }
  vec3 alb = mix(rock, mix(clay, vec3(.93, .6, .33), smoothstep(3., 14., wp.y)), flat_);
  alb = mix(alb, vec3(.42, .14, .06), crack * flat_ * .85);
  // the meadow after the rain, spreading from the bud
  float dB = length(wp.xz);
  float front = uBloomR - dB + frontN(wp.xz) * 13.;
  float green = smoothstep(0., 9., front) * smoothstep(.45, .8, n.y) * (1. - smoothstep(24., 40., wp.y));
  vec3 grass = mix(vec3(.08, .42, .18), vec3(.25, .62, .16), vn2(wp.xz * .25));
  // distant flowers read as colour, not as objects
  float fl = smoothstep(.62, .78, vn2(wp.xz * .9 + 3.)) * smoothstep(0., 12., front);
  grass = mix(grass, vec3(1., .12, .45), fl * .6 * smoothstep(20., 70., dist));
  float fl2 = smoothstep(.66, .8, vn2(wp.xz * .7 + 19.)) * smoothstep(0., 12., front);
  grass = mix(grass, vec3(1., .75, .1), fl2 * .5 * smoothstep(20., 70., dist));
  alb = mix(alb, grass, green);
  // wet ground darkens and mirrors the sky in its cracks
  float wet = uWet * (.75 + .25 * flat_);
  alb *= 1. - .45 * wet;
  float ao = mix(.55, 1., smoothstep(-.3, .7, n.y));
  vec3 col = light(alb, n, wp, ao);
  vec3 v = normalize(wp - uCam);
  float fres = pow(1. - max(dot(-v, n), 0.), 4.);
  float puddle = wet * flat_ * (1. - green) * clamp(crack * 1.4 + smoothstep(.62, .75, vn2(wp.xz * .35)), 0., 1.);
  if (uWet > 0.) {
    vec3 refl = skyCol(reflect(v, n));
    col = mix(col, refl * .9, puddle * .85 + wet * flat_ * fres * .5 * (1. - green * .85));
  }
  // heat: the far floor glows pale in the noon haze
  col = mix(col, uSkyHor * 1.05, uHaze * smoothstep(30., 160., dist) * .25);
  gl_FragColor = vec4(fogApply(col, wp), 1.);
}`;

const SKY_FRAG = /* glsl */`
void main() {
  vec3 d = normalize(vW - uCam);
  vec3 c = skyCol(d);
  // high thin clouds, drifting slowly
  vec2 p = d.xz / max(d.y + .12, .05);
  float w = smoothstep(.52, .85, fbm2(p * vec2(.9, 2.6) + vec2(uT * .01, 0.)));
  vec3 lit = mix(uSkyHor, vec3(1.), .5) + uSunCol * .15;
  c = mix(c, lit, w * .35 * smoothstep(.02, .25, d.y) * (1. - uRain));
  // stars at dusk
  vec2 sp = floor(d.xz / (d.y + .3) * 220.);
  float st = step(.9965, h21(sp)) * smoothstep(.1, .5, d.y);
  c += vec3(1., .95, .9) * st * uStars * (.6 + .4 * h21(sp + 5.)) * 1.2;
  c += rainbow(d);
  c += vec3(.75, .75, 1.2) * uFlash * .6 * smoothstep(-.1, .5, d.y);
  gl_FragColor = vec4(c, 1.);
}`;

const LIT_FRAG = /* glsl */`
varying vec3 vN;
uniform vec3 uAlb; uniform float uTrans;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vW - uCam);
  if (dot(n, v) > 0.) n = -n;
  vec3 col = light(uAlb * (1. - .3 * uWet), n, vW, 1.);
  col += uAlb * uSunCol * uTrans * pow(max(dot(v, uSunDir), 0.), 3.) * .6;   // light through thin petals
  gl_FragColor = vec4(fogApply(col, vW), 1.);
}`;

// flowers and grass: one instanced mesh each; growth is decided in the vertex shader from uBloomR
const INST_VERT = /* glsl */`
attribute vec4 aP;        // x, y, z, seed
attribute vec3 aC;        // colour
varying vec3 vN; varying vec3 vC; varying float vPart;
attribute float part;
uniform float uSize, uDelay;
void main() {
  float d = length(aP.xz);
  float front = uBloomR - d + frontN(aP.xz) * 13.;
  float k = clamp((front - uDelay - aP.w * 5.) / 5., 0., 1.);
  if (k <= 0.) { gl_Position = vec4(2., 2., 2., 1.); return; }
  float g = 1. + 2.2 * pow(k - 1., 3.) + 1.2 * pow(k - 1., 2.);     // overshoot as it pops open
  g *= step(.001, k);
  float s = uSize * (.65 + .7 * fract(aP.w * 13.1)) * g;
  vec3 p = position * s;
  float ang = aP.w * 6.283;
  p.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * p.xz;
  // wind sway grows with height
  float sway = sin(uT * 1.7 + aP.x * .3 + aP.z * .2) * .12 + sin(uT * 3.1 + aP.w * 20.) * .05;
  p.x += sway * position.y * s;
  vec4 w = modelMatrix * vec4(p + aP.xyz, 1.);
  vW = w.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vN.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * vN.xz;
  vC = aC; vPart = part;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const INST_FRAG = /* glsl */`
varying vec3 vN; varying vec3 vC; varying float vPart;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(vW - uCam);
  if (dot(n, v) > 0.) n = -n;
  vec3 alb = vPart < .5 ? vC : vPart < 1.5 ? vec3(1., .78, .15) : vec3(.12, .45, .14);
  vec3 col = light(alb, n, vW, .9);
  col += alb * uSunCol * pow(max(dot(v, uSunDir), 0.), 2.) * .35 * step(vPart, .5);
  gl_FragColor = vec4(fogApply(col, vW), 1.);
}`;

function flowerGeometry() {
  // five petals, a centre and a stem, merged; attribute "part": 0 petal, 1 centre, 2 stem
  const parts = [];
  const add = (g, part) => { g = g.toNonIndexed(); const n = g.attributes.position.count; g.setAttribute('part', new THREE.Float32BufferAttribute(new Array(n).fill(part), 1)); parts.push(g); };
  // flat, slightly cupped petals: a fan of six triangles each
  for (let i = 0; i < 5; i++) {
    const g = new THREE.CircleGeometry(1, 6);
    const P = g.attributes.position;
    for (let j = 0; j < P.count; j++) { const x = P.getX(j) * 0.16, y = P.getY(j) * 0.3 + 0.3; P.setXYZ(j, x, -0.25 * x * x / 0.03 * 0.03, y); }
    g.computeVertexNormals();
    g.rotateX(-0.4); g.rotateY(i / 5 * Math.PI * 2); g.translate(0, 1, 0);
    add(g, 0);
  }
  const c = new THREE.IcosahedronGeometry(0.12, 0); c.scale(1, 0.6, 1); c.translate(0, 1.03, 0); add(c, 1);
  const s = new THREE.CylinderGeometry(0.025, 0.035, 1, 3, 1, true); s.translate(0, 0.5, 0); add(s, 2);
  const leaf = new THREE.CircleGeometry(1, 5); leaf.scale(0.07, 0.22, 1); leaf.rotateX(-Math.PI / 2 + 0.5); leaf.translate(0, 0.25, 0.2); add(leaf, 2);
  return merge(parts);
}
function grassGeometry() {
  const parts = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.ConeGeometry(0.05, 1, 2, 1, true); g.translate(0, 0.5, 0);
    g.rotateZ((i % 3 - 1) * 0.35); g.rotateY(i * 1.1); g.translate(Math.cos(i * 2.1) * 0.08, 0, Math.sin(i * 2.1) * 0.08);
    g.scale(1, 0.6 + (i % 3) * 0.25, 1);
    const n = g.toNonIndexed(); n.setAttribute('part', new THREE.Float32BufferAttribute(new Array(n.attributes.position.count).fill(2), 1)); parts.push(n);
  }
  return merge(parts);
}
function merge(list) {
  const out = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'part']) {
    const arrs = list.map(g => g.attributes[name].array); const len = arrs.reduce((a, b) => a + b.length, 0);
    const buf = new Float32Array(len); let o = 0; for (const a of arrs) { buf.set(a, o); o += a.length; }
    out.setAttribute(name, new THREE.BufferAttribute(buf, name === 'part' ? 1 : 3));
  }
  return out;
}

// camera spots in the close shots: nothing grows through the lens
const KEEP_CLEAR = [[1.3, 2.4, 0.9], [0.9, 2.8, 0.8], [0.5, 1.3, 0.5], [-3.3, 5.6, 1.4], [-2.8, 5.25, 1.3], [5, 8.5, 1.4], [0.3, 0.9, 0.35], [-4.2, 16, 1.5],
  [2, 18, 1.5], [1.5, 21, 1.5], [-9, 30, 1.5], [-8, 26, 1.5], [3.5, 28, 1.5], [3, 25, 1.5], [-4.5, 20, 1.5], [-4.5, 22, 1.5], [-3, 11.5, 1.3], [-3, 13, 1.3], [-4, 7.4, 1.4], [6.3, 11.5, 1.3], [4.4, 6.5, 1.3]];

export function createWorld(scene, U) {
  // sky dome
  const sky = new THREE.Mesh(new THREE.SphereGeometry(1500, 32, 16), mat(U, VERT_WORLD, SKY_FRAG, { side: THREE.BackSide, depthWrite: false }));
  sky.renderOrder = -10; sky.frustumCulled = false;
  scene.add(sky);

  // terrain
  const g = new THREE.PlaneGeometry(440, 440, 300, 300);
  g.rotateX(-Math.PI / 2); g.translate(0, 0, -90);
  const P = g.attributes.position;
  for (let i = 0; i < P.count; i++) P.setY(i, groundH(P.getX(i), P.getZ(i)));
  g.computeVertexNormals();
  const terrainMat = mat(U, VERT_WORLD, TERRAIN_FRAG);
  const terrain = new THREE.Mesh(g, terrainMat);
  scene.add(terrain);

  // a fine patch under the bud so close-ups have real relief
  const fine = new THREE.PlaneGeometry(16, 16, 96, 96);
  fine.rotateX(-Math.PI / 2);
  const F = fine.attributes.position;
  for (let i = 0; i < F.count; i++) { const x = F.getX(i), z = F.getZ(i); F.setY(i, groundH(x, z) + 0.012 + fbm(x * 3, z * 3, 2) * 0.03 * smooth(8, 2, Math.hypot(x, z))); }
  fine.computeVertexNormals();
  const finePatch = new THREE.Mesh(fine, terrainMat);
  finePatch.renderOrder = 1;
  scene.add(finePatch);

  // boulders (same terrain shader: they take on strata and clay colours)
  const rnd = mulberry(7);
  const rockGeo = new THREE.IcosahedronGeometry(1, 3);
  const RP = rockGeo.attributes.position;
  const RN = rockGeo.attributes.normal;
  for (let i = 0; i < RP.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(RP, i).normalize();
    const r = 1 + vn(v.x * 2 + 3, v.z * 2 + v.y * 1.7) * 0.16;
    RN.setXYZ(i, v.x, v.y / 0.62, v.z);                    // smooth normals of the squashed pebble
    RP.setXYZ(i, v.x * r, v.y * r * 0.62, v.z * r);
  }
  for (let i = 0; i < RN.count; i++) { const n = new THREE.Vector3().fromBufferAttribute(RN, i).normalize(); RN.setXYZ(i, n.x, n.y, n.z); }
  const rocks = new THREE.InstancedMesh(rockGeo, terrainMat, 60);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const place = (i, x, z, s) => { e.set(rnd() * 0.3, rnd() * 6, rnd() * 0.3); q.setFromEuler(e); m4.compose(new THREE.Vector3(x, groundH(x, z) - s * 0.15, z), q, new THREE.Vector3(s, s, s)); rocks.setMatrixAt(i, m4); };
  place(0, 0.34, 0.26, 0.22);                 // the stone the last drop hits
  place(1, -0.55, -0.35, 0.11);
  place(2, 2.6, -1.8, 0.45);
  place(3, -4.5, -2.5, 0.6);
  for (let i = 4; i < 60; i++) {
    let x, z, g = 0;
    do { const a = rnd() * 6.28, r = 6 + rnd() * 34; x = Math.cos(a) * r; z = Math.sin(a) * r - 8; }
    while (g++ < 40 && (Math.hypot(x, z) < 14 || KEEP_CLEAR.some(([cx, cz, rr]) => Math.hypot(x - cx, z - cz) < rr + 2.5)));
    place(i, x, z, 0.3 + rnd() * rnd() * 2.2);
  }
  scene.add(rocks);

  // flowers + grass, placed on gentle ground around the bud
  const makeField = (geo, count, radius, pick, uSize, uDelay) => {
    const aP = new Float32Array(count * 4), aC = new Float32Array(count * 3);
    const r2 = mulberry(count + 11); let n = 0, guard = 0;
    while (n < count && guard++ < count * 30) {
      const u = r2(), a = r2() * Math.PI * 2, rr = radius * Math.pow(u, 0.62) + 0.35;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr * 0.85 - 4;
      if (Math.hypot(x - 0.34, z - 0.26) < 0.3) continue;
      if (KEEP_CLEAR.some(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r)) continue;
      const y = groundH(x, z); if (y > 20 || slopeAt(x, z) > 0.45) continue;
      aP.set([x, y - 0.02, z, r2()], n * 4);
      aC.set(pick(r2), n * 3);
      n++;
    }
    const ig = new THREE.InstancedBufferGeometry();
    ig.index = null;
    for (const k of ['position', 'normal', 'part']) ig.setAttribute(k, geo.attributes[k]);
    ig.setAttribute('aP', new THREE.InstancedBufferAttribute(aP, 4));
    ig.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 3));
    ig.instanceCount = n;
    const m = mat(U, INST_VERT, INST_FRAG, { uniforms: { uSize: { value: uSize }, uDelay: { value: uDelay } } });
    const mesh = new THREE.Mesh(ig, m); mesh.frustumCulled = false; mesh.userData.max = n;
    scene.add(mesh);
    return mesh;
  };
  const PAL = [[1, 0.1, 0.42], [1, 0.1, 0.42], [1, 0.72, 0.08], [1, 0.95, 0.9], [0.95, 0.35, 0.95], [1, 0.42, 0.12]];
  const col = PAL.map(c => new THREE.Color(...c));      // already linear-ish; keep them loud
  const flowers = makeField(flowerGeometry(), 14000, 120, r => { const c = col[Math.floor(r() * col.length)]; return [c.r, c.g, c.b]; }, 0.32, 3);
  const grass = makeField(grassGeometry(), 16000, 70, () => [0, 0, 0], 0.55, 0);

  // ---------------- the bud ----------------
  const bud = new THREE.Group();
  const litMat = (hex, trans = 0) => mat(U, VERT_WORLD, LIT_FRAG, { side: THREE.DoubleSide, uniforms: { uAlb: { value: new THREE.Color(hex) }, uTrans: { value: trans } } });
  const stemMat = litMat('#4f7a2a'), petalMat = litMat('#ff2f8a', 1), sepalMat = litMat('#3f6a22'), heartMat = litMat('#ffc21a');
  const STEM_N = 7, stem = [];
  for (let i = 0; i < STEM_N; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.09, 6), stemMat); bud.add(s); stem.push(s); }
  const head = new THREE.Group(); bud.add(head);
  const petals = [];
  for (let i = 0; i < 6; i++) {
    const pv = new THREE.Group(); pv.rotation.y = i / 6 * Math.PI * 2;
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), petalMat); p.scale.set(0.045, 0.11, 0.016); p.position.y = 0.1;
    const tilt = new THREE.Group(); tilt.add(p); pv.add(tilt); head.add(pv); petals.push(tilt);
  }
  const sepals = [];
  for (let i = 0; i < 4; i++) {
    const pv = new THREE.Group(); pv.rotation.y = i / 4 * Math.PI * 2 + 0.4;
    const p = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), sepalMat); p.scale.set(0.03, 0.075, 0.012); p.position.y = 0.06;
    const tilt = new THREE.Group(); tilt.add(p); pv.add(tilt); head.add(pv); sepals.push(tilt);
  }
  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), heartMat); heart.position.y = 0.05; head.add(heart);
  const leaves = [];
  for (let i = 0; i < 2; i++) {
    const pv = new THREE.Group(); pv.rotation.y = i * Math.PI + 0.6;
    const l = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), stemMat); l.scale.set(0.04, 0.012, 0.13); l.position.z = 0.12;
    const tilt = new THREE.Group(); tilt.add(l); pv.add(tilt); pv.position.y = 0.04; bud.add(pv); leaves.push(tilt);
  }
  bud.position.set(0, groundH(0, 0), 0);
  bud.scale.setScalar(1.6);
  scene.add(bud);

  function poseBud(t, lift, open, sway) {
    // stem as a chain of short segments: bent over when wilted, straight when alive
    const bend = lerp(1.9, 0.12, lift) + sway;
    let x = 0, y = 0, a = 0;
    const seg = 0.085;
    for (let i = 0; i < STEM_N; i++) {
      const da = bend / STEM_N * (0.4 + i / STEM_N * 1.2);
      a += da;
      const nx = x + Math.sin(a) * seg, ny = y + Math.cos(a) * seg;
      stem[i].position.set((x + nx) / 2, (y + ny) / 2, 0); stem[i].rotation.set(0, 0, -a);
      x = nx; y = ny;
    }
    head.position.set(x, y, 0); head.rotation.set(0, 0, -a);
    const hs = lerp(0.85, 1.15, lift);
    head.scale.setScalar(hs);
    for (const p of petals) p.rotation.x = lerp(-0.12, 1.25, open) + Math.sin(t * 2 + p.parent.rotation.y) * 0.02 * open;
    for (const s of sepals) s.rotation.x = lerp(0.25, 1.7, Math.max(open, lift * 0.3));
    heart.scale.setScalar(lerp(0.4, 1, open));
    for (const l of leaves) l.rotation.x = lerp(0.9, -0.15, lift);
    bud.rotation.y = -0.5;
  }

  // ---------------- rain ----------------
  const RAIN_N = 9000;
  const rg = new THREE.InstancedBufferGeometry();
  rg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  const seeds = new Float32Array(RAIN_N * 4); const r3 = mulberry(99);
  for (let i = 0; i < RAIN_N * 4; i++) seeds[i] = r3();
  rg.setAttribute('aS', new THREE.InstancedBufferAttribute(seeds, 4));
  rg.instanceCount = RAIN_N;
  const rain = new THREE.Mesh(rg, mat(U, /* glsl */`
    attribute vec4 aS; varying float vA; varying vec2 vUv;
    void main() {
      float box = 70., H = 42.;
      vec3 c = uCam;
      vec3 p;
      p.x = c.x + (fract(aS.x - c.x / box) - .5) * box;
      p.z = c.z + (fract(aS.y - c.z / box) - .5) * box;
      float fall = uT * (22. + 10. * aS.z) + aS.w * H;
      p.y = c.y + 22. - mod(fall, H);
      vec3 view = normalize(p - uCam);
      vec3 side = normalize(cross(view, vec3(0., 1., 0.)));
      float len = 1.1 + aS.z * .6;
      vec3 w = p + side * position.x * .035 * (1. + length(p - uCam) * .02) + vec3(.18, 1., .1) * position.y * len;
      vA = step(aS.z, uRain) * (1. - position.y) * smoothstep(1., 4., length(p - uCam)) * smoothstep(-.5, .5, p.y - 0.);
      vUv = position.xy + .5;
      vW = w;
      gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
    }`, /* glsl */`
    varying float vA; varying vec2 vUv;
    void main() { float a = vA * (1. - abs(vUv.x - .5) * 2.) * .42; gl_FragColor = vec4(mix(vec3(.75, .78, 1.), uSkyHor, .3) * (.8 + uFlash * 2.), a); }`,
  { transparent: true, depthWrite: false }));
  rain.frustumCulled = false; rain.renderOrder = 5;
  scene.add(rain);

  // rain curtains hanging from the storm, seen from afar
  const curtains = [];
  const CU = { uCurtain: { value: 0 }, uTop: { value: 30 }, uSeed: { value: 0 } };
  for (let i = 0; i < 9; i++) {
    const m = mat(U, /* glsl */`
      varying vec2 vUv; uniform float uTop;
      void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`, /* glsl */`
      varying vec2 vUv; uniform float uCurtain, uTop, uSeed;
      void main() {
        float streak = fbm2(vec2(vUv.x * 22. + uSeed * 9., vUv.y * 1.5 + uT * 3.2));
        float edge = smoothstep(0., .25, vUv.x) * smoothstep(1., .75, vUv.x);
        float reach = 1. - uCurtain;                         // curtain grows downward from the cloud
        float body = smoothstep(reach - .08, reach + .08, vUv.y);
        float a = (.25 + .55 * streak) * edge * body * uRain * smoothstep(0., .2, vUv.y) * .55;
        vec3 c = mix(uSkyHor, vec3(.6, .6, .95), .5) * (.8 + uFlash * 1.5);
        gl_FragColor = vec4(fogApply(c, vW), a);
      }`, { transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uCurtain: CU.uCurtain, uTop: CU.uTop, uSeed: { value: i * 1.37 } } });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m);
    q.geometry.translate(0, 0.5, 0);
    q.renderOrder = 4; q.frustumCulled = false;
    scene.add(q); curtains.push(q);
  }

  // dust: the wind made visible
  const DUST_N = 2600;
  const dg = new THREE.BufferGeometry();
  const dp = new Float32Array(DUST_N * 3), r4 = mulberry(5);
  for (let i = 0; i < DUST_N; i++) dp.set([r4(), r4(), r4()], i * 3);
  dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dustMat = mat(U, /* glsl */`
    uniform float uDust, uUp, uPx, uFrac; varying float vA;
    void main() {
      vec3 s = position;
      float keep = step(s.x * .7 + s.z * .3, uFrac);
      // box around the valley; drift with the wind (east in the heat, uphill after the turn)
      vec3 box = vec3(60., 7., 70.);
      vec3 drift = vec3(uT * .9, 0., 0.) + vec3(0., 0., -1.) * uUp * (uT - 24.) * 6.;
      vec3 p = (fract(s + drift / box) - .5) * box + vec3(0., 0., -12.);
      p.y = s.y * box.y;
      // near the slope the dust climbs
      float climb = uUp * smoothstep(-30., -60., p.z);
      p.y += climb * (-p.z - 30.) * .8;
      p.y += sin(uT * 1.3 + s.x * 40.) * .3;
      vec4 w = modelMatrix * vec4(p, 1.);
      vW = w.xyz;
      vec4 mv = viewMatrix * w;
      gl_Position = projectionMatrix * mv;
      float d = -mv.z;
      gl_PointSize = clamp(uPx * (.02 + s.z * .03) * (1. + uUp) / d, 1., 7.);
      vA = uDust * keep * smoothstep(3., 9., d) * (.3 + .7 * s.y) * (.35 + .4 * uUp);
    }`, /* glsl */`
    varying float vA;
    void main() { vec2 c = gl_PointCoord - .5; float a = smoothstep(.5, .1, length(c)) * vA; gl_FragColor = vec4(fogApply(mix(uSkyHor, vec3(1., .75, .5), .5) * 1.1, vW), a); }`,
  { transparent: true, depthWrite: false, uniforms: { uDust: { value: 1 }, uUp: { value: 0 }, uPx: { value: 1000 }, uFrac: { value: 1 } } });
  const dust = new THREE.Points(dg, dustMat); dust.frustumCulled = false; dust.renderOrder = 6;
  scene.add(dust);

  // the four drops of the first attempt and their little puffs of steam
  const dropMat = mat(U, VERT_WORLD, /* glsl */`
    varying vec3 vN;
    void main() { vec3 n = normalize(vN); vec3 v = normalize(vW - uCam); float f = pow(1. - abs(dot(n, v)), 2.);
      vec3 c = mix(vec3(.55, .75, 1.), vec3(1.), f) * (.8 + .6 * uSunCol.r) + skyCol(reflect(v, n)) * .3;
      gl_FragColor = vec4(c, .85); }`, { transparent: true });
  const dropMeshes = [...Array(4)].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), dropMat); d.scale.set(1, 1.35, 1); scene.add(d); return d; });
  const STEAM_N = 48;
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(STEAM_N * 3), 3));
  sg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(STEAM_N * 2), 2));
  const steam = new THREE.Points(sg, mat(U, /* glsl */`
    attribute vec2 aA; varying float vA; uniform float uPx;
    void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vec4 mv = viewMatrix * w; gl_Position = projectionMatrix * mv; gl_PointSize = uPx * aA.y / -mv.z; vA = aA.x; }`, /* glsl */`
    varying float vA;
    void main() { vec2 c = gl_PointCoord - .5; float a = smoothstep(.5, 0., length(c)) * vA; gl_FragColor = vec4(vec3(1., .96, .92) * 1.1, a * .7); }`,
  { transparent: true, depthWrite: false, uniforms: { uPx: { value: 1000 } } }));
  steam.frustumCulled = false; steam.renderOrder = 7;
  scene.add(steam);

  return {
    terrain, flowers, grass, rain, dust, bud, sky,
    setDensity(k) {
      flowers.geometry.instanceCount = Math.floor(flowers.userData.max * k);
      grass.geometry.instanceCount = Math.floor(grass.userData.max * k);
      rain.geometry.instanceCount = Math.floor(RAIN_N * (0.4 + 0.6 * k));
      dustMat.uniforms.uFrac.value = 0.5 + 0.5 * k;
    },
    update(t, e, h, px, camPos, drops, puffs) {
      dustMat.uniforms.uDust.value = e.dust; dustMat.uniforms.uUp.value = e.updraft; dustMat.uniforms.uPx.value = px;
      steam.material.uniforms.uPx.value = px;
      poseBud(t, e.budLift, e.budOpen, Math.sin(t * 1.3) * 0.04 * (1 - e.budLift * 0.5) + (h.pos[1] < 4 && Math.hypot(h.pos[0], h.pos[2]) < 2 ? 0.05 * Math.sin(t * 2.2) : 0));
      // curtains under the storm cloud, turned to face the camera
      const base = h.pos[1] - h.S * 0.35;
      CU.uCurtain.value = smooth(42.6, 43.6, t) * (1 - smooth(48.5, 51.5, t) * 0.9);
      curtains.forEach((c, i) => {
        c.visible = e.rain > 0.01;
        const a = i * 2.4, r = h.S * (0.25 + 0.12 * (i % 4));
        const x = h.pos[0] + Math.cos(a) * r * 1.4, z = h.pos[2] + Math.sin(a) * r * 0.8 + 6;
        c.position.set(x, groundH(x, z) - 1, z);
        c.scale.set(h.S * (0.55 + 0.1 * (i % 3)), Math.max(1, base - c.position.y), 1);
        c.rotation.y = Math.atan2(camPos.x - x, camPos.z - z);
        c.material.uniforms.uCurtain.value = CU.uCurtain.value;
      });
      dropMeshes.forEach((d, i) => { const q = drops[i]; d.visible = !!q; if (q) { d.position.set(...q.p); d.scale.set(q.r, q.r * 1.35, q.r); } });
      const P = steam.geometry.attributes.position, A = steam.geometry.attributes.aA;
      for (let i = 0; i < STEAM_N; i++) { const q = puffs[i]; if (q) { P.setXYZ(i, ...q.p); A.setXY(i, q.a, q.s); } else A.setXY(i, 0, 0); }
      P.needsUpdate = true; A.needsUpdate = true;
    },
  };
}
