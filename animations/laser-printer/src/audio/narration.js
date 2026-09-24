// Optional spoken narration with the browser's own Turkish voice (no online service).
export class Narration {
  constructor() {
    this.enabled = false;
    this.voice = null;
    this.speaking = false;
    this.current = null;
    this.ready = new Promise(res => {
      const pick = () => {
        const vs = speechSynthesis.getVoices();
        const tr = vs.filter(v => /^tr/i.test(v.lang));
        this.voice = tr.find(v => /tolga|emel|yelda|google/i.test(v.name)) || tr[0] || null;
        if (vs.length) res(this.voice);
      };
      if (!('speechSynthesis' in window)) { res(null); return; }
      pick();
      speechSynthesis.onvoiceschanged = pick;
      setTimeout(() => res(this.voice), 1500);
    });
  }
  get available() { return !!this.voice; }

  // text as it should be spoken (no brackets, letters read the Turkish way)
  static spoken(text) {
    return text
      .replace(/\s*\([^)]*\)/g, '')
      .replace(/CMYK/g, 'ce, me, ye, ka')
      .replace(/A4/g, 'A dört')
      .replace(/“|”/g, '');
  }

  say(text, rate = 1) {
    if (!this.enabled || !this.voice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(Narration.spoken(text));
    u.voice = this.voice; u.lang = this.voice.lang; u.rate = Math.min(1.6, 0.98 * rate); u.pitch = 1;
    this.speaking = true;
    u.onend = u.onerror = () => { if (this.current === u) this.speaking = false; };
    this.current = u;
    speechSynthesis.speak(u);
  }
  stop() { if ('speechSynthesis' in window) speechSynthesis.cancel(); this.speaking = false; this.current = null; }
  pause() { if ('speechSynthesis' in window) speechSynthesis.pause(); }
  resume() { if ('speechSynthesis' in window) speechSynthesis.resume(); }
}
