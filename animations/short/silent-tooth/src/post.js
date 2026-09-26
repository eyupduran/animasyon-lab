// Cinema chain: scene (linear HDR, MSAA, depth texture) → half-res downsample with linear depth →
// single-pass bokeh depth of field (golden-angle spiral gather, circle of confusion from depth) →
// bloom from the blurred image (dual-filter pyramid) → composite: sharp/blurred mix by CoC, bloom,
// exposure, the film's two-state grade (cold "dust" → warm "karar"), ACES, vignette, fade, still dither.
import * as THREE from 'three';

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const DEPTH = `
uniform float uNear, uFar;
float viewZ(float d) { return (uNear * uFar) / (uFar - (uFar - uNear) * d); }`;
const COC = `
uniform float uFocus, uBlur, uMaxR;
float coc(float z) { return min(uMaxR, uBlur * abs(1.0 - uFocus / z)); }`;

export const TIERS = {
  ultra: { scale: 1, dpr: 1, msaa: 4, step: 0.55, shadow: 4096, bloom: 6 },
  high: { scale: 1, dpr: 1.5, msaa: 4, step: 0.85, shadow: 2048, bloom: 6 },
  mid: { scale: 0.85, dpr: 1.25, msaa: 4, step: 1.25, shadow: 2048, bloom: 5 },
  low: { scale: 0.72, dpr: 1, msaa: 2, step: 1.9, shadow: 1024, bloom: 5 },
  min: { scale: 0.55, dpr: 1, msaa: 0, step: 2.8, shadow: 1024, bloom: 4 },
};

