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
- **Prosedürel arı** (`src/bee.js`): kıl kabukları, canvas'ta çizilmiş damarlı kanat, hız bulanıklığı yelpazesi, IK bacaklar, poz = parametrelerin saf fonksiyonu; kovan kalabalığı için tek çağrılı örneklenmiş basit arı.
- **Setler:** ıhlamur ve kovuk (Voronoi levhalı kabuk, iki ölçekli; `src/tree.js`), çayır (örneklenmiş ot ve shader'da çizilen dört çiçek türü + gerçek taç yapraklı kahraman çiçek; `src/meadow.js`), kuş bakışı harita (`src/map.js`), shader'la boyanmış dikey petek, 3B hücre makrosu, desenli tünel (`src/comb.js`).
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

## Ölçümler (RTX 3050 Ti dizüstü, 1600×900)

- Senkron kare maliyeti (high): medyan 14,2 ms, p90 27,4 ms.
- Gerçek fps (otomatik seçim → high): açılış 60, çayır 98, dönüş 88, kovan 100, dans 91, gece 96; 12 sn'de 50 ms üstü kare 2–3 (bölüm/kayıt yüklenirken).
- Kademeler (açılış sahnesi): high 61 · mid 73 · low 135 · min 141 fps.
- Oynatma testi (40 sn, yapay takılmalarla): geri gitme 0, kayıt ortasında sarma 0, ses–görüntü farkı ort. 19 ms; konsol hatası 0.
- Bölüm sonları (`endtest fast`): 11 bölümde yeniden başlama 0, geri 0.
- CC ve anlatım düğmeleri: kapalıyken altyazı 0 kez göründü, anlatımsız saat akıyor, seçim hatırlanıyor.
- `npm run verify`: 9 anda `renderAt(t)` saf.

## Bilinen kısıtlar

- Stilize prosedürel arı; yakın planlarda bacaklar hâlâ çubuk gibi, ağız parçaları basit.
- Kovan kalabalığı basit geometri; uzak planlarda karıncayı andırabiliyor.
- Harita parselleri Voronoi; gerçek tarla dokusu kadar düzenli değil.
- Kanat 230 Hz: normal hızda bulanıklık yelpazesiyle, yalnız ağır çekimde gerçek vuruş; sallanım normal hızda görsel olarak yarı frekansta (13 Hz kare hızında kırpışır).
