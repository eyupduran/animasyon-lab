// The channel's publishing schedule: channel/plan.json is the single source; this tool reads and updates it.
//   npm run plan                              the whole schedule as a table, next item marked
//   npm run plan -- next                      the next video to produce (its brief goes to /animation word for word)
//   npm run plan -- show <no|slug>            one row in full
//   npm run plan -- set <no|slug> status=produced [slug=…] [youtube=…] [date=YYYY-MM-DD] [title="…"]
//   npm run plan -- check                     consistency checks (weekdays, duplicates, slugs, categories)
//   npm run plan -- build                     writes channel/PLAN.md and channel/plan.html (the page published as an Artifact)
// Statuses: planned → produced (film on the site) → packaged (YouTube package ready) → published (on YouTube); skipped.
import fs from 'fs';
import path from 'path';
import { ROOT, CATEGORIES, COLLECTIONS, listAnimations } from './lib/animations.mjs';

const DIR = path.join(ROOT, 'channel');
const FILE = path.join(DIR, 'plan.json');
const STATUS = { planned: 'Planlandı', produced: 'Film hazır', packaged: 'Paket hazır', published: 'Yayında', skipped: 'Atlandı' };
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const plan = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const save = () => { plan.updated = today(); fs.writeFileSync(FILE, JSON.stringify(plan, null, 2) + '\n', 'utf8'); };

// dates are plain YYYY-MM-DD strings; arithmetic goes through UTC noon so no time zone can shift a day
const toDate = s => new Date(s + 'T12:00:00Z');
const iso = d => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
const weekday = s => toDate(s).getUTCDay();
const long = s => { const d = toDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} ${DAYS[d.getUTCDay()]}`; };
const short = s => { const d = toDate(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };

const series = id => plan.series.find(s => s.id === id) || { id, title: id, short: id };
const slot = id => plan.channel.slots.find(s => s.id === id) || { label: '', time: '' };
const byDate = [...plan.videos].sort((a, b) => a.date.localeCompare(b.date) || a.no - b.no);
const find = ref => plan.videos.find(v => String(v.no) === String(ref) || v.slug === ref);
const lead = plan.channel.leadDays ?? 3;
const nextUp = () => byDate.find(v => v.status === 'planned');
const waiting = () => byDate.filter(v => v.status === 'produced' || v.status === 'packaged');

function relative(date) {
  const n = daysBetween(today(), date);
  if (n === 0) return 'bugün';
  return n > 0 ? `${n} gün sonra` : `${-n} gün geçti`;
}

function describe(v) {
  const s = series(v.series), sl = slot(v.slot);
  const out = [];
  out.push(`#${v.no} · ${long(v.date)}${sl.time ? ' ' + sl.time.replace(':', '.') : ''} · ${sl.weekday == null ? sl.label + ' · ' : ''}${s.short} · ${STATUS[v.status] || v.status}`);
  out.push(`Başlık: ${v.title}`);
  out.push(`Açı: ${v.angle}`);
  if (v.hook) out.push(`Takvim: ${v.hook.label} (${short(v.hook.date)})${v.hook.fixed ? ', tarihi kaçmamalı' : ''}`);
  if (v.school) out.push('Okulda da işlenen konu.');
  out.push(`Süre hedefi: ${s.minutes || v.minutes} dakika · Kategori: ${v.category} · Slug: ${v.slug}`);
  if (v.status === 'planned') out.push(sl.weekday == null ? 'Film hazır olur olmaz yayınlanır.' : `Üretim için son gün: ${long(addDays(v.date, -lead))} (${relative(addDays(v.date, -lead))})`);
  if (v.youtube) out.push(`YouTube: ${v.youtube}`);
  for (const e of v.evidence || []) out.push(`Dayanak: ${e}`);
  if (v.brief) out.push('', 'İstek (/animation akışına kelimesi kelimesine verilir):', v.brief);
  return out.join('\n');
}

