# Tasarım notları

## Elenen dört fikir (treatment → 3)

- **A · Kum saati (zaman):** Kum saatinin boğazına sıkışan iri bir kum tanesi arkasındaki bütün kumu tutar; üstündeki ağırlık arttıkça çatlar ve zaman yeniden akar. Elendi: imge eskimiş, kum akışı bir günde güvenilir kurulamaz, "tane"nin istediği sözsüz okunmaz.
- **B · Newton beşiği (momentum):** Ortadaki bilye her vuruşu yalnızca aktarır; bir kez kendisi sallanmak ister. Elendi: nesne, en bilinen fizik render demolarından biri.
- **D · Bağış hunisi (açısal momentum):** Huniye düşen para deliğe yaklaştıkça hızlanır. Elendi: karakterin isteği belirsiz, fizik gösterisine dönüyor.
- **E · Güneş saati (gölge):** Kadrana hapsolmuş gölge çatlaktaki çiçeğe ulaşmak ister. Elendi: dönüşüm bir tutulmaya, yani ışığa dayanıyor; sözsüz okunması zor.

## Teknik kararlar

- **Three.js (r170), derleyicisiz:** `build.mjs` kaynakları ve `three.module.js`'yi `dist/` içine kopyalar; sayfa bir import map ile açılır. Paket kurulumu yok.
- **Birim milimetre.** Silindir X ekseni boyunca, yarıçap 4,6 mm; tarak dişleri silindirin üstünde yatay, uçları silindirin tepesinin hemen önünde. Pimler aşağıdan gelip diş ucunu yukarı kaldırır ve bırakır (gerçek müzik kutusu gibi).
- **Zaman saf fonksiyon:** silindirin açısı `B(t)` (vuruş sayısı) hız eğrisinin sayısal integralinden, açılışta bir kez tablo olarak hesaplanır. Her pimin çalma anı bu tablodan çözülür. Dişlerin eğilmesi, titreşimi, toz ve kamera hep `t`'nin fonksiyonu.
- **Ses:** bütün film sesi açılışta `OfflineAudioContext` ile bir kez üretilir; canlı oynatma bu tamponu çalar, hikâye zamanı ses saatini izler. Video da aynı tamponu alır: canlı ve video sesi birebir aynı.
- **Son işleme:** sahne → MSAA hedef (derinlik dokusuyla) → tek geçişli bokeh alan derinliği (sarmal örnekleme, CoC derinlikten) → yarı çözünürlükte çok basamaklı bloom → birleştirme (ACES, iki durumlu renk düzeni, vinyet, sabit dither).
- **Kalite kademeleri:** `ultra` (video) · `high` · `mid` · `low` · `min`; piksel oranı, DOF örnek sayısı, bloom basamağı, gölge haritası, MSAA. Açılışta ağır üç anı ölçüp bütçenin altındaki ilk kademe seçilir; oynatmada 2,5 sn boyunca kare > 45 ms ise bir kademe düşülür.
