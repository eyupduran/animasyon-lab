# Bir Sayfanın Yolculuğu: Yazıcı ve Fotokopi

**İzle:** https://eyupduran.github.io/animasyon-lab/printer-copier/ · Süre: 6 dk 52 sn · Anlatım: OmniVoice `omni-erkek-derin`

Yazıcıdan çıkan sayfa neden sıcaktır? Film tek bir sayfayı lazer yazıcının içinde baştan sona izler: kâğıdın çekilişi, ışığa duyarlı tamburun yüklenmesi, dönen çok yüzlü aynayla tambura yazan lazer, kuru plastik tozu olan tonerin tutunması ve yaklaşık iki yüz derecelik ısıtıcıda kâğıda erimesi. Ardından yazıcının tek bir siyahla fotoğrafı nasıl bastığını (yarım ton) gösterir ve sayfayı fotokopiye sokar: iki nokta ızgarası üst üste binince beliren hare desenleri, sertleşen tonlar ve kopyanın kopyasında kaybolan ayrıntı. Aradaki tarih şeridi Chester Carlson'un 1938'deki ilk kserografik kopyasından 1959'daki Xerox 914'e ve 1971'de bir fotokopi makinesinden yapılan ilk lazer yazıcıya uzanır.

## Bölümler

| Zaman | Bölüm |
|---|---|
| 0:00 | Sıcak bir sayfa |
| 0:38 | Kâğıt |
| 1:08 | Tambur |
| 1:41 | Lazer |
| 2:22 | Toz ve ısı |
| 3:13 | Yarım ton |
| 3:59 | Fotokopi |
| 5:15 | Kopyanın kopyası |
| 6:17 | Bir anlık ışık |

## Teknik

- Canvas 2D ile çizilen kesitler ve şemalar; yarım ton, tarama ve kopya kuşakları WebGL2 gölgelendiricisinde benzetilir (`src/gl.js`, `src/photo.js`).
- Görüntü zamanın saf fonksiyonudur: `?video=1` ile açıldığında `window.__film` (`duration`, `renderAt`, `narration`, `chapters`, `sound`) sunulur.
- Müzik ve makine sesleri (motor, kâğıt, dönen ayna, lazer, ısıtıcı) Web Audio ile kodla üretilir (`src/sound.js`, OfflineAudioContext).
- Anlatım metni `NARRATION.md`, kayıtlar `public/voice/`, kelime zamanları `narration/manifest.json`; olaylar bu zamanlara bağlıdır.

## Çalıştırma

```
node build.mjs                          # dist/index.html (tek dosya); tarayıcıda açınca sessiz, döngülü önizleme
npm run verify -- printer-copier        # kökte: renderAt saflık testi
npm run video -- printer-copier         # kökte: renders/printer-copier.mp4 + .srt + bölüm listesi
npm run thumbnail -- printer-copier     # kökte: 5 kapak (thumbnail.html, filmin kendi kareleriyle)
```

## Kaynaklar

Ayrıntılı notlar `RESEARCH.md` dosyasında. Başlıcaları: Wikipedia "Xerography", "Laser printing", "Chester Carlson", "Toner (printing)", "Halftone", "Paper size"; ETHW / IEEE Milestone "Development of the Commercial Laser Printer, 1971-1977"; Xerox "Chester Carlson Xerography History"; ısıtıcı sıcaklığı için üretici destek kaynakları (yaklaşık 180–220 °C).
