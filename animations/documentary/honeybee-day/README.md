# Bal Arısının Bir Günü

Doğa belgeseli, ~6 dk. Hayatının son haftasındaki bir toplayıcı bal arısını (*Apis mellifera*) şafaktan geceye izler. Büyük soru açılışta sorulur: bu arı, bir iki kilometre ötedeki çiçeklerin yerini zifiri karanlık kovanda nasıl tarif eder? Cevap sekizinci bölümde verilir: sallanım dansında koşunun yönü, güneşe göre yöndür; peteğin "yukarısı" güneştir; koşunun süresi uzaklıktır.

Canlı: https://eyupduran.github.io/animasyon-lab/honeybee-day/

## Bölümler (bir günün saatleri)

| Saat | Bölüm | Ne anlatıyor |
|---|---|---|
| 05.40 | Bal Arısının Bir Günü | Ihlamur kovuğu, soru |
| 06.10 | Son Hafta | Yaşa bağlı iş bölümü, yönelim uçuşları, toplayıcının kısa ömrü |
| 07.30 | Gökyüzü Pusulası | Kanat vuruşu, güneş pusulası ve iç saat, bulutta polarize ışık |
| 09.00 | İki Çayır | Bileşik göz mozaiği, UV görme, kırmızının kararması, nektar işareti, çiçek sadakati |
| 10.30 | Yük | Hortum, bal midesi, polen sepeti, yük, nektarın yolda koyulaşması |
| 11.30 | Eve Giden Ok | Yol entegrasyonu, optik akışla mesafe (tünel deneyi) |
| 11.50 | Kovanın İçi | 35 °C yavru alanı, ısıtıcı arılar, altıgen, mumun bedeli, karanlık |
| 12.10 | Karanlıkta Dans | Açı = yön, yukarı = güneş, süre = uzaklık |
| 12.20 | Dansı Okumak | Anten, 250 Hz vızıltı, titreşim, koku; von Frisch; radar kanıtı (2005) |
| 12.40 | Nektardan Bala | Ağızdan ağıza aktarım, enzimler, yelpazeleme, su %18, mumla sırlama |
| 20.10 | Gece | On sefer, uyku, uykusuz dans, bir ömürde yarım gram bal |

Kaynaklar: `RESEARCH.md` (≈70 kaynak, temkinli bilgiler ayrıca işaretli). Sanat yönü: `TREATMENT.md`. Anlatım ve beat sheet: `NARRATION.md`.

## Teknik

