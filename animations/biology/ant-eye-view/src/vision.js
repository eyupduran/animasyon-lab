// Two ways of seeing the ant's world:
// 1) the compound-eye mosaic: a post-process that, right of a wipe line, rebuilds the picture
//    from a hexagonal lattice of facets, each facet one blurred sample (one ommatidium = one point);
// 2) smell vision: soft glowing odour puffs (trail pheromone, food, colony odour) and a
//    pheromone ribbon on the ground.
import {
  PostProcess, Effect, Vector3, Matrix, Quaternion, Mesh, VertexData, StandardMaterial, Color3,
  DynamicTexture, Texture, Engine, MeshBuilder,
} from '@babylonjs/core';
import { rng } from './noise.js';

Effect.ShadersStore.mosaicFragmentShader = `
precision highp float;
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform vec2 res;
uniform float split;     // screen x (0..1) where the mosaic begins
uniform float cols;      // facets across the full width
uniform float amount;    // 0..1 strength
uniform float dim;       // smell-vision dimming 0..1
vec2 hexCenter(vec2 p, float s) {
  // pointy hex lattice with cell size s (pixels)
  vec2 r = vec2(1.0, 1.7320508);
  vec2 h = r * 0.5;
  vec2 a = mod(p / s, r) - h, b = mod(p / s - h, r) - h;
  vec2 g = dot(a, a) < dot(b, b) ? a : b;
  return p - g * s;
}
float hexDist(vec2 p, vec2 c, float s) {
  vec2 q = abs(p - c) / s;
  return max(dot(q, normalize(vec2(1.0, 1.7320508))), q.x);
}
void main(void) {
  vec4 base = texture2D(textureSampler, vUV);
  vec3 col = base.rgb;
  if (dim > 0.0) {
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, vec3(l) * vec3(0.55, 0.6, 0.72), dim * 0.85);
    col *= 1.0 - dim * 0.35;
  }
  if (amount > 0.0 && vUV.x > split) {
    vec2 px = vUV * res;
    float s = res.x / cols;
    vec2 c = hexCenter(px, s);
    // one ommatidium = one blurred sample around the facet centre
    vec3 acc = vec3(0.0); float w = 0.0;
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
      vec2 o = vec2(float(i), float(j)) * s * 0.18;
      float k = exp(-dot(o, o) / (s * s * 0.08));
      acc += texture2D(textureSampler, clamp((c + o) / res, 0.0, 1.0)).rgb * k; w += k;
    }
    vec3 m = acc / w;
    float l = dot(m, vec3(0.299, 0.587, 0.114));
    m = mix(m, vec3(l) * vec3(0.9, 1.0, 0.95), 0.35);
    float d = hexDist(px, c, s);
    float edge = smoothstep(0.40, 0.5, d);
    float dome = 1.0 - 0.25 * smoothstep(0.0, 0.46, d);
    m = m * dome * (1.0 - edge * 0.65);
    col = mix(col, m, amount);
  }
  gl_FragColor = vec4(col, base.a);
}`;

export function createMosaic(camera, engine) {
  const pp = new PostProcess('mosaic', 'mosaic', ['res', 'split', 'cols', 'amount', 'dim'], null, 1, camera, Texture.BILINEAR_SAMPLINGMODE, engine);
  const st = { split: 1, cols: 12, amount: 0, dim: 0 };
  pp.onApply = e => {
    e.setFloat2('res', pp.width, pp.height);
    e.setFloat('split', st.split); e.setFloat('cols', st.cols); e.setFloat('amount', st.amount); e.setFloat('dim', st.dim);
  };
  return st;
}

function puffTexture(scene) {
  const t = new DynamicTexture('puff', { width: 128, height: 128 }, scene, true);
  const c = t.getContext();
  const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128); t.update(); t.hasAlpha = true;
  return t;
}

