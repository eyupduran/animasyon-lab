# Animasyon Lab

Tarayıcıda çalışan eğitim animasyonlarının deposu. Her animasyon `animations/` altında **kendi başına bir projedir**: kendi kodu, kendi derleme komutu, kendi README'si vardır ve farklı bir teknikle (Three.js, Babylon.js, Canvas, video…) yazılabilir. Depo kökü yalnızca ortak işleri yapar: yeni animasyon açmak ve hepsini tek bir sitede yayınlamak.

**Canlı site:** https://eyupduran.github.io/animasyon-lab/ · `main` dalına yapılan her gönderimde otomatik güncellenir.

## Animasyonlar

| Animasyon | Teknik | Açıklama |
|---|---|---|
| [Bir Lokumun Yolculuğu](animations/digestive-journey) · [izle](https://eyupduran.github.io/animasyon-lab/digestive-journey/) | Three.js · Avaturn GLB | Bir parça lokumun ağızdan mideye, bağırsaklara, kana ve beyne uzanan yolculuğu |

## Yeni animasyon

```
npm run new -- heartbeat "Kalbin Bir Atımı"                            # Three.js şablonundan
npm run new -- heartbeat "Kalbin Bir Atımı" --from digestive-journey   # var olan bir animasyondan
cd animations/heartbeat
node build.mjs                                                                # → dist/index.html
```

Sonra tabloya bir satır ekleyip gönderin; site birkaç dakika içinde yeni kartla güncellenir.

Başka bir teknikle yazılan bir animasyon da aynı kurallara uyduğu sürece siteye katılır (bkz. [Kurallar](#bir-animasyon-klasörünün-kuralları)).

## Klasörler

```
animasyon-lab/
├─ animations/
│  ├─ _template-threejs/        Three.js şablonu (npm run new varsayılanı; "_" ile başlayanlar yayınlanmaz)
│  └─ digestive-journey/        her animasyon bağımsız bir proje
│     ├─ animation.json         kimlik kartı: başlık, açıklama, teknik, derleme komutu, çıktı klasörü
│     ├─ README.md              bu animasyonun anlatımı ve komutları
│     ├─ package.json           bu animasyonun komutları ve (varsa) bağımlılıkları
│     ├─ build.mjs              derleme → dist/
│     ├─ src/                   kaynak kod (bu animasyonun kendi motoru ve sahneleri)
│     ├─ assets/                modeller, dokular…
│     ├─ tools/                 bu animasyona özel araçlar (video üretimi vb.)
│     └─ poster.jpg             sitedeki kart görseli (16:9)
├─ tools/
│  ├─ new-animation.mjs         şablondan ya da var olan animasyondan kopyalar
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
     "tech": "Three.js r170 · WebGL",
     "build": "node build.mjs",
     "output": "dist"
   }
   ```
   `build` komutu animasyon klasöründe çalıştırılır ve `output` klasörüne bir `index.html` üretmelidir. Diğer alanlar animasyonun kendi kodu içindir.
3. Derlenen sayfa kendi başına açılabilmeli (tek HTML ya da `output` altında göreli yollarla dosyalar).
4. `README.md`: ne anlattığı, nasıl derlendiği, varsa video ve model adımları.
5. Büyük dosyalar (videolar) `renders/` altında kalır; git'e girmez.

## Siteyi yerelde derlemek

```
npm run build                        # tüm animasyonlar → dist/index.html
npm run build -- digestive-journey   # yalnızca biri (ana sayfa yine üretilir)
```
