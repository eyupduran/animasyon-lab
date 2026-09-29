# Animasyon Lab

Kodla çizilen eğitim filmleri. Kanal filmleri `youtube/` altında, denemeler `animations/` altında; her film **kendi başına bir projedir**. Kendi kodu, paketleri, derleme komutu, görsel dili ve README'si vardır. Ortak bir motor ya da şablon yoktur; her yeni animasyon konusunun gerektirdiği teknikle (Three.js, Babylon.js, WebGPU, Canvas, SVG, video…) sıfırdan yazılır. Depo kökü yalnızca ortak işleri yapar: boş bir animasyon klasörü açmak, avatar kütüphanesini yönetmek ve hepsini tek bir sitede yayınlamak.

**Canlı site:** https://eyupduran.github.io/animasyon-lab/ · `main` dalına yapılan her gönderimde otomatik güncellenir.

## Kanal filmleri

YouTube kanalı için yapılan filmler `youtube/` altında durur ve sitede ayrı bir sayfada listelenir: https://eyupduran.github.io/animasyon-lab/kanal/

| Film | Kategori | Teknik | Açıklama |
|---|---|---|---|

## Denemeler

Kanaldan önceki çalışmalar ve denemeler. `animations/` altında, oldukları gibi duruyorlar; kanala yüklenmezler.