// odour puffs: a few families, each a thin-instanced quad turned to the camera every frame
export function createSmell(scene) {
  const tex = puffTexture(scene);
  const families = {};
  const mk = (name, color) => {
    const m = MeshBuilder.CreatePlane('puff-' + name, { size: 1 }, scene);
    const mat = new StandardMaterial('puffm-' + name, scene);
    mat.emissiveColor = new Color3(...color); mat.diffuseColor = new Color3(0, 0, 0); mat.specularColor = new Color3(0, 0, 0);
    mat.opacityTexture = tex; mat.disableLighting = true; mat.alphaMode = Engine.ALPHA_ADD; mat.disableDepthWrite = true; mat.backFaceCulling = false;
    m.material = mat; m.isPickable = false; m.alwaysSelectAsActiveMesh = true;
    const buf = new Float32Array(900 * 16);
    m.thinInstanceSetBuffer('matrix', buf, 16, false);
    m.thinInstanceCount = 0;
    families[name] = { mesh: m, mat, buf, n: 0 };
  };
  mk('trail', [0.62, 0.38, 1.0]); mk('food', [1.0, 0.62, 0.18]); mk('colony', [0.3, 0.85, 0.78]); mk('foe', [1.0, 0.35, 0.3]);
  const tmp = new Matrix();
  // puffs: [{ x,y,z, s }] per family; camera rotation used for billboarding
  const set = (name, puffs, camera, alpha = 1) => {
    const f = families[name];
    f.mat.alpha = alpha;
    f.mesh.setEnabled(alpha > 0.01 && puffs.length > 0);
    if (!puffs.length || alpha <= 0.01) return;
    const q = Quaternion.FromRotationMatrix(camera.getWorldMatrix().getRotationMatrix());
    const n = Math.min(900, puffs.length);
    for (let i = 0; i < n; i++) { const p = puffs[i]; Matrix.ComposeToRef(new Vector3(p.s, p.s, p.s), q, new Vector3(p.x, p.y, p.z), tmp); f.buf.set(tmp.m, i * 16); }
    f.mesh.thinInstanceBufferUpdated('matrix');
    f.mesh.thinInstanceCount = n;
  };
  const hideAll = () => { for (const f of Object.values(families)) f.mesh.setEnabled(false); };
  return { set, hideAll, families };
}

// a glowing ribbon laid on the ground along frames (from pathAt(s)), revealed up to `upTo` mm
export function createRibbon(scene, name, pathAt, len, { width = 0.7, color = [0.62, 0.38, 1.0], lift = 0.06, dash = 1.4 } = {}) {
  const n = Math.ceil(len / 0.25);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const s = len * i / n;
    const f = pathAt(s);
    const side = Vector3.Cross(f.up, f.fwd).normalize();
    const w = width * (0.75 + 0.25 * Math.sin(s * 3.1));
    const a = f.pos.add(f.up.scale(lift)).add(side.scale(-w / 2)), b = f.pos.add(f.up.scale(lift)).add(side.scale(w / 2));
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z); uv.push(s / len, 0, s / len, 1);
    if (i < n) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const m = new Mesh(name, scene);
  const vd = new VertexData(); vd.positions = pos; vd.uvs = uv; vd.indices = idx;
  const nor = []; VertexData.ComputeNormals(pos, idx, nor); vd.normals = nor; vd.applyToMesh(m);
  // dashes (gaster touching the ground) × a reveal mask
  const dt = new DynamicTexture(name + '-d', { width: 1024, height: 16 }, scene, true);
  const c = dt.getContext();
  const reps = Math.max(1, Math.round(len / dash));
  for (let x = 0; x < 1024; x++) {
    const u = x / 1024 * reps; const f = u - Math.floor(u);
    const a = f < 0.55 ? Math.sin(f / 0.55 * Math.PI) : 0.12;
    c.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; c.fillRect(x, 0, 1, 16);
  }
  const vg = c.createLinearGradient(0, 0, 0, 16); vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,1)');
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = vg; c.fillRect(0, 0, 1024, 16);
  dt.update(); dt.hasAlpha = true;
  const mat = new StandardMaterial(name + '-m', scene);
  mat.emissiveColor = new Color3(...color); mat.diffuseColor = new Color3(0, 0, 0); mat.specularColor = new Color3(0, 0, 0);
  mat.opacityTexture = dt; mat.disableLighting = true; mat.alphaMode = Engine.ALPHA_ADD; mat.disableDepthWrite = true; mat.backFaceCulling = false;
  m.material = mat; m.isPickable = false;
  m.alwaysSelectAsActiveMesh = true;
  // reveal: rebuild index count so only [from, to] (mm) is drawn
  const all = idx.slice();
  let last = '';
  const show = (from, to, alpha) => {
    mat.alpha = alpha;
    m.setEnabled(alpha > 0.01 && to > from);
    const i0 = Math.max(0, Math.floor(from / len * n)), i1 = Math.min(n, Math.ceil(to / len * n));
    const key = i0 + ':' + i1;
    if (key !== last && i1 > i0) { last = key; m.setIndices(all.slice(i0 * 6, i1 * 6)); }
  };
  return { mesh: m, show };
}
