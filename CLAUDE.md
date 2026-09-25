# Animasyon Lab — çalışma kuralları

Bu depo, kullanıcının tüm eğitim animasyonlarını ve denemelerini bir arada tutan bir **koleksiyondur**. Ortak bir motoru ya da ortak bir stili yoktur. Her animasyon kendi başına tasarlanır ve yazılır.

## Yeni animasyon isteğinde

Ayrıntılı istek şablonu ve kalite ölçütleri: `prompts/new-animation.md` (araştırma, anlatım, ses ve altyazı tekniği, özgün tasarım). Kullanıcı bu dosyaya atıf yaparsa baştan sona uygula.

1. **Sıfırdan tasarla.** Başka animasyonların kodunu, motorunu, arayüzünü, renklerini ya da yazı tiplerini örnek alma; onları açıp okuma. Konunun ve hedef kitlenin ne gerektirdiğini düşün: teknik (Three.js, Babylon.js, WebGPU, Canvas 2D, SVG, CSS, Vite, React…), görsel dil, anlatım yapısı, arayüz ve ses tümüyle bu animasyon için seçilir. Kullanıcı açıkça "şu animasyon gibi" ya da "şundan başla" demedikçe önceki bir animasyonu temel alma.
2. Animasyonlar kategori klasörlerinde durur: `animations/<kategori>/<slug>/`. Kategori adları İngilizcedir (biology, history, geography, physics, chemistry, math, space, technology, software); liste ve Türkçe karşılıkları `tools/lib/animations.mjs` içinde. Slug bütün kategorilerde tektir, site adresi değişmez (`…/animasyon-lab/<slug>/`). Araçlar animasyonu yalnızca slug ile bulur.
   `npm run new -- <kategori>/<slug> "<Başlık>"` yalnızca boş bir klasör ile `animation.json` ve `README.md` açar. Paketler, derleme düzeni ve klasör yapısı animasyonun kendi ihtiyacına göre kurulur (kendi `package.json`'ı olabilir; derlemede gereken paketler `dependencies`, yalnızca yerel araçlar `devDependencies` altına).
3. Yalnızca `animations/<kategori>/<slug>/` içinde çalış. Başka bir animasyonun dosyalarını değiştirme.
4. `animation.json` içindeki `slug`, `title`, `description`, `tech`, `build`, `output` alanlarını doldur. Sitenin kartı bunlardan üretilir. `build` komutu animasyon klasöründe çalışır ve `output` klasörüne kendi başına açılan bir `index.html` üretmelidir.
5. Animasyonun `README.md` dosyasını yaz: ne anlattığı, bölümleri ve komutları.
6. Kök `README.md` içindeki "Animasyonlar" tablosuna bir satır ekle.
7. Kökte `npm run build -- <slug>` çalıştır, ardından sayfayı headless Chrome ile ekran görüntüsü alarak kontrol et (masaüstü ve telefon genişliği). Metinlerin hızlı akışta okunabildiğini de kontrol et.
8. Kullanıcı isterse commit edip `main`'e gönder. Pages yayını otomatik.

## Ortak kaynaklar (isteğe bağlı)

- `assets/avatars/`: gerçekçi insan karakterleri (Avaturn GLB, 54 kemikli ortak iskelet, ARKit ve viseme yüz şekilleri). Yalnızca animasyon gerçekten bir insan karakteri gerektiriyorsa kullan. `npm run avatars -- list` ile listelenir, `use <id> <slug>` ile animasyonun kendi klasörüne kopyalanır. Modeller meshopt ile sıkıştırılmıştır; yükleyicide meshopt çözücüsü gerekir.
- `tools/voice.mjs` (`npm run voice -- <slug> [--voice <id>]`): anlatım sesi yerelde üretilir; kullanıcının seçtiği 20 ses `assets/voices/catalog.json` içinde (OmniVoice, Supertonic 3, Chatterbox, EMA-TTS; açıklaması `assets/voices/README.md`). Yalnızca ticari kullanıma açık ve atıf istemeyen modeller kullanılır; öyle olmayanlar önerilmez, kurulmaz. OmniVoice'ta Türkçe ses doğrudan tarifle üretilmez (kalitesiz); kısa temiz bir kayıttan kopyalanır. Animasyon `narration/lines.json` yazar, süreler `narration/manifest.json`'dan okunur ve altyazı süreleri sese göre ayarlanır. Söylenecek metinde rakamları sözcüğe çevir, parantezleri ve kısaltmaları söylenişe göre düzenle (ekrandaki metin değişmesin). Aracın sonunda listelenen şüpheli cümleleri düzelt.
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
- Klasör, dosya ve slug adları İngilizce: `digestive-journey`, `heartbeat`. Türkçe yalnızca ekranda görünen metinlerde (başlık, alt yazı, README) kullanılır ve düzgün Türkçe olmalıdır.
