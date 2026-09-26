// Boot, player and the video interface. The soundtrack is rendered once at load; while playing,
// story time follows the audio clock, so picture and sound never drift. Quality tiers are picked
// at start-up by timing the heaviest frames and dropped (never raised) if playback stays slow.
import * as THREE from 'three';
import { createScene } from './scene.js';
import { createPost, TIERS } from './post.js';
import { shot, look, titleOpacity, HEAVY, shotTimes } from './shots.js';
import { TOTAL } from './score.js';
import { renderSoundtrack } from './sound.js';

const Q = new URLSearchParams(location.search);
const VIDEO = Q.has('video');
const $ = id => document.getElementById(id);
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const coarse = matchMedia('(pointer: coarse)').matches;

const canvas = $('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: VIDEO, powerPreference: 'high-performance', alpha: false });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(1);
const S = createScene(renderer);
const post = createPost(renderer);
const camera = new THREE.PerspectiveCamera(20, 16 / 9, 0.8, 3000);
const DUST = { ultra: 1, high: 1, mid: 0.85, low: 0.7, min: 0.5 };
let tierName = 'high';

// ---------------- size: a 16:9 picture letterboxed in the window ----------------
function fit() {
  const st = $('stage'), W = st.clientWidth || innerWidth, H = st.clientHeight || innerHeight;
  let w = W, h = Math.round(W * 9 / 16);
  if (h > H) { h = H; w = Math.round(H * 16 / 9); }
  canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
  const t = TIERS[tierName];
  const k = VIDEO ? 1 : Math.min(devicePixelRatio || 1, t.dpr) * t.scale;
  const rw = Math.round(w * k), rh = Math.round(h * k);
  renderer.setSize(rw, rh, false);
  post.setSize(rw, rh);
  camera.aspect = 16 / 9; camera.updateProjectionMatrix();
}
function applyTier(name) {
  tierName = name;
  post.setTier(name);
  S.setShadow(TIERS[name].shadow);
  document.body.dataset.tier = name;
  fit();
}

// ---------------- one frame, as a pure function of story time ----------------
const fwd = new THREE.Vector3(), fp = new THREE.Vector3();
function draw(t) {
  t = Math.max(0, Math.min(TOTAL, t));
  const s = shot(t), lk = look(t);
  camera.position.set(...s.pos);
  camera.lookAt(...s.tgt);
  camera.fov = s.fov; camera.updateProjectionMatrix();
  camera.getWorldDirection(fwd);
  fp.set(...(s.focus === 'tgt' ? s.tgt : s.focus)).sub(camera.position);
  const focus = Math.max(1, fp.dot(fwd));
  const [, rh] = post.size;
  const pxScale = rh / (2 * Math.tan(THREE.MathUtils.degToRad(s.fov) / 2));
  S.update(t, { hide: s.hide || null, camPos: camera.position, pxScale, warm: lk.warm, dustFrac: DUST[tierName] });
  if (Q.has('raw')) { renderer.setRenderTarget(null); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.render(S.scene, camera); }   // debug: no post chain
  else post.render(S.scene, camera, { focus, blur: s.blur, ...lk, exposure: lk.exposure * (s.ex || 1) });
  $('title').style.opacity = titleOpacity(t).toFixed(3);
}

// ---------------- tier choice ----------------
const TIER_ORDER = ['high', 'mid', 'low', 'min'];
async function pickTier() {
  if (VIDEO || Q.has('tier')) return;
  const gl = renderer.getContext(), px = new Uint8Array(4);
  const cost = () => {
    const ts = [];
    for (const t of HEAVY) { draw(t); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const a = performance.now(); draw(t + 0.04); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); ts.push(performance.now() - a); }
    ts.sort((a, b) => a - b); return ts[1];
  };
  const startAt = TIER_ORDER.indexOf(tierName);
  for (const name of TIER_ORDER.slice(Math.max(0, startAt))) {
    applyTier(name);
    await new Promise(r => setTimeout(r, 30));
    cost();
    const ms = cost();
    console.log(`[kalite] ${name}: ${ms.toFixed(1)} ms/kare`);
    if (ms < (name === 'high' ? 20 : 26) || name === 'min') return;
  }
}
let slowSince = 0;
function watchFrame(dt) {
  if (VIDEO || Q.has('tier') || !playing) { slowSince = 0; return; }
  const i = TIER_ORDER.indexOf(tierName);
  if (i < 0 || i === TIER_ORDER.length - 1) return;
  if (dt > 0.045) { if (!slowSince) slowSince = performance.now(); else if (performance.now() - slowSince > 2500) { applyTier(TIER_ORDER[i + 1]); slowSince = 0; console.log('[kalite] düşürüldü →', tierName); } }
  else if (dt < 0.03) slowSince = 0;
}

