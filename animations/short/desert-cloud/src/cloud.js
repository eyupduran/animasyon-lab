// Çise, the little cloud: a cluster of soft bubbles, two big eyes, pink cheeks and a vapour tail.
// It is posed every frame from hero(t); the bubbles boil gently in the vertex shader.
import * as THREE from 'three';
import { COMMON } from './glsl.js';
import { hero } from './score.js';
import { clamp, EASE, lerp } from './util.js';

// [x, y, z, r, appears-at-growth]  (face bubble radius 1; growth 0 = small cumulus)
const BODY = [
  [0, 0, 0, 1, 0], [-0.95, -0.16, -0.05, 0.72, 0], [0.97, -0.13, -0.05, 0.75, 0],
  [-0.42, 0.66, -0.12, 0.66, 0], [0.4, 0.72, -0.18, 0.72, 0], [-0.02, 0.92, -0.45, 0.55, 0],
  [-1.6, -0.32, -0.15, 0.46, 0], [1.62, -0.3, -0.1, 0.48, 0], [0, -0.3, -0.65, 0.85, 0], [0.25, 0.35, -0.75, 0.78, 0],
  [-0.7, -0.45, 0.2, 0.55, 0], [0.7, -0.45, 0.2, 0.55, 0],
  // the tower boils up as it climbs
  [-2.4, -0.2, -0.5, 0.85, 0.05], [2.5, -0.2, -0.5, 0.85, 0.08], [0, 1.45, -0.55, 0.95, 0.1],
  [-1.3, 0.95, -0.6, 0.85, 0.15], [1.4, 1.0, -0.6, 0.88, 0.18], [-0.75, 1.75, -0.65, 0.85, 0.25],
  [0.8, 2.0, -0.7, 0.9, 0.3], [0, 2.55, -0.75, 1.0, 0.38], [-0.9, 2.8, -0.8, 0.8, 0.45],
  [0.7, 3.25, -0.75, 0.85, 0.52], [-0.2, 3.7, -0.8, 0.95, 0.6], [0.5, 4.2, -0.85, 0.8, 0.68],
  [-1.5, 4.25, -0.9, 0.8, 0.75], [1.6, 4.35, -0.9, 0.85, 0.8], [-2.6, 4.45, -1, 0.62, 0.86],
  [2.7, 4.5, -1, 0.62, 0.9], [-3.3, -0.35, -0.8, 0.7, 0.3], [3.4, -0.3, -0.8, 0.72, 0.35],
  [-2.1, 1.9, -0.9, 0.75, 0.55], [2.2, 2.3, -0.9, 0.75, 0.6],
];
const TAIL = 5;

const BODY_VERT = /* glsl */`
varying vec3 vN; varying vec3 vL; varying float vSeed;
uniform float uBoil;
void main() {
  vec3 p = position;
  float seed = instanceMatrix[3].x * 1.7 + instanceMatrix[3].z * 3.1;
  // soft billows on every bubble
  float b = vn3(p * 2.1 + seed + uT * .25) - .5;
  b += (vn3(p * 4.3 - seed + uT * .4) - .5) * .5;
  p += normal * b * .09 * uBoil;
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.);
  vW = w.xyz; vSeed = seed;
  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const BODY_FRAG = /* glsl */`
