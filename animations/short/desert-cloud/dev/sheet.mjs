// Contact sheet of every .jpg in a folder: node dev/sheet.mjs <dir> [cols] [cellWidth]
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const sharp = createRequire(import.meta.url)('../../../../node_modules/sharp');
const [dir, c = 4, w = 640] = process.argv.slice(2); const cols = +c, cw = +w;
const files = fs.readdirSync(dir).filter(f => f.startsWith('f-') && f.endsWith('.jpg')).sort();
const ch = Math.round(cw * 9 / 16), rows = Math.ceil(files.length / cols);
const parts = await Promise.all(files.map(async (f, i) => {
  const label = Buffer.from(`<svg width="${cw}" height="${ch}"><rect x="0" y="0" width="92" height="26" fill="black" opacity=".7"/><text x="8" y="19" font-size="17" font-family="Arial" fill="#ff0">${f.slice(2, -4)}</text></svg>`);
  const img = await sharp(path.join(dir, f)).resize(cw, ch).composite([{ input: label }]).toBuffer();
  return { input: img, left: (i % cols) * cw, top: Math.floor(i / cols) * ch };
}));
await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: '#111' } }).composite(parts).jpeg({ quality: 85 }).toFile(path.join(dir, 'sheet.jpg'));
console.log(path.join(dir, 'sheet.jpg'));
