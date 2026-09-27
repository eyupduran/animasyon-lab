# Animasyon Lab

Bir YouTube kanalı için kodla üretilen filmler: belgesel, tarih, coğrafya, bilim, yazılım, kısa film. **Filmi nasıl yapacağın tamamen sana bırakılmıştır.** Teknik, görsel dil, kamera, yapı, paket, dosya düzeni: hepsi senin kararın. Bu depo bir kalıp değildir; önceki filmler örnek değildir.

## Yalnızca şunlar şart

1. **Yalnızca kod.** Görüntü, hareket, müzik ve efekt sesleri senin yazdığın kodla üretilir. Üretken görsel/video/ses modeli ve ücretli servis yok. Anlatım sesi yalnızca yerel araçla: `npm run voice -- <slug>`.
2. **Doğru bilgi.** Her sayı, tarih ve ad güvenilir kaynağa dayanır (`RESEARCH.md`); emin olunmayan yuvarlak ve temkinli söylenir. Ekrana yazılan bilgi de buna dahildir.
3. **Türüne uygun anlatım.** Anlatım metni türünün diliyle yazılır: belgesel belgesel gibi, tarih tarih gibi, yazılım yazılımcıya anlatır gibi; doğal Türkçe, insan yazmış gibi. Yazım kuralları yalnızca metin aşamasında okunur.
4. **Önceki filmlere ve depodaki notlara bakma.** `animations/` altındaki başka klasörleri ve `docs/` klasörünü açma; kod, görünüm ya da teknik örneği alma. Her film sıfırdan.
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
   Oynatıcıyı, altyazıyı, anlatımın sese karıştırılmasını, bölüm listesini ve MP4'ü araçlar yapar. Sitede film, araçların oynatıcısının içinde video gibi oynar (`npm run build`, `npm run soundtrack`). MP4 kare kare alınır (`npm run video`). Filmden oynatıcı, altyazı, zaman çubuğu, kalite ayarı, test ya da kapak **istenmez**. Görsel zenginlikten kısma. Sitede oynatıcı `renderAt`'ı gerçek zamanlı çağırır: hızlı çizilen kare sitede akıcı görünür, ağır kare MP4'ü etkilemez, sitede yalnızca kare atlatır.

## Klasör ve adlar

`animations/<kategori>/<slug>/` (kategori ve slug İngilizce: documentary, history, geography, biology, physics, chemistry, math, space, technology, software, short). `npm run new -- <kategori>/<slug> "<Başlık>"` boş klasörü açar. `animation.json` içindeki `build` komutu `output` klasörüne kendi başına açılan bir `index.html` üretir. Ekrandaki metinler, README ve commit mesajları düzgün Türkçe.

## Anlatım sesi

`narration/lines.json`: `{ "voice", "speed", "out": "public/voice", "manifest": "narration/manifest.json", "lines": [{ "id", "say", "text" }] }`. Bir satır bir bölümün bütün anlatımıdır (tek kayıt). `say` söylendiği gibi yazılır (rakamlar sözcükle, kısaltmalar okunuşuyla, parantez yok); `text` altyazıda görünecek yazılı hâlidir. `npm run voice -- <slug>` kayıtları ve `manifest.json`'ı (süre ve kelime zamanları) üretir; filmdeki olayları bu zamanlara bağla. Sesler: `npm run voice -- voices`.

## Tek istek, ayrı aşamalar

Kullanıcı tek istek verir (`/animation <konu>` ya da `/short [fikir]`) ve sitede yayınlanmış filmi alır. Komut işi aşamalara böler; her aşama temiz bir yardımcı ajanda çalışır ve yalnızca kendi işini bilir:

- **Metin** (yalnızca anlatımlı filmde): araştırma, anlatım metni, Türkçe ses. Görüntü hakkında karar verilmez.
- **Film:** yalnızca film. Anlatım varsa görüntü onun zamanlarına göre yapılır. Paket işleri yapılmaz.
- **Yayın:** saflık denetimi, ses dosyası, poster, README, site, commit ve push.

YouTube paketini kullanıcı ayrıca ister: `/youtube <slug>`. Altyazılı ve altyazısız MP4, .srt, bölümler, kanalın seri kimliğinde kapaklar, başlık, açıklama ve etiketler masaüstündeki YouTube klasörüne gider.
