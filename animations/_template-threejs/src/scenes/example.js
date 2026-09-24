// ============================================================
//  EXAMPLE — a glowing object travelling down a tissue tunnel.
//  Copy this pattern: one defWorld (the 3D set) + defChapter blocks (the timeline).
// ============================================================
defWorld('example', () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14060a);
  scene.fog = new THREE.FogExp2(0x14060a, 0.05);
  const tex = tissueTex('example-wall', { c0: 0x5a1020, c1: 0xb84858, c2: 0xf0a0a8, scale: 3, veins: 16, bump: 2.2, seed: 5 });
  const pts = [V3(0, 0, 0), V3(2, 1, -10), V3(-2, 0, -20), V3(1, -1, -30), V3(0, 0, -40)];
  const F = pathFrames(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), 400);
  const R = 1.6;
  const mat = wetMat({ tex, rough: 0.4 });
  const wu = addTubeMotion(mat);
  scene.add(new THREE.Mesh(tubeGeo(F, (s, th) => R * (1 + 0.06 * noise3(Math.cos(th) * 2, Math.sin(th) * 2, s * 0.3)), { radial: 64, uvU: 0.25, uvV: 3 }), mat));
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 16), new THREE.MeshStandardMaterial({ color: 0xffd070, emissive: new THREE.Color(0xffa020), emissiveIntensity: 2 }));
  const glow = halo(0xffc54d, 1.2, 0.9);
  scene.add(core, glow);
  scene.add(motes(800, (v, r) => F.pt(r() * F.L, r() * TAU, R * 0.9 * Math.sqrt(r()), v), { color: 0xffd0c0, size: 0.03, drift: 0.2, opacity: 0.5 }));
  scene.add(new THREE.HemisphereLight(0xc06070, 0x200608, 1.2));
  return { scene, F, wu, core, glow, lamp: [5, 25, 0xfff0ea, 1.2] };
});

// camera follows the object from behind along the tunnel
function followObject(t, w, s0, s1, dur) {
  const s = lerp(s0, s1, eio(clamp(t / dur)));
  const f = w.F.at(s);
  w.core.position.copy(f.p); w.glow.position.copy(f.p);
  w.wu.uTime.value = T; w.wu.uWaveC.value = s - 1.2; w.wu.uWaveA.value = 0.3;
  const fc = w.F.at(Math.max(0, s - 2.4));
  aim(camera, fc.p, f.p, fc.u);
  camera.fov = 65;
}

defChapter({
  order: 1, id: 'sahne-1', n: 1, name: 'Birinci Sahne', latin: 'Alt başlık', blurb: 'Bu bölümün tek cümlelik özeti.',
  world: 'example', dur: 12,
  clock: [0, 60], ph: 7, scale: '~2 cm', state: 'Başlangıç',
  cues: [[0.3, 'Bu, şablon sahnesi. Alt yazılar zamanlarıyla birlikte burada yazılır.'], [6, 'Etiketler 3D bir noktaya bağlanır ve kamerayla birlikte hareket eder.']],
  facts: [['Örnek bilgi', 'değer']],
  labels: [{ t0: 2, t1: 9, text: 'Takip edilen nesne', sub: 'etiket örneği', at: w => w.core.position, hero: true }],
  events: [[0.4, 'whoosh'], [6, 'ping']],
  update(t, w) { followObject(t, w, 1, 18, 12); },
});

defChapter({
  order: 2, id: 'sahne-2', n: 2, name: 'İkinci Sahne', latin: 'Alt başlık', blurb: 'Aynı dünyada devam eden ikinci bölüm.',
  world: 'example', dur: 12,
  clock: [60, 120], ph: 7, scale: '~2 cm', state: 'Devam',
  cues: [[0.3, 'Aynı dünyayı paylaşan bölümler arasında kararma olmaz; kamera kesintisiz devam eder.']],
  update(t, w) { followObject(t, w, 18, 37, 12); },
});
