# Animasyon Lab

Tarayıcıda çalışan eğitim animasyonlarının ve denemelerinin koleksiyonu. Her animasyon `animations/` altında **kendi başına bir projedir**. Kendi kodu, paketleri, derleme komutu, görsel dili ve README'si vardır. Ortak bir motor ya da şablon yoktur; her yeni animasyon konusunun gerektirdiği teknikle (Three.js, Babylon.js, WebGPU, Canvas, SVG, video…) sıfırdan yazılır. Depo kökü yalnızca ortak işleri yapar: boş bir animasyon klasörü açmak, avatar kütüphanesini yönetmek ve hepsini tek bir sitede yayınlamak.

**Canlı site:** https://eyupduran.github.io/animasyon-lab/ · `main` dalına yapılan her gönderimde otomatik güncellenir.

## Animasyonlar

| Animasyon | Teknik | Açıklama |
|---|---|---|
| [Sindirim Yolculuğu](animations/digestive-journey) · [izle](https://eyupduran.github.io/animasyon-lab/digestive-journey/) | Three.js · Avaturn GLB | Bir besinin ağızdan mideye, bağırsaklara, kana ve beyne uzanan yolculuğu |
| [Yazıcının İçinde](animations/laser-printer) · [izle](https://eyupduran.github.io/animasyon-lab/laser-printer/) | Three.js · Vite · GPU simülasyonu | Renkli lazer yazıcı ve fotokopinin kesit hâlinde anlatımı; kopyadan kopyaya biriken kayıplar |
| [İstanbul'un Fethi](animations/fall-of-constantinople) · [izle](https://eyupduran.github.io/animasyon-lab/fall-of-constantinople/) | Canvas 2D · prosedürel minyatür harita | 1453 kuşatması canlanan bir harita üzerinde: Boğazkesen, dev top, Haliç'teki zincir, karadan yürüyen gemiler ve son saldırı |

## Yeni animasyon

```
npm run new -- heartbeat "Kalbin Bir Atımı"     # → animations/heartbeat/ (yalnızca animation.json ve README.md)
```

Klasör boş açılır. Teknik, paketler ve derleme düzeni animasyonun kendi ihtiyacına göre kurulur; önceki animasyonlar şablon olarak kullanılmaz. Sonra `animation.json`'daki alanlar doldurulur, tabloya bir satır eklenir ve gönderilir; site birkaç dakika içinde yeni kartla güncellenir.

## Avatar kütüphanesi (isteğe bağlı)

Bir animasyonda gerçekçi bir insan karakteri gerekirse `assets/avatars/` altındaki hazır modeller kullanılabilir (Avaturn, glTF 2.0). Hepsi aynı 54 kemikli iskeleti ve aynı yüz şekillerini (52 ARKit ifadesi ve 15 konuşma şekli) paylaşır. Küçük resimler ve açıklamalar [assets/avatars/README.md](assets/avatars/README.md) dosyasında.

```
npm install                                        # kökte, bir kez
npm run avatars -- list                            # kütüphanedeki karakterler
npm run avatars -- use set-01-f02 heartbeat        # modeli animations/heartbeat/assets/ içine kopyalar
npm run avatars -- add set-02-f03                  # ham modeli (~14 MB) küçültüp kütüphaneye ekler (~3,5 MB)
```

Ham modeller git'te tutulmaz (`catalog.json` → `source`).

## Yeni animasyon istemek

[prompts/new-animation.md](prompts/new-animation.md) dosyasındaki "İSTEK" bölümünü doldurup yeni bir oturumda şunu yazın: *"prompts/new-animation.md dosyasını oku ve uygula."* Şablon; konunun önce araştırılmasını, anlatımın bir insan konuşması gibi yazılmasını, ortak ses ve altyazı tekniğini ve her animasyonun diğerlerinden bağımsız, özgün bir tasarımla yapılmasını tarif eder.

## Seslendirme (yerel, ücretsiz)

Anlatım sesleri bu bilgisayarda üretilir; dışarıya hiçbir şey gönderilmez. Dört motor var: **OmniVoice**, **Supertonic 3**, **Chatterbox** ve **EMA-TTS**; hepsinin lisansı ticari kullanıma açık, atıf şartı yok. Sesler sentetiktir, gerçek bir kişiden kopyalanmamıştır. Liste ve açıklama [assets/voices/README.md](assets/voices/README.md) dosyasında.

```
npm run voice -- voices                                  # 20 ses: OmniVoice (O…), Supertonic (S…), Chatterbox (C…), EMA-TTS (E1)
npm run voice -- laser-printer                           # animations/laser-printer/narration/lines.json → public/voice/*.mp3
npm run voice -- laser-printer --voice omni-kadin-genc   # sesi değiştirir (seçim lines.json'a yazılır)
```

Animasyon söylenecek satırları `narration/lines.json` dosyasına yazar (`{ "voice", "out", "manifest", "lines": [{ "id", "say" }] }`). Bir satır bir bölümün anlatımının tamamıdır: cümleleri ayrı ayrı seslendirip art arda çalmak kesik ve robotik duyulduğu için her bölüm tek parça, doğal akışla okunur. Araç her satırı ayrı bir MP3 yapar ve sürelerini `narration/manifest.json` dosyasına kaydeder; yalnızca değişen satırları yeniden üretir. Her kayıt Whisper ile dinlenip denetlenir, bozuk çıkan birkaç kez yeniden denenir, hâlâ şüpheli olanlar sonda listelenir. Kayıtlar git'e girer, çünkü site derlenirken model çalışmaz.

Kurulum (bir kez): `C:\ProgramData	ts_lab\omni` Python ortamı (PyTorch CUDA, `omnivoice`, `faster-whisper`), modeller `C:\ProgramData	ts_lab\hf` altında.

## YouTube videosu

```
npm run video -- <slug>                # animations/<slug>/renders/<slug>.mp4 + .srt + -chapters.txt
npm run video -- <slug> --subs burn    # altyazı görüntüye gömülü
```

Animasyon `?video=1` adresinde `window.__video` nesnesini sunar (`duration`, `renderAt`, `prepareSound`, `soundChunk`, `srt`, `chapters`). Araç kareleri headless Chrome'da tek tek çizer, film sesini sayfada çevrimdışı üretir ve ffmpeg ile birleştirir. `.srt` dosyası YouTube'a ayrıca yüklenir, izleyici altyazıyı açıp kapatabilir.

## Klasörler

```
animasyon-lab/
├─ animations/
│  └─ digestive-journey/        her animasyon bağımsız bir proje; içi animasyona göre değişir
│     ├─ animation.json         kimlik kartı: başlık, açıklama, teknik, derleme komutu, çıktı klasörü (zorunlu)
│     ├─ README.md              bu animasyonun anlatımı ve komutları (zorunlu)
│     └─ poster.jpg             sitedeki kart görseli, 16:9 (isteğe bağlı)
├─ assets/avatars/             isteğe bağlı avatar kütüphanesi: catalog.json, models/*.glb, thumbs/*.jpg
├─ assets/voices/              anlatıcı sesleri: catalog.json + her sesin kimlik kaydı
├─ tools/
│  ├─ new-animation.mjs         boş bir animasyon klasörü açar
│  ├─ avatars.mjs               avatar kütüphanesi: list, add, use, thumbs
│  ├─ voice.mjs                 yerel seslendirme (OmniVoice, Piper) + Whisper denetimi
│  ├─ tts/                      motor çalışanları: OmniVoice, Supertonic, Chatterbox, EMA-TTS (+ Whisper denetimi)
│  ├─ render-video.mjs          YouTube için MP4 + SRT + bölüm listesi
│  └─ build-site.mjs            her animasyonu kendi komutuyla derler, siteyi dist/ altında toplar
├─ .github/workflows/pages.yml  her gönderimde siteyi derleyip GitHub Pages'e yayınlar
└─ CLAUDE.md                    yapay zekâ oturumları için depo kuralları
```

`dist/`, `renders/` ve `node_modules/` hiçbir düzeyde git'e girmez.

## Bir animasyon klasörünün kuralları

1. Klasör adı İngilizce; küçük harf, rakam ve tire: `heartbeat`, `digestive-journey`. Türkçe başlık ve metinler `animation.json` içinde durur.
2. `animation.json` şu alanları taşır:
   ```json
   {
     "slug": "heartbeat",
     "title": "Kalbin Bir Atımı",
     "description": "Sitedeki kartta görünen tek cümle.",
     "tech": "Kullanılan teknik, ör. Babylon.js 9 · WebGL",
     "build": "node build.mjs",
     "output": "dist"
   }
   ```
   `build` komutu animasyon klasöründe çalıştırılır ve `output` klasörüne bir `index.html` üretmelidir. `build` boşsa animasyon siteye alınmaz. Diğer alanlar animasyonun kendi kodu içindir. Derleme için gereken paketler (ör. Vite) animasyonun `package.json` → `dependencies` alanına yazılır; site derlenirken bunlar kendiliğinden kurulur. `devDependencies` yalnızca yerelde kullanılan araçlar içindir (video üretimi vb.).
3. Derlenen sayfa kendi başına açılabilmeli (tek HTML ya da `output` altında göreli yollarla dosyalar).
4. `README.md`: ne anlattığı, nasıl derlendiği, varsa video ve model adımları.
5. Büyük dosyalar (videolar) `renders/` altında kalır; git'e girmez.

## Siteyi yerelde derlemek

```
npm run build                        # tüm animasyonlar → dist/index.html
npm run build -- digestive-journey   # yalnızca biri (ana sayfa yine üretilir)
```