export function createPost(renderer) {
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  const qs = new THREE.Scene(); qs.add(quad);
  const pass = (mat, target) => { quad.material = mat; renderer.setRenderTarget(target); renderer.render(qs, cam); };
  const mat = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const rtOpt = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };

  let tier = TIERS.high, W = 2, H = 2;
  let rtScene = null, rtHalf, rtDof, down = [], up = [];
  function makeScene() {
    if (rtScene) rtScene.dispose();
    rtScene = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: tier.msaa, depthTexture: new THREE.DepthTexture(W, H, THREE.UnsignedIntType), minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  }
  function makeRest() {
    for (const r of [rtHalf, rtDof, ...down, ...up]) r && r.dispose();
    const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1);
    rtHalf = new THREE.WebGLRenderTarget(hw, hh, rtOpt);
    rtDof = new THREE.WebGLRenderTarget(hw, hh, rtOpt);
    down = []; up = [];
    let w = hw, h = hh;
    for (let i = 0; i < tier.bloom; i++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); down.push(new THREE.WebGLRenderTarget(w, h, rtOpt)); up.push(new THREE.WebGLRenderTarget(w, h, rtOpt)); }
  }

  // full → half: colour average, linear depth (nearest of four) in alpha
  const mDown = mat(`${DEPTH}
    uniform sampler2D tColor, tDepth; uniform vec2 uTexel; varying vec2 vUv;
    // over-bright speculars can overflow half floats: clean them before anything spreads them
    vec3 fetch(vec2 uv) { vec3 c = texture2D(tColor, uv).rgb; if (any(isnan(c)) || any(isinf(c))) return vec3(0.0); return min(c, vec3(60.0)); }
    void main() {
      vec2 o = uTexel * 0.5;
      vec3 c = fetch(vUv + vec2(-o.x, -o.y)) + fetch(vUv + vec2(o.x, -o.y)) + fetch(vUv + vec2(-o.x, o.y)) + fetch(vUv + vec2(o.x, o.y));
      float z = min(min(viewZ(texture2D(tDepth, vUv + vec2(-o.x, -o.y)).x), viewZ(texture2D(tDepth, vUv + vec2(o.x, -o.y)).x)), min(viewZ(texture2D(tDepth, vUv + vec2(-o.x, o.y)).x), viewZ(texture2D(tDepth, vUv + vec2(o.x, o.y)).x)));
      gl_FragColor = vec4(c * 0.25, z);
    }`, { tColor: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uNear: { value: 1 }, uFar: { value: 1000 } });

  // bokeh gather on the half-res image (radii in half-res pixels); alpha = foreground coverage
  const mDof = mat(`${COC}
    uniform sampler2D tHalf; uniform vec2 uTexel; uniform float uStep; varying vec2 vUv;
    void main() {
      vec4 c0 = texture2D(tHalf, vUv);
      vec3 col = c0.rgb; float cz = c0.a; float cs = coc(cz);
      float tot = 1.0, fg = 0.0, rad = uStep;
      for (int i = 0; i < 420; i++) {
        if (rad >= uMaxR) break;
        float ang = float(i) * 2.39996323;
        vec4 s = texture2D(tHalf, vUv + vec2(cos(ang), sin(ang)) * uTexel * rad);
        float ss = coc(s.a);
        if (s.a > cz) ss = clamp(ss, 0.0, cs * 2.0);
        float m = smoothstep(rad - 0.5, rad + 0.5, ss);
        col += mix(col / tot, s.rgb, m);
        if (s.a < cz * 0.97) fg += m;
        tot += 1.0; rad += uStep / rad;
      }
      gl_FragColor = vec4(col / tot, clamp(fg / tot * 3.0, 0.0, 1.0));
    }`, { tHalf: { value: null }, uTexel: { value: new THREE.Vector2() }, uStep: { value: 1 }, uFocus: { value: 100 }, uBlur: { value: 10 }, uMaxR: { value: 20 } });

  const mPre = mat(`
    uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThresh; varying vec2 vUv;
    void main() {
      vec2 o = uTexel;
      vec3 c = (texture2D(tSrc, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tSrc, vUv + vec2(o.x, -o.y)).rgb + texture2D(tSrc, vUv + vec2(-o.x, o.y)).rgb + texture2D(tSrc, vUv + vec2(o.x, o.y)).rgb) * 0.25;
      float l = max(c.r, max(c.g, c.b));
      float k = max(0.0, l - uThresh); k = k * k / (k + 0.5);
      gl_FragColor = vec4(c * (k / max(l, 1e-4)), 1.0);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uThresh: { value: 1.0 } });
  const mD = mat(`
    uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
    void main() {
      vec2 o = uTexel;
      vec3 c = texture2D(tSrc, vUv).rgb * 4.0 + texture2D(tSrc, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tSrc, vUv + vec2(o.x, -o.y)).rgb + texture2D(tSrc, vUv + vec2(-o.x, o.y)).rgb + texture2D(tSrc, vUv + vec2(o.x, o.y)).rgb;
      gl_FragColor = vec4(c / 8.0, 1.0);
    }`, { tSrc: { value: null }, uTexel: { value: new THREE.Vector2() } });
  const mU = mat(`
    uniform sampler2D tSrc, tLow; uniform vec2 uTexel; varying vec2 vUv;
    void main() {
      vec2 o = uTexel * 1.5;
      vec3 l = texture2D(tLow, vUv + vec2(-o.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(o.x, 0.0)).rgb + texture2D(tLow, vUv + vec2(0.0, -o.y)).rgb + texture2D(tLow, vUv + vec2(0.0, o.y)).rgb
             + (texture2D(tLow, vUv + vec2(-o.x, -o.y)).rgb + texture2D(tLow, vUv + vec2(o.x, -o.y)).rgb + texture2D(tLow, vUv + vec2(-o.x, o.y)).rgb + texture2D(tLow, vUv + vec2(o.x, o.y)).rgb) * 0.5;
      gl_FragColor = vec4(texture2D(tSrc, vUv).rgb + l / 6.0, 1.0);
    }`, { tSrc: { value: null }, tLow: { value: null }, uTexel: { value: new THREE.Vector2() } });

  const mComp = mat(`${DEPTH}${COC}
    uniform sampler2D tSharp, tDepth, tDof, tBloom;
    uniform float uExposure, uWarm, uFade, uBloom; uniform vec2 uRes;
    varying vec2 vUv;
    vec3 aces(vec3 v) {
      const mat3 i = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
      const mat3 o = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
      v = i * v; vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return clamp(o * (a / b), 0.0, 1.0);
    }
    float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main() {
      vec3 sharp = texture2D(tSharp, vUv).rgb;
      if (any(isnan(sharp)) || any(isinf(sharp))) sharp = vec3(0.0);
      sharp = min(sharp, vec3(60.0));
      float c = coc(viewZ(texture2D(tDepth, vUv).x));
      vec4 d = texture2D(tDof, vUv);
      float w = max(smoothstep(0.6, 1.6, c), d.a);
      vec3 col = mix(sharp, d.rgb, w);
      col += texture2D(tBloom, vUv).rgb * uBloom;
      col *= uExposure;
      // two-state grade: "dust" (cold, pale) → "karar" (warm, full)
      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 cold = mix(vec3(l), col, 0.84) * vec3(0.92, 0.98, 1.08);
      vec3 warm = mix(vec3(l), col, 1.14) * vec3(1.13, 0.99, 0.8);
      col = mix(cold, warm, uWarm);
      float sh = 1.0 - smoothstep(0.0, 0.08, l);
      col += sh * vec3(0.0, 0.0015, 0.004);          // shadows keep a little night blue in both states
      col = aces(col);
      vec2 q = vUv - 0.5; q.x *= uRes.x / uRes.y;
      col *= 1.0 - 0.42 * smoothstep(0.35, 1.05, length(q));
      col = pow(col, vec3(1.0 / 2.2));
      col *= uFade;
      col += (h12(gl_FragCoord.xy) - 0.5) / 180.0;   // still dither (no moving grain)
      gl_FragColor = vec4(col, 1.0);
    }`, {
    tSharp: { value: null }, tDepth: { value: null }, tDof: { value: null }, tBloom: { value: null },
    uNear: { value: 1 }, uFar: { value: 1000 }, uFocus: { value: 100 }, uBlur: { value: 10 }, uMaxR: { value: 20 },
    uExposure: { value: 1 }, uWarm: { value: 0 }, uFade: { value: 1 }, uBloom: { value: 0.1 }, uRes: { value: new THREE.Vector2(16, 9) },
  });

  return {
    setTier(name) { tier = TIERS[name]; makeScene(); makeRest(); },
    get tier() { return tier; },
    setSize(w, h) { W = Math.max(2, w | 0); H = Math.max(2, h | 0); makeScene(); makeRest(); },
    get size() { return [W, H]; },
    // look: { focus (mm), blur (background CoC in px at 1080 lines), exposure, warm, fade, bloom }
    render(scene, camera, look) {
      renderer.setRenderTarget(rtScene);
      renderer.render(scene, camera);
      const near = camera.near, far = camera.far, k = H / 1080;
      const blurFull = look.blur * k, maxFull = look.blur * 1.6 * k;
      Object.assign(mDown.uniforms, {}); mDown.uniforms.tColor.value = rtScene.texture; mDown.uniforms.tDepth.value = rtScene.depthTexture;
      mDown.uniforms.uTexel.value.set(1 / W, 1 / H); mDown.uniforms.uNear.value = near; mDown.uniforms.uFar.value = far;
      pass(mDown, rtHalf);
      const u = mDof.uniforms;
      u.tHalf.value = rtHalf.texture; u.uTexel.value.set(1 / rtHalf.width, 1 / rtHalf.height); u.uStep.value = tier.step;
      u.uFocus.value = look.focus; u.uBlur.value = blurFull / 2; u.uMaxR.value = Math.max(1, maxFull / 2);
      pass(mDof, rtDof);
      // bloom pyramid
      mPre.uniforms.tSrc.value = rtDof.texture; mPre.uniforms.uTexel.value.set(1 / rtDof.width, 1 / rtDof.height); mPre.uniforms.uThresh.value = look.thresh ?? 0.9;
      pass(mPre, down[0]);
      for (let i = 1; i < down.length; i++) { mD.uniforms.tSrc.value = down[i - 1].texture; mD.uniforms.uTexel.value.set(1 / down[i - 1].width, 1 / down[i - 1].height); pass(mD, down[i]); }
      let low = down[down.length - 1];
      for (let i = down.length - 2; i >= 0; i--) { mU.uniforms.tSrc.value = down[i].texture; mU.uniforms.tLow.value = low.texture; mU.uniforms.uTexel.value.set(1 / low.width, 1 / low.height); pass(mU, up[i]); low = up[i]; }
      const c = mComp.uniforms;
      c.tSharp.value = rtScene.texture; c.tDepth.value = rtScene.depthTexture; c.tDof.value = rtDof.texture; c.tBloom.value = low.texture;
      c.uNear.value = near; c.uFar.value = far; c.uFocus.value = look.focus; c.uBlur.value = blurFull; c.uMaxR.value = maxFull;
      c.uExposure.value = look.exposure; c.uWarm.value = look.warm; c.uFade.value = look.fade; c.uBloom.value = look.bloom; c.uRes.value.set(W, H);
      pass(mComp, null);
    },
  };
}
