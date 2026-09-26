# Karar

Sözsüz kısa film, 64 saniye, 16:9. **[İzle](https://eyupduran.github.io/animasyon-lab/silent-tooth/)**

**Logline:** Bir müzik kutusunun, pimi kırık olduğu için hiç çalınmamış tozlu dişi, yay biterken son turda kendini kırık pime uzatır ve her turda yarım kalan melodiyi bitirir.

Melodi her turda "re – si – …" diye yükselir ve do'ya varmadan susar. O do, silindirdeki pimi kırık dişin notasıdır. Diş hiç titremediği için tozlu ve mattır; komşuları parlaktır. Türk müziğinde **karar**, ezginin durduğu, çözüldüğü perdedir; aynı zamanda dişin verdiği karardır.

Özgünlük kapısı (klişe listesi, beş fikir, puanlama, seçim) [TREATMENT.md](TREATMENT.md) dosyasında, elenen fikirler ve teknik kararlar [DESIGN.md](DESIGN.md) dosyasında.

## Beat'ler

| Zaman | Beat |
|---|---|
| 0–5,6 | Açılış: arkadan ışıklı makro; bir pim yükselip bir dişi çeker. Mekanizma bırakılır, melodi başlar. |
| 5,6–9,6 | Dünya: gece, masada açık ceviz kutu. |
| 9,6–13,6 | Durum: parlak dişler çalar; odak tozlu dişe kayar; melodi do'dan önce susar, kırık pim sessizce geçer. |
| 13,6–19 | Ayna açısı: pencere her dişin üstünde parlar, biri hariç. Komşular çalarken tozlu diş kıpırdar. |
| 19–24,4 | Engel: ikinci tur; diş aşağı uzanır, bir kıl payı yetişemez, geri yaylanır. |
| 24,4–36,4 | Dönüm: regülatör yavaşlar, melodi ağırlaşır. Diş yarı yoldan geri çekilir. |
| 36,4–42 | **Doruk (%65):** zorlanma gıcırtısı, uzanış, kırık pime değme, bırakma: do. Toz patlar. |
| 42–58 | Sonuç: toz pencere ışığında asılı; mekanizma durmuş; diş ilk kez temiz ve parlak. |
| 58–64 | Kararma, **K A R A R**, sessizlik. |

## Teknik

- **Three.js r170**, derleyicisiz: `node build.mjs` kaynakları ve `three.module.min.js`'yi `dist/` içine kopyalar, bir import map ile açılır.
- **Sahne** (`src/scene.js`): milimetre ölçeğinde pirinç mekanizma; pimli silindir (pimler melodiden yerleştirilir), 18 dişli tarak (tek instanced mesh; vertex shader her dişi konsol kiriş gibi büker, fragment shader kahraman dişin üstüne toz tabakası serer), yay tamburu, regülatör kanatları (hıza bağlı hareket bulanıklığı), ceviz kutu. Yansımalar için kodla kurulmuş bir oda ortamı (PMREM): arka-sol üstte ay ışıklı pencere, sıcak masa.
- **Saat** (`src/score.js`): silindir açısı hız eğrisinin integrali. Yayın boşalmaya başladığı an, kırık pim kahraman dişe tam 41,6 sn'de gelecek şekilde çözülür. Her pimin çalma anı bu eğriden bulunur; dişin kalkışı gerçek geometriden (pim ucu yarıçapı, diş alt yüzü).
- **Toz**: 1600 tanecik + 240 hava zerresi; her biri zamanın saf fonksiyonu (yapışık / ıskada düşen / dorukta fırlatılan). Pencereye bakan kamerada ileri saçılımla parlar.
- **Son işleme** (`src/post.js`): MSAA + derinlik → yarım çözünürlükte tek geçişli bokeh alan derinliği → bloom piramidi → iki durumlu renk düzeni (soğuk "toz" → ılık "karar"), ACES, vinyet, sabit dither (hareketli gren yok).
- **Ses** (`src/sound.js`): tamamı Web Audio, açılışta `OfflineAudioContext` ile bir kez üretilir; canlı oynatma ve video aynı tamponu kullanır, hikâye zamanı ses saatini izler. Oda uğultusu, regülatör vızıltısı ve dişli tıkırtısı (hız eğrisine bağlı), müzik kutusu notaları (temel + birkaç sent kayık ikiz + ~5,9× kısmi + pim tıkı, kutu ve oda yankısı), gıcırtı, dorukta kutu gümlemesi + uzun do + sempatik diş tınlaması + yükselen pad; sonda tam sessizlik.
- **Kalite kademeleri:** `ultra` (video) · `high` · `mid` · `low` · `min` (piksel oranı, DOF örnek aralığı, MSAA, gölge haritası, bloom basamağı, toz sayısı). Açılışta ağır üç an ölçülür; oynatmada 2,5 sn yavaşlıkta bir kademe düşülür.

## Ölçümler

- `npm run verify -- silent-tooth`: 3 kez geçti; ayrıca 11,8 · 22,83 · 41,59 · 41,62 · 43,4 sn anlarında ayrı ayrı geçti.
- Gerçek oynatma, 1600×900, 36. saniyeden 12 sn (doruk dahil): otomatik `high` 64 fps; `mid` 95 fps; `low` 143 fps; `min` 144 fps; hiçbir kademede 50 ms'yi aşan kare yok.

## Komutlar

```
node build.mjs                                   # dist/
npm run verify -- silent-tooth                   # (kökte) saflık testi
npm run video -- silent-tooth                    # (kökte) renders/silent-tooth.mp4
npm run thumbnail -- silent-tooth                # (kökte) 5 kapak
node dev/frames.mjs <klasör> 3,15,43.4 1280x720  # kareler; ?raw=1 ile son işleme olmadan
node dev/sheet.mjs <klasör> 4 480                # temas sayfası
node dev/fpstest.mjs "tier=mid" 12 36            # gerçek fps
```

Sayfa parametreleri: `?t=41` başlangıç anı, `?tier=low` kademe sabitleme, `?shot=43.4` tek kare, `?video=1` video sözleşmesi.