- **Three.js + Vite.** Bütün malzemeler özel shader: üç basamaklı ramp gölgeleme, yarım küre ortam ışığı, kenar ışığı, hava sisi (`src/glsl.js`).
- **Arı gözü:** malzemeler ortak bir "arı görüşü" dönüşümü taşır (kırmızı kararır, UV yansıması mor vurgu olur); son işlemde ekran uzayında altıgen omatidyum mozaiği; ekran ortadan bölünebilir (`uSplit`).
- **Gökyüzü** (`src/sky.js`): saat ön ayarlarıyla gradyan, bulutlar, uzak sırtlar, yıldızlar; arı gözünde güneş çevresinde polarizasyon halkaları (polarizasyon derecesi `sin²θ/(1+cos²θ)`).
- **Prosedürel arı** (`src/bee.js`): kıl kabukları, canvas'ta çizilmiş damarlı kanat; uçuşta kanat vuruş yayına dağılmış soluk kopyalarla hareket bulanıklığı; üst üste binen karın halkaları ve aralarında oluklar; eklem düğümlü, incelen bacaklar ve üç parçalı kıvrık tarsus; ayaklar verilen yüzey düzlemine (kovuk dudağı, çiçek göbeği, petek) IK ile oturur; uçarken bacaklar gövde altına katlanır, altında yüksekliğe göre solan yumuşak gölge. Poz = parametrelerin saf fonksiyonu. Kovan kalabalığı için tek çağrılı örneklenmiş basit arı.
- **Setler:** ıhlamur ve kovuk (Voronoi levhalı kabuk, iki ölçekli; `src/tree.js`), çayır (örneklenmiş ot ve shader'da çizilen dört çiçek türü + gerçek taç yapraklı kahraman çiçek; `src/meadow.js`), kuş bakışı harita (`src/map.js`), shader'la boyanmış dikey petek, 3B hücre makrosu, çayırın ortasında içi ve zemini şeritli, üstü çıtalı ahşap tünel (`src/comb.js`).
- **Geniş plan zanaatı:** son işlemde odak dışı ön plan katmanı (ot siluetleri + çiçek bokehi, zamanın saf fonksiyonu), çayırda sürüklenen bulut gölgeleri, uzaklıkla doygunluğu düşen hava perspektifi; her geniş planda tek odak (iniş yapan ya da kalkan arı, güneş).
- **Yönetmen** (`src/director.js`, `src/shots.js`, `src/tod.js`): her kare hikâye zamanının saf fonksiyonu; çekimler anlatımdaki kelimelere bağlı (0,4 sn önce başlar); saha rehberi etiketleri SVG katmanında (`src/overlay.js`).
- **Ortak belgesel tekniği** (oynatıcı, kayıt izleyen saat, iki satırlı kelime kelime altyazı, CC/N düğmeleri, video sözleşmesi, testler) `documentary-tech.md`'ye göre referans belgeselden alındı; görünüm sıfırdan.
- **Ses** (`src/sound.js`): dosyasız, Web Audio; rüzgâr, kuş, Doppler'li geçen arı, koloni uğultusu, dansın 250 Hz darbeleri, cırcır böceği, alçak drone; aynı kod video sesini `OfflineAudioContext` ile üretir.
- **Anlatım:** yerel OmniVoice, O9 sesi, hız 0,9, bölüm başına tek kayıt (11 kayıt, 4 dk 50 sn); Whisper kelime zamanları.

## Komutlar

```
npm install
npm run dev                         # http://127.0.0.1:5230
npm run lines                       # src/script.js → narration/lines.json
npm run build
# kökten:
npm run voice -- honeybee-day
npm run verify -- honeybee-day
npm run video -- honeybee-day
npm run thumbnail -- honeybee-day   # thumbs/ kareleri: node dev/thumbframes.mjs
```

Geliştirme testleri (`dev/`, sunucu açıkken): `perftest`, `fpstest`, `playtest`, `endtest fast`, `toggletest`, `sheet`, `frames`, `poster`.

## Ölçümler

Koşul: RTX 3050 Ti dizüstü, headless Chrome (`--use-angle=d3d11`), 1600×900 pencere, `dev/fpstest.mjs` 12 sn; aynı makinede başka yük altında ölçümler daha düşük çıkabilir (bağımsız denetimde auto→high 40 fps ölçülmüştü; o sürümden bu yana `high` bütçesi 27 → 22 ms senkron yapıldı).

| Kademe | açılış (8 sn) | çayır (75 sn) | kovan (230 sn) | 50 ms üstü kare / 12 sn |
|---|---|---|---|---|
| auto → high | 60 | 93 | 97 | 2 |
| high | 59 | 92 | 97 | 2–3 |
| mid | 73 | 113 | 118 | 2–4 |
| low | 138 | 141 | 142 | 0–2 |
| min | 140 | 141 | 142 | 0–2 |

Kalan yavaş kare "İzle"ye basıldığı ilk yarım saniyede (ses bağlamı açılışı); bölüm geçişleri ve kayıt başlangıçları artık temiz (sonraki kayıt yüklenince bir kez sessizce çalınıp çözücüsü ısıtılıyor).

- Oynatma testi (40 sn, 28 yapay takılma): geri gitme 0, kayıt ortasında sarma 0, ses–görüntü farkı ort. 19 ms; konsol hatası 0.
- Bölüm sonları (`endtest fast`): 11 bölümde yeniden başlama 0, geri 0.
- CC ve anlatım düğmeleri: kapalıyken altyazı 0 kez göründü, anlatımsız saat akıyor, seçim hatırlanıyor.
- `npm run verify --n 15`: art arda 3 çalıştırma, 45/45 an saf (ilk çalıştırma dahil).
- `npm run video -- honeybee-day --from 60 --to 75`: 1920×1080, ses var, tepe −1,9 dB.

## Denetimden sonra (AUDIT.md → "Önce düzeltilecek 5 şey")

1. Arı modeli: eklemler, incelen bacaklar, kıvrık tarsus, yüzeye değen ayaklar, uçuşta katlanan bacaklar, temas gölgesi, kanat hareket bulanıklığı, karın segment oluk ve basamakları.
2. Çayır geniş planları: ön plan katmanı, hava perspektifi, bulut gölgeleri, tek odak.
3. Okunaklılık: başlık kartına koyu yumuşak şerit ve daha erken giriş; telefonda en küçük yazı 12 px, ikincil satırlar gizli, ekrandan taşan etiketler ters yöne çevriliyor.
4. Tünel: çayırın içinde, şeritli ahşap koridor.
5. Saflık: her karede set durumu sıfırlanıyor, ısınma her çekimi çiziyor, `__ready` yazı tipleri ve yerleşim oturduktan sonra; `high` kademe bütçesi sıkılaştırıldı, kayıt çözücüsü önceden ısıtılıyor.

## Bilinen kısıtlar

- Stilize prosedürel arı; ağız parçaları basit, bacaklarda kıl yok.
- Kovan kalabalığı basit geometri; uzak planlarda karıncayı andırabiliyor.
- Harita parselleri Voronoi; gerçek tarla dokusu kadar düzenli değil.
- Kanat 230 Hz: normal hızda bulanıklık yelpazesiyle, yalnız ağır çekimde gerçek vuruş; sallanım normal hızda görsel olarak yarı frekansta (13 Hz kare hızında kırpışır).
