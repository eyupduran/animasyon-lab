// Shared shader code: one light model, one sky, one fog, so every object sits in the same air.
export const COMMON = /* glsl */`
uniform float uT;
uniform vec3 uSunDir, uSunCol, uSkyTop, uSkyHor, uCam;
uniform float uAmb, uFlash, uWet, uRain, uRainbow, uStars, uBloomR, uHaze;
uniform vec4 uCloud;          // hero centre + shadow radius
varying vec3 vW;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float h31(vec3 p) { p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn2(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); vec3 u = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), u.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), u.x), u.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), u.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), u.x), u.y), u.z); }
// cheap wobble of the meadow front, shared by the ground and the flowers
float frontN(vec2 p) { return sin(p.x * .071 + 1.3) * sin(p.y * .083 - .4) * .55 + sin(p.x * .19 + p.y * .13 + 2.) * .3 + sin(p.x * .41 - p.y * .37) * .15; }
float fbm2(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn2(p); p = p * 2.03 + 11.7; a *= .5; } return s; }

vec3 rainbow(vec3 d) {
  vec3 A = -uSunDir;
  float ang = acos(clamp(dot(d, A), -1., 1.));
  float x = (ang - .705) / .045;                 // 0 violet (40.4°) … 1 red (43°)
  float band = smoothstep(-.15, .15, x) * smoothstep(1.15, .85, x);
  vec3 c = clamp(vec3(abs(x * 6. - 4.) - 1., 2. - abs(x * 6. - 2.8), 2. - abs(x * 6. - 1.3)), 0., 1.);
  c = mix(vec3(1.), c, .85);
  float inner = smoothstep(.72, .5, ang) * .06;   // the sky is brighter inside the bow
  float x2 = (ang - .88) / .05;                   // faint secondary bow, colours reversed
  float band2 = smoothstep(-.2, .2, x2) * smoothstep(1.2, .8, x2);
  vec3 c2 = clamp(vec3(abs((1. - x2) * 6. - 4.) - 1., 2. - abs((1. - x2) * 6. - 2.8), 2. - abs((1. - x2) * 6. - 1.3)), 0., 1.);
  return (c * band * .55 + c2 * band2 * .14 + inner) * uRainbow * smoothstep(-.02, .06, d.y + .05);
}

vec3 skyCol(vec3 d) {
  float h = clamp(d.y, 0., 1.);
  vec3 c = mix(uSkyHor, uSkyTop, pow(h, .5));
  float sd = max(dot(d, uSunDir), 0.);
  // warm glow around the sun, spreading along the horizon when it is low
  float low = 1. - smoothstep(.1, .6, uSunDir.y);
  c += uSunCol * (pow(sd, 6.) * .12 + pow(sd, 40.) * .25) ;
  c += uSunCol * low * .12 * pow(1. - h, 6.) * (.4 + .6 * sd);
  c = mix(c, uSkyHor * .9, smoothstep(0., -.08, d.y));
  return c;
}

// aerial perspective: far things melt into the horizon colour; shadows fill with sky
vec3 fogApply(vec3 col, vec3 wp) {
  vec3 dv = wp - uCam; float dist = length(dv); vec3 d = dv / dist;
  float dens = .0042 + .006 * uRain;
  float f = 1. - exp(-dist * dens);
  f *= mix(1., .55, smoothstep(10., 70., wp.y));        // thinner air up high
  vec3 fc = mix(uSkyHor, skyCol(vec3(d.x, .06, d.z)), .5);
  fc = mix(fc, vec3(.55, .56, .8) * length(uSkyTop) * .9, uRain * .35);
  vec3 o = mix(col, fc, clamp(f, 0., .93));
  if (uRainbow > 0.) o += rainbow(d) * smoothstep(40., 140., dist) * .8;
  return o;
}

// the hero's soft shadow, cast along the sun
float cloudShadow(vec3 wp) {
  vec3 L = uSunDir;
  float k = (uCloud.y - wp.y) / max(L.y, .08);
  vec3 q = wp + L * k;
  float d = length(q.xz - uCloud.xz) / uCloud.w;
  return mix(1., .45, smoothstep(1., .35, d) * step(0., k));
}

vec3 light(vec3 alb, vec3 n, vec3 wp, float ao) {
  float nd = dot(n, uSunDir);
  float sun = clamp((nd + .2) / 1.2, 0., 1.);
  sun *= cloudShadow(wp);
  vec3 skyA = mix(uSkyHor, uSkyTop, .6);
  vec3 bounce = vec3(.9, .45, .3) * .6;
  vec3 amb = mix(bounce * .5, skyA, n.y * .5 + .5) * uAmb * .55;
  vec3 flash = vec3(.8, .8, 1.3) * uFlash * 2.2 * (n.y * .5 + .5);
  return alb * (uSunCol * sun * .95 + amb * ao + flash);
}
`;

export const VERT_WORLD = /* glsl */`
varying vec3 vN;
void main() {
#ifdef USE_INSTANCING
  mat4 im = instanceMatrix;
#else
  mat4 im = mat4(1.);
#endif
  vec4 w = modelMatrix * im * vec4(position, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * mat3(im) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
