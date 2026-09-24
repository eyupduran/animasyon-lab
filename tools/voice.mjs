// Local Turkish narration with Piper TTS (the same engine and voice profiles as Voxtory).
//   npm run voice -- <slug> [--profile anlatici] [--force]
//   npm run voice -- profiles
// The animation provides animations/<slug>/narration/lines.json:
//   { "profile": "anlatici", "out": "public/voice", "manifest": "narration/manifest.json",
//     "lines": [ { "id": "intro-0", "say": "Metnin söylenecek hâli." }, ... ] }
// Each line becomes <out>/<id>.mp3; the manifest records every clip's exact duration so the
// animation can time its subtitles to the voice. Unchanged lines are not generated again.
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Voxtory's profiles (app/engines/tts/profiles.py)
export const PROFILES = {
  anlatici: { ad: 'Anlatıcı (varsayılan)', length_scale: 1.0, noise_scale: 0.667, noise_w: 0.8, sentence_silence: 0.3 },
  yavas: { ad: 'Yavaş ve dramatik', length_scale: 1.35, noise_scale: 0.5, noise_w: 0.6, sentence_silence: 0.6 },
  hizli: { ad: 'Hızlı anlatım', length_scale: 0.75, noise_scale: 0.8, noise_w: 0.9, sentence_silence: 0.15 },
  fisiltili: { ad: 'Fısıltılı', length_scale: 1.15, noise_scale: 0.9, noise_w: 1.0, sentence_silence: 0.5 },
  enerjik: { ad: 'Enerjik', length_scale: 0.85, noise_scale: 0.8, noise_w: 0.5, sentence_silence: 0.2 },
  derin: { ad: 'Derin ve ciddi', length_scale: 1.2, noise_scale: 0.4, noise_w: 0.4, sentence_silence: 0.4 },
};
const MODEL = 'tr_TR-dfki-medium.onnx';

// Piper needs an ASCII-only working directory (its DLLs and espeak data), so prefer ProgramData.
function findPiper() {
  const cands = [
    process.env.PIPER_DIR,
    path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'piper_data'),
    path.join(process.env.LOCALAPPDATA || os.homedir(), 'piper_data'),
    path.join(os.homedir(), 'Desktop', 'Voxtory', 'tts'),
  ].filter(Boolean);
  for (const d of cands) if (fs.existsSync(path.join(d, 'piper.exe')) && fs.existsSync(path.join(d, MODEL))) return d;
  return null;
}

function wavDuration(file) {
  const b = fs.readFileSync(file);
  let o = 12, rate = 0, bytesPerSec = 0, data = 0;
  while (o + 8 <= b.length) {
    const id = b.toString('ascii', o, o + 4), size = b.readUInt32LE(o + 4);
    if (id === 'fmt ') { rate = b.readUInt32LE(o + 12); bytesPerSec = b.readUInt32LE(o + 16); }
    if (id === 'data') { data = Math.min(size, b.length - o - 8); break; }
    o += 8 + size + (size & 1);
  }
  return bytesPerSec ? data / bytesPerSec : 0;
}

const args = process.argv.slice(2);
const slug = args.find(a => !a.startsWith('--'));
const flag = n => { const i = args.indexOf(`--${n}`); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : null; };

if (!slug || slug === 'profiles') {
  console.log('Ses profilleri:');
  for (const [k, p] of Object.entries(PROFILES)) console.log(`  ${k.padEnd(10)} ${p.ad}`);
  console.log('\nkullanım: npm run voice -- <slug> [--profile anlatici] [--force]');
  process.exit(slug ? 0 : 1);
}

const dir = path.join(ROOT, 'animations', slug);
const linesFile = path.join(dir, 'narration', 'lines.json');
if (!fs.existsSync(linesFile)) { console.log(`${path.relative(ROOT, linesFile)} yok. Animasyon önce seslendirilecek satırları bu dosyaya yazmalı.`); process.exit(1); }
const spec = JSON.parse(fs.readFileSync(linesFile, 'utf8'));
const profileId = flag('profile') || spec.profile || 'anlatici';
const profile = { ...PROFILES[profileId], ...(spec.tweak || {}) };
if (!PROFILES[profileId]) { console.log(`Bilinmeyen profil: ${profileId}`); process.exit(1); }
const piperDir = findPiper();
if (!piperDir) { console.log('Piper bulunamadı. PIPER_DIR ortam değişkeniyle ya da C:\\ProgramData\\piper_data altına kurun (Voxtory README).'); process.exit(1); }

const outDir = path.join(dir, spec.out || 'public/voice');
const manifestFile = path.join(dir, spec.manifest || 'narration/manifest.json');
fs.mkdirSync(outDir, { recursive: true });
const old = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : { lines: {} };
const manifest = { engine: 'piper', model: MODEL, profile: profileId, lines: {} };
const tmp = fs.mkdtempSync(path.join(piperDir, 'voice_'));
const publicBase = path.relative(path.join(dir, 'public'), outDir).split(path.sep).join('/');

let made = 0, kept = 0;
try {
  for (const line of spec.lines) {
    const hash = crypto.createHash('sha1').update(JSON.stringify([MODEL, profile, line.say])).digest('hex').slice(0, 12);
    const file = path.join(outDir, `${line.id}.mp3`);
    const prev = old.lines?.[line.id];
    if (!flag('force') && prev && prev.hash === hash && fs.existsSync(file)) { manifest.lines[line.id] = prev; kept++; continue; }
    const wav = path.join(tmp, `${line.id}.wav`);
    const r = spawnSync(path.join(piperDir, 'piper.exe'), [
      '--model', MODEL, '--espeak_data', 'espeak-ng-data',
      '--length_scale', String(profile.length_scale), '--noise_scale', String(profile.noise_scale),
      '--noise_w', String(profile.noise_w), '--sentence_silence', String(profile.sentence_silence),
      '--output_file', wav,
    ], { cwd: piperDir, input: line.say, encoding: 'utf8' });
    if (r.status !== 0 || !fs.existsSync(wav)) { console.log(`✗ ${line.id}: Piper hata verdi\n${r.stderr}`); process.exit(1); }
    // even loudness across clips, then a compact mono MP3
    const f = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', wav, '-af', 'highpass=f=60,loudnorm=I=-17:TP=-1.5:LRA=9,aresample=44100', '-ac', '1', '-b:a', '96k', file]);
    if (f.status !== 0) { console.log(`✗ ${line.id}: ffmpeg hata verdi\n${f.stderr}`); process.exit(1); }
    manifest.lines[line.id] = { file: `${publicBase}/${line.id}.mp3`, dur: Math.round(wavDuration(wav) * 1000) / 1000, hash };
    made++;
    process.stdout.write(`\r${made + kept}/${spec.lines.length} ${line.id}`.padEnd(40));
  }
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
// remove clips of lines that no longer exist
const keep = new Set(spec.lines.map(l => `${l.id}.mp3`));
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.mp3') && !keep.has(f)) fs.rmSync(path.join(outDir, f));
fs.mkdirSync(path.dirname(manifestFile), { recursive: true });
fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1) + '\n');
const total = Object.values(manifest.lines).reduce((a, l) => a + l.dur, 0);
console.log(`\n${slug}: ${made} yeni, ${kept} değişmedi · ${profile.ad} · toplam ${Math.floor(total / 60)} dk ${Math.round(total % 60)} sn`);
