// Yazıcının İçinde — entry point: builds the scene, runs the page simulation and plays the story.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadPageFonts, drawPage } from './page/content.js';
import { PagePipeline } from './page/pipeline.js';
import { setupStudio, Laptop, TonerParticles, Steam } from './scene/studio.js';
import { Printer } from './scene/printer.js';
import { Sheet } from './scene/sheet.js';
import { PAGE_L, PAGE_W, LEAD_FINAL, S_WAIT, S_EXIT } from './scene/layout.js';
import { buildTimeline, smoother, lerp, clamp01 } from './story/timeline.js';
import { makeState } from './story/state.js';
import { STEPS } from './story/script.js';
import { Insets } from './ui/insets.js';
import { LoupeRenderer } from './ui/loupe.js';
import { Sound } from './audio/sound.js';
import { Narration } from './audio/narration.js';

const params = new URLSearchParams(location.search);
const $ = id => document.getElementById(id);
if (params.get('ui') === '0') document.body.classList.add('noui');

// ---------------------------------------------------------------- renderer
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('capture') });
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
let dpr = Math.min(maxDpr, 1.5);
renderer.setPixelRatio(dpr);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.3, 1600);
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------------------------------------------------------------- content + simulation
await loadPageFonts();
const pageCanvas = document.createElement('canvas');
drawPage(pageCanvas);
const pipe = new PagePipeline(renderer, pageCanvas);
pipe.run();
const covOrig = pipe.readOriginalK();

// ---------------------------------------------------------------- scene
setupStudio(renderer, scene);
const printer = new Printer(scene);
const sheet1 = new Sheet(scene); sheet1.setSource(pipe.orig.texture, false);
const sheet2 = new Sheet(scene); sheet2.setSource(pipe.gens[1].texture, true);
const genSheets = [2, 4, 8].map(g => { const s = new Sheet(scene); s.setSource(pipe.gens[g].texture, true); s.mesh.visible = false; return s; });
const laptop = new Laptop(scene, pageCanvas);
const particles = new TonerParticles(scene);
const steam = new Steam(scene);
renderer.compile(scene, camera);

const tl = buildTimeline();
const S = makeState(tl);
const insets = new Insets($('insetCanvas'), pageCanvas);
const loupeR = new LoupeRenderer();
const sound = new Sound();
const narr = new Narration();

const covSampler = (u, v, ch, mono) => {
  if (!mono) return covOrig.sample(u, v, ch);
  const k = covOrig.sample(u, v, 3), c = covOrig.sample(u, v, 0), m = covOrig.sample(u, v, 1);
  return Math.max(k, (c + m) * 0.5);
};

// ---------------------------------------------------------------- camera from shots
// shots are framed for 16:9; on narrow screens widen the vertical fov to keep most of the width
function fitFov(f) {
  const a = camera.aspect;
  if (a >= 1.5) return f;
  const tanH = Math.tan(f * Math.PI / 360) * 1.78 * (a < 1 ? 0.78 : 1);
  return Math.min(92, Math.max(f, 2 * Math.atan(tanH / a) * 180 / Math.PI));
}
const _p = new THREE.Vector3(), _t = new THREE.Vector3();
function shotAt(T) {
  const c = tl.chapterAt(T);
  const u = clamp01((T - c.start) / c.dur);
  const keys = c.shots;
  const prev = c.index > 0 ? tl.chapters[c.index - 1].shots.at(-1) : keys[0];
  const K = (k) => ({ p: new THREE.Vector3(...k[1]), t: new THREE.Vector3(...k[2]), f: k[3] });
  let a, b, e;
  if (u < keys[0][0]) { a = K(prev); b = K(keys[0]); e = smoother(u / keys[0][0]); }
  else {
    let i = 0;
    while (i < keys.length - 1 && u > keys[i + 1][0]) i++;
    if (i >= keys.length - 1) { a = b = K(keys.at(-1)); e = 0; }
    else { a = K(keys[i]); b = K(keys[i + 1]); e = smoother((u - keys[i][0]) / (keys[i + 1][0] - keys[i][0])); }
  }
  _p.copy(a.p).lerp(b.p, e); _t.copy(a.t).lerp(b.t, e);
  const f = lerp(a.f, b.f, e);
  // gentle hand-held drift proportional to the shot distance
  const d = _p.distanceTo(_t) * 0.006;
  _p.x += Math.sin(T * 0.23) * d * 1.2; _p.y += Math.sin(T * 0.17 + 1) * d * 0.8;
  return { p: _p, t: _t, f };
}

