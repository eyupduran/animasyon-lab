// Small synthesized sound effects (Web Audio): nothing is loaded from files.
export function createSfx() {
  let ac = null, master = null, duck = 1;
  const ensure = () => {
    if (ac) return ac;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.5; master.connect(ac.destination);
    return ac;
  };
  const noise = dur => {
    const b = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const s = ac.createBufferSource(); s.buffer = b; return s;
  };
  const env = (node, t, a, peak, d) => {
    const g = ac.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak * duck, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    node.connect(g); g.connect(master); return g;
  };
  const tone = (f, t, a, peak, d, type = 'sine', f2) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    env(o, t, a, peak, d); o.start(t); o.stop(t + a + d + 0.05);
  };
  const band = (src, t, f, q, a, peak, d, f2) => {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.setValueAtTime(f, t); bp.Q.value = q;
    if (f2) bp.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    src.connect(bp); env(bp, t, a, peak, d); src.start(t); src.stop(t + a + d + 0.05);
  };
  const play = {
    tick(t) { tone(1800, t, 0.002, 0.12, 0.04, 'square'); },
    pop(t) { tone(520, t, 0.005, 0.35, 0.12, 'sine', 900); },
    chime(t) { [660, 990, 1320].forEach((f, i) => tone(f, t + i * 0.07, 0.01, 0.18, 0.7)); },
    whoosh(t) { band(noise(0.7), t, 400, 1.2, 0.18, 0.35, 0.45, 2400); },
    shutter(t) { band(noise(0.08), t, 3000, 0.8, 0.002, 0.6, 0.05); band(noise(0.1), t + 0.09, 2200, 0.8, 0.002, 0.45, 0.07); },
    roll(t) { for (let i = 0; i < 14; i++) tone(1200 + (i % 3) * 300, t + i * 0.1, 0.002, 0.06, 0.03, 'square'); },
    alert(t) { tone(330, t, 0.01, 0.22, 0.18, 'triangle'); tone(247, t + 0.2, 0.01, 0.22, 0.26, 'triangle'); },
    stamp(t) { tone(90, t, 0.003, 0.6, 0.18, 'sine', 50); band(noise(0.1), t, 800, 1, 0.002, 0.3, 0.08); },
    rail(t) { for (let i = 0; i < 4; i++) band(noise(0.06), t + i * 0.12, 1500, 3, 0.002, 0.15, 0.04); },
  };
  return {
    unlock() { const c = ensure(); if (c && c.state === 'suspended') c.resume(); },
    setDuck(on) { duck = on ? 0.4 : 1; },
    fire(type, delay = 0) { if (!ac || ac.state !== 'running' || !play[type]) return; play[type](ac.currentTime + 0.01 + delay); },
  };
}