| Animasyon | Kategori | Teknik | Açıklama |
|---|---|---|---|
| [Bir Sayfanın Yolculuğu: Yazıcı ve Fotokopi](animations/technology/printer-copier) · [izle](https://eyupduran.github.io/animasyon-lab/printer-copier/) | Teknoloji | Canvas 2D · WebGL2 gölgelendirici · Web Audio | Lazer yazıcıda bir sayfanın doğuşu (tambur, lazer, toner, ısıtıcı), gri tonsuz fotoğraf ve fotokopide beliren hare desenleri |
| [Sağanak](animations/short/cloudburst) · [izle](https://eyupduran.github.io/animasyon-lab/cloudburst/) | Kısa Film | Canvas 2D · Web Audio | Sözsüz kısa film: avuç kadar bir bulut, boynu bükük bir tomurcuk için dağ kadar büyür ve yağar (serbest üretim deneyi) |
| [Sindirim Yolculuğu](animations/biology/digestive-journey) · [izle](https://eyupduran.github.io/animasyon-lab/digestive-journey/) | Biyoloji | Three.js · Avaturn GLB | Bir besinin ağızdan mideye, bağırsaklara, kana ve beyne uzanan yolculuğu |
| [Bal Arısının Bir Günü](animations/documentary/honeybee-day) · [izle](https://eyupduran.github.io/animasyon-lab/honeybee-day/) | Belgesel | Three.js · özel shader · arı gözü mozaiği | Bir toplayıcı arının şafaktan geceye günü: gökyüzü pusulası, UV çiçekler, eve giden ok ve karanlık kovanda sallanım dansı |
| [Karıncanın Gözünde Hayat · Belgesel Sürümü](animations/documentary/ant-documentary) · [izle](https://eyupduran.github.io/animasyon-lab/ant-documentary/) | Belgesel | Babylon.js · PBR · HDRI | Aynı belgesel, belgesel anlatım skilli ve gerçekçilik araştırmasıyla yeniden: uzun objektif, gerçek çayır ışığı, sahneyi kıran çiy damlaları |
| [Yazıcının İçinde](animations/technology/laser-printer) · [izle](https://eyupduran.github.io/animasyon-lab/laser-printer/) | Teknoloji | Three.js · Vite · GPU simülasyonu | Renkli lazer yazıcı ve fotokopinin kesit hâlinde anlatımı; kopyadan kopyaya biriken kayıplar |
| [İstanbul'un Fethi](animations/history/fall-of-constantinople) · [izle](https://eyupduran.github.io/animasyon-lab/fall-of-constantinople/) | Tarih | Canvas 2D · prosedürel minyatür harita | 1453 kuşatması canlanan bir harita üzerinde: Boğazkesen, dev top, Haliç'teki zincir, karadan yürüyen gemiler ve son saldırı |
| [Spring Boot'un İçi](animations/software/spring-boot-internals) · [izle](https://eyupduran.github.io/animasyon-lab/spring-boot-internals/) | Yazılım | Canvas 2D · Web Audio | `SpringApplication.run()` ağır çekimde: konteyner, bean yaşam döngüsü, otomatik yapılandırma, proxy'ler ve bir HTTP isteğinin yolculuğu |
| [Git Hattı: Sürüm Kontrolü](animations/software/git-version-control) · [izle](https://eyupduran.github.io/animasyon-lab/git-version-control/) | Yazılım | Canvas 2D · Web Audio | Git bir metro haritası üzerinde: commit, dal, birleştirme, çakışma, push ve pull |
| [Karar](animations/short/silent-tooth) · [izle](https://eyupduran.github.io/animasyon-lab/silent-tooth/) | Kısa Film | Three.js · bokeh DOF · Web Audio sentezi | Sözsüz: müzik kutusunun hiç çalınmamış tozlu dişi, yay biterken yarım kalan melodiyi bitirir |

## Yeni animasyon

```
npm run new -- biology/heartbeat "Kalbin Bir Atımı"     # → animations/biology/heartbeat/ (yalnızca animation.json ve README.md)
```

Klasör boş açılır. Teknik, paketler ve derleme düzeni animasyonun kendi ihtiyacına göre kurulur; önceki animasyonlar şablon olarak kullanılmaz. Sonra `animation.json`'daki alanlar doldurulur, tabloya bir satır eklenir ve gönderilir; site birkaç dakika içinde yeni kartla güncellenir.

## Avatar kütüphanesi (isteğe bağlı)

Bir animasyonda gerçekçi bir insan karakteri gerekirse `assets/avatars/` altındaki hazır modeller kullanılabilir (Avaturn, glTF 2.0). Hepsi aynı 54 kemikli iskeleti ve aynı yüz şekillerini (52 ARKit ifadesi ve 15 konuşma şekli) paylaşır. Küçük resimler ve açıklamalar [assets/avatars/README.md](assets/avatars/README.md) dosyasında.

```
npm install                                        # kökte, bir kez
npm run avatars -- list                            # kütüphanedeki karakterler
npm run avatars -- use set-01-f02 heartbeat        # modeli animations/biology/heartbeat/assets/ içine kopyalar
npm run avatars -- add set-02-f03                  # ham modeli (~14 MB) küçültüp kütüphaneye ekler (~3,5 MB)
```

Ham modeller git'te tutulmaz (`catalog.json` → `source`).

## Film istemek

```
/next                                          # yayın çizelgesindeki sıradaki videoyu üretir (channel/)
/animation bal arısının bir günü, belgesel     # çizelge dışı anlatımlı film: metin ve ses → film → yayın
/short                                         # sözsüz kısa film (fikir verilebilir)
/youtube <slug>                                # YouTube paketi: video, altyazı, kapaklar, başlık
/plan                                          # çizelgeyi değerlendirir ve sonraki dönemi kurar
/audit <slug>                                  # bağımsız denetim raporu
```

**Filmi nasıl yapacağı modele bırakılmıştır.** Bir kıyas deneyinde aynı hikâye hem depo kurallarıyla hem de boş bir klasörde tek prompt'la üretildi; kuralsız olan açıkça daha iyi çıktı (`animations/short/cloudburst`; kurallarla üretilen sürüm kaldırıldı, git geçmişinde duruyor). Anlatımlı filmlerde görüntü sese bağlı olduğu için önce metin ve ses hazırlanır, film onun üzerine yapılır. Komut her aşamayı temiz bir yardımcı ajana verir; kullanıcı tek istek yazar. Film aşamasında yalnızca beş şart var ([CLAUDE.md](CLAUDE.md)): yalnızca kod, doğru bilgi, türüne uygun anlatım ([.claude/skills/narration](.claude/skills/narration/SKILL.md)), önceki filmlere bakmamak ve videoya çevirmek için tek küçük söz (`window.__film`). Oynatıcı, altyazı, test, kapak, README gibi işler filmden ayrıldı: oynatıcıyı, altyazıyı ve ses karışımını araçlar yapar; yayın ayrı bir aşamadır, YouTube paketi ayrı bir komuttur.

## Sitede oynatma

Site filmi video gibi oynatır ama MP4 yüklemez: film tarayıcıda canlı çizilir. `tools/build-site.mjs`, `window.__film` sunan her filmi `tools/player` oynatıcısının içine koyar (`dist/<slug>/index.html`, film `dist/<slug>/film/` altında). Oynatıcı saatini ses dosyasından alır, filmin o anki karesini çizdirir ve altyazıyı videodakiyle aynı görünüşte gösterir. Oynat/duraklat, zaman çubuğu, bölüm işaretleri, altyazı aç/kapa, ses ve tam ekran düğmeleri vardır; klavye (boşluk, oklar, F, C, M) ve dokunmatik ekran desteklenir.

```
npm run soundtrack -- <slug>          # anlatım + filmin sesi tek dosyada → animations/<kategori>/<slug>/soundtrack.m4a (~6 MB / 7 dk, git'e girer)
npm run poster -- <slug> --pick 10    # aday kareler; sonra --t <saniye> → poster.jpg
```

`soundtrack.m4a` yoksa oynatıcı anlatım kayıtlarını ve filmin sesini tarayıcıda kendisi karıştırır (sesini yavaş üreten filmlerde müziğin gelmesi gecikebilir).

## Yayın çizelgesi

Kanalda hangi gün hangi videonun çıkacağı [channel/](channel/README.md) altında durur: [çizelge](channel/PLAN.md), kurallar ve konu araştırması. Tek kaynak `channel/plan.json`.

```
npm run plan                           # çizelge, sıradaki video işaretli
npm run plan -- next                   # sıradaki videonun isteği ve üretim için son günü
npm run plan -- build                  # channel/PLAN.md ve çizelge sayfası
npm run compile -- derleme-1           # bir serinin videolarını tek parça yapar
npm run topics -- suggest "osmanlı neden"   # konu araştırması: insanlar YouTube'da ne arıyor
```

## Seslendirme (yerel, ücretsiz)

Anlatım sesleri bu bilgisayarda üretilir; dışarıya hiçbir şey gönderilmez. Dört motor var: **OmniVoice**, **Supertonic 3**, **Chatterbox** ve **EMA-TTS**; hepsinin lisansı ticari kullanıma açık, atıf şartı yok. Sesler sentetiktir, gerçek bir kişiden kopyalanmamıştır. Liste ve açıklama [assets/voices/README.md](assets/voices/README.md) dosyasında.

```
npm run voice -- voices                                  # 19 ses: OmniVoice (O…), Supertonic (S…), Chatterbox (C…), EMA-TTS (E1)
npm run voice -- laser-printer                           # animations/technology/laser-printer/narration/lines.json → public/voice/*.mp3
npm run voice -- laser-printer --voice omni-kadin-genc   # sesi değiştirir (seçim lines.json'a yazılır)
```

Animasyon söylenecek satırları `narration/lines.json` dosyasına yazar (`{ "voice", "out", "manifest", "lines": [{ "id", "say" }] }`). Bir satır bir bölümün anlatımının tamamıdır: cümleleri ayrı ayrı seslendirip art arda çalmak kesik ve robotik duyulduğu için her bölüm tek parça, doğal akışla okunur. Araç her satırı ayrı bir MP3 yapar ve sürelerini `narration/manifest.json` dosyasına kaydeder; yalnızca değişen satırları yeniden üretir. Her kayıt Whisper ile dinlenip denetlenir, bozuk çıkan birkaç kez yeniden denenir, hâlâ şüpheli olanlar sonda listelenir. Kayıtlar git'e girer, çünkü site derlenirken model çalışmaz.

Kurulum (bir kez): `C:\ProgramData	ts_lab\omni` Python ortamı (PyTorch CUDA, `omnivoice`, `faster-whisper`), modeller `C:\ProgramData	ts_lab\hf` altında.

## YouTube videosu

```
npm run video -- <slug>                # renders/<slug>.mp4 (temiz) + <slug>-altyazili.mp4 + .srt + -chapters.txt
npm run subs -- <slug> [--srt]         # yalnızca altyazılı sürümü yeniden basar (--srt: altyazıyı filmden yeniden üretir)
npm run verify -- <slug>               # renderAt(t) saflık testi: aynı an aynı piksel, sayfa hatası yok
```

Altyazı sesle ilerler: bir cümle (uzunsa bir parçası) en fazla iki satırlık bir parça olarak baştan yerleşir, kelimeler anlatıcı söyledikçe tek tek belirir; bant yok, yumuşak gölge var (Inter Medium, `assets/fonts/`). Kurallar ve görünüş `tools/lib/film.mjs` içinde (`CUE`, `SUB_STYLE`); `.srt`, altyazılı video ve site oynatıcısı aynı kaynaktan beslenir.

Claude Code'da `/youtube <slug>` komutu bütün işi yapar: iki videoyu, altyazıyı, bölüm listesini, kapakları ve YouTube metnini `Masaüstü\YouTube\<slug>\` klasörüne çıkarır ([.claude/skills/youtube/SKILL.md](.claude/skills/youtube/SKILL.md)).

Kapak görselleri de kodla çizilir:

```
npm run thumbnail -- <slug>            # animations/<kategori>/<slug>/renders/thumbnail-<n>-<ad>.jpg (ana kapak + 2 alternatif, 1920×1080)
```

Animasyon `thumbnail.html` sayfasını sunar (`?v=<n>` bir konsept çizer; sözleşme `tools/thumbnail.mjs` içinde). Kapaklar kanalın seri kimliğini [assets/thumbnail-kit/kit.js](assets/thumbnail-kit/kit.js) kitinden alır: "ANİMASYON LAB" işareti, kategori renginde kenar şeridi ve etiket, ızgaraya oturan büyük başlık, ortak renk işleme. Sağ alt köşe YouTube'un süre rozeti için boş kalır. Ana görsel her videoda filmin kendi karesinden ya da kodundan gelir: `?v=1` ana kapak, `?v=2` ve `?v=3` A/B alternatifleri.

Film `?video=1` adresinde `window.__film` nesnesini sunar: `duration`, `renderAt(t)`; varsa `narration: [{ id, at }]`, `chapters: [{ t, title }]`, `sound(from, to)`. Araç kareleri headless Chrome'da tek tek çizer, altyazıyı anlatım metninden ve kelime zamanlarından üretir, anlatım kayıtlarını filmin kendi sesinin üstüne karıştırır ve ffmpeg ile birleştirir (`tools/lib/film.mjs`). Eski animasyonların `window.__video` sözleşmesi de desteklenir. `.srt` dosyası YouTube'a ayrıca yüklenir, izleyici altyazıyı açıp kapatabilir.

## Klasörler

```
animasyon-lab/
├─ animations/
│  ├─ biology/                  kategori klasörleri (İngilizce): biology, history, geography, physics,
│  │  └─ digestive-journey/     chemistry, math, space, technology, software … (tools/lib/animations.mjs)
│  │     ├─ animation.json      her animasyon bağımsız bir proje; kimlik kartı: başlık, açıklama, teknik, derleme (zorunlu)
│  │     ├─ README.md           bu animasyonun anlatımı ve komutları (zorunlu)
│  │     └─ poster.jpg          sitedeki kart görseli, 16:9 (isteğe bağlı)
│  ├─ documentary/              belgeseller (konusu ne olursa olsun)
│  ├─ history/ · technology/ · software/ …
├─ assets/avatars/             isteğe bağlı avatar kütüphanesi: catalog.json, models/*.glb, thumbs/*.jpg
├─ assets/voices/              anlatıcı sesleri: catalog.json + her sesin kimlik kaydı
├─ assets/thumbnail-kit/       YouTube kapaklarının ortak kanal kimliği
├─ assets/fonts/               altyazı yazı tipi (Inter, SIL OFL)
├─ tools/
│  ├─ lib/animations.mjs        kategori listesi; araçlar animasyonu slug ile bulur
│  ├─ new-animation.mjs         boş bir animasyon klasörü açar (<kategori>/<slug>)
│  ├─ avatars.mjs               avatar kütüphanesi: list, add, use, thumbs
│  ├─ voice.mjs                 yerel seslendirme (OmniVoice, Piper) + Whisper denetimi
│  ├─ tts/                      motor çalışanları: OmniVoice, Supertonic, Chatterbox, EMA-TTS (+ Whisper denetimi)
│  ├─ render-video.mjs          YouTube için MP4 (temiz + altyazılı) + SRT + bölüm listesi
│  ├─ burn-subs.mjs             altyazıyı görüntüye basar (npm run subs)
│  ├─ soundtrack.mjs            site oynatıcısının ses dosyası (npm run soundtrack)
│  ├─ poster.mjs                site kartı ve oynatıcı açılışı için kare (npm run poster)
│  ├─ player/                   sitedeki video oynatıcı: filmi iframe'de canlı çizdirir
│  └─ build-site.mjs            her animasyonu kendi komutuyla derler, siteyi dist/ altında toplar
├─ .github/workflows/pages.yml  her gönderimde siteyi derleyip GitHub Pages'e yayınlar
└─ CLAUDE.md                    yapay zekâ oturumları için depo kuralları
```

`dist/`, `renders/` ve `node_modules/` hiçbir düzeyde git'e girmez.

## Bir animasyon klasörünün kuralları

1. Yer: `animations/<kategori>/<slug>/`. Kategori ve slug İngilizce; küçük harf, rakam ve tire: `biology/heartbeat`, `software/git-version-control`. Slug bütün kategorilerde tektir; sitedeki adres kategori içermez (`…/<slug>/`). Türkçe başlık ve metinler `animation.json` içinde durur.
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
