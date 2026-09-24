// Narration: plays the pre-recorded Piper clip of the subtitle on screen, locked to story time
// (seeking, pausing and speed changes keep voice and picture together).
export class Narration {
  constructor() {
    this.enabled = true;
    this.el = new Audio();
    this.el.preload = 'auto';
    this.el.preservesPitch = true;
    this.cue = null;
    this.pending = null;
    this.warm = new Map();
    this.el.addEventListener('loadedmetadata', () => {
      if (this.pending !== null) { this.el.currentTime = this.pending; this.pending = null; }
    });
  }

  get speaking() { return !this.el.paused && !!this.cue; }

  // prefetch the next clips so they start without a gap
  prefetch(cues) {
    for (const q of cues) {
      if (!q?.voice || this.warm.has(q.voice.url)) continue;
      const a = new Audio(); a.preload = 'auto'; a.src = q.voice.url;
      this.warm.set(q.voice.url, a);
      if (this.warm.size > 6) this.warm.delete(this.warm.keys().next().value);
    }
  }

  sync(T, playing, speed, cue, volume = 1) {
    const off = cue?.voice ? T - cue.start : -1;
    const active = this.enabled && playing && cue?.voice && off >= 0 && off < cue.voice.dur;
    if (!active) { if (!this.el.paused) this.el.pause(); if (!cue || !this.enabled) this.cue = null; return; }
    if (this.cue !== cue) {
      this.cue = cue;
      this.el.src = cue.voice.url;
      this.pending = off;
    } else if (this.pending === null && Math.abs(this.el.currentTime - off) > 0.25 * Math.max(1, speed)) {
      this.el.currentTime = off;
    }
    this.el.playbackRate = speed;
    this.el.volume = volume;
    if (this.el.paused) this.el.play().catch(() => {});
  }

  stop() { this.el.pause(); this.cue = null; }
}
