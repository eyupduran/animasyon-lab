# Karıncanın Gözünde Hayat

Makro bir belgesel: bir siyah bahçe karıncası (*Lasius niger*) işçisini bir gün boyunca izleyen, sesli anlatımlı ve kelime kelime altyazılı yaklaşık 7 dakikalık 3B animasyon. Dünya gerçek ölçekte kuruldu (1 birim = 1 mm): kum taneleri kaya, çim yaprakları kule, çiy damlaları su küresi gibi görünür. Kamera bir makro objektif gibi davranır: sığ alan derinliği, arkadan vuran sabah güneşi, parlayan kıllar.

**İzle:** https://eyupduran.github.io/animasyon-lab/ant-eye-view/

## Bölümler

| # | Bölüm | Ne anlatıyor |
|---|---|---|
| I | Karıncanın Gözünde Hayat | Gözün peteklerinden geri çekilen kamera; kum taneleri kaya, çimler kule |
| II | Dev Bir Dünya | Ölçek: karınca insan boyuna büyütülse 7,5 cm'lik çim 32 m (on kat), 2 mm'lik kum tanesi 85 cm |
| III | Bir İşçinin Bedeni | İşçilerin hepsi dişi; baş, mezozoma (göğüs + karnın 1. halkası), bel (petiyol, 2. karın halkası), gaster; kitin zırh, solunum delikleri |
| IV | Bulanık Bir Mozaik | Bileşik göz, göz başına yüz kadar ommatidyum; ekran ikiye bölünür: bizim gördüğümüz ve karıncanın gördüğü mozaik |
| V | Antenlerle Görmek | 12 halkalı dirsekli anten; koku, tat, dokunma, nem, sıcaklık, titreşim; koku alma genleri; koku haritası |
| VI | Kimlik Kontrolü | Anten teması, koloni kokusu (kütiküler hidrokarbonlar), yuvadaş ve yabancı |
| VII | Görünmez Yollar | Tatlı damla, kursak, bağırsaktan gelen feromon izi, güçlenen ve bir saat içinde uçan iz |
| VIII | Lidersiz Akıl | İki köprü deneyi (Goss ve ark. 1989) gerçek bir benzetimle; kendiliğinden örgütlenme |
| IX | Küçük ama Güçlü | Tohum taşıyan karınca, kare-küp yasası (kesit ×4, hacim ×8), "araba kaldıran dev karınca" yanlışı |
| X | Küçüklerin Fiziği | Çim yaprağından ağır çekim düşüş, yağmur damlası (4–14 mg) ve karınca (~2 mg), yüzey gerilimi |
| XI | Yaprak Biti Çobanları | *Aphis fabae* kolonisi, ballı çiy, antenle okşama, uğur böceğine karşı koruma, mutualizm |
| XII | Yeraltı Şehri | Yuva kesiti: kraliçe (laboratuvar rekoru 28¾ yıl), yumurta, larva, koza (yanlış bilinen "karınca yumurtası"), yaşa göre iş bölümü, trofalaksi |
| XIII | Ayağımızın Altındaki Dünya | Özet, açılış sorusunun yanıtı, yaklaşık yirmi katrilyon karınca |

Bilgilerin kaynakları `RESEARCH.md`, tasarım kararları `DESIGN.md` dosyasında.

## Teknik

- **Babylon.js 9** (fiziksel tabanlı malzemeler): kitin için şeffaf cila katmanı ve mikro doku, bacak ve çimlerde yarı saydamlık, çiy ve şurupta kırılma, koddan üretilen ortam ışığı.
- **Sinema son işleme:** alan derinliği (bulanıklık odak uzaklığına göre, "makro" ayarıyla), bloom, ACES ton eşleme, renk eğrileri, kararma, film greni, hafif renk sapması; gölge haritası kameranın baktığı yere oturtulur.
- **Karınca koddan modellendi** (`src/ant.js`): baş, bileşik gözler, 12 halkalı dirsekli antenler, mezozoma, tek pullu bel, bantlı gaster, 6 bacak (koksa, femur, tibya, 5 parçalı tarsus), kıllar. Bacaklar yürüyüş mesafesinden hesaplanan üçlü destek yürüyüşü (tripod gait) ve iki kemikli ters kinematikle yere basar; yüzey düz zemin, bitki sapı, çim yaprağı ya da yuva odası olabilir. Parçalar örneklenir (instancing), onlarca karınca aynı çizim maliyetiyle çizilir.
- **Öteki canlılar ve yerler:** yaprak biti, uğur böceği, tohum, bitki, yumurta, larva, koza (`src/critters.js`); yuva kesiti (`src/nest.js`); iki köprü deneyi, açılışta bir kez çalışan sabit tohumlu bir benzetim (`src/lab.js`).
- **Görme:** bileşik göz mozaiği ve koku görüşü birer son işleme / parçacık katmanı (`src/vision.js`).
- **Zamanlama:** bölüm süresi kayıttan gelir; sahne olayları anlatımdaki kelimelere bağlıdır (`src/script.js` → `cues`, `src/timeline.js`). Sahne durumu zamanın saf fonksiyonudur (`src/director.js`).
- **Ses:** anlatım O33 (OmniVoice, yaşlı ve çok derin erkek sesi), bölüm başına tek kayıt; rüzgâr, kuşlar, yaylı dokusu ve efektler Web Audio ile üretilir, anlatım sırasında kısılır (`src/sound.js`).
- **Oynatıcı:** oynat/duraklat, bölüm atlama, bölüm işaretli ilerleme çubuğu, hız, altyazı (C), anlatım (N), altyazı boyutu, tam ekran (F), klavye (boşluk, oklar). Seçimler hatırlanır.

## Komutlar

```
npm install                          # bu klasörde, bir kez
npm run dev                          # geliştirme sunucusu
npm run build                        # dist/ (sitenin derlediği çıktı)
npm run lines                        # src/script.js → narration/lines.json
```

Depo kökünde:

```
npm run voice -- ant-eye-view        # anlatımı üretir (yalnızca değişen bölümler)
npm run build -- ant-eye-view        # siteye derler
npm run video -- ant-eye-view        # YouTube için MP4 + SRT + bölüm listesi (?video=1 arayüzü)
```

Geliştirme araçları (`dev/`, geliştirme sunucusu 127.0.0.1:5199 üzerinde açıkken):

```
node dev/sheet.mjs <çıktı.jpg> 1600 900 [bölüm…]   # bölümlerden kareler, temas sayfası
node dev/playtest.mjs 40 0                         # gerçek zamanlı oynatma testi (geri gitme, sarma, ses–görüntü farkı)
node dev/toggletest.mjs                            # CC ve anlatım düğmeleri
node dev/poster.mjs fizik sip 1.5                  # poster.jpg
```

Kaliteyi elle seçmek için adrese `?q=low` ya da `?q=high` eklenebilir (telefonda kendiliğinden düşük kalite).