// ---------------------------------------------------------------- UI construction
const segEls = tl.chapters.map((c) => {
  const d = document.createElement('div');
  d.style.flex = String(c.dur);
  d.innerHTML = '<b></b>';
  $('segs').appendChild(d);
  return d;
});
$('chapTotal').textContent = String(tl.chapters.length).padStart(2, '0');
STEPS.forEach((s, i) => { const li = document.createElement('li'); li.innerHTML = `<b>${i + 1}</b>${s}`; $('steps').appendChild(li); });
const stepEls = [...$('steps').children];
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
$('startMeta').textContent = `Yaklaşık ${Math.round(tl.total / 60)} dakika · 16 bölüm · ses için hoparlörü açın`;

// ---------------------------------------------------------------- playback state
let T = 0, playing = false, speed = 1, explore = false;
const speeds = [0.75, 1, 1.25, 1.5];
if (params.has('ch')) T = tl.byId[params.get('ch')].start + Number(params.get('t') || 0);
if (params.has('T')) T = Number(params.get('T'));
let lastCue = null, lastChapter = null, prevSt = null;

function setPlaying(p) {
  playing = p;
  $('iPlay').innerHTML = p ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M7 4v16l13-8z"/>';
  if (!p) narr.pause(); else narr.resume();
}
function seek(t) {
  T = Math.max(0, Math.min(tl.total - 0.01, t));
  narr.stop(); lastCue = null;
  if (explore) leaveExplore();
}
function chapterJump(dir) {
  const c = tl.chapterAt(T);
  const i = Math.max(0, Math.min(tl.chapters.length - 1, c.index + dir));
  seek(tl.chapters[i].start + 0.01);
}
$('bPlay').onclick = () => { if (explore) { leaveExplore(); seek(0); } setPlaying(!playing); };
$('bPrev').onclick = () => chapterJump(-1);
$('bNext').onclick = () => chapterJump(1);
$('bSpeed').onclick = () => { speed = speeds[(speeds.indexOf(speed) + 1) % speeds.length]; $('bSpeed').textContent = `${String(speed).replace('.', ',')}×`; };
$('bVoice').onclick = () => toggleVoice(!narr.enabled);
$('bSound').onclick = () => toggleSound();
$('bFull').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
$('bReplay').onclick = () => { leaveExplore(); seek(0); setPlaying(true); };
function toggleVoice(on) {
  if (on && !narr.available) { $('bVoice').title = 'Bu tarayıcıda Türkçe ses bulunamadı'; $('bVoice').textContent = 'Türkçe ses yok'; return; }
  narr.enabled = on; $('bVoice').classList.toggle('on', on);
  if (!on) narr.stop(); else lastCue = null;
}
function toggleSound() {
  sound.setMuted(!sound.muted);
  $('iSound').style.opacity = sound.muted ? 0.35 : 1;
}
const track = $('track');
track.addEventListener('pointermove', e => {
  const r = track.getBoundingClientRect(), f = clamp01((e.clientX - r.left) / r.width);
  const c = tl.chapterAt(f * tl.total);
  $('tip').textContent = `${c.index + 1}. ${c.title}`;
  $('tip').style.left = `${e.clientX - r.left}px`;
});
track.addEventListener('click', e => {
  const r = track.getBoundingClientRect(), f = clamp01((e.clientX - r.left) / r.width);
  const c = tl.chapterAt(f * tl.total);
  seek(c.start + 0.01);
});
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); $('bPlay').click(); }
  else if (e.code === 'ArrowRight') chapterJump(1);
  else if (e.code === 'ArrowLeft') chapterJump(-1);
  else if (e.key === 'f' || e.key === 'F') $('bFull').click();
  else if (e.key === 'n' || e.key === 'N') toggleVoice(!narr.enabled);
  else if (e.key === 'm' || e.key === 'M') toggleSound();
});
let idleTimer = 0;
window.addEventListener('pointermove', () => { idleTimer = 0; document.body.classList.remove('idle'); });

