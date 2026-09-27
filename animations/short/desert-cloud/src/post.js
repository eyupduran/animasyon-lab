// After the scene: a small dual-filter bloom and one finishing pass (heat shimmer, saturation,
// vignette, tone mapping, sRGB). Only the scene target is multisampled; everything after it is
// a handful of cheap full-screen passes. Tiers trade resolution, MSAA and bloom for speed.
import * as THREE from 'three';

export const TIERS = {
  ultra: { dpr: 1, scale: 1, bloom: true, density: 1, msaa: 4 },
  high: { dpr: 1.25, scale: 1, bloom: true, density: 1, msaa: 4 },
  mid: { dpr: 1, scale: 0.85, bloom: true, density: 0.75, msaa: 2 },
  low: { dpr: 1, scale: 0.7, bloom: true, density: 0.5, msaa: 0 },
  min: { dpr: 1, scale: 0.55, bloom: false, density: 0.3, msaa: 0 },
};

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;
const DOWN = /* glsl */`
uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThreshold; varying vec2 vUv;
// a single NaN/Inf pixel would spread into a black blot, so the first level cleans its input
vec3 tap(vec2 o) { vec3 c = texture2D(tSrc, vUv + o * uTexel).rgb; return (any(isnan(c)) || any(isinf(c))) ? vec3(0.) : min(c, vec3(40.)); }
void main() {
  vec3 c = tap(vec2(0.)) * 4. + tap(vec2(-1., -1.)) + tap(vec2(1., -1.)) + tap(vec2(-1., 1.)) + tap(vec2(1., 1.));
  c /= 8.;
  if (uThreshold > 0.) { float l = max(c.r, max(c.g, c.b)); c *= smoothstep(uThreshold, uThreshold * 1.6, l); }
  gl_FragColor = vec4(c, 1.);
}`;
const UP = /* glsl */`
uniform sampler2D tSrc, tAdd; uniform vec2 uTexel; varying vec2 vUv;
vec3 tap(vec2 o) { return texture2D(tSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = tap(vec2(-2., 0.)) + tap(vec2(2., 0.)) + tap(vec2(0., -2.)) + tap(vec2(0., 2.))
         + (tap(vec2(-1., -1.)) + tap(vec2(1., -1.)) + tap(vec2(-1., 1.)) + tap(vec2(1., 1.))) * 2.;
  gl_FragColor = vec4(c / 12. + texture2D(tAdd, vUv).rgb, 1.);
}`;
const FINISH = /* glsl */`
uniform sampler2D tScene, tBloom; uniform float uBloom, uHaze, uT, uVig, uAspect; varying vec2 vUv;
void main() {
  vec2 uv = vUv;
  float m = uHaze * smoothstep(.62, .2, uv.y);          // heat shimmer above the ground at noon
  uv.x += sin(uv.y * 160. + uT * 7.) * .0009 * m + sin(uv.y * 71. - uT * 4.3) * .0006 * m;
  vec3 c = texture2D(tScene, uv).rgb;
  if (any(isnan(c)) || any(isinf(c))) c = texture2D(tScene, uv + vec2(1. / 1920., 0.)).rgb;
  c = max(c, 0.) + texture2D(tBloom, uv).rgb * uBloom;
  float l = dot(c, vec3(.2126, .7152, .0722));
  c = max(mix(vec3(l), c, 1.12), 0.);
  vec2 q = (vUv - .5) * vec2(uAspect, 1.);
  c *= 1. - uVig * smoothstep(.45, 1.25, length(q));
  gl_FragColor = vec4(c, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createPost(renderer, scene, camera) {
  const opts = { type: THREE.HalfFloatType, depthBuffer: false };
  const sceneRT = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: 4 });
  const LEVELS = 5;
  const down = [...Array(LEVELS)].map(() => new THREE.WebGLRenderTarget(8, 8, opts));
  const up = [...Array(LEVELS - 1)].map(() => new THREE.WebGLRenderTarget(8, 8, opts));
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mk = (frag, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
  const downMat = mk(DOWN, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThreshold: { value: 0 } });
  const upMat = mk(UP, { tSrc: { value: null }, tAdd: { value: null }, uTexel: { value: new THREE.Vector2() } });
  const finMat = mk(FINISH, { tScene: { value: sceneRT.texture }, tBloom: { value: null }, uBloom: { value: 0.5 }, uHaze: { value: 0 }, uT: { value: 0 }, uVig: { value: 0.35 }, uAspect: { value: 16 / 9 } }, { toneMapped: true });
  const blit = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(quad, cam); };
  let size = [16, 16], useBloom = true;
  const black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1); black.needsUpdate = true;

  return {
    get size() { return size; },
    setSize(w, h) {
      size = [w, h];
      sceneRT.setSize(w, h);
      let dw = w, dh = h;
      for (let i = 0; i < LEVELS; i++) { dw = Math.max(1, dw >> 1); dh = Math.max(1, dh >> 1); down[i].setSize(dw, dh); if (i < LEVELS - 1) up[i].setSize(dw, dh); }
    },
    setTier(name) {
      const T = { ...TIERS[name] };
      const Q = new URLSearchParams(location.search);            // debug overrides: ?msaa=0&bloom=0
      if (Q.has('msaa')) T.msaa = +Q.get('msaa'); if (Q.has('bloom')) T.bloom = Q.get('bloom') === '1';
      useBloom = T.bloom;
      if (sceneRT.samples !== T.msaa) { sceneRT.samples = T.msaa; sceneRT.dispose(); }
    },
    render(t, lk, e) {
      renderer.toneMappingExposure = lk.ex;
      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);
      if (useBloom) {
        let src = sceneRT.texture, sw = size[0], sh = size[1];
        for (let i = 0; i < LEVELS; i++) {
          downMat.uniforms.tSrc.value = src; downMat.uniforms.uTexel.value.set(1 / sw, 1 / sh);
          downMat.uniforms.uThreshold.value = i === 0 ? 1.9 : 0;
          blit(downMat, down[i]);
          src = down[i].texture; sw = down[i].width; sh = down[i].height;
        }
        for (let i = LEVELS - 2; i >= 0; i--) {
          const from = i === LEVELS - 2 ? down[LEVELS - 1] : up[i + 1];
          upMat.uniforms.tSrc.value = from.texture; upMat.uniforms.uTexel.value.set(0.5 / from.width, 0.5 / from.height);
          upMat.uniforms.tAdd.value = down[i].texture;
          blit(upMat, up[i]);
        }
        finMat.uniforms.tBloom.value = up[0].texture;
      } else finMat.uniforms.tBloom.value = black;
      finMat.uniforms.uBloom.value = lk.bloomGain * 0.55;
      finMat.uniforms.uHaze.value = e.haze; finMat.uniforms.uT.value = t;
      blit(finMat, null);
    },
  };
}
