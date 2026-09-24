// Writes narration/lines.json (what the narrator says for every subtitle) from the story script.
// Then, at the repository root: npm run voice -- laser-printer
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHAPTERS } from '../src/story/script.js';
import { spoken } from '../src/story/spoken.js';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lines = [];
for (const c of CHAPTERS) c.cues.forEach((q, i) => lines.push({ id: `${c.id}-${i}`, say: spoken(q) }));
fs.mkdirSync(path.join(DIR, 'narration'), { recursive: true });
fs.writeFileSync(path.join(DIR, 'narration', 'lines.json'), JSON.stringify({ profile: 'anlatici', out: 'public/voice', manifest: 'narration/manifest.json', lines }, null, 1) + '\n');
console.log(`narration/lines.json: ${lines.length} satır`);