// explore mode: orbit + hover magnifier
const controls = new OrbitControls(camera, canvas);
controls.enabled = false; controls.enableDamping = true; controls.maxDistance = 400; controls.minDistance = 8;
controls.maxPolarAngle = Math.PI * 0.49;
function enterExplore() {
  explore = true; setPlaying(false);
  const s = shotAt(tl.total - 0.01);
  camera.position.copy(s.p); controls.target.copy(s.t); controls.enabled = true; controls.update();
  $('explore').hidden = false;
}
function leaveExplore() { explore = false; controls.enabled = false; $('explore').hidden = true; }
const pointer = { x: -1, y: -1, in: false };
canvas.addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.in = true; });
canvas.addEventListener('pointerleave', () => { pointer.in = false; });

// ---------------------------------------------------------------- per-frame application
const sheetKeys = { s1: sheet1, s2: sheet2, g2: genSheets[0], g4: genSheets[1], g8: genSheets[2] };
const sheetPose = {};
function applySheet(sheet, s, active, st, key) {
  sheet.mesh.visible = s.visible !== false;
  if (!sheet.mesh.visible) return;
  if (s.mode === 'path') { sheet.followPath(s.lead); sheetPose[key] = null; }
  else { sheet.setPose(s.p, s.q, s.bow || 0); sheetPose[key] = { p: s.p.clone(), q: s.q.clone(), bow: s.bow || 0 }; }
  sheet.setPrint({ lead: s.lead ?? LEAD_FINAL, full: s.full, active, scanX: st.scanX, scanOn: key === 's1' ? st.lampOn : 0 });
}
function sheetPoint(key, u, v) {
  const P = sheetPose[key];
  if (!P) return null;
  return new THREE.Vector3((u - 0.5) * PAGE_W, 0.05, (v - 0.5) * PAGE_L).applyQuaternion(P.q).add(P.p);
}

function apply(st) {
  printer.update({
    ...st,
    sepTex: st.job === 2 ? pipe.gens[1].texture : pipe.orig.texture,
  }, T, covSampler);
  applySheet(sheet1, st.sheet1, [1, 1, 1, 1], st, 's1');
  applySheet(sheet2, st.sheet2, [0, 0, 0, 1], st, 's2');
  st.gens.forEach((g, i) => applySheet(genSheets[i], { mode: 'pose', full: true, visible: g.visible, p: g.p, q: g.q, bow: g.bow }, [0, 0, 0, 1], st, ['g2', 'g4', 'g8'][i]));
  laptop.update(st);
  const devVis = st.chapter.id === 'develop' ? 1 : st.chapter.id === 'laser' ? clamp01((tl.ph('laser', T) - 0.8) * 5) : st.chapter.id === 'transfer' ? 1 - clamp01(tl.ph('transfer', T) * 4) : 0;
  particles.update(st, st.job === 1 ? (u, v) => covOrig.sample(u, v, 3) : null, devVis);
  const fu = tl.ph('fuse', T), ou = tl.ph('output', T);
  steam.update(T, (fu > 0.05 && fu < 1 ? 1 : 0) + (ou > 0 && ou < 0.2 ? 1 - ou * 5 : 0));
}