function check() {
  const errs = [], warns = [];
  const films = listAnimations(), slugs = new Set(films.map(a => a.slug));
  const home = Object.fromEntries(films.map(a => [a.slug, a.collection]));
  const seenNo = new Set(), seenDate = new Map(), seenSlug = new Set();
  for (const v of plan.videos) {
    const tag = `#${v.no} ${v.title}`;
    if (seenNo.has(v.no)) errs.push(`${tag}: sıra numarası iki kez kullanılmış`);
    seenNo.add(v.no);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date)) { errs.push(`${tag}: tarih biçimi YYYY-AA-GG olmalı`); continue; }
    const sl = plan.channel.slots.find(s => s.id === v.slot);
    if (!sl) errs.push(`${tag}: bilinmeyen gün (${v.slot})`);
    else if (sl.weekday != null && weekday(v.date) !== sl.weekday) errs.push(`${tag}: ${v.date} ${DAYS[weekday(v.date)]}, ama ${sl.label} olmalı`);
    if (seenDate.has(v.date)) errs.push(`${tag}: ${v.date} tarihinde başka video var (${seenDate.get(v.date)})`);
    seenDate.set(v.date, tag);
    if (!plan.series.some(s => s.id === v.series)) errs.push(`${tag}: bilinmeyen seri (${v.series})`);
    if (!CATEGORIES[v.category]) errs.push(`${tag}: bilinmeyen kategori (${v.category}); tools/lib/animations.mjs → CATEGORIES`);
    if (!STATUS[v.status]) errs.push(`${tag}: bilinmeyen durum (${v.status})`);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug || '')) errs.push(`${tag}: slug küçük harf, rakam ve tire olmalı`);
    if (seenSlug.has(v.slug)) errs.push(`${tag}: slug iki kez kullanılmış (${v.slug})`);
    seenSlug.add(v.slug);
    const made = v.status === 'produced' || v.status === 'packaged' || v.status === 'published';
    if (made && !slugs.has(v.slug)) errs.push(`${tag}: durum "${STATUS[v.status]}" ama ${COLLECTIONS.channel.folder}/ altında ${v.slug} yok`);
    if (home[v.slug] === 'lab') errs.push(`${tag}: ${v.slug} animations/ altında (deneme); çizelgedeki filmler ${COLLECTIONS.channel.folder}/ altında olur`);
    if (v.status === 'planned' && slugs.has(v.slug)) warns.push(`${tag}: ${v.slug} klasörü var ama durum hâlâ "Planlandı"`);
    if (v.status === 'planned' && !v.brief) errs.push(`${tag}: istek metni (brief) boş`);
    if (v.hook) {
      if (daysBetween(v.date, v.hook.date) < 0) errs.push(`${tag}: video, bağlı olduğu günden (${v.hook.date}) sonra yayınlanıyor`);
      if (daysBetween(v.date, v.hook.date) > 7) warns.push(`${tag}: bağlı olduğu güne (${v.hook.date}) bir haftadan uzak`);
    }
    if (v.status === 'planned' && daysBetween(today(), v.date) < 0 && plan.channel.slots.find(s => s.id === v.slot)?.weekday != null) warns.push(`${tag}: yayın günü geçti (${short(v.date)}), film üretilmedi`);
  }
  for (const c of plan.compilations || []) for (const n of c.parts) if (!plan.videos.some(v => v.no === n)) errs.push(`${c.title}: #${n} çizelgede yok`);
  const p = plan.channel.period;
  if (byDate.length && (byDate[0].date < p.from || byDate[byDate.length - 1].date > p.to)) warns.push('Çizelge dönemi (period) videoların tarihlerini kapsamıyor');
  return { errs, warns };
}

function table(rows) {
  const w = rows[0].map((_, i) => Math.max(...rows.map(r => [...String(r[i])].length)));
  return rows.map(r => r.map((c, i) => String(c) + ' '.repeat(w[i] - [...String(c)].length)).join('  ')).join('\n');
}

