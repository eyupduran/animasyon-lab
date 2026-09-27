// Site player: plays a film like a video without an MP4. The film page is loaded in an iframe with ?video=1
// and only answers window.__film (renderAt, sound, narration, chapters); this page draws the film's frame for the
// current time and shows the subtitles in the same look as the video.
// The clock is the sound: normally one small pre-mixed file (soundtrack.m4a from npm run soundtrack, an <audio>
// element: streams, seeks, plays with the iPhone silent switch on). Without it the player mixes live with the
// AudioContext: narration clips plus the film's own sound rendered in chunks with film.sound(from, to).
// Data comes from window.__PLAYER, written by tools/build-site.mjs:
//   { title, soundtrack?, musicDb, cue: { lead, tail, minDur, join }, fade: [in, out], clips: { id: { file?, cues: [{ a, b, text }] } } }
(() => {
  const D = window.__PLAYER;
  const root = document.getElementById('pl');
  const $ = s => root.querySelector(s);
  const video = $('.pl-video'), frame = $('.pl-film'), subEl = $('.pl-sub span'), big = $('.pl-big');
  const track = $('.pl-track'), fill = $('.pl-fill'), knob = $('.pl-knob'), tip = $('.pl-tip'), timeEl = $('.pl-time');
  const ICON = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86A1 1 0 0 0 8 5.14z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
    replay: '<svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z"/></svg>',
    vol: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm12.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
    mute: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4zm15.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 0h2v5h-5v-2h3z"/></svg>',
    exit: '<svg viewBox="0 0 24 24"><path d="M8 5h2v5H5V8h3zm6 0h2v3h3v2h-5zM5 14h5v5H8v-3H5zm9 0h5v2h-3v3h-2z"/></svg>',
  };
  const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

  let film = null, dur = 0, chapters = [], placed = [], cues = [];
  let t = 0, playing = false, ended = false, needFrame = true, busy = false, dragging = false;
  let ctx = null, master = null, music = null, t0Ctx = 0, t0Film = 0, gen = 0, sources = [];
  const CH = 12, chunks = new Map(), scheduled = new Set(), voice = {}, fetched = {};
  const hasVoice = Object.keys(D.clips || {}).length > 0;
  const MEDIA = !!D.soundtrack;
  const audio = MEDIA ? new Audio() : null;
  if (audio) {
    audio.preload = 'auto'; audio.src = D.soundtrack; audio.setAttribute('playsinline', '');
    audio.addEventListener('waiting', () => { if (playing) root.classList.add('loading'); });
    audio.addEventListener('playing', () => root.classList.remove('loading'));
  }
  let mA = 0, mP = 0; // last media time and when it was read: smooth the coarse media clock between updates
  function mediaClock() {
    const a = audio.currentTime, p = performance.now();
    if (a !== mA || audio.paused || audio.readyState < 3) { mA = a; mP = p; return a; }
    return a + Math.min(0.25, (p - mP) / 1000);
  }
  root.classList.toggle('novoice', !hasVoice);
  if (store.get('pl-subs') === '0') root.classList.add('nosubs');

  // ---- layout: fit the 1920×1080 film into the box, keep 16:9 -------------------------------------------
  function fit() {
    const W = root.clientWidth, H = root.clientHeight, s = Math.min(W / 1920, H / 1080);
    const w = 1920 * s, h = 1080 * s;
    Object.assign(video.style, { width: w + 'px', height: h + 'px', left: (W - w) / 2 + 'px', top: (H - h) / 2 + 'px' });
    root.style.setProperty('--w', w + 'px'); root.style.setProperty('--h', h + 'px');
    frame.style.transform = `scale(${s})`;
  }
  addEventListener('resize', fit); new ResizeObserver(fit).observe(root); fit();

  // ---- film ------------------------------------------------------------------------------------------
  const q = new URLSearchParams(location.search);
  t = Math.max(0, Number(q.get('t')) || 0);
  if (!MEDIA) for (const id in D.clips) fetched[id] = fetch(D.clips[id].file).then(r => r.arrayBuffer()).catch(() => null);
  root.classList.add('loading');
  const waitFilm = new Promise((resolve, reject) => {
    const t0 = Date.now();
    const poll = () => {
      let f = null; try { f = frame.contentWindow && frame.contentWindow.__film; } catch {}
      if (f && f.duration > 0) resolve(f);
      else if (Date.now() - t0 > 120000) reject(new Error('film açılmadı'));
      else setTimeout(poll, 100);
    };
    poll();
  });
  waitFilm.then(f => {
    film = f; dur = f.duration; chapters = (f.chapters || []).slice().sort((a, b) => a.t - b.t);
    placed = (f.narration || []).filter(p => D.clips[p.id]);
    cues = placeCues();
    t = Math.min(t, dur);
    for (const c of chapters) if (c.t > 0.5) { const k = document.createElement('div'); k.className = 'pl-tick'; k.style.left = (c.t / dur * 100) + '%'; $('.pl-rail').appendChild(k); }
    root.classList.remove('loading'); needFrame = true; ui(t);
  }).catch(e => { root.classList.remove('loading'); const d = document.createElement('div'); d.className = 'pl-err'; d.textContent = 'Film yüklenemedi: ' + e.message; root.appendChild(d); });

  // same rules as tools/lib/film.mjs → placeCues
  function placeCues() {
    const C = D.cue, out = [];
    for (const p of placed) for (const c of D.clips[p.id].cues) out.push({ a: p.at + c.a - C.lead, b: p.at + Math.max(c.b, c.a + C.minDur) + C.tail, text: c.text });
    out.sort((x, y) => x.a - y.a);
    for (let i = 0; i < out.length - 1; i++) { const nx = out[i + 1].a; if (out[i].b > nx - C.join) out[i].b = nx - 0.02; }
    return out;
  }

  // ---- audio -----------------------------------------------------------------------------------------
  function ensureAudio() {
    if (ctx) return;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch {} // iOS: play even with the silent switch on
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'playback' });
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -1.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.003; lim.release.value = 0.12;
    master = ctx.createGain(); master.gain.value = store.get('pl-mute') === '1' ? 0 : 1;
    master.connect(lim); lim.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = hasVoice ? Math.pow(10, (D.musicDb ?? -8) / 20) : 1; music.connect(master);
    const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); // unlock
  }
  const decoded = {};
  function decodeVoices() {
    return Promise.all(Object.keys(fetched).map(id => decoded[id] || (decoded[id] = fetched[id].then(ab => ab ? new Promise(r => ctx.decodeAudioData(ab, r, () => r(null))) : null).then(buf => { voice[id] = buf; }))));
  }
  function chunk(i) {
    if (!chunks.has(i)) chunks.set(i, (async () => {
      const a = i * CH, b = Math.min(dur, a + CH);
      const src = await film.sound(a, b);
      const out = ctx.createBuffer(src.numberOfChannels, src.length, src.sampleRate);
      for (let c = 0; c < src.numberOfChannels; c++) out.copyToChannel(src.getChannelData(c), c);
      return out;
    })().catch(() => null));
    return chunks.get(i);
  }
  const clock = () => !playing ? t : MEDIA ? mediaClock() : t0Film + (ctx.currentTime - t0Ctx);
  function pump() {
    if (!playing || MEDIA || typeof film.sound !== 'function') return;
    const i = Math.floor(clock() / CH), my = gen;
    for (let k = i; k <= i + 1; k++) {
      if (scheduled.has(k) || k * CH >= dur) continue;
      scheduled.add(k);
      chunk(k).then(buf => {
        if (!buf || my !== gen || !playing) return;
        let when = t0Ctx + (k * CH - t0Film), off = 0;
        if (when < ctx.currentTime + 0.01) { off = ctx.currentTime + 0.02 - when; when = ctx.currentTime + 0.02; }
        if (off >= buf.duration) return;
        const s = ctx.createBufferSource(); s.buffer = buf; s.connect(music); s.start(when, off); sources.push(s);
      });
    }
    for (const k of chunks.keys()) if (k < i - 1 || k > i + 3) chunks.delete(k);
  }
  function scheduleVoices() {
    for (const p of placed) {
      const b = voice[p.id]; if (!b || p.at + b.duration <= t0Film) continue;
      const s = ctx.createBufferSource(); s.buffer = b; s.connect(master);
      s.start(t0Ctx + Math.max(0, p.at - t0Film), Math.max(0, t0Film - p.at)); sources.push(s);
    }
  }
  function stopAll() { gen++; if (audio) audio.pause(); for (const s of sources) { try { s.stop(); } catch {} } sources = []; scheduled.clear(); }

  // ---- transport -------------------------------------------------------------------------------------
  async function play() {
    if (!film || playing) return;
    const my = ++gen;
    if (ended || t >= dur - 0.05) { t = 0; ended = false; }
    root.classList.add('started', 'loading'); big.classList.remove('replay');
    if (MEDIA) {
      audio.muted = store.get('pl-mute') === '1';
      try {
        const started = audio.play(); // first, inside the tap: iOS allows play() only there
        if (audio.readyState < 1) await new Promise((r, j) => { audio.addEventListener('loadedmetadata', r, { once: true }); audio.addEventListener('error', j, { once: true }); });
        if (Math.abs(audio.currentTime - t) > 0.05) audio.currentTime = t;
        mA = t; await started;
      }
      catch (e) { if (my === gen) { root.classList.remove('loading'); ui(t); } return; }
      if (my !== gen) { audio.pause(); return; }
      if (audio.readyState >= 3) root.classList.remove('loading');
      playing = true; ui(t); poke(); return;
    }
    ensureAudio();
    try { await ctx.resume(); } catch {}
    await Promise.all([decodeVoices(), typeof film.sound === 'function' ? chunk(Math.floor(t / CH)) : null]);
    if (my !== gen) return;
    root.classList.remove('loading');
    t0Ctx = ctx.currentTime + 0.06; t0Film = t; playing = true;
    scheduleVoices(); pump(); ui(t); poke();
  }
  function pause() {
    if (!playing) { gen++; root.classList.remove('loading'); return; }
    t = Math.min(dur, clock()); playing = false; stopAll(); ui(t); poke();
  }
  const toggle = () => (playing || root.classList.contains('loading')) ? pause() : play();
  function seek(x, resume) {
    const was = resume ?? playing;
    if (playing) pause();
    t = Math.max(0, Math.min(dur, x)); ended = false; needFrame = true; ui(t);
    if (was) play();
  }

  // ---- frame loop ------------------------------------------------------------------------------------
  function frameLoop() {
    requestAnimationFrame(frameLoop);
    if (!film) return;
    let now = clock();
    if (playing && now >= dur) { t = dur; playing = false; ended = true; stopAll(); now = dur; big.classList.add('replay'); ui(t); root.classList.remove('idle'); }
    if (!busy && (playing || needFrame)) {
      needFrame = false; busy = true;
      try { const r = film.renderAt(Math.min(now, dur)); if (r && r.then) r.then(() => { busy = false; }, () => { busy = false; }); else busy = false; }
      catch (e) { busy = false; console.error(e); }
    }
    if (playing) { pump(); ui(now); }
    subs(now);
  }
  requestAnimationFrame(frameLoop);

  let lastCue = null;
  function subs(now) {
    let c = null;
    for (let i = 0; i < cues.length; i++) { if (cues[i].a > now) break; if (now < cues[i].b) c = cues[i]; }
    if (c !== lastCue) { subEl.textContent = c ? c.text : ''; lastCue = c; }
    if (c) { const [fi, fo] = D.fade; subEl.style.opacity = Math.max(0, Math.min(1, (now - c.a) / fi, (c.b - now) / fo)); }
  }

  const fmt = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  const chapterAt = s => { let c = null; for (const x of chapters) if (x.t <= s + 0.01) c = x; return c; };
  let lastUi = '';
  function ui(now) {
    const p = dur ? Math.min(1, now / dur) * 100 : 0;
    fill.style.width = p + '%'; knob.style.left = p + '%';
    const ch = chapterAt(now), label = `${fmt(now)} / ${fmt(dur)}${ch && ch.title ? ` <i>· ${ch.title.replace(/</g, '&lt;')}</i>` : ''}`;
    if (label !== lastUi) { timeEl.innerHTML = label; lastUi = label; }
    const icon = playing ? 'pause' : (ended ? 'replay' : 'play');
    const pb = $('.pl-play'); if (pb.dataset.i !== icon) { pb.innerHTML = ICON[icon]; pb.dataset.i = icon; pb.setAttribute('aria-label', playing ? 'Duraklat' : 'Oynat'); }
    root.classList.toggle('playing', playing);
    big.innerHTML = ended ? ICON.replay : ICON.play;
  }

  // ---- controls --------------------------------------------------------------------------------------
  let idleTimer = 0;
  function poke() { root.classList.remove('idle'); clearTimeout(idleTimer); if (playing) idleTimer = setTimeout(() => { if (playing && !dragging) root.classList.add('idle'); }, 2600); }
  root.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') poke(); });
  big.addEventListener('click', e => { e.stopPropagation(); play(); });
  $('.pl-hit').addEventListener('click', e => {
    if (!root.classList.contains('started')) return play();
    if (e.pointerType === 'mouse' || !e.pointerType) { toggle(); poke(); }
    else if (root.classList.contains('idle')) poke(); else if (playing) { clearTimeout(idleTimer); root.classList.add('idle'); } else toggle();
  });
  $('.pl-hit').addEventListener('dblclick', () => fullscreen());
  $('.pl-play').addEventListener('click', () => { toggle(); poke(); });
  $('.pl-cc').addEventListener('click', () => { const off = root.classList.toggle('nosubs'); store.set('pl-subs', off ? '0' : '1'); poke(); });
  const muteBtn = $('.pl-mute');
  const setMute = m => { store.set('pl-mute', m ? '1' : '0'); if (master) master.gain.value = m ? 0 : 1; if (audio) audio.muted = m; muteBtn.innerHTML = m ? ICON.mute : ICON.vol; muteBtn.setAttribute('aria-label', m ? 'Sesi aç' : 'Sesi kapat'); };
  setMute(store.get('pl-mute') === '1');
  muteBtn.addEventListener('click', () => { setMute(store.get('pl-mute') !== '1'); poke(); });

  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function fullscreen() {
    const req = root.requestFullscreen || root.webkitRequestFullscreen;
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else if (root.classList.contains('full')) root.classList.remove('full');
    else if (req) { Promise.resolve(req.call(root)).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch {} }).catch(() => root.classList.add('full')); }
    else root.classList.add('full'); // iPhone Safari: no element fullscreen, fill the window instead
    setTimeout(fit, 50);
  }
  const fsBtn = $('.pl-fs');
  const fsIcon = () => { const on = !!fsEl() || root.classList.contains('full'); fsBtn.innerHTML = on ? ICON.exit : ICON.full; fsBtn.setAttribute('aria-label', on ? 'Tam ekrandan çık' : 'Tam ekran'); };
  document.addEventListener('fullscreenchange', () => { fsIcon(); fit(); }); document.addEventListener('webkitfullscreenchange', () => { fsIcon(); fit(); });
  fsBtn.addEventListener('click', () => { fullscreen(); setTimeout(fsIcon, 60); poke(); }); fsIcon();

  // seek bar: drag shows the frame under the finger, release continues from there
  let wasPlaying = false;
  const posAt = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * dur; };
  const showTip = s => { const ch = chapterAt(s); tip.textContent = fmt(s) + (ch && ch.title ? ' · ' + ch.title : ''); tip.style.left = Math.max(40, Math.min(track.clientWidth - 40, s / dur * track.clientWidth)) + 'px'; };
  track.addEventListener('pointerdown', e => {
    if (!film) return;
    dragging = true; track.classList.add('drag'); track.setPointerCapture(e.pointerId);
    wasPlaying = playing || root.classList.contains('loading'); pause();
    t = posAt(e); needFrame = true; ui(t); showTip(t); poke();
  });
  track.addEventListener('pointermove', e => { if (!film) return; showTip(posAt(e)); if (dragging) { t = posAt(e); needFrame = true; ui(t); } });
  const end = e => { if (!dragging) return; dragging = false; track.classList.remove('drag'); seek(posAt(e), wasPlaying); };
  track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);

  addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('a,input')) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'k') { e.preventDefault(); toggle(); }
    else if (k === 'arrowright' || k === 'l') seek(clock() + (k === 'l' ? 10 : 5));
    else if (k === 'arrowleft' || k === 'j') seek(clock() - (k === 'j' ? 10 : 5));
    else if (k === 'f') fullscreen();
    else if (k === 'c') $('.pl-cc').click();
    else if (k === 'm') muteBtn.click();
    else if (k === 'home') seek(0);
    else return;
    poke();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); });

  const poster = $('.pl-poster');
  if (poster) poster.addEventListener('error', () => poster.remove());
})();