varying vec3 vN; varying float vSeed;
uniform vec3 uCenter; uniform float uS, uHeavy, uCloudFlash;
void main() {
  vec3 n = normalize(vN);
  vec3 v = normalize(uCam - vW);
  float nd = dot(n, uSunDir);
  float wrap = clamp((nd + .55) / 1.55, 0., 1.);
  wrap = wrap * wrap * (3. - 2. * wrap);
  vec3 skyA = mix(uSkyHor, uSkyTop, .45);
  vec3 shade = mix(skyA, vec3(.95, .72, .82), .45) * mix(.85, 1., uAmb);
  vec3 lit = vec3(1.) * (.35 + .22 * length(uSunCol));
  lit = mix(lit, uSunCol * .42, .35);
  vec3 c = mix(shade, lit, wrap);
  // a heavy storm belly: dark violet underneath
  float ly = (vW.y - uCenter.y) / uS;
  c = mix(c, vec3(.2, .18, .42) * (.6 + .4 * length(uSkyTop)), uHeavy * smoothstep(.4, -.9, ly) * .85);
  c *= mix(1., .82, smoothstep(.2, -.9, ly));
  // silver lining: bright rim, strongest against the sun
  float fres = pow(1. - max(dot(n, v), 0.), 2.5);
  float back = pow(max(dot(-v, uSunDir), 0.), 2.);
  c += fres * (.18 + .9 * back) * mix(vec3(1.), uSunCol * .5, .5);
  // lightning inside the cloud
  float inner = vn3(vW / uS * 1.3 + vSeed) ;
  c += vec3(.85, .8, 1.25) * uCloudFlash * (.4 + 1.6 * inner * inner) * (1. - fres * .6) * 2.2;
  c += vec3(.7, .7, 1.) * uFlash * .5;
  gl_FragColor = vec4(fogApply(c, vW), 1.);
}`;
const EYE_FRAG = /* glsl */`
varying vec2 vUv;
uniform float uLid, uHappy, uDroop, uSide;
uniform vec2 uGaze;
float sd(vec2 p, vec2 r) { return (length(p / r) - 1.) * min(r.x, r.y); }
void main() {
  vec2 p = vUv * 2. - 1.;
  vec2 c = uGaze * vec2(.2, .16);
  vec2 q = p - c;
  float e = sd(q, vec2(.56, .74));
  // top lid: sloped inward when sad; bottom lid curve when happy
  float inner = q.x * uSide;
  float top = mix(.8, -.95, uLid) - uDroop * .35 * (.6 - inner);
  float bot = -1. + uHappy * (1.25 - .9 * q.x * q.x);
  float shape = max(e, max(q.y - top, bot - q.y));
  float aa = fwidth(shape) * 1.2;
  float a = 1. - smoothstep(-aa, aa, shape);
  // closed: a gentle curved line
  float closed = smoothstep(.8, .97, uLid) * (1. - uHappy);
  float line = abs(q.y + .2 - .35 * q.x * q.x) - .075;
  line = max(line, abs(q.x) - .55);
  float la = (1. - smoothstep(-aa, aa, line)) * closed;
  vec3 col = vec3(.07, .08, .2);
  // catch lights
  float h1 = 1. - smoothstep(.1, .14, length(q - vec2(-.2, .34)));
  float h2 = 1. - smoothstep(.05, .08, length(q - vec2(.2, -.2)));
  col = mix(col, vec3(1.), (h1 + h2 * .7) * (1. - smoothstep(.3, .7, uLid)) * step(shape, -.02));
  col += vec3(.15, .12, .3) * smoothstep(-.1, -.5, q.y) * .6;
  float alpha = max(a * (1. - closed), la);
  if (alpha < .01) discard;
  gl_FragColor = vec4(col, alpha);
}`;
const CHEEK_FRAG = /* glsl */`
varying vec2 vUv; uniform float uA;
void main() { float d = length(vUv * 2. - 1.); float a = smoothstep(1., .1, d) * uA; gl_FragColor = vec4(vec3(1., .42, .5), a); }`;
const QUAD_VERT = /* glsl */`
varying vec2 vUv;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