// ---------------------------------------------------------------- overlay (labels, leaders, loupes, texts)
const labelsEl = $('labels'), loupesEl = $('loupes'), svg = $('leaders');
const pool = { labels: [], loupes: [] };
const getEl = (list, parent, cls) => { let el = list.find(e => !e._used); if (!el) { el = document.createElement('div'); el.className = cls; parent.appendChild(el); list.push(el); } el._used = true; return el; };
const _v = new THREE.Vector3();
function toScreen(p) {
  _v.copy(p).project(camera);
  return { x: (_v.x * 0.5 + 0.5) * window.innerWidth, y: (-_v.y * 0.5 + 0.5) * window.innerHeight, front: _v.z < 1 && _v.z > -1 };
}
function overlay(st, loupeDraws) {
  pool.labels.forEach(e => (e._used = false));
  pool.loupes.forEach(e => (e._used = false));
  let lines = '';
  const c = st.chapter, u = (T - c.start) / c.dur;
  const W = window.innerWidth, H = window.innerHeight, md = Math.min(W, H), sc = md < 700 ? 0.7 : 1;
  if (!explore) {
    // part labels
    c.labels.forEach(([key, text, a, b, dx, dy]) => {
      const anchor = printer.anchors[key];
      if (!anchor || u < a || u > b) return;
      const fade = Math.min(1, (u - a) * c.dur / 0.5, (b - u) * c.dur / 0.5);
      const s = toScreen(anchor);
      if (!s.front) return;
      const el = getEl(pool.labels, labelsEl, 'lbl');
      el.className = 'lbl';
      el.textContent = text;
      const lx = s.x + dx * 1.6 * sc, ly = s.y + dy * 1.6 * sc;
      el.style.transform = `translate(${lx}px, ${ly}px) translate(-50%, -50%)`;
      el.style.opacity = fade;
      lines += `<g opacity="${fade}"><line x1="${s.x}" y1="${s.y}" x2="${lx}" y2="${ly}"/><circle cx="${s.x}" cy="${s.y}" r="4"/></g>`;
    });
    // sheet names on the desk
    if (c.id === 'compare' || c.id === 'generations') {
      const names = c.id === 'compare' ? [['s1', 'Orijinal'], ['s2', 'Kopya']] : [['s1', 'Orijinal'], ['s2', '1. kopya'], ['g2', '2. kopya'], ['g4', '4. kopya'], ['g8', '8. kopya']];
      const f = c.id === 'compare' ? clamp01((tl.ph('compare', T) - 0.2) * 8) : 1;
      names.forEach(([k, n]) => {
        if (!sheetKeys[k].mesh.visible) return;
        const top = c.id === 'compare';
        const p = sheetPoint(k, 0.5, top ? -0.03 : 1.03); if (!p) return;
        const s = toScreen(p); if (!s.front) return;
        const el = getEl(pool.labels, labelsEl, 'lbl');
        el.className = 'lbl sheetName'; el.textContent = n;
        el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, ${top ? '-100%' : '0'})`;
        el.style.opacity = f;
      });
    }
  }
  // loupes
  const list = explore ? hoverLoupe() : st.loupes;
  const n = list.length;
  const R = md * (n >= 5 ? 0.075 : n >= 4 ? 0.095 : n >= 2 ? 0.125 : 0.15);
  list.forEach(L => {
    const sheet = sheetKeys[L.sheet];
    if (!sheet.mesh.visible) return;
    const P = sheetPoint(L.sheet, L.u, L.v); if (!P) return;
    const s = toScreen(P); if (!s.front) return;
    // projected size of the magnified patch
    const P2 = sheetPoint(L.sheet, L.u + L.span / 2 / PAGE_W, L.v);
    const s2 = toScreen(P2);
    const ring = Math.max(4, Math.hypot(s2.x - s.x, s2.y - s.y));
    let cx = s.x + L.dx * md, cy = s.y + L.dy * md;
    cx = Math.max(R + 12, Math.min(W - R - 12, cx)); cy = Math.max(R + 70, Math.min(H - R - 150, cy));
    const el = getEl(pool.loupes, loupesEl, 'loupe');
    el.style.width = el.style.height = `${2 * R}px`;
    el.style.transform = `translate(${cx - R}px, ${cy - R}px)`;
    el.innerHTML = `<i>×${Math.max(2, Math.round(R / ring))}</i>${L.label ? `<span>${L.label}</span>` : ''}`;
    el.style.opacity = 1;
    const ang = Math.atan2(cy - s.y, cx - s.x);
    lines += `<g><circle class="ring" cx="${s.x}" cy="${s.y}" r="${ring}" fill="none"/><line class="lp" x1="${s.x + Math.cos(ang) * ring}" y1="${s.y + Math.sin(ang) * ring}" x2="${cx - Math.cos(ang) * R}" y2="${cy - Math.sin(ang) * R}"/></g>`;
    loupeDraws.push({ x: cx - R + 6, y: cy - R + 6, size: 2 * R - 12, tex: L.sheet === 's1' ? pipe.orig.texture : pipe.gens[{ s2: 1, g2: 2, g4: 4, g8: 8 }[L.sheet]].texture, mono: L.sheet !== 's1', u: L.u, v: L.v, span: L.span });
  });
  svg.innerHTML = lines.replace(/class="ring"/g, 'style="fill:none"');
  pool.labels.forEach(e => { if (!e._used) e.style.opacity = 0; });
  pool.loupes.forEach(e => { if (!e._used) e.style.opacity = 0; });
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function hoverLoupe() {
  if (!pointer.in) return [];
  ndc.set(pointer.x / window.innerWidth * 2 - 1, -(pointer.y / window.innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const names = { s1: 'Orijinal', s2: '1. kopya', g2: '2. kopya', g4: '4. kopya', g8: '8. kopya' };
  let best = null;
  for (const [k, sh] of Object.entries(sheetKeys)) {
    const P = sheetPose[k]; if (!P || !sh.mesh.visible) continue;
    const n = new THREE.Vector3(0, 1, 0).applyQuaternion(P.q);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, P.p);
    const hit = ray.ray.intersectPlane(plane, new THREE.Vector3()); if (!hit) continue;
    const loc = hit.clone().sub(P.p).applyQuaternion(P.q.clone().invert());
    const u = loc.x / PAGE_W + 0.5, v = loc.z / PAGE_L + 0.5;
    if (u < 0 || u > 1 || v < 0 || v > 1) continue;
    const d = hit.distanceTo(camera.position);
    if (!best || d < best.d) best = { d, sheet: k, u, v };
  }
  if (!best) return [];
  return [{ sheet: best.sheet, u: best.u, v: best.v, span: 2.4, dx: 0.14, dy: -0.14, label: names[best.sheet] }];
}

let insetKind = null;
function texts(st) {
  const c = st.chapter;
  if (c !== lastChapter) {
    lastChapter = c;
    $('chapNum').textContent = String(c.index + 1).padStart(2, '0');
    $('chapTitle').textContent = c.title;
  }
  // steps
  const showSteps = c.step !== undefined && c.step >= 0 || c.id === 'summary';
  $('steps').classList.toggle('hide', !showSteps);
  const order = [0, 1, 2, 3, 4, 5];
  stepEls.forEach((el, i) => {
    el.classList.toggle('on', c.id === 'summary' ? i === Math.floor((T - c.start) / 1.3) % 6 : i === c.step);
    el.classList.toggle('done', c.step >= 0 && order.indexOf(i) < order.indexOf(c.step) && i !== 5);
  });
  // subtitle
  const cue = explore ? null : tl.cueAt(T);
  const sub = $('subText');
  if (cue !== lastCue) {
    if (cue) { sub.textContent = cue.text; sub.classList.add('show'); if (playing) narr.say(cue.text, speed); }
    else sub.classList.remove('show');
    lastCue = cue;
  }
  // inset
  const ch = c.inset && !explore ? c.inset : null;
  const u = (T - c.start) / c.dur;
  const show = ch && u > (ch === 'scan' ? tl.cueU('scan', 1) - 0.01 : 0.03) && u < 0.985;
  $('inset').classList.toggle('show', !!show);
  if (show) {
    const q = c.cues.reduce((acc, qq, i) => (T >= qq.start - 0.1 ? i : acc), 0);
    const lt = T - (c.cues[q]?.start ?? c.start);
    const r = insets.draw(ch, ch === 'summary' ? T - c.start : lt, q, { scan: pipe.scan1, progress: st.scanProgress });
    if (insetKind !== ch + q) { $('insetTitle').textContent = r.title; $('insetCaption').textContent = r.caption; insetKind = ch + q; }
  }
  // bar
  segEls.forEach((el, i) => {
    const cc = tl.chapters[i];
    el.firstChild.style.width = `${clamp01((T - cc.start) / cc.dur) * 100}%`;
    el.classList.toggle('cur', cc === c);
  });
  $('clock').textContent = `${fmt(T)} / ${fmt(tl.total)}`;
}

// ---------------------------------------------------------------- sound events
let blipAcc = 0;
function audio(st, prev, dt) {
  if (!prev || dt <= 0) return;
  const jump = Math.abs(st.T - prev.T) > 0.5 || st.T < prev.T;
  const drumSpeed = jump ? 0 : (st.drumTravel - prev.drumTravel) / dt;
  const scanSpeed = jump ? 0 : (st.scanX - prev.scanX) / dt;
  const on = st.T > tl.byId.send.start + 5 && !explore;
  sound.update({ on, drumSpeed, laser: st.laserVis > 0 && playing, fuser: st.fuserHeat > 0.5 && on, scanSpeed });
  if (jump || !playing) return;
  if (prev.pickupAngle < 0.05 && st.pickupAngle >= 0.05) { sound.click(); sound.swish(0.7); }
  const lead = st.job === 2 ? st.sheet2.lead : st.sheet1.lead, plead = prev.job === 2 ? prev.sheet2.lead : prev.sheet1.lead;
  if (plead !== undefined && lead !== undefined) {
    if (plead < S_WAIT + 0.2 && lead >= S_WAIT + 0.2) sound.click(0.18);
    if (plead < S_EXIT && lead >= S_EXIT) sound.swish(0.9, 0.1);
    if (plead < LEAD_FINAL - 0.5 && lead >= LEAD_FINAL - 0.5) sound.swish(0.35, 0.08);
  }
  if (prev.lidAngle > 0.03 && st.lidAngle <= 0.03) sound.lid();
  if (prev.lidAngle <= 0.001 && st.lidAngle > 0.001) sound.click(0.12);
  if (!prev.lampOn && st.lampOn) sound.click(0.15);
  if (!prev.pressed && st.pressed) sound.beep();
  if (st.packets > 0 && st.packets < 1) { blipAcc += dt; if (blipAcc > 0.07) { blipAcc = 0; sound.blip(); } }
}

// ---------------------------------------------------------------- loop
let last = performance.now(), frameAvg = 16, dprTimer = 0;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  // advance story time; hold at a subtitle's end while the narrator is still speaking
  if (playing && !explore) {
    const cue = tl.cueAt(T);
    const hold = narr.enabled && narr.speaking && cue && T >= cue.end - 0.05;
    if (!hold) T += dt * speed;
    if (T >= tl.total) { T = tl.total - 0.001; enterExplore(); }
  }
  const st = S(T);
  apply(st);
  if (explore) controls.update();
  else if (params.has('cam')) {
    const c = params.get('cam').split(',').map(Number);
    camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5]);
    if (c[6] && camera.fov !== c[6]) { camera.fov = c[6]; camera.updateProjectionMatrix(); }
  } else {
    const s = shotAt(T);
    camera.position.copy(s.p); camera.lookAt(s.t);
    const f = fitFov(s.f);
    if (Math.abs(camera.fov - f) > 0.01) { camera.fov = f; camera.updateProjectionMatrix(); }
  }
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
  const loupeDraws = [];
  overlay(st, loupeDraws);
  renderer.autoClear = false;
  loupeDraws.forEach(d => loupeR.draw(renderer, d.x, d.y, d.size, d.tex, d.mono, d.u, d.v, d.span));
  renderer.autoClear = true;
  renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  texts(st);
  audio(st, prevSt, dt);
  prevSt = st;
  // idle UI + adaptive resolution
  idleTimer += dt;
  if (playing && idleTimer > 3.5) document.body.classList.add('idle');
  frameAvg = frameAvg * 0.95 + dt * 1000 * 0.05;
  dprTimer += dt;
  if (dprTimer > 2 && !params.has('capture')) {
    dprTimer = 0;
    if (frameAvg > 26 && dpr > 0.8) { dpr = Math.max(0.8, dpr - 0.15); renderer.setPixelRatio(dpr); resize(); }
    else if (frameAvg < 15 && dpr < maxDpr) { dpr = Math.min(maxDpr, dpr + 0.1); renderer.setPixelRatio(dpr); resize(); }
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------------------------------------------------------------- start
const skipStart = params.has('ch') || params.has('T');
narr.ready.then(v => { $('cVoice').checked = !!v; if (!v) { $('cVoice').disabled = true; $('cVoice').parentElement.title = 'Bu tarayıcıda Türkçe ses yok'; } });
$('bStart').disabled = false;
$('bStart').textContent = 'Başla';
$('bStart').onclick = () => {
  $('start').classList.add('gone');
  sound.start();
  toggleVoice($('cVoice').checked);
  setPlaying(true);
};
if (skipStart) { $('start').classList.add('gone'); if (params.get('play') === '1') setPlaying(true); }

// hooks for automated screenshots
window.__tl = tl;
window.__seek = (t) => { T = t; };
window.__ready = true;
