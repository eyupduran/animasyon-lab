# Animasyon Lab — çalışma kuralları

Bu depo, kullanıcının tüm eğitim animasyonlarını ve denemelerini bir arada tutan bir **koleksiyondur**. Ortak bir motoru ya da ortak bir stili yoktur. Her animasyon kendi başına tasarlanır ve yazılır. Hedef: bir YouTube kanalı; izleyen "bu çok iyi yapılmış" demeli.

## Yalnızca kod

Her şey Claude'un yazdığı kodla üretilir: sahne, karakterler, hareket, ses efektleri, müzik, altyazı. **Üretken görsel/video/ses modelleri kullanılmaz** (Veo, Sora, Kling, Runway, Midjourney, Flux, ElevenLabs, Suno vb.); ücretsiz katmanları da yok, öneri olarak da geçmez. Anlatım sesi yalnızca yerel TTS'ten (`tools/voice.mjs`). İzin verilen dış kaynaklar: ücretsiz CDN'den kütüphane ve yazı tipi, CC0 HDRI/doku gibi telifsiz veri dosyaları (kaynağı README'de yazılır).

## Kalite tanımı

Kullanıcı kaliteyi dört şeyle ölçer; hepsi birlikte sağlanmalı:
1. **Görsel:** türe uygun, özenli, "ucuz" görünmeyen bir dünya (ışık, derinlik, doku, easing, ikincil hareket, kamera dili). Kodla ulaşılabilir stiller ve kuralları: `docs/cartoon-style-in-code.md` (düz vektör / çizgi film / kâğıt kesme / toon 3B), `.claude/skills/animation/documentary-tech.md` (gerçekçi belgesel), `.claude/skills/animation/craft.md`.
2. **Hikâye:** izleyiciyi gerçekten saran bir anlatı: açılış sorusu, kahraman, gerilim, ödül. `.claude/skills/narration/` (tür dosyaları + `retention.md`).
3. **Metin insan yazmış gibi:** yapay zekâ kokan kalıplar yok ("Gelin birlikte keşfedelim", "önemli bir rol oynar", tekrarlı üçlü listeler, her cümlede sıfat). Belgesel belgesel gibi, yazılım yazılım gibi okunur; tür dosyasındaki ses birebir uygulanır ve sesli okunup kesilir.
4. **Ses sürekliliği ve akıcılık:** aynı anlatıcı sesi baştan sona, bölüm başına tek kayıt; Web Audio ile üretilen ince ortam sesleri ve efektler (anlatımda kısılır). Ve **hiç donmama**: aşağıdaki performans kuralı.

## Performans: donma yasak