function markdown() {
  const out = [];
  const p = plan.channel.period;
  out.push(`# ${plan.channel.name ? plan.channel.name + ': yayın çizelgesi' : 'Yayın çizelgesi'}`, '');
  out.push(`${long(p.from)} – ${long(p.to)} · ${plan.videos.length} video · son güncelleme ${long(plan.updated)}`, '');
  out.push('> Bu dosya üretilir (`npm run plan -- build`). Elle düzenleme; kaynak `channel/plan.json`. Kurallar: [README.md](README.md).', '');
  if (plan.channel.artifact) out.push(`Çizelge sayfası: ${plan.channel.artifact}`, '');
  out.push('## Kararlar', '');
  for (const d of plan.decisions) out.push(`- **${d.q}** ${d.a}`);
  out.push('', '## Günler', '');
  for (const s of plan.channel.slots) out.push(`- **${[s.label, s.time.replace(':', '.')].filter(Boolean).join(' ')}**: ${s.role}`);
  out.push('', '## Seriler', '', '| Seri | Gün | Süre | Video | Ne anlatır |', '|---|---|---|---|---|');
  for (const s of plan.series) out.push(`| ${s.title}${s.kind === 'deneme' ? ' (deneme)' : ''} | ${slot(s.slot).label} | ${s.minutes} dk | ${plan.videos.filter(v => v.series === s.id).length} | ${s.about} |`);
  const months = [...new Set(byDate.map(v => v.date.slice(0, 7)))];
  const extras = [
    ...(plan.milestones || []).map(m => ({ date: m.date, line: `| | ${short(m.date)} | | | **${m.title}.** ${m.text} | | |` })),
    ...(plan.compilations || []).map(c => ({ date: c.date, line: `| + | ${short(c.date)} ${DAYS[weekday(c.date)]} | Derleme | ${c.title} | ${c.text} Bölümler: ${c.parts.map(n => '#' + n).join(', ')}. | ${STATUS[c.status] || c.status} | |` })),
  ];
  for (const m of months) {
    const [y, mo] = m.split('-').map(Number);
    out.push('', `## ${MONTHS[mo - 1]} ${y}`, '', '| No | Tarih | Seri | Başlık | Açı | Durum | Not |', '|---|---|---|---|---|---|---|');
    const rows = [
      ...byDate.filter(v => v.date.startsWith(m)).map(v => ({ date: v.date, order: 1, line: `| ${v.no} | ${short(v.date)} ${DAYS[weekday(v.date)]} | ${series(v.series).short} | ${v.title} | ${v.angle} | ${STATUS[v.status]}${v.slug && v.status !== 'planned' ? ` (\`${v.slug}\`)` : ''} | ${[v.hook ? `${v.hook.label}${v.hook.fixed ? ' (sabit)' : ''}` : '', v.school ? 'Okulda da var' : ''].filter(Boolean).join(' · ')} |` })),
      ...extras.filter(e => e.date.startsWith(m)).map(e => ({ date: e.date, order: 0, line: e.line })),
    ].sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order);
    for (const r of rows) out.push(r.line);
  }
  const later = extras.filter(e => !months.includes(e.date.slice(0, 7)));
  if (later.length) { out.push('', '## Sonrası', '', '| | Tarih | | | | | |', '|---|---|---|---|---|---|---|'); for (const e of later) out.push(e.line); }
  out.push('', '## Yedek konular', '');
  for (const s of plan.series) {
    const items = (plan.reserve || []).filter(r => r.series === s.id);
    if (!items.length) continue;
    out.push(`**${s.short}**`, '');
    for (const r of items) out.push(`- ${r.title}${/[.?!)]$/.test(r.title) ? '' : '.'} ${r.evidence}`);
    out.push('');
  }
  out.push('## Kaynaklar', '');
  for (const s of plan.sources || []) out.push(s.url ? `- [${s.title}](${s.url})` : `- ${s.title}`);
  return out.join('\n') + '\n';
}

function build() {
  const { errs } = check();
  if (errs.length) { console.log('Çizelgede hata var, önce düzeltin:\n' + errs.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
  fs.writeFileSync(path.join(DIR, 'PLAN.md'), markdown(), 'utf8');
  const tpl = path.join(DIR, 'page.template.html');
  const made = ['channel/PLAN.md'];
  if (fs.existsSync(tpl)) {
    const data = JSON.stringify({ ...plan, built: today(), statusLabels: STATUS }).replace(/</g, '\\u003c');
    const html = fs.readFileSync(tpl, 'utf8');
    if (!html.includes('/*__PLAN__*/null')) { console.log('page.template.html içinde /*__PLAN__*/null işareti yok'); process.exit(1); }
    const name = esc(plan.channel.name || 'Animasyon Lab');
    fs.writeFileSync(path.join(DIR, 'plan.html'), html.replaceAll('__CHANNEL__', name).replace('/*__PLAN__*/null', () => data), 'utf8');
    made.push('channel/plan.html');
  }
  console.log('→ ' + made.join('\n→ '));
}

const [cmd = 'list', ...rest] = process.argv.slice(2);
if (cmd === 'list') {
  const nx = nextUp();
  const rows = [['', 'No', 'Tarih', 'Gün', 'Seri', 'Başlık', 'Durum']];
  for (const v of byDate) rows.push([nx && v.no === nx.no ? '→' : '', v.no, short(v.date), slot(v.slot).label, series(v.series).short, v.title, STATUS[v.status]]);
  console.log(table(rows));
  const count = k => plan.videos.filter(v => v.status === k).length;
  console.log(`\n${plan.videos.length} video · ${Object.keys(STATUS).filter(k => count(k)).map(k => `${STATUS[k]}: ${count(k)}`).join(' · ')}`);
} else if (cmd === 'next') {
  const v = nextUp();
  if (!v) console.log('Çizelgede üretilecek video kalmadı. Yeni dönem için /plan çalıştırın.');
  else console.log('SIRADAKİ\n' + describe(v));
  const w = waiting();
  if (w.length) console.log('\nFİLMİ HAZIR, YAYIN BEKLEYENLER\n' + w.map(x => `#${x.no} · ${short(x.date)} ${slot(x.slot).label} · ${x.title} · ${STATUS[x.status]}${x.status === 'produced' ? ` → /youtube ${x.slug}` : ' → YouTube\'a yükle'}`).join('\n'));
} else if (cmd === 'show') {
  const v = find(rest[0]);
  if (!v) { console.log(`çizelgede yok: ${rest[0]}`); process.exit(1); }
  console.log(describe(v));
} else if (cmd === 'set') {
  const v = find(rest[0]);
  if (!v) { console.log(`çizelgede yok: ${rest[0]} (bu film çizelge dışı bir deneme olabilir; yapılacak bir şey yok)`); process.exit(0); }
  const allowed = ['status', 'slug', 'date', 'youtube', 'title'];
  for (const kv of rest.slice(1)) {
    const i = kv.indexOf('=');
    const k = kv.slice(0, i), val = kv.slice(i + 1);
    if (i < 1 || !allowed.includes(k)) { console.log(`bilinmeyen alan: ${kv} (kullanılabilir: ${allowed.join(', ')})`); process.exit(1); }
    if (k === 'status' && !STATUS[val]) { console.log(`bilinmeyen durum: ${val} (kullanılabilir: ${Object.keys(STATUS).join(', ')})`); process.exit(1); }
    v[k] = val;
  }
  const { errs } = check();
  if (errs.length) { console.log('Değişiklik kaydedilmedi:\n' + errs.map(e => '  ✗ ' + e).join('\n')); process.exit(1); }
  save();
  console.log(`#${v.no} ${v.title}: ${STATUS[v.status]}${v.youtube ? ' · ' + v.youtube : ''}`);
} else if (cmd === 'check') {
  const { errs, warns } = check();
  for (const e of errs) console.log('✗ ' + e);
  for (const w of warns) console.log('! ' + w);
  console.log(errs.length ? `\n${errs.length} hata` : `Çizelge tutarlı (${plan.videos.length} video${warns.length ? `, ${warns.length} uyarı` : ''}).`);
  process.exit(errs.length ? 1 : 0);
} else if (cmd === 'build') {
  build();
} else {
  console.log('kullanım: npm run plan [-- next | show <no|slug> | set <no|slug> alan=değer … | check | build]');
  process.exit(1);
}
