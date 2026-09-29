// Topic research for the publishing schedule, from public YouTube pages only (no account, no key, nothing sent).
//   npm run topics -- suggest "osmanlı neden" "nasıl çalışır animasyon"    what people type into YouTube search (Turkish)
//   npm run topics -- top DFTTarih kurzgesagt [--limit 20] [--lang en]       a channel's most viewed videos
//   npm run topics -- channels "tarih belgesel"                             channels matching a search, with subscriber counts
// A topic enters channel/plan.json only with evidence from one of these: a search phrase or a watched example.
// YouTube changes its page format from time to time; when a command returns nothing, the parser here needs an update.

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const args = process.argv.slice(2);
const cmd = args.shift();
const opt = (n, d) => { const i = args.indexOf(`--${n}`); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const lang = opt('lang', 'tr');
const limit = Number(opt('limit', 20));
const headers = { 'User-Agent': UA, 'Accept-Language': lang === 'tr' ? 'tr-TR,tr;q=0.9' : 'en-US,en;q=0.9', Cookie: 'CONSENT=YES+1; SOCS=CAI' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

const text = v => !v ? '' : typeof v === 'string' ? v : v.simpleText || (v.runs || []).map(r => r.text || '').join('') || v.content || '';
function walk(o, fn) {
  if (Array.isArray(o)) { for (const x of o) walk(x, fn); return; }
  if (o && typeof o === 'object') { if (fn(o) === false) return; for (const x of Object.values(o)) walk(x, fn); }
}
const initialData = html => { const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s); return m ? JSON.parse(m[1]) : null; };

function videosIn(data) {
  const out = [];
  walk(data, o => {
    if (o.lockupViewModel) {
      const v = o.lockupViewModel, md = v.metadata?.lockupMetadataViewModel || {};
      const parts = [];
      for (const row of md.metadata?.contentMetadataViewModel?.metadataRows || []) for (const p of row.metadataParts || []) parts.push(text(p.text));
      let len = '';
      walk(v.contentImage, z => { if (z.thumbnailBadgeViewModel && !len) len = z.thumbnailBadgeViewModel.text || ''; });
      out.push({ title: text(md.title), views: parts.find(x => /view|görüntüleme/.test(x)) || '', age: parts.find(x => /ago|önce/.test(x)) || '', len });
      return false;
    }
    const r = o.videoRenderer || o.gridVideoRenderer;
    if (r) { out.push({ title: text(r.title), views: text(r.viewCountText), age: text(r.publishedTimeText), len: text(r.lengthText) }); return false; }
  });
  return out;
}

async function top(handle) {
  const html = await (await fetch(`https://www.youtube.com/@${encodeURIComponent(handle)}/videos`, { headers })).text();
  const data = initialData(html);
  if (!data) return { name: handle, subs: '', mode: 'okunamadı', videos: [] };
  const name = (html.match(/<meta property="og:title" content="([^"]*)"/) || [])[1] || handle;
  const subs = (html.match(/"([\d.,]+\s?(?:[KMB]|Mn|B)? (?:subscribers|abone))"/) || [])[1] || '';
  let token = null;
  walk(data, o => {
    if (o.chipViewModel && /^(Popular|Popüler)$/.test(o.chipViewModel.text || '')) walk(o.chipViewModel, z => { if (z.continuationCommand) token = z.continuationCommand.token; });
  });
  const key = (html.match(/"INNERTUBE_API_KEY":"([^"]+)"/) || [])[1];
  const ver = (html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/) || [])[1] || '2.20240620.00.00';
  if (token && key) {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${key}&prettyPrint=false`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: { client: { clientName: 'WEB', clientVersion: ver, hl: lang, gl: 'TR' } }, continuation: token }),
    });
    const videos = videosIn(await res.json());
    if (videos.length) return { name, subs, mode: 'en çok izlenenler', videos };
  }
  return { name, subs, mode: 'en yeniler (en çok izlenenler okunamadı)', videos: videosIn(data) };
}

async function suggest(q) {
  const res = await fetch(`https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=tr&gl=tr&q=${encodeURIComponent(q)}`, { headers: { 'User-Agent': UA } });
  const buf = Buffer.from(await res.arrayBuffer());
  for (const enc of ['utf-8', 'windows-1254', 'latin1']) {
    try { const s = new TextDecoder(enc, { fatal: true }).decode(buf); return JSON.parse(s)[1]; } catch { /* try the next encoding */ }
  }
  return [];
}

async function channels(q) {
  const html = await (await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}&sp=EgIQAg%3D%3D`, { headers })).text();
  const out = [];
  walk(initialData(html), o => {
    if (!o.channelRenderer) return;
    const c = o.channelRenderer;
    out.push({ title: text(c.title), a: text(c.subscriberCountText), b: text(c.videoCountText) });
    return false;
  });
  return out;
}

const pad = (s, n) => { const len = [...s].length; return len >= n ? s : ' '.repeat(n - len) + s; };
if (cmd === 'suggest' && args.length) {
  for (const q of args) { console.log(`[${q}]  ${(await suggest(q)).join(' | ') || '(öneri yok)'}`); await sleep(250); }
} else if (cmd === 'top' && args.length) {
  for (const h of args) {
    try {
      const r = await top(h.replace(/^@/, ''));
      console.log(`\n=== @${h.replace(/^@/, '')} · ${r.name} · ${r.subs} · ${r.mode}`);
      for (const v of r.videos.slice(0, limit)) console.log(`${pad(v.views, 20)} | ${pad(v.len, 8)} | ${pad(v.age, 13)} | ${v.title.slice(0, 100)}`);
    } catch (e) { console.log(`\n=== @${h}: okunamadı (${e.message})`); }
    await sleep(800);
  }
} else if (cmd === 'channels' && args.length) {
  for (const q of args) {
    const r = await channels(q);
    console.log(`\n=== ${q} (${r.length} kanal)`);
    for (const c of r.slice(0, limit)) console.log(`   ${c.title} | ${c.a} | ${c.b}`);
    await sleep(600);
  }
} else {
  console.log('kullanım:\n  npm run topics -- suggest "<arama başı>" …\n  npm run topics -- top <kanal adresi> … [--limit 20] [--lang en]\n  npm run topics -- channels "<arama>" …');
  process.exit(1);
}