// ---------------- sound: one pre-rendered buffer ----------------
let actx = null, soundBuf = null, src = null, clock0 = 0, story0 = 0;
function audioStart() {
  if (!soundBuf) return;
  if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
  actx.resume();
  audioStop();
  src = actx.createBufferSource(); src.buffer = soundBuf; src.connect(actx.destination);
  clock0 = actx.currentTime + 0.03; story0 = storyT;
  src.start(clock0, Math.min(storyT, soundBuf.duration - 0.01));
}
function audioStop() { if (src) { try { src.stop(); } catch { } src.disconnect(); src = null; } }

// ---------------- player ----------------
let storyT = Number(Q.get('t') || 0), playing = false, lastNow = performance.now();
function setPlaying(v) {
  if (v === playing) return;
  playing = v;
  document.body.classList.toggle('playing', v);
  if (v) { if (storyT >= TOTAL - 0.05) storyT = 0; lastNow = performance.now(); audioStart(); }
  else audioStop();
}
function seek(t) { storyT = Math.max(0, Math.min(TOTAL - 0.02, t)); if (playing) audioStart(); }
function tick(now) {
  const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
  watchFrame(dt);
  if (playing) {
    if (src && actx && actx.state === 'running' && actx.currentTime >= clock0) storyT = story0 + (actx.currentTime - clock0);
    else if (!src) storyT += dt;
    if (storyT >= TOTAL) { storyT = TOTAL; setPlaying(false); document.body.classList.add('ended'); }
  }
  draw(storyT);
  updateBar();
  requestAnimationFrame(tick);
}
let lastBar = -1;
function updateBar() {
  const k = Math.floor(storyT * 10); if (k === lastBar) return; lastBar = k;
  $('fill').style.width = (storyT / TOTAL * 100) + '%';
  $('time').textContent = `${fmt(storyT)} / ${fmt(TOTAL)}`;
}
function start() {
  $('start').classList.add('gone'); document.body.classList.add('started'); document.body.classList.remove('ended');
  if (!Q.has('t')) storyT = 0;
  setPlaying(true); showBar();
  if (!looping) { looping = true; lastNow = performance.now(); requestAnimationFrame(tick); }
}
let looping = false;
$('go').onclick = start;
$('bPlay').onclick = () => { document.body.classList.remove('ended'); setPlaying(!playing); };
$('bFull').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else $('stage').requestFullscreen?.(); };
const prog = $('progress');
const posAt = e => { const r = prog.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * TOTAL; };
prog.addEventListener('pointerdown', e => { seek(posAt(e)); const mv = ev => seek(posAt(ev)); const up = () => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); }; addEventListener('pointermove', mv); addEventListener('pointerup', up); });
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); if (!$('start').classList.contains('gone')) { if (!$('go').disabled) start(); } else $('bPlay').click(); }
  else if (e.key === 'f' || e.key === 'F') $('bFull').click();
  else if (e.code === 'ArrowRight') seek(storyT + 5);
  else if (e.code === 'ArrowLeft') seek(storyT - 5);
  showBar();
});
let barTimer = 0;
function showBar() { if (!document.body.classList.contains('started')) return; document.body.classList.add('bar-on'); clearTimeout(barTimer); barTimer = setTimeout(() => { if (playing) document.body.classList.remove('bar-on'); }, 2200); }
addEventListener('pointermove', showBar); addEventListener('pointerdown', showBar);
canvas.addEventListener('click', () => { if (document.body.classList.contains('started')) $('bPlay').click(); });
addEventListener('resize', fit);
document.addEventListener('fullscreenchange', () => requestAnimationFrame(fit));

