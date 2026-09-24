# Yazıcının İçinde

Renkli, çok işlevli bir lazer yazıcının yan tarafı kesilip açılmış 3D modeli. Bir okul gazetesi sayfası bilgisayardan yazıcıya gidiyor, dört renkte basılıyor, sonra tarayıcıda taranıp siyah-beyaz fotokopisi çekiliyor. Son olarak orijinal ile kopyaları ve kopyaların kopyalarını büyüteçle karşılaştırıyoruz. Yaklaşık 7 dakika, 16 bölüm. Sonunda serbest keşif modu açılıyor: sahne döndürülebiliyor, sayfaların üzerinde gezinen büyüteçle farklar incelenebiliyor.

## Anlattıkları

| # | Bölüm | İçerik |
|---|---|---|
| 1 | Kesit | Yazıcının bölümleri: tarayıcı, lazer ünitesi, kartuşlar, fırın, tepsiler |
| 2 | Ekrandan yazıcıya | Dizüstünde "Yazdır", veri paketleri kabloyla yazıcıya gider |
| 3 | Sayfa noktalara bölünür | İşlemci kartı, 600 dpi ≈ 35 milyon nokta, yarım ton, CMYK ayrımı |
| 4 | Kâğıt yola çıkar | Alma makarası (D biçimli), ayırma pedi, kıvrık yol, hizalama makaraları |
| 5 | Tambur yüklenir | Işığa duyarlı tambur, şarj silindiri, yaklaşık −600 V |
| 6 | Lazer görüntüyü çizer | Lazer diyotu, çokgen ayna, yönlendirme aynaları, gizli görüntü, ayna görüntüsü, kızılötesi notu |
| 7 | Toner yapışır | Toner taneleri (5–10 µm), geliştirme silindiri, yüklerin itmesi ve çekmesi |
| 8 | Kâğıda aktarılır | Aktarım silindiri (+), sarı → macenta → camgöbeği → siyah katmanları |
| 9 | Tambur temizlenir | Temizleme bıçağı, atık toner, bir sayfada 3 turdan fazla dönen tambur |
| 10 | Fırında erir | 180–200 °C ısıtma silindiri, baskı silindiri, liflere eriyen toner |
| 11 | Çıktı | Yüzü aşağı çıkış, büyüteçte dolu siyah yazı ve CMYK rozet deseni |
| 12 | Fotokopi: tarama | Cam, ışık çubuğu, tam ve yarım hızlı ayna arabaları, mercek, CCD, 0–255 değerleri |
| 13 | Kopya basılır | Aynı lazer süreci, yalnızca siyah tambur |
| 14 | Kopyada ne değişti? | Gri tonlar, hare (moiré), kaybolan açık tonlar, ince çizgiler, toz, kenar gölgesi, eğiklik |
| 15 | Kopyanın kopyası | 1., 2., 4. ve 8. kuşak kopyalar yan yana |
| 16 | Özet | Altı adım ve kserografinin kısa tarihi |

## Nasıl çalışıyor

- **Her şey kodla üretiliyor.** Yazıcı, dizüstü, masa, gazete sayfası (fotoğraf dahil), şemalar ve sesler; hiçbir görsel ya da ses dosyası yok.
- **Baskı ve fotokopi gerçekten hesaplanıyor** (`src/page/pipeline.js`, GPU üzerinde):
  1. Sayfa CMYK'ye ayrılıp dört açılı yarım ton ızgarasıyla (15°, 75°, 0°, 45°) noktalanıyor.
  2. Tarama: basılı sayfanın yansıması okunuyor. Mercek bulanıklığı, otomatik pozlama eğrisi, hafif eğiklik, kapak gölgesi, camdaki toz ve sensör gürültüsü ekleniyor.
  3. Kopya: gri görüntü farklı sıklıkta, tek renkli bir ızgarayla yeniden noktalanıyor. Hare deseni, kaybolan açık tonlar ve kalınlaşan koyular elle çizilmiyor, bu işlemden kendiliğinden çıkıyor.
  4. Kopyanın kopyası aynı işlemi tekrarlıyor (1, 2, 4 ve 8. kuşak).
- **Tambur yüzeyi durumsuz bir gölgelendiriciyle çiziliyor** (`src/scene/materials.js`): yüzeydeki her noktanın hangi sayfa satırını taşıdığı ve yüklü, pozlanmış, tonerli ya da temizlenmiş olduğu kâğıdın ilerleyişinden hesaplanıyor. Tamburdaki görüntü bu yüzden doğal olarak ters (ayna görüntüsü) çıkıyor.
- **Zaman çizelgesi:** her şey hikâye zamanının saf bir fonksiyonu (`src/story/state.js`), bu yüzden istenen ana doğrudan atlanabiliyor. Bölüm süreleri altyazıların okunma süresinden hesaplanıyor.
- **Ses:** makine sesleri Web Audio ile sentezleniyor. İsteğe bağlı anlatım tarayıcının kendi Türkçe sesiyle (varsa) yapılıyor; cümle bitmeden sahne ilerlemiyor.

## Kısayollar

Boşluk: oynat / duraklat · ← →: bölüm · N: anlatım · M: ses · F: tam ekran

## Komutlar

```
npm install
npm run dev        # geliştirme sunucusu
npm run build      # dist/ klasörüne derler
```

Test için sayfa parametreleri: `?ch=<bölüm>&t=<saniye>` (ör. `?ch=laser&t=20`), `ui=0` arayüzü gizler, `play=1` hemen oynatır, `cam=x,y,z,hx,hy,hz,fov` kamerayı sabitler.
Ekran görüntüsü (kökteki `puppeteer-core` ile, önce `npm run build`):

```
node tools/shot.mjs <klasör> 1600x900 "ch=transfer&t=19" "ch=compare&t=14"
```
