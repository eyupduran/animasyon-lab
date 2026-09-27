# Animasyon Lab

Bir YouTube kanalı için kodla üretilen filmler: belgesel, tarih, coğrafya, bilim, yazılım, kısa film. **Filmi nasıl yapacağın tamamen sana bırakılmıştır.** Teknik, görsel dil, kamera, yapı, paket, dosya düzeni: hepsi senin kararın. Bu depo bir kalıp değildir; önceki filmler örnek değildir.

## Yalnızca şunlar şart

1. **Yalnızca kod.** Görüntü, hareket, müzik ve efekt sesleri senin yazdığın kodla üretilir. Üretken görsel/video/ses modeli ve ücretli servis yok. Anlatım sesi yalnızca yerel araçla: `npm run voice -- <slug>`.
2. **Doğru bilgi.** Konuyu internetten araştır; her sayı, tarih ve ad güvenilir kaynağa dayansın; emin olmadığını yuvarlak ve temkinli söyle. Kaynakları filmin klasöründe `RESEARCH.md`'ye yaz.
3. **Türüne uygun anlatım.** Anlatım metni, türünün diliyle yazılır: belgesel belgesel gibi, tarih tarih gibi, yazılım yazılımcıya anlatır gibi; doğal Türkçe, insan yazmış gibi. Metni yazmadan önce `.claude/skills/narration/SKILL.md` ve ilgili tür dosyasını oku. Bu, depodaki tek yazım kuralıdır.
4. **Önceki filmlere bakma.** `animations/` altındaki başka klasörleri açma, kodunu ya da görünümünü örnek alma. Her film sıfırdan.
5. **Tek teknik söz** (videoya çevirebilmek için): sayfa `?video=1` ile açıldığında şunu sunar:
   ```js
   window.__film = {
     duration,                  // saniye
     renderAt(t),               // t anını çizer; aynı t her zaman aynı kare
     narration: [{ id, at }],   // varsa: anlatım kayıtlarının kimliği ve başladığı an (saniye)
     chapters: [{ t, title }],  // varsa
     sound(from, to),           // varsa: filmin kendi sesi (müzik, efekt), OfflineAudioContext ile AudioBuffer
   };
   ```
   Altyazıyı, anlatımın sese karıştırılmasını, bölüm listesini ve MP4'ü araçlar yapar (`npm run video -- <slug>`). Filmden oynatıcı, altyazı, zaman çubuğu, kalite ayarı, test ya da kapak **istenmez**. Video kare kare alınır; gerçek zamanlı akıcılık şart değildir, görsel zenginlikten kısma.

## Klasör ve adlar

`animations/<kategori>/<slug>/` (kategori ve slug İngilizce: documentary, history, geography, biology, physics, chemistry, math, space, technology, software, short). `npm run new -- <kategori>/<slug> "<Başlık>"` boş klasörü açar. `animation.json` içindeki `build` komutu `output` klasörüne kendi başına açılan bir `index.html` üretir. Ekrandaki metinler, README ve commit mesajları düzgün Türkçe.

## Anlatım sesi

`narration/lines.json`: `{ "voice", "speed", "out": "public/voice", "manifest": "narration/manifest.json", "lines": [{ "id", "say", "text" }] }`. Bir satır bir bölümün bütün anlatımıdır (tek kayıt). `say` söylendiği gibi yazılır (rakamlar sözcükle, kısaltmalar okunuşuyla, parantez yok); `text` altyazıda görünecek yazılı hâlidir. `npm run voice -- <slug>` kayıtları ve `manifest.json`'ı (süre ve kelime zamanları) üretir; filmdeki olayları bu zamanlara bağla. Sesler: `npm run voice -- voices`.

## İki ayrı iş

- **Film** (`/animation <konu>`, `/short [fikir]`): araştırma, anlatım, film. Başka hiçbir şey.
- **Paket** (`/package <slug>`): film bittikten ve kullanıcı izledikten sonra, ayrı oturumda: video, kapaklar, README, yayın. Film oturumunda paket işleri yapılmaz, `.claude/skills/package/` okunmaz.
