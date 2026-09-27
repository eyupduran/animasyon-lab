// ---------------------------------------------------------------------------------------------
// Ses: bütünüyle kodla üretilir (OfflineAudioContext). Yumuşak bir müzik zemini ve makinenin
// sesleri: motor uğultusu, kâğıt hışırtısı, dönen aynanın ıslığı, lazer tıkırtıları, ısıtıcı...
// Tüm film bir kez üretilir, istenen aralık ondan kesilir (belirlenimci).
// ---------------------------------------------------------------------------------------------
const SR = 48000;
let SOUND_CACHE = null;

function buildSound() {
  const ac = new OfflineAudioContext(2, Math.ceil(DURATION * SR), SR);
  const master = ac.createGain(); master.gain.value = .9;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3; comp.attack.value = .01; comp.release.value = .3;
  master.connect(comp); comp.connect(ac.destination);
  const musicBus = ac.createGain(); musicBus.gain.value = .55; musicBus.connect(master);
  const fxBus = ac.createGain(); fxBus.gain.value = 1; fxBus.connect(master);
  // yankı (kısa, sentetik)
  const verb = ac.createConvolver();
  {
    const len = SR * 2.6, b = ac.createBuffer(2, len, SR), r = mulberry(4);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    verb.buffer = b;
  }
  const verbIn = ac.createGain(); verbIn.gain.value = .35; verbIn.connect(verb); verb.connect(master);

  const rnd = mulberry(99);
  const noise = (() => { const b = ac.createBuffer(1, SR * 4, SR), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rnd() * 2 - 1; return b; })();
  const env = (param, t0, t1, peak, a, r, base = 0) => {
    param.setValueAtTime(base, Math.max(0, t0));
    param.linearRampToValueAtTime(peak, t0 + a);
    param.setValueAtTime(peak, Math.max(t0 + a, t1 - r));
    param.linearRampToValueAtTime(base, t1);
  };
  const out = (node, pan = 0, bus = fxBus, rev = 0) => {
    const p = ac.createStereoPanner(); p.pan.value = pan; node.connect(p); p.connect(bus);
    if (rev) { const s = ac.createGain(); s.gain.value = rev; p.connect(s); s.connect(verbIn); }
  };
  function tone(t0, dur, f0, gain, o = {}) {
    const osc = ac.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(f0, t0); if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    const g = ac.createGain(); env(g.gain, t0, t0 + dur, gain, o.a == null ? .01 : o.a, o.r == null ? dur * .8 : o.r);
    let n = osc;
    if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; n.connect(f); n = f; }
    n.connect(g); out(g, o.pan || 0, o.bus || fxBus, o.rev || 0);
    osc.start(t0); osc.stop(t0 + dur + .05);
  }
  function hiss(t0, dur, gain, o = {}) {
    const src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
    const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.Q.value = o.q || 1;
    f.frequency.setValueAtTime(o.f0 || 1000, t0); if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    const g = ac.createGain(); env(g.gain, t0, t0 + dur, gain, o.a == null ? .05 : o.a, o.r == null ? .2 : o.r);
    src.connect(f); f.connect(g); out(g, o.pan || 0, fxBus, o.rev || 0);
    src.start(t0, (t0 * 1.37) % 3); src.stop(t0 + dur + .05);
  }
  // özel dokular: doğrudan örnek üretimi
  function texture(t0, dur, gain, fn, pan = 0, rev = 0) {
    const n = Math.ceil(dur * SR), b = ac.createBuffer(1, n, SR), d = b.getChannelData(0);
    fn(d, n);
    const src = ac.createBufferSource(); src.buffer = b;
    const g = ac.createGain(); g.gain.value = gain;
    src.connect(g); out(g, pan, fxBus, rev); src.start(t0);
  }
  const clicks = (rate, seed, dec = 300, jitter = .3, prob = 1) => (d, n) => {
    const r = mulberry(seed); let t = 0;
    while (t < n / SR) {
      if (r() < prob) { const i0 = Math.floor(t * SR), a = .5 + .5 * r(); for (let i = 0; i < 400 && i0 + i < n; i++) d[i0 + i] += a * Math.exp(-i / (dec / 10)) * (r() * 2 - 1); }
      t += (1 + (r() - .5) * jitter) / rate;
    }
  };
  function motor(t0, t1, gain, pitch = 90) {
    tone(t0, t1 - t0, pitch, gain * .6, { type: 'sawtooth', lp: 260, a: .8, r: 1 });
    tone(t0, t1 - t0, pitch * 2.01, gain * .25, { type: 'triangle', lp: 600, a: .8, r: 1 });
    hiss(t0, t1 - t0, gain * .5, { f0: 700, q: .7, a: .8, r: 1 });
  }
  function whoosh(t0, dur, gain, up = true, pan = 0) { hiss(t0, dur, gain, { f0: up ? 300 : 2500, f1: up ? 2500 : 300, q: 1.2, a: dur * .45, r: dur * .5, pan, rev: .4 }); }

  // ---- müzik: bölüm bölüm yumuşak akorlar
  const N = (s) => 440 * Math.pow(2, s / 12);   // A4'ten yarım ton
  const chords = [
    [0, lineEnd('01-sicak') + 1, [-19, -12, -7, -3]],                 // D
    [lineEnd('01-sicak') - .5, S['02-kagit'] + 1, [-23, -16, -11, -4]],  // Bb
    [S['02-kagit'] - 1, S['03-tambur'] + 1, [-16, -9, -4, 0]],          // F
    [S['03-tambur'] - 1, S['04-lazer'] + 1, [-24, -12, -9, -5]],        // A m
    [S['04-lazer'] - 1, S['05-toner'] + 1, [-21, -14, -9, -2]],         // C
    [S['05-toner'] - 1, S['06-yarim-ton'] + 1, [-19, -12, -7, -3]],     // D m
    [S['06-yarim-ton'] - 1, S['07-fotokopi'] + 1, [-26, -14, -11, -7]], // G m
    [S['07-fotokopi'] - 1, S['07-fotokopi'] + 23, [-16, -9, -4, 0]],    // F
    [S['07-fotokopi'] + 22, S['08-kopya'] + 1, [-24, -12, -9, -5]],     // tarih: A m
    [S['08-kopya'] - 1, S['09-final'] + 1, [-23, -16, -11, -4]],        // Bb
    [S['09-final'] - 1, DURATION, [-19, -12, -7, -2, 2]],               // D (sus2 ile açılır)
  ];
  for (const [a, b, notes] of chords) {
    notes.forEach((s, i) => {
      const f = N(s);
      for (const det of [-3, 3]) tone(a, b - a, f * Math.pow(2, det / 1200), .05 / notes.length * 4, { type: i === 0 ? 'triangle' : 'sine', lp: 1400, a: 2.2, r: 2.4, bus: musicBus, pan: det > 0 ? .3 : -.3, rev: .5 });
    });
  }
  // ince çan notaları (anlatımdaki önemli anlarda)
  const bell = (t, s, g = .06) => { tone(t, 2.8, N(s), g, { a: .005, r: 2.7, bus: musicBus, rev: .9 }); tone(t, 2.2, N(s) * 2.76, g * .25, { a: .005, r: 2.1, bus: musicBus, rev: .9 }); };

  // ---- 1. bölüm
  motor(.8, 7.2, .08, 80);
  whoosh(1.7, 5, .05, true, 0);
  texture(1.7, 5, .05, clicks(28, 1, 80, .2));                 // silindir tıkırtısı
  hiss(6.7, 5, .03, { f0: 4000, q: .5, a: 1, r: 2 });           // sıcaklık
  bell(T('01-sicak', 'Sıcak'), 2);
  // damla ve toz
  tone(T('01-sicak', 'sıvı') - .2, .6, 900, .08, { f1: 300, a: .002, r: .5, rev: .5 });
  texture(T('01-sicak', 'sıvı') - .1, 1.6, .12, clicks(260, 3, 30, 1, .9), 0, .3);
  whoosh(T('01-sicak', 'Bu') - .1, 1.8, .06, true);
  whoosh(T('01-sicak', 'Sonra') + .2, 1.4, .06, false, .4);
  // başlık
  const tA = lineEnd('01-sicak') + .6;
  texture(tA, 3.2, .06, clicks(60, 7, 40, .05));
  tone(tA, 3.2, 1600, .012, { type: 'sine', a: .3, r: .6, rev: .5 });
  bell(tA + 3.2, 5, .08); bell(tA + 3.25, 12, .05);

  // ---- 2. bölüm
  whoosh(S['02-kagit'] + 22 - 12.5 + 8.5, 1.2, .05);           // katlama
  const tPick = T('02-kagit', 'kauçuk') - .2;
  motor(tPick - .8, S['03-tambur'] + 2, .07, 70);
  tone(tPick, .25, 70, .25, { a: .003, r: .22, lp: 400 });
  tone(T('02-kagit', 'engelliyor'), .2, 90, .15, { a: .003, r: .18, lp: 400 });
  whoosh(T('02-kagit', 'Tek') - .1, 3, .08);

  // ---- 3. bölüm
  motor(S['03-tambur'], S['03-tambur'] + 10, .04, 60);
  bell(T('03-tambur', 'ışık'), 9, .05);
  texture(T('03-tambur', 'tel') - .3, 1.4, .05, clicks(70, 9, 25, 1, .6), -.2);      // korona çıtırtısı
  hiss(T('03-tambur', 'Tamburun') - .6, 3, .025, { f0: 5000, q: 2, a: .5, r: 1 });
  texture(T('03-tambur', 'kabartan') - .5, 1.2, .07, clicks(40, 11, 20, 1, .5), .3);   // kıvılcım
  tone(T('03-tambur', 'ışık', 1) - .5, 1.4, 2400, .02, { a: .6, r: .6, rev: .6 });

  // ---- 4. bölüm
  const t4 = S['04-lazer'];
  texture(T('04-lazer', 'harf') - .1, 2.4, .04, clicks(14, 13, 60, .1));              // hücreler dolar
  tone(T('04-lazer', 'Hareket') - .5, S['05-toner'] - T('04-lazer', 'Hareket') - 4, 1450, .012, { type: 'sine', f1: 2600, a: 1.5, r: 1 });   // dönen ayna
  motor(T('04-lazer', 'Bu') - .3, T('04-lazer', 'Sonunda'), .04, 110);
  tone(T('04-lazer', 'süpürüyor') - 2.2, 2.2, 600, .03, { f1: 1200, a: .1, r: .4 });
  tone(T('04-lazer', 'satır', 1) - .3, .8, 600, .03, { f1: 1200, a: .05, r: .3 });
  texture(T('04-lazer', 'Lazer', 2) + 1.8, 8, .05, clicks(34, 17, 18, .05, .45));        // lazer tık tık
  bell(T('04-lazer', 'görünmez'), 7, .05);

  // ---- 5. bölüm
  texture(S['05-toner'] - .5, 10, .03, clicks(120, 19, 12, 1, .7), 0, .5);          // toz
  bell(T('05-toner', 'toza') + .2, 0, .06);
  texture(T('05-toner', 'Tamburun') - .1, 4, .05, clicks(12, 23, 40, .6));           // zıplayan tanecikler
  texture(T('05-toner', 'kabul') - .5, 3, .06, clicks(30, 29, 30, .6));
  motor(T('05-toner', 'Şimdi') - .5, T('05-toner', 'Yaz') + .3, .06, 85);
  hiss(T('05-toner', 'parmağınızı') - .1, 1.8, .06, { f0: 1200, f1: 800, q: .8, a: .2, r: .6 });   // sürtme
  motor(T('05-toner', 'Onu') - .5, T('05-toner', 'Plastik', 1), .05, 75);
  hiss(T('05-toner', 'Biri') - .5, 8, .05, { f0: 3500, q: .6, a: 1.5, r: 2 });          // ısıtıcı
  tone(T('05-toner', 'Plastik', 1), 3, 220, .02, { f1: 110, a: .5, r: 1.5, rev: .5 });
  motor(T('05-toner', 'Tambur') - .3, lineEnd('05-toner') + 1, .05, 70);
  texture(T('05-toner', 'temizleniyor') - .3, 1.5, .04, clicks(90, 31, 15, 1, .6));
  [0, 1, 2, 3, 4, 5].forEach(i => bell(T('05-toner', 'sonraki') - .1 + i * .18, [0, 3, 7, 10, 12, 15][i], .03));

  // ---- 6. bölüm
  bell(T('06-yarim-ton', 'siyah') - .1, -2, .06);
  whoosh(T('06-yarim-ton', 'Birkaç') - .1, 3, .05, false);
  bell(T('06-yarim-ton', 'yarım') - .1, 5, .07);
  hiss(T('06-yarim-ton', 'Açıda') - .2, 4, .03, { f0: 300, f1: 900, q: 3, a: 1, r: 1.5 });

  // ---- 7. bölüm
  const s7 = S['07-fotokopi'];
  motor(T('07-fotokopi', 'Camın') - .4, T('07-fotokopi', 'Sonra') + .4, .06, 95);
  hiss(T('07-fotokopi', 'Camın') - .3, T('07-fotokopi', 'Sonra') - T('07-fotokopi', 'Camın') + .6, .04, { f0: 500, f1: 900, q: 1.5, a: .5, r: .6 });
  texture(T('07-fotokopi', 'Her') - .3, 2, .03, clicks(20, 37, 30, .1));
  motor(T('07-fotokopi', 'Sonra') - .3, T('07-fotokopi', 'Ama') + .3, .05, 90);
  // tarih: sahne geçişlerinde kâğıt hışırtısı
  for (const w of ['Ama', 'Chester', 'Mutfağında', 'Sonunda', '38', '20', 'fikirden', 'Adı', '12']) {
    const tt = T('07-fotokopi', w, w === 'Adı' ? 1 : 0) - .35;
    hiss(tt, .5, .04, { f0: 3000, f1: 1200, q: .7, a: .05, r: .35, pan: (hash1(tt) - .5) * .6 });
  }
  texture(T('07-fotokopi', 'yangın') - .3, 2.2, .06, clicks(35, 41, 25, 1, .7), .2);     // çıtırtı
  hiss(T('07-fotokopi', 'yangın') - .3, 2.2, .03, { f0: 600, q: .5, a: .2, r: .8 });
  tone(T('07-fotokopi', 'ilk') - .2, .15, 1800, .04, { a: .002, r: .14, rev: .6 });       // flaş
  bell(T('07-fotokopi', 'ilk'), 7, .06);
  texture(T('07-fotokopi', 'geri') - .5, 1.4, .07, clicks(16, 43, 60, .3), -.1);          // damgalar
  bell(T('07-fotokopi', 'Kserografi') - .1, 4, .06);
  tone(T('07-fotokopi', 'içine') - .3, 1.2, 1200, .02, { f1: 2400, a: .3, r: .5, rev: .5 });
  bell(T('07-fotokopi', 'siyahı') - .1, 9, .06);

  // ---- 8. bölüm
  whoosh(T('08-kopya', 'Kopya') - .4, 1.2, .07, true, .4);
  texture(T('08-kopya', 'Kopya') - .4, 1.2, .04, clicks(28, 47, 60, .2));
  bell(T('08-kopya', 'Hare'), 3, .07);
  tone(T('08-kopya', 'ayarı') - .3, .12, 900, .05, { a: .002, r: .1 });                    // düğme
  for (let i = 0; i < 6; i++) { const tt = T('08-kopya', 'Şimdi', 1) - .3 + i * 1.2; whoosh(tt, .9, .045, true, (i - 2.5) * .12); texture(tt, .9, .025, clicks(30, 50 + i, 60, .2)); }
  bell(T('08-kopya', 'boşluk'), 0, .06);

  // ---- 9. bölüm
  for (const w of ['Elektrik', 'Sıcaklık', 'Fotoğrafı', 'Fotokopi', 'Her', 'kopyası', 'ofiste']) {
    const tt = T('09-final', w, w === 'Elektrik' ? 1 : 0) - .35;
    whoosh(tt, .7, .03, true, (hash1(tt) - .5) * .6);
  }
  motor(T('09-final', 'ofiste') - .7, T('09-final', 'Karanlıkta'), .06, 100);
  const tL = T('09-final', 'ışık') - .15;
  tone(tL - .3, .5, 800, .04, { f1: 3000, a: .3, r: .1 });
  tone(tL + .15, 5, 55, .35, { a: .005, r: 4.8, lp: 300, rev: .8 });                        // derin vuruş
  hiss(tL + .15, 3, .12, { f0: 6000, f1: 1500, q: .4, a: .005, r: 2.8, rev: 1 });
  bell(tL + .3, 2, .09); bell(tL + .32, 9, .06); bell(tL + .35, 14, .04);

  return ac.startRendering();
}

async function renderSound(from, to) {
  if (!SOUND_CACHE) SOUND_CACHE = await buildSound();
  const s0 = Math.max(0, Math.floor(from * SR)), s1 = Math.min(SOUND_CACHE.length, Math.ceil(to * SR));
  const n = Math.max(1, s1 - s0);
  const ac = new OfflineAudioContext(2, n, SR);
  const b = ac.createBuffer(2, n, SR);
  for (let c = 0; c < 2; c++) b.copyToChannel(SOUND_CACHE.getChannelData(c).subarray(s0, s0 + n), c);
  return b;
}