export function createCloud(scene, U) {
  const N = BODY.length + TAIL;
  const own = { uCenter: { value: new THREE.Vector3() }, uS: { value: 1 }, uHeavy: { value: 0 }, uCloudFlash: { value: 0 }, uBoil: { value: 1 } };
  const bodyMat = new THREE.ShaderMaterial({ uniforms: { ...U, ...own }, vertexShader: COMMON + BODY_VERT, fragmentShader: COMMON + BODY_FRAG });
  const geo = new THREE.IcosahedronGeometry(1, 4);
  const body = new THREE.InstancedMesh(geo, bodyMat, N);
  body.frustumCulled = false;
  scene.add(body);

  const face = new THREE.Group(); scene.add(face);
  const eyes = [-1, 1].map(side => {
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, uLid: { value: 0 }, uHappy: { value: 0 }, uDroop: { value: 0 }, uGaze: { value: new THREE.Vector2() }, uSide: { value: -side } }, vertexShader: COMMON + QUAD_VERT, fragmentShader: COMMON + EYE_FRAG, transparent: true, depthWrite: false });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.renderOrder = 3; face.add(q); return q;
  });
  const cheeks = [-1, 1].map(() => {
    const m = new THREE.ShaderMaterial({ uniforms: { ...U, uA: { value: 0.45 } }, vertexShader: COMMON + QUAD_VERT, fragmentShader: COMMON + CHEEK_FRAG, transparent: true, depthWrite: false });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); q.renderOrder = 2; face.add(q); return q;
  });

  const m4 = new THREE.Matrix4(), qt = new THREE.Quaternion(), yq = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0);
  const local = new THREE.Vector3();

  function update(t, h) {
    const [px, py, pz] = h.pos, S = h.S;
    yq.setFromAxisAngle(Y, h.yaw);
    own.uCenter.value.set(px, py, pz); own.uS.value = S; own.uHeavy.value = h.heavy; own.uCloudFlash.value = h.flash;
    own.uBoil.value = 0.7 + 0.6 * h.grow;
    const toWorld = (x, y, z, out) => { local.set(x * h.sx, y * h.sy, z * h.sx).applyQuaternion(yq).multiplyScalar(S); return out.set(px + local.x, py + local.y, pz + local.z); };
    let i = 0;
    for (const [x, y, z, r, th] of BODY) {
      let k = th === 0 ? 1 : clamp((h.grow - th) / 0.14);
      k = k <= 0 ? 0 : EASE.back(k);
      // the smallest bubbles puff a little on their own (alive, never still)
      const breathe = 1 + 0.03 * Math.sin(t * 2.1 + x * 3 + y * 5);
      // when sad the top sinks
      const sag = y > 0.3 ? -0.18 * h.droop : 0;
      toWorld(x, y + sag, z, v);
      const s = S * r * k * breathe;
      sc.set(s * h.sx, s * h.sy, s * h.sx);
      m4.compose(v, yq, sc); body.setMatrixAt(i++, m4);
    }
    // vapour tail: trails behind the motion and streams with the wind
    const prev = hero(t - 0.3).pos;
    const vel = [px - prev[0], 0, pz - prev[2]];
    const vl = Math.hypot(...vel);
    let dir = [0.75, -0.1, -0.25];
    if (vl > 0.02) dir = dir.map((d, j) => d * 0.4 - vel[j] / vl * clamp(vl * 2.5));
    const up = smoothUp(t);
    dir = [dir[0] * (1 - up), dir[1] + up * 0.35, dir[2] * (1 - up) - up];
    const dl = Math.hypot(...dir); dir = dir.map(d => d / dl);
    const tailK = 1 - clamp(h.grow * 1.3);
    for (let j = 1; j <= TAIL; j++) {
      const lag = hero(t - 0.07 * j).pos;
      const curl = Math.sin(t * 2.6 - j * 0.9) * 0.16 * j, curl2 = Math.cos(t * 1.9 - j * 0.7) * 0.1 * j;
      const d = S * (1.45 + 0.36 * j);
      v.set(lag[0] + dir[0] * d + dir[2] * curl * S, lag[1] + dir[1] * d + curl2 * S, lag[2] + dir[2] * d - dir[0] * curl * S);
      const s = S * (0.45 - 0.065 * j) * tailK;
      sc.set(s, s, s); qt.identity(); m4.compose(v, qt, sc); body.setMatrixAt(i++, m4);
    }
    body.instanceMatrix.needsUpdate = true;

    // face: eyes and cheeks sit on the front bubble, facing out along its surface
    const place = (q, x, y, size) => {
      const lx = x, ly = y, lz = Math.sqrt(Math.max(0, 1 - lx * lx - ly * ly)) + 0.035;
      toWorld(lx, ly, lz, q.position);
      const n = local.set(lx, ly, lz).normalize().applyQuaternion(yq);
      q.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
      q.scale.set(size * S * h.sx, size * S * h.sy, 1);
    };
    const gx = h.gaze[0] * 0.08, gy = h.gaze[1] * 0.06;
    eyes.forEach((q, j) => {
      const side = j ? 1 : -1;
      place(q, side * 0.33 + gx, 0.04 + gy, 0.43);
      const u = q.material.uniforms;
      u.uLid.value = h.lid; u.uHappy.value = h.happy; u.uDroop.value = h.droop; u.uGaze.value.set(h.gaze[0], h.gaze[1]);
    });
    cheeks.forEach((q, j) => { place(q, (j ? 1 : -1) * 0.58 + gx * 0.5, -0.24 + gy * 0.5, 0.34); q.material.uniforms.uA.value = 0.35 + 0.35 * h.happy; });
    face.visible = Math.cos(h.yaw) > -0.2;
  }
  return { body, update };
}
function smoothUp(t) { const k = clamp((t - 24.6) / 2); const e = 1 - clamp((t - 36) / 4); return k * k * (3 - 2 * k) * e; }
