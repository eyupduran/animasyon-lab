// The one place of the film: an open walnut music box at night, its brass movement in close-up.
// Units are millimetres. The pinned cylinder turns about X; teeth lie over its top with their tips
// at z = 0; pins rise from the back (+z), lift a tip and let it go as they pass (real mechanics).
// Everything visible is set from story time in update(t): no state carries from frame to frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { PINS, PITCH, HERO, R, HP, HS, Y_UNDER, TOOTH_T, BPR, STUB_BEAT, TC, T_MISS2, toothX, toothLen, beatsAt, rateAt, toothDeflect } from './score.js';
import { clamp, smooth, hash, rng, noise1 } from './util.js';

const PHI = 2 * Math.PI / BPR;
const TOP = Y_UNDER + TOOTH_T;            // top face of the teeth
const XH = toothX(HERO), LH = toothLen(HERO);
const shape = s => s * s * (3 - s) / 2;    // cantilever bend, 0 at root, 1 at tip

// ---------------- procedural textures ----------------
function canvasTex(w, h, draw, { repeat = [1, 1], srgb = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function brushed() {   // lengthwise streaks (roughness), along the texture's v axis
  return canvasTex(64, 512, (g, w, h) => {
    const r = rng(3); g.fillStyle = 'rgb(62,62,62)'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 700; i++) { const x = r() * w, v = 40 + r() * 60; g.fillStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.5})`; g.fillRect(x, 0, 0.6 + r() * 1.2, h); }
  });
}
function mottle(seed, base, spread) {
  return canvasTex(256, 256, (g, w, h) => {
    const r = rng(seed); g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2600; i++) { const v = base + (r() - 0.5) * spread; g.fillStyle = `rgba(${v},${v},${v},0.35)`; const s = 1 + r() * 7; g.beginPath(); g.arc(r() * w, r() * h, s, 0, 7); g.fill(); }
  });
}
function walnut(seed, dark = 1) {
  return canvasTex(1024, 256, (g, w, h) => {
    const r = rng(seed);
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, `rgb(${58 * dark},${36 * dark},${24 * dark})`); grd.addColorStop(1, `rgb(${46 * dark},${28 * dark},${19 * dark})`);
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y0 = r() * h, a = 0.05 + r() * 0.14, amp = 2 + r() * 9, f = 0.004 + r() * 0.01, ph = r() * 7;
      g.strokeStyle = r() < 0.5 ? `rgba(20,10,6,${a})` : `rgba(110,70,40,${a * 0.6})`; g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath(); for (let x = 0; x <= w; x += 8) { const y = y0 + Math.sin(x * f + ph) * amp + Math.sin(x * f * 3.1 + ph * 2) * amp * 0.3; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    }
  }, { srgb: true });
}

// ---------------- environment for reflections ----------------
// A dark room: a tall moonlit window high behind-left (the key light's direction), a faint cool
// wall, a warm walnut table underneath and one far lamp. Metal reads by what it reflects.
export const WIN_DIR = new THREE.Vector3(-0.6, 0.45, 0.66).normalize();
function environment(renderer) {
  const s = new THREE.Scene();
  const sky = new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { uWin: { value: WIN_DIR } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `varying vec3 vD; uniform vec3 uWin;
      void main(){
        vec3 floorC = vec3(0.085, 0.062, 0.045), wallC = vec3(0.055, 0.066, 0.09), ceilC = vec3(0.03, 0.034, 0.048);
        vec3 c = mix(floorC, wallC, smoothstep(-0.35, 0.05, vD.y));
        c = mix(c, ceilC, smoothstep(0.35, 0.9, vD.y));
        float w = max(0.0, dot(vD, uWin));
        c += vec3(0.22, 0.28, 0.4) * pow(w, 5.0);
        vec3 pool = normalize(vec3(uWin.x * -0.6, -1.0, uWin.z * -0.6));
        c += vec3(0.07, 0.08, 0.1) * pow(max(0.0, dot(vD, pool)), 12.0);
        gl_FragColor = vec4(c, 1.0);
      }`,
  }));
  s.add(sky);
  const win = new THREE.Group();
  win.position.copy(WIN_DIR).multiplyScalar(9.2); win.lookAt(0, 0, 0); s.add(win);
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 6.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.68, 1.0).multiplyScalar(1.5) }));
  win.add(pane);
  for (const [w, h, x, y] of [[0.07, 6.5, -0.9, 0], [5.7, 0.06, 0, 1.1]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0x000000 })); m.position.set(x, y, 0.01); win.add(m); }
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.6, 0.28).multiplyScalar(0.55) }));
  lamp.position.set(8.5, -0.8, -5); lamp.lookAt(0, 0, 0); s.add(lamp);
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.01);
  pm.dispose();
  return rt.texture;
}

// gear outline as an extruded shape (axis along X after rotation)
function gearGeom(r, teeth, depth, toothH = 0.45, hole = 0.8) {
  const sh = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a0 = i / teeth * Math.PI * 2, da = Math.PI * 2 / teeth;
    const pts = [[a0, r - toothH], [a0 + da * 0.18, r], [a0 + da * 0.45, r], [a0 + da * 0.62, r - toothH]];
    pts.forEach(([a, rr], k) => { const x = Math.cos(a) * rr, y = Math.sin(a) * rr; (i === 0 && k === 0) ? sh.moveTo(x, y) : sh.lineTo(x, y); });
  }
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); sh.holes.push(h);
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, -depth / 2); g.rotateY(Math.PI / 2);
  return g;
}

export function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0.004, 0.005, 0.008);
  const envTex = environment(renderer);
  scene.environment = envTex;

  const brushTex = brushed();
  const brassRough = mottle(9, 88, 60);
  const wood = walnut(21), woodDark = walnut(33, 0.75);

  const brass = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.6, 0.43, 0.21), metalness: 1, roughness: 0.3, roughnessMap: brassRough, envMapIntensity: 1.1 });
  const brassDark = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.55, 0.39, 0.2), metalness: 1, roughness: 0.46, roughnessMap: brassRough, envMapIntensity: 0.9 });
  const steel = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.78, 0.8, 0.83), metalness: 1, roughness: 0.24, envMapIntensity: 1.2 });
  const combSteel = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.74, 0.76, 0.79), metalness: 1, roughness: 0.3, roughnessMap: brushTex, envMapIntensity: 1.1 });
  const woodMat = new THREE.MeshStandardMaterial({ map: wood, roughness: 0.5, metalness: 0, color: new THREE.Color(1.5, 1.4, 1.3) });
  const tableMat = new THREE.MeshStandardMaterial({ map: woodDark, roughness: 0.42, metalness: 0, color: new THREE.Color(1.4, 1.3, 1.2) });
  tableMat.map = woodDark.clone(); tableMat.map.repeat.set(3, 6); tableMat.map.needsUpdate = true;
  const velvet = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.03, 0.028, 0.034), roughness: 1, metalness: 0 });
  const blackMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const shadowy = m => { m.castShadow = true; m.receiveShadow = true; return m; };

  // ---------------- lights ----------------
  const sun = new THREE.DirectionalLight(new THREE.Color(0.78, 0.86, 1.0), 1.5);
  sun.position.copy(WIN_DIR).multiplyScalar(150); sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  Object.assign(sun.shadow.camera, { left: -48, right: 48, top: 48, bottom: -48, near: 20, far: 320 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(new THREE.Color(0.14, 0.18, 0.26), new THREE.Color(0.05, 0.03, 0.02), 0.25);
  scene.add(hemi);

  // ---------------- cylinder ----------------
  const cyl = new THREE.Group(); scene.add(cyl);
  const body = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(R, R, 37, 128, 1), brass)); body.rotation.z = Math.PI / 2; cyl.add(body);
  for (const x of [-18.7, 18.7]) { const cap = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(R + 0.35, R + 0.35, 0.7, 96), brassDark)); cap.rotation.z = Math.PI / 2; cap.position.x = x; cyl.add(cap); }
  const axle = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 46, 24), steel)); axle.rotation.z = Math.PI / 2; cyl.add(axle);
  const wheel = shadowy(new THREE.Mesh(gearGeom(5.4, 44, 0.9), brass)); wheel.position.x = 19.6; cyl.add(wheel);
  const worm = shadowy(new THREE.Mesh(gearGeom(5.0, 36, 0.7), brassDark)); worm.position.x = -19.7; cyl.add(worm);
  // pins
  const pinGeo = new THREE.CylinderGeometry(0.085, 0.1, HP, 10); pinGeo.translate(0, R + HP / 2 - 0.02, 0);
  const pins = shadowy(new THREE.InstancedMesh(pinGeo, steel, PINS.length));
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  PINS.forEach((p, k) => { e.set(p.b * PHI, 0, 0); q.setFromEuler(e); m4.compose(v3.set(toothX(p.tooth), 0, 0), q, one); pins.setMatrixAt(k, m4); });
  cyl.add(pins);
  // the broken pin: a short, rough stub
  const stubGeo = new THREE.CylinderGeometry(0.1, 0.13, HS, 7, 1); stubGeo.translate(0, R + HS / 2 - 0.02, 0);
  { const p = stubGeo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > R + HS * 0.6) p.setY(i, p.getY(i) + (hash(i * 3.1) - 0.5) * 0.06); stubGeo.computeVertexNormals(); }
  const stub = shadowy(new THREE.Mesh(stubGeo, new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.6, 0.6, 0.62), metalness: 1, roughness: 0.45 })));
  stub.rotation.x = STUB_BEAT * PHI; stub.position.x = XH; cyl.add(stub);

  // ---------------- comb ----------------
  const combTopY = TOP;
  const shp = new THREE.Shape();
  const xs = PITCH.map((_, i) => toothX(i)), back = 17.5;
  shp.moveTo(xs[0] - 1.6, back); shp.lineTo(xs[0] - 1.6, toothLen(0));
  for (let i = 0; i < xs.length; i++) { shp.lineTo(xs[i] - 1.0, toothLen(i)); shp.lineTo(xs[i] + 1.0, toothLen(i)); }
  shp.lineTo(xs[17] + 1.6, toothLen(17)); shp.lineTo(xs[17] + 1.6, back); shp.closePath();
  const combGeo = new THREE.ExtrudeGeometry(shp, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
  combGeo.rotateX(Math.PI / 2);
  const comb = shadowy(new THREE.Mesh(combGeo, combSteel)); comb.position.y = combTopY - 0.08; scene.add(comb);
  const foot = shadowy(new THREE.Mesh(new RoundedBoxGeometry(40, combTopY - 1.8 + 7, 5.5, 3, 0.5), brassDark)); foot.position.set(0, (combTopY - 1.8 - 7) / 2, 14.5); scene.add(foot);
  for (const x of [-12.5, 0.5, 13]) {
    const hd = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.35, 0.55, 32), steel)); hd.position.set(x, combTopY + 0.25, 14.8); scene.add(hd);
    const slot = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.28), blackMat); slot.position.set(x, combTopY + 0.44, 14.8); slot.rotation.y = hash(x) * 3; scene.add(slot);
  }

  // teeth: one instanced mesh; the vertex shader bends each tooth (cantilever) and the fragment
  // shader lays the dust layer on the hero's top face
  const toothGeo = (() => {
    const w = 1.52 / 2, h = TOOTH_T / 2, r = 0.13, sh = new THREE.Shape();
    sh.moveTo(-w + r, -h); sh.lineTo(w - r, -h); sh.quadraticCurveTo(w, -h, w, -h + r); sh.lineTo(w, h - r); sh.quadraticCurveTo(w, h, w - r, h);
    sh.lineTo(-w + r, h); sh.quadraticCurveTo(-w, h, -w, h - r); sh.lineTo(-w, -h + r); sh.quadraticCurveTo(-w, -h, -w + r, -h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 1, steps: 30, bevelEnabled: false, curveSegments: 4 });
    g.computeVertexNormals();
    return g;
  })();
  const toothMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.8, 0.82, 0.85), metalness: 1, roughness: 0.26, roughnessMap: brushTex, envMapIntensity: 1.35 });
  const aDef = new THREE.InstancedBufferAttribute(new Float32Array(18), 1);
  const aDust = new THREE.InstancedBufferAttribute(new Float32Array(18), 1);
  const aLen = new THREE.InstancedBufferAttribute(new Float32Array(PITCH.map((_, i) => toothLen(i))), 1);
  const aHide = new THREE.InstancedBufferAttribute(new Float32Array(18), 1);
  toothGeo.setAttribute('aDef', aDef); toothGeo.setAttribute('aDust', aDust); toothGeo.setAttribute('aLen', aLen); toothGeo.setAttribute('aHide', aHide);
  toothMat.onBeforeCompile = sh => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aDef; attribute float aDust; attribute float aLen; attribute float aHide;
varying float vDust; varying vec3 vLoc; varying float vUp;`)
      .replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
{ float s = 1.0 - clamp(position.z, 0.0, 1.0); objectNormal.z += objectNormal.y * aDef * 1.5 * s * (2.0 - s) / (aLen * aLen); }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{ float s = 1.0 - clamp(position.z, 0.0, 1.0); transformed.y += aDef * s * s * (3.0 - s) * 0.5;
  // round the tip a little
  float tip = 1.0 - smoothstep(0.0, 0.06 / aLen, position.z); transformed.x *= 1.0 - 0.1 * tip * step(0.0, abs(position.x) - 0.5);
  transformed *= 1.0 - aHide; }
vDust = aDust; vLoc = vec3(position.x, position.y, position.z * aLen); vUp = normal.y;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying float vDust; varying vec3 vLoc; varying float vUp;
float dh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float dn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(dh(i), dh(i + vec2(1, 0)), f.x), mix(dh(i + vec2(0, 1)), dh(i + vec2(1, 1)), f.x), f.y); }`)
      .replace('#include <metalnessmap_fragment>', `#include <metalnessmap_fragment>
{ float grain = dn(vLoc.xz * 9.0) * 0.6 + dn(vLoc.xz * 31.0) * 0.4;
  float m = vDust * (smoothstep(0.25, 0.8, vUp) * (0.55 + 0.45 * grain) + (1.0 - smoothstep(-0.2, 0.3, abs(vUp))) * 0.35 * grain);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.24, 0.225, 0.2), clamp(m * 1.15, 0.0, 1.0));
  roughnessFactor = mix(roughnessFactor, 0.93, clamp(m * 1.3, 0.0, 1.0));
  metalnessFactor = mix(metalnessFactor, 0.05, clamp(m * 1.2, 0.0, 1.0)); }`);
  };
  const teeth = shadowy(new THREE.InstancedMesh(toothGeo, toothMat, 18));
  PITCH.forEach((_, i) => { m4.compose(v3.set(toothX(i), Y_UNDER + TOOTH_T / 2, 0), q.identity(), new THREE.Vector3(1, 1, toothLen(i))); teeth.setMatrixAt(i, m4); });
  teeth.frustumCulled = false;
  scene.add(teeth);

  // ---------------- frame, spring barrel, governor ----------------
  const bed = shadowy(new THREE.Mesh(new RoundedBoxGeometry(66, 1.5, 38, 3, 0.4), brassDark)); bed.position.set(-1, -7.75, 3.5); scene.add(bed);
  for (const x of [-21.0, 21.2]) {
    const post = shadowy(new THREE.Mesh(new RoundedBoxGeometry(1.6, 9.2, 5.5, 3, 0.35), brass)); post.position.set(x, -2.6, 0); scene.add(post);
    const bush = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 1.9, 24), steel)); bush.rotation.z = Math.PI / 2; bush.position.set(x, 0, 0); scene.add(bush);
  }
  const barrel = new THREE.Group(); barrel.position.set(24.5, -4.6, 13.1); scene.add(barrel);
  const drum = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(7.2, 7.2, 7.5, 64), brass)); drum.rotation.z = Math.PI / 2; drum.position.x = 4.2; barrel.add(drum);
  const bgear = shadowy(new THREE.Mesh(gearGeom(7.95, 96, 0.9), brass)); bgear.position.x = -4.9; barrel.add(bgear);
  const ratchet = shadowy(new THREE.Mesh(gearGeom(4.2, 18, 1.2, 0.9), steel)); ratchet.position.x = 8.6; barrel.add(ratchet);
  // governor: worm shaft standing in front of the worm wheel, two air-brake vanes on top
  const gov = new THREE.Group(); gov.position.set(-19.7, 0, -6.1); scene.add(gov);
  const shaft = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 20, 16), steel)); shaft.position.y = 2; gov.add(shaft);
  const screwTex = canvasTex(64, 256, (g, w, h) => { g.fillStyle = '#777'; g.fillRect(0, 0, w, h); g.strokeStyle = '#222'; g.lineWidth = 9; for (let y = -64; y < h + 64; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 32); g.stroke(); } });
  const wormMat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color(0.75, 0.77, 0.8), metalness: 1, roughness: 0.3, roughnessMap: screwTex, bumpMap: screwTex, bumpScale: 3 });
  const wormS = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 5, 24), wormMat)); wormS.position.y = 0; gov.add(wormS);
  // air-brake vanes; at speed a few faint copies spread over the shutter angle blur them
  const vanes = new THREE.Group(); vanes.position.y = 11.4; gov.add(vanes);
  const vaneGeo = (() => {
    const sh = new THREE.Shape(); sh.moveTo(-1.8, -0.9); sh.lineTo(0.9, -0.9); sh.absarc(0.9, 0, 0.9, -Math.PI / 2, Math.PI / 2, false); sh.lineTo(-1.8, 0.9); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 16 }); g.translate(0, 0, -0.08); return g;
  })();
  const ghosts = [];
  for (let k = 0; k < 7; k++) {
    const g = new THREE.Group(); vanes.add(g);
    const m = k === 0 ? brass : brass.clone();
    if (k) { m.transparent = true; m.depthWrite = false; }
    for (const s of [-1, 1]) { const v = new THREE.Mesh(vaneGeo, m); v.position.x = s * 2.4; v.rotation.y = s < 0 ? Math.PI : 0; if (!k) { v.castShadow = true; v.receiveShadow = true; } g.add(v); }
    ghosts.push({ g, m });
  }
  const hub = shadowy(new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.2, 20), brassDark)); vanes.add(hub);
  const bridge = shadowy(new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.7, 9, 2, 0.25), brassDark)); bridge.position.set(0, 12.9, 3.4); gov.add(bridge);
  const govPost = shadowy(new THREE.Mesh(new RoundedBoxGeometry(1.5, 21.2, 1.5, 2, 0.3), brassDark)); govPost.position.set(0, 2.6, 7.6); gov.add(govPost);

  // ---------------- the box and the table ----------------
  const boxG = new THREE.Group(); scene.add(boxG);
  const slab = (w, h, d, x, y, z, m = woodMat) => { const b = shadowy(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(1.2, Math.min(w, h, d) * 0.3)), m)); b.position.set(x, y, z); boxG.add(b); return b; };
  slab(92, 3, 66, 0, -10, 3);                         // floor
  slab(92, 22, 4, 0, 0, -32);                          // front wall (lower)
  slab(92, 30, 4, 0, 4, 38);                           // back wall
  slab(4, 30, 66, -48, 4, 3); slab(4, 30, 66, 48, 4, 3);
  slab(84, 1, 58, 0, -8.4, 3, velvet);                 // lining under the movement
  const lid = new THREE.Group(); lid.position.set(0, 19, 40); lid.rotation.x = 1.8; boxG.add(lid);
  { const l = shadowy(new THREE.Mesh(new RoundedBoxGeometry(96, 4, 72, 3, 1.2), woodMat)); l.position.set(0, 0, -36); lid.add(l); const v = new THREE.Mesh(new THREE.BoxGeometry(84, 0.6, 60), velvet); v.position.set(0, -2.2, -36); lid.add(v); }
  const table = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), tableMat); table.rotation.x = -Math.PI / 2; table.position.y = -11.5; table.receiveShadow = true; scene.add(table);

  // ---------------- dust ----------------
  const dustMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 1000 }, uLight: { value: WIN_DIR.clone().negate() }, uCam: { value: new THREE.Vector3() }, uWarm: { value: 0 } },
    vertexShader: `
      attribute float aSize; attribute float aTone; attribute float aAir;
      uniform float uScale; uniform vec3 uLight; uniform vec3 uCam; uniform float uWarm;
      varying vec3 vCol;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.6, aSize * uScale / -mv.z);
        vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
        vec3 v = normalize(uCam - wp);
        float fwd = pow(max(0.0, dot(v, uLight)), 5.0);          // light scattered forward, toward the lens
        vec3 base = mix(vec3(0.1, 0.095, 0.085), vec3(0.24, 0.225, 0.2), aTone);
        vec3 airCol = mix(vec3(0.55, 0.62, 0.75), vec3(1.0, 0.72, 0.4), uWarm);
        float glow = aAir * (0.35 + 5.0 * fwd) * (0.6 + 0.8 * aTone);
        vCol = base * (1.0 - aAir * 0.4) + airCol * glow;
      }`,
    fragmentShader: `
      varying vec3 vCol;
      void main() {
        vec2 c = gl_PointCoord - 0.5; float r = length(c);
        if (r > 0.5) discard;
        gl_FragColor = vec4(vCol, 1.0 - smoothstep(0.32, 0.5, r));
      }`,
  });
  dustMat.alphaToCoverage = true;
  const r = rng(77);
  const ND = 1600, NA = 240;
  const dust = [];
  for (let i = 0; i < ND; i++) {
    const v = Math.pow(r(), 0.9) * 0.97 + 0.015;
    dust.push({
      u: (r() - 0.5) * 1.3, v, h: 0.004 + r() * r() * 0.05, size: 0.016 + r() * r() * 0.05, tone: r(),
      early: v < 0.4 && r() < 0.3, stay: v > 0.72 && r() < 0.06,
      tl: TC + 0.035 * v + 0.02 * r(), vy: (9 + 30 * r()) * (0.35 + 0.65 * (1 - v)), vx: (r() - 0.5) * 22, vz: -(r() * 12) + 3,
      f1: 0.2 + r() * 0.35, f2: 0.15 + r() * 0.3, f3: 0.1 + r() * 0.3, p1: r() * 7, p2: r() * 7, p3: r() * 7, amp: 0.25 + r() * 0.6, settle: 0.12 + r() * 0.22,
      te: T_MISS2 + 0.1 + r() * 0.2,
    });
  }
  const motes = [];
  for (let i = 0; i < NA; i++) motes.push({ x: (r() - 0.5) * 80, y: -4 + r() * 38, z: -34 + r() * 60, size: 0.06 + r() * 0.12, tone: r(), f: 0.03 + r() * 0.08, p: r() * 7, a: 1 + r() * 3 });
  const dustGeo = new THREE.BufferGeometry();
  const pos = new Float32Array((ND + NA) * 3), size = new Float32Array(ND + NA), tone = new Float32Array(ND + NA), air = new Float32Array(ND + NA);
  dust.forEach((d, i) => { size[i] = d.size; tone[i] = d.tone; });
  motes.forEach((m, k) => { const i = ND + k; size[i] = m.size; tone[i] = m.tone; air[i] = 1; });
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  dustGeo.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  dustGeo.setAttribute('aTone', new THREE.BufferAttribute(tone, 1));
  dustGeo.setAttribute('aAir', new THREE.BufferAttribute(air, 1));
  const points = new THREE.Points(dustGeo, dustMat); points.frustumCulled = false; scene.add(points);

  // where a resting grain sits on the hero tooth, given the tooth's tip deflection d
  const onTooth = (d, dd, out) => {
    const s = 1 - dd.v;
    out[0] = XH + dd.u; out[1] = TOP + dd.h + d * shape(s); out[2] = dd.v * LH;
  };
  const tmp = [0, 0, 0];
  let dustCount = ND;

  const pinMats = PINS.map((_, k) => { const mm = new THREE.Matrix4(); pins.getMatrixAt(k, mm); return mm; });
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  let pinsHidden = '';
  function update(t, { hide = null, camPos, pxScale, warm = 0, dustFrac = 1 }) {
    const B = beatsAt(t);
    cyl.rotation.x = -B * PHI;
    const hk = hide ? hide[0] + hide[1] : '';
    const hidden = i => !hide ? false : hide[0] === 'L' ? i < hide[1] : i > hide[1];
    if (hk !== pinsHidden) { pinsHidden = hk; PINS.forEach((p, k) => pins.setMatrixAt(k, hidden(p.tooth) ? zero : pinMats[k])); pins.instanceMatrix.needsUpdate = true; }
    // spring barrel turns slowly the other way; governor runs fast
    barrel.rotation.x = B * PHI * 44 / 96;
    const va = B * Math.PI * 2 * 1.35, span = rateAt(t) * Math.PI * 2 * 1.35 / 60;
    ghosts.forEach(({ g, m }, k) => { g.rotation.y = va - span * k / 6; if (k) { m.opacity = 0.42 * clamp(span / 0.5) * (1 - k / 7); g.visible = m.opacity > 0.01; } });
    wormS.rotation.y = va;
    for (let i = 0; i < 18; i++) {
      aDef.array[i] = toothDeflect(i, t, B);
      aHide.array[i] = hidden(i) ? 1 : 0;
    }
    // the dust layer on the hero thins as grains leave it
    const dh = t < T_MISS2 + 0.1 ? 1 : t < TC ? 0.9 : 0.9 - 0.82 * smooth((t - TC) / 0.35);
    aDust.array[HERO] = dh;
    aDef.needsUpdate = true; aHide.needsUpdate = true; aDust.needsUpdate = true;

    // dust grains: attached, dropped at the near miss, or thrown at the climax (pure functions of t)
    const dHero = aDef.array[HERO];
    const n = Math.floor(ND * dustFrac);
    for (let i = 0; i < ND; i++) {
      const d = dust[i];
      if (i >= n) { pos[i * 3 + 1] = -9999; air[i] = 0; continue; }
      let x, y, z, a = 0;
      if (d.early && t > d.te) {
        const s = t - d.te; onTooth(toothDeflect(HERO, d.te), d, tmp);
        x = tmp[0] + d.vx * 0.02 * (1 - Math.exp(-s / 0.3)) + 0.2 * noise1(s * d.f1 + d.p1, i);
        y = tmp[1] - 2.6 * (s - 0.18 * (1 - Math.exp(-s / 0.18)));
        z = tmp[2] + 0.2 * noise1(s * d.f2 + d.p2, i + 7); a = 0.5;
      } else if (!d.stay && !d.early && t > d.tl) {
        const s = t - d.tl, tau = 0.22; onTooth(toothDeflect(HERO, d.tl), d, tmp);
        const k = tau * (1 - Math.exp(-s / tau)), w = smooth(s / 0.9);
        x = tmp[0] + d.vx * k + w * d.amp * (Math.sin(s * d.f1 + d.p1) - Math.sin(d.p1));
        y = tmp[1] + d.vy * k + w * d.amp * 0.7 * (Math.sin(s * d.f2 + d.p2) - Math.sin(d.p2)) - d.settle * s;
        z = tmp[2] + d.vz * k + w * d.amp * (Math.sin(s * d.f3 + d.p3) - Math.sin(d.p3));
        a = clamp(s / 0.08);
      } else {
        onTooth(dHero, d, tmp); [x, y, z] = tmp;
      }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; air[i] = a;
    }
    for (let k = 0; k < NA; k++) {
      const m = motes[k], i = ND + k;
      pos[i * 3] = m.x + m.a * Math.sin(t * m.f + m.p);
      pos[i * 3 + 1] = m.y + m.a * 0.6 * Math.sin(t * m.f * 0.8 + m.p * 2) - 0.08 * t;
      pos[i * 3 + 2] = m.z + m.a * Math.sin(t * m.f * 1.3 + m.p * 3);
    }
    dustGeo.attributes.position.needsUpdate = true; dustGeo.attributes.aAir.needsUpdate = true;
    dustMat.uniforms.uCam.value.copy(camPos); dustMat.uniforms.uScale.value = pxScale; dustMat.uniforms.uWarm.value = warm;
  }

  function setShadow(size) { sun.shadow.mapSize.set(size, size); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  return { scene, update, setShadow, sun, heroTip: new THREE.Vector3(XH, TOP, 0) };
}
