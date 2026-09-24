// Narration: plays the recorded clip of the subtitle on screen. While a clip plays it is the
// clock: story time follows the audio, so a slow frame never makes the voice skip or repeat.
// Clips are preloaded a few sentences ahead and played from their own elements (no reloads).
export class Narration {
  constructor() {
    this.enabled = true;
    this.pool = new Map(); // url → HTMLAudioElement
    this.cue = null;       // cue whose clip is loaded in `el`
    this.el = null;
    this.muted = false;
  }

  audioFor(url) {
    let a = this.pool.get(url);
    if (!a) {
      a = new Audio();
      a.preload = 'auto';
      a.preservesPitch = true;
      a.src = url;
      this.pool.set(url, a);
    }
    return a;
  }

  // keep the next clips loaded; drop far-away ones
  prefetch(cues) {
    const keep = new Set(cues.filter(q => q?.voice).map(q => q.voice.url));
    if (this.cue?.voice) keep.add(this.cue.voice.url);
    for (const url of keep) this.audioFor(url);
    for (const [url, a] of this.pool) if (!keep.has(url) && a !== this.el) { a.removeAttribute('src'); a.load(); this.pool.delete(url); }
  }

  get speaking() { return !!this.el && !this.el.paused && !this.el.ended; }

  // story time as told by the playing clip, or null when no clip is playing
  clock() {
    if (!this.speaking || !this.cue) return null;
    return this.cue.start + this.el.currentTime;
  }

  sync(T, playing, speed, cue) {
    const inClip = cue?.voice && T >= cue.start && T < cue.start + cue.voice.dur;
    if (!this.enabled || !playing || !inClip) {
      if (this.el && !this.el.paused) this.el.pause();
      if (!inClip) this.cue = null;
      return;
    }
    if (this.cue !== cue) {
      if (this.el && !this.el.paused) this.el.pause();
      this.cue = cue;
      this.el = this.audioFor(cue.voice.url);
      this.seekTo(T - cue.start);
    } else if (this.el.paused && !this.el.ended) {
      // resumed after a pause or a seek inside the same sentence
      if (Math.abs(this.el.currentTime - (T - cue.start)) > 0.3) this.seekTo(T - cue.start);
    }
    this.el.playbackRate = speed;
    this.el.muted = this.muted;
    if (this.el.paused && !this.el.ended) this.el.play().catch(() => {});
  }

  seekTo(sec) {
    const el = this.el;
    const set = () => { try { el.currentTime = Math.max(0, sec); } catch { /* not ready */ } };
    if (sec < 0.05) { if (el.currentTime > 0.05) set(); return; }
    if (el.readyState >= 1) set(); else el.addEventListener('loadedmetadata', set, { once: true });
  }

  // a jump in the story (chapter change, scrubbing): forget the current clip
  reset() { if (this.el && !this.el.paused) this.el.pause(); this.cue = null; }
  stop() { this.reset(); }
}