İzleyicinin bilgisayarı bizimkinden zayıf olabilir. Her animasyon:
- Zayıf bir dizüstünde de akıcı oynar: **kalite kademeleri** (ör. ultra/high/mid/low/min) çalışma anında değiştirilebilir; açılışta kısa bir ölçümle makineye uygun kademe seçilir; oynatma sırasında kareler yavaşlarsa bir kademe düşülür. Video çıktısı her zaman en yüksek kademede alınır.
- Ölçülür: `dev/perftest.mjs` (kare maliyeti) ve `dev/fpstest.mjs` (gerçek oynatma fps'i) gibi testlerle her kademede; hedef orta makinede ≥ 50 fps, en düşük kademede zayıf makinede ≥ 30 fps, 50 ms'yi aşan kare sayısı yaklaşık sıfır.
- Binlerce küçük nesne bölgelere ayrılır (kamera görmediğini çizmez), geometri piksel boyutuna göre kabalaştırılır, ağır efektler (SSAO, PCSS, ekran uzayı katmanları) yalnızca üst kademelerde.
- Ağır sahneler ve shader'lar başlangıç ekranında ısıtılır; oynatma sırasında yeni doku/geometri üretilmez.

## Türe göre teknik

Görsel stil animasyona özeldir, ama **türün tekniği yeniden kullanılır**: belgesellerde `documentary-tech.md` (referans: `animations/documentary/ant-documentary`), öteki türlerde `docs/cartoon-style-in-code.md` seçenekleri. Yazılım animasyonu belgesel gibi görünmez; iki belgesel ise aynı kamera ve oynatıcı tekniğini paylaşabilir, dünyaları farklı olur.

## Yeni animasyon isteğinde

Ayrıntılı istek şablonu ve kalite ölçütleri: `prompts/new-animation.md` (araştırma, anlatım, ses ve altyazı tekniği, özgün tasarım). Kullanıcı bu dosyaya atıf yaparsa baştan sona uygula.

1. **Sıfırdan tasarla.** Başka animasyonların kodunu, motorunu, arayüzünü, renklerini ya da yazı tiplerini örnek alma; onları açıp okuma. Tek istisna: aynı türün **teknik** modülleri (`documentary-tech.md` tablosunda "kopyala" denenler); görsel dünya yine sıfırdan. Konunun ve hedef kitlenin ne gerektirdiğini düşün: teknik (Three.js, Babylon.js, WebGPU, Canvas 2D, SVG, CSS, Vite, React…), görsel dil, anlatım yapısı, arayüz ve ses tümüyle bu animasyon için seçilir. Kullanıcı açıkça "şu animasyon gibi" ya da "şundan başla" demedikçe önceki bir animasyonu temel alma.
2. Animasyonlar kategori klasörlerinde durur: `animations/<kategori>/<slug>/`. Kategori adları İngilizcedir (biology, history, geography, physics, chemistry, math, space, technology, software, documentary); liste ve Türkçe karşılıkları `tools/lib/animations.mjs` içinde. Slug bütün kategorilerde tektir, site adresi değişmez (`…/animasyon-lab/<slug>/`). Araçlar animasyonu yalnızca slug ile bulur.
   `npm run new -- <kategori>/<slug> "<Başlık>"` yalnızca boş bir klasör ile `animation.json` ve `README.md` açar. Paketler, derleme düzeni ve klasör yapısı animasyonun kendi ihtiyacına göre kurulur (kendi `package.json`'ı olabilir; derlemede gereken paketler `dependencies`, yalnızca yerel araçlar `devDependencies` altına).
3. Yalnızca `animations/<kategori>/<slug>/` içinde çalış. Başka bir animasyonun dosyalarını değiştirme.
4. `animation.json` içindeki `slug`, `title`, `description`, `format`, `tech`, `build`, `output` alanlarını doldur (`format`: documentary, explainer, software, history, kids). Sitenin kartı bunlardan üretilir. `build` komutu animasyon klasöründe çalışır ve `output` klasörüne kendi başına açılan bir `index.html` üretmelidir.
5. Animasyonun `README.md` dosyasını yaz: ne anlattığı, bölümleri ve komutları.
6. Kök `README.md` içindeki "Animasyonlar" tablosuna kategorisiyle birlikte bir satır ekle.
7. Kökte `npm run build -- <slug>` çalıştır, ardından sayfayı headless Chrome ile ekran görüntüsü alarak kontrol et (masaüstü ve telefon genişliği). Metinlerin hızlı akışta okunabildiğini de kontrol et. Performans testlerini her kademede çalıştır; donma varsa bitmiş sayılmaz.
8. Kullanıcı isterse commit edip `main`'e gönder. Pages yayını otomatik.

## Anlatım türleri

Anlatım metni `.claude/skills/narration/` skilliyle yazılır. Belgeseller, konusu ne olursa olsun, kendi kategorilerinde durur: `animations/documentary/<slug>/` (konu `animation.json` açıklamasında belirtilir); öteki türler konu kategorisine girer. Her video türünün (belgesel, açıklayıcı, yazılım, tarih, çocuklar) kendi sesi, yapısı, temposu ve kamera dili `formats/<tür>.md` içindedir; izleyiciyi tutma teknikleri `retention.md` içindedir. Tür görsel stili (renk, yazı tipi, teknik) belirlemez, o her animasyonun kendi kararıdır.

## Ortak kaynaklar (isteğe bağlı)

- `assets/avatars/`: gerçekçi insan karakterleri (Avaturn GLB, 54 kemikli ortak iskelet, ARKit ve viseme yüz şekilleri). Yalnızca animasyon gerçekten bir insan karakteri gerektiriyorsa kullan. `npm run avatars -- list` ile listelenir, `use <id> <slug>` ile animasyonun kendi klasörüne kopyalanır. Modeller meshopt ile sıkıştırılmıştır; yükleyicide meshopt çözücüsü gerekir.
- `tools/voice.mjs` (`npm run voice -- <slug> [--voice <id>]`): anlatım sesi yerelde üretilir; kullanıcının seçtiği 19 ses `assets/voices/catalog.json` içinde (OmniVoice, Supertonic 3, Chatterbox, EMA-TTS; açıklaması `assets/voices/README.md`). Yalnızca ticari kullanıma açık ve atıf istemeyen modeller kullanılır; öyle olmayanlar önerilmez, kurulmaz. OmniVoice'ta Türkçe ses doğrudan tarifle üretilmez (kalitesiz); kısa temiz bir kayıttan kopyalanır. Animasyon `narration/lines.json` yazar, süreler `narration/manifest.json`'dan okunur ve altyazı süreleri sese göre ayarlanır. Söylenecek metinde rakamları sözcüğe çevir, parantezleri ve kısaltmaları söylenişe göre düzenle (ekrandaki metin değişmesin). Aracın sonunda listelenen şüpheli cümleleri düzelt.
- Anlatım bölüm başına tek kayıt olarak üretilir (cümle cümle değil); oynatırken hikâye zamanı kaydı izler, hiç geri gitmez, kayıt yüklenirken bekler. Altyazı ve sahne zamanları kayıttaki Whisper kelime zamanlarından çıkarılır.
- Anlatım ve altyazı olan animasyonlarda izleyici ikisini ayrı ayrı açıp kapatabilmeli (altyazı düğmesi ve kısayolu, seçim hatırlanır). Altyazılar en çok iki satır, sesle birlikte ilerleyen parçalar hâlinde gösterilir ve kelimeler anlatıcı söyledikçe açılır (Whisper kelime zamanları `manifest.json` → `words`; `npm run voice -- <slug> --words-only` mevcut kayıtlara ekler). Stil: kutu yok, altta yumuşak karartma, gölgeli beyaz yazı, masaüstünde ~17–23 px.
- `tools/render-video.mjs` (`npm run video -- <slug>`): YouTube için MP4 + SRT + bölüm listesi. Animasyon `?video=1` ile `window.__video` sözleşmesini sunmalı (bkz. kök README).
- `assets/thumbnail-kit/` ve `tools/thumbnail.mjs` (`npm run thumbnail -- <slug>`): YouTube kapakları. **Tek istisna:** animasyonlar arasında ortak stil yoktur, ama kapaklar kanalın ortak kimliğini taşır. Logo ve konu etiketi, başlık düzeni, sarı vurgu, süre etiketi ve renk işleme kitten gelir. Ana görsel her animasyonda kendi konusundan kodla çizilir. Her video için 5 kapak konsepti üretilir.
- `tools/build-site.mjs`: her animasyonu kendi `build` komutuyla derler ve siteyi toplar. `build` alanı boş olan animasyon atlanır.

## Kısıtlar

- Ücretli dış servis kullanma (yapay zekâ ses/görsel API'leri). Yerel ve ücretsiz araçları tercih et; dışarıya bir şey gönderilecekse önce sor. Ücretsiz CDN'lerden kütüphane ya da font yüklemek serbest.
- Yerel araçlar: Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`), ffmpeg (PATH'te), OmniVoice + Whisper (`C:\ProgramData\tts_lab`, RTX 3050 Ti 4 GB ekran kartıyla).
- Animasyonlar öğrencilere gösterilir: bilimsel olarak doğru, öğretici, akıcı ve okunaklı olmalı.

## Dil ve adlandırma

- Arayüz metinleri, README'ler ve commit mesajları Türkçe; kod tanımlayıcıları İngilizce.
- Klasör, dosya, kategori ve slug adları İngilizce: `biology/digestive-journey`, `software/git-version-control`. Türkçe yalnızca ekranda görünen metinlerde (başlık, alt yazı, README) kullanılır ve düzgün Türkçe olmalıdır.
