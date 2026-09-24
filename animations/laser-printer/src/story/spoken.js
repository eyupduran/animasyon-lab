// How a subtitle should be read aloud: brackets dropped or reworded, letters and symbols spelled out.
const WORDS = [
  [/\s*\|\s*/g, ' '],
  [/yarım ton \(raster\)/g, 'yarım ton ya da raster'],
  [/hare \(moiré\)/g, 'hare'],
  [/\s*\([^)]*\)/g, ''],
  [/Kısaca CMYK\./g, 'Kısaca bu dört renge ce me ye ka denir.'],
  [/CMYK/g, 'ce me ye ka'],
  [/çokgen/g, 'çok kenarlı'],
  [/Chester Carlson/g, 'Çester Karlson'],
  [/camgöbeği/g, 'cam göbeği'],
  [/\bA4\b/g, 'A dört'],
  [/[“”"]/g, ''],
  [/(\d+)\s*[–-]\s*(\d+)/g, '$1 ile $2'],
  [/−\s*(\d)/g, 'eksi $1'],
  [/°C/g, ' derece'],
  [/µm/g, ' mikrometre'],
];

export function spoken(text) {
  let s = text;
  for (const [re, to] of WORDS) s = s.replace(re, to);
  return s.replace(/\s+/g, ' ').trim();
}
