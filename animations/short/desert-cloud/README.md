# Sağanak

Sözsüz kısa film, 66 saniye, 16:9. **İzle:** https://eyupduran.github.io/animasyon-lab/desert-cloud/

> Çölde kurumuş tek bir tomurcuğa yağmur yağdırmak isteyen avuç kadar bir bulut, birkaç damlası toprağa varmadan buharlaşınca rüzgârın yamaçtan yukarı esişine kapılır, yükseldikçe dev bir fırtına bulutuna dönüşür ve bütün vadiyi yağmurla çiçeğe boğar.

Fikir sprinti, cazibe kapısı, puanlama ve beat listesi: [TREATMENT.md](TREATMENT.md). Elenen fikirler ve teknik kararlar: [DESIGN.md](DESIGN.md).

## Beat listesi

| Süre | Ne olur |
|---|---|
| 0–8 | Kavruk kızıl kanyon, sıcak dalgası. Çise sağdan süzülür, durur, çevresine bakar. |
| 8–16,5 | Çatlaktaki boynu bükük tomurcuğu görür, yarı yolda duraksar, üstüne iner (makro: tomurcuk). |
| 16,5–24 | Çömelir, sıkar; dört damla havada buharlaşır, sonuncusu tomurcuğun dibinde tıslar. Çise sarkar. |
| 24–31 | Rüzgâr yamaca döner. Çise dağa bakar, iki kez tomurcuğa geri döner, sonra kendini bırakır. |
| 31–40,5 | Yamaç boyunca yükselir, kabarcıkları kaynayarak dağ kadar olur; gün batar. |
| 40,5–48,5 | **Doruk (42,6 sn, %64):** dev yüz, derin nefes, gözler kapanır; içinden şimşek, gök gürültüsü, sağanak perdesi. |
| 48,5–60,5 | Yağmur diner, gökkuşağı; çiçek dalgası tomurcuktan vadiye yayılır, tomurcuk macenta açar; küçülerek dönen Çise sevinçle zıplar. |
| 60,5–66,5 | Alacakaranlık, ilk yıldızlar, Çise uzaklaşır. Siyah kart: SAĞANAK. |

## Teknik

- **Three.js r170**, derleyicisiz: `node build.mjs` kaynakları ve `three.module.min.js`'yi `dist/` içine kopyalar, import map ile açılır. Bütün malzemeler kendi `ShaderMaterial`'ı; ortak ışık, gök, sis ve gökkuşağı kodu `src/glsl.js`.
- **Hikâye zamanın saf fonksiyonu:** `src/score.js` bulutun konumunu, ölçeğini, göz kapaklarını, bakışını, ezilip uzamasını, havayı ve paleti zamandan hesaplar; `src/shots.js` 12 çekimi; `src/main.js` (kısa film oynatıcısı) kareyi çizer. `?video=1` ile `window.__video` sözleşmesi.
- **Dünya (`src/world.js`):** CPU'da basamaklı yükseklik alanı (kanyon duvarları, rampa yamaç, mesa, uzak mesalar); arazi gölgelendiricisinde tortul çizgiler, Voronoi kil çatlakları, ıslaklık ve gök yansıtan su birikintileri, tomurcuktan yayılan çayır cephesi, bulutun gölgesi. Örneklenmiş çiçek, çimen, yağmur; fırtınanın yağmur perdeleri; rüzgârı gösteren toz.
- **Bulut (`src/cloud.js`):** kabarcık kümesi + gecikmeli kuyruk; kabarcıklar köşe gölgelendiricisinde hafifçe kabarır; içeriden şimşek ışığı; gözler ve yanaklar yüz kabarcığına oturan dörtgenler.
- **Son işleme (`src/post.js`):** MSAA'lı sahne hedefi, dual-filter bloom, tek bitiş geçişi (öğle sıcaklığında hava titremesi, doygunluk, vinyet, Neutral ton eşleme). Videoda gren yok.
- **Ses (`src/sound.js`):** `OfflineAudioContext` ile açılışta bir kez sentezlenir: kuru rüzgâr ve ağustos böceği, bulutun "bup" sesleri, damlalar ve tıslama, üç notalık kalimba motifi (önce inen, sonda çözülen), yükselişte açılan pad, doruğun gök gürültüsü vuruşu, sağanak ve tıpırtı, çiçek dalgasında cam çanlar, sonda sessizlik. Hikâye saati sesi izler.
- **Kalite kademeleri:** `ultra` (video) · `high` · `mid` · `low` · `min` (piksel oranı, çözünürlük ölçeği, MSAA, bloom, çiçek/çimen/yağmur/toz yoğunluğu). Açılışta ağır üç an ölçülür, oynatmada 2,5 sn yavaşlıkta bir kademe düşülür.

## Testler

- `npm run verify -- desert-cloud`: 3 kez geçti; ayrıca 18,6 · 20,3 · 42,6 · 42,75 · 51 · 58,3 · 64 sn anlarında ayrı ayrı geçti.
- Gerçek oynatma, 1600×900, Intel Iris Xe (zayıf dizüstü GPU'su): otomatik seçim `low` 74–86 fps; `mid` 56–63 fps; `min` 107 fps; `high` bu makinede 38 fps (otomatik seçici almıyor). Otomatik kademede ve `mid`'de 50 ms'yi aşan kare yok (damla, buhar, yağmur ve gökkuşağı gölgelendiricileri açılışta ısıtılır).

## Komutlar

```
node build.mjs                                   # dist/
npm run verify -- desert-cloud                   # (kökte) saflık testi
npm run video -- desert-cloud                    # (kökte) renders/desert-cloud.mp4
npm run thumbnail -- desert-cloud                # (kökte) 5 kapak
node dev/frames.mjs <klasör> 3,19,42.7 1280x720  # kareler
node dev/sheet.mjs <klasör> 4 480                # temas sayfası
node dev/fpstest.mjs "tier=mid" 12 40            # gerçek fps
node dev/cost.mjs "tier=high&off=flowers" 10,44  # parça parça kare maliyeti
```

Sayfa parametreleri: `?t=41` başlangıç anı, `?tier=low` kademe sabitleme, `?shot=43.4` tek kare, `?video=1` video sözleşmesi, `?cam=px,py,pz,tx,ty,tz,fov` kapak kamerası, `?off=flowers,grass,…` ve `?msaa=0&bloom=0` ölçüm için.

Kapak görselleri (`thumbs/`) filmin kendi kareleri; `thumbnail.html` onları kanalın ortak kapak kitiyle birleştirir.