// ---------------- video interface ----------------
function wavChunks(buf, from, to) {
  const ch = buf.numberOfChannels, sr = buf.sampleRate, a = Math.floor(from * sr), n = Math.max(0, Math.min(buf.length, Math.ceil(to * sr)) - a);
  const data = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o, s) => { for (let i = 0; i < s.length; i++) data.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); data.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); data.setUint32(16, 16, true); data.setUint16(20, 1, true);
  data.setUint16(22, ch, true); data.setUint32(24, sr, true); data.setUint32(28, sr * ch * 2, true); data.setUint16(32, ch * 2, true); data.setUint16(34, 16, true);
  w(36, 'data'); data.setUint32(40, n * ch * 2, true);
  const chans = [...Array(ch)].map((_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, chans[c][a + i])); data.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
  const bytes = new Uint8Array(data.buffer), out = [], CH = 1 << 20;
  for (let i = 0; i < bytes.length; i += CH) { let s = ''; const part = bytes.subarray(i, i + CH); for (let j = 0; j < part.length; j += 8192) s += String.fromCharCode.apply(null, part.subarray(j, j + 8192)); out.push(btoa(s)); }
  return out;
}
let soundOut = [];
window.__player = { get t() { return storyT; }, get playing() { return playing; }, seek };
window.__probe = t => { const gl = renderer.getContext(), px = new Uint8Array(4); const a = performance.now(); draw(t); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return performance.now() - a; };
window.__video = {
  duration: TOTAL,
  renderAt(t) { draw(t); },
  async prepareSound(from, to) { soundOut = wavChunks(soundBuf, from, to); return soundOut.length; },
  soundChunk(i) { return soundOut[i]; },
  srt() { return ''; },
  chapters() { return [{ t: 0, title: 'Karar' }]; },
};

// ---------------- boot ----------------
async function boot() {
  applyTier(Q.get('tier') || (VIDEO ? 'ultra' : (coarse || innerWidth < 800) ? 'low' : 'high'));
  const bar = $('prep').firstElementChild;
  const times = shotTimes();
  for (let i = 0; i < times.length; i++) { draw(times[i]); bar.style.width = ((i + 1) / (times.length + 3) * 100) + '%'; await new Promise(r => setTimeout(r, 0)); }
  try { soundBuf = await renderSoundtrack(); } catch (e) { console.warn('ses üretilemedi', e); }
  bar.style.width = ((times.length + 2) / (times.length + 3) * 100) + '%';
  await pickTier();
  bar.style.width = '100%';
  await document.fonts.ready;
  if (VIDEO) {
    document.body.classList.add('video');
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    fit();
    for (const t of times) draw(t);
    draw(0); window.__ready = true; return;
  }
  const posterT = Q.has('t') ? storyT : 43.2;
  draw(posterT);
  $('go').disabled = false; $('go').querySelector('.lbl').textContent = 'İzle';
  window.__ok = true;
  if (Q.has('shot')) { storyT = Number(Q.get('shot')); $('start').style.display = 'none'; document.body.classList.add('started', 'clean'); draw(storyT); window.__shot = true; return; }
  // the start screen shows one still frame; it is redrawn only when the window changes size
  addEventListener('resize', () => { if (!document.body.classList.contains('started')) draw(posterT); });
  if (Q.has('autoplay')) start();
}
boot();
