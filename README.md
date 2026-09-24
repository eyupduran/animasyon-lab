# Animasyon Lab

Tarayıcıda çalışan 3D eğitim animasyonları. Her animasyon kodla çizilir (Three.js · WebGL · Web Audio), tek bir HTML dosyasına derlenir, istenirse kare kare MP4 videoya dönüştürülür. `main` dalına yapılan her gönderim, tüm animasyonları GitHub Pages'te otomatik yayınlar.

| Animasyon | Açıklama |
|---|---|
| [Bir Lokumun Yolculuğu](animations/lokumun-yolculugu) | Bir parça lokumun ağızdan mideye, bağırsaklara, kana ve beyne uzanan yolculuğu |

## Hızlı başlangıç

```
npm install                              # yalnızca video ve model araçları için gerekir
npm run build -- lokumun-yolculugu       # → dist/lokumun-yolculugu/index.html (çift tıklayıp açılır)
npm run build:all                        # tüm animasyonlar + dist/index.html (yayınlanan site)
```

Derlenen sayfa internet bağlantısı ister (Three.js ve yazı tipleri CDN'den gelir).

## Yeni bir animasyon

```
npm run new -- kalbin-bir-atimi "Kalbin Bir Atımı"
npm run build -- kalbin-bir-atimi
```

`animations/_template` kopyalanır; içinde çalışan bir örnek sahne vardır. Sonra `animations/kalbin-bir-atimi/` klasöründe:

1. `animation.json` → başlık, giriş ve bitiş metinleri, sahne dosyalarının sırası
2. `scenes/*.js` → dünyalar (`defWorld`) ve bölümler (`defChapter`)
3. isteğe bağlı: `assets/` (ör. karakter GLB), `poster.jpg` (ana sayfa kartı, 16:9)

## Video

```
npm run video -- lokumun-yolculugu          # renders/lokumun-yolculugu/*.mp4 (~1 saat, 60 fps)
npm run video -- lokumun-yolculugu test     # her bölümden bir kare, düzeni kontrol etmek için
FPS=30 npm run video -- lokumun-yolculugu   # daha hızlı üretim
```

Üç dosya üretilir: anlatımlı 1080p, anlatımsız 1080p ve mesajlaşma uygulamaları için 720p. Anlatım, Windows'un yerel Türkçe sesi **Microsoft Tolga** ile yapılır (PowerShell 7 `pwsh` gerekir; dış servis kullanılmaz). Bir cümle alt yazı süresine sığmazsa görüntü o kısımda hafifçe yavaşlar. Gereken: Chrome, ffmpeg (PATH'te) ve `npm install`.

Videolar büyük olduğu için git'e girmez (`renders/` yok sayılır); paylaşmak için Drive, YouTube veya GitHub Releases kullanın.

## Karakter modelleri

Avaturn GLB karakterleri web için küçültülür (yalnızca gereken yüz ifadeleri kalır, ~14 MB → ~2,8 MB):

```
npm run avatar -- "C:/Users/Eyüp/Desktop/cafe-avatars-glb/set-01-m01.glb" animations/lokumun-yolculugu/assets/avatar.glb
```

`animation.json` içindeki `embed` alanı dosyayı sayfaya gömer (`"AVATAR_GLB_B64": "assets/avatar.glb"`).

## Klasörler

```
animasyon-lab/
├─ engine/                 ortak motor (her animasyonda aynı)
│  ├─ shell.html           sayfa iskeleti, arayüz ve stiller ({{…}} alanları animation.json'dan dolar)
│  ├─ core.js              gürültü, prosedürel dokular, tüp ve SDF geometri, moleküller, parçacıklar
│  └─ engine.js            render, efektler, zaman çizelgesi, alt yazı, 3D etiketler, harita, ses, video modu
├─ animations/
│  ├─ _template/           yeni animasyon şablonu (npm run new)
│  └─ lokumun-yolculugu/   animation.json · scenes/ · assets/ · poster.jpg · README.md
├─ tools/
│  ├─ build.mjs            derleme (tek animasyon ya da --all)
│  ├─ new-animation.mjs    şablondan yeni animasyon
│  ├─ render-video.mjs     kare kare MP4 + yerel anlatım
│  └─ slim-avatar.mjs      GLB karakter küçültme
├─ .github/workflows/pages.yml   her gönderimde derleyip GitHub Pages'e yayınlar
├─ dist/                   derleme çıktısı (git'e girmez)
└─ renders/                videolar (git'e girmez)
```

## Motorda test kısayolları

Derlenmiş sayfaya adres parametresi eklenebilir: `index.html?ch=stomach&t=6` (o bölümün 6. saniyesinden başlar), `&hud=0` (arayüzü gizler), `?capture=1` (video modu). Klavye: boşluk (oynat/duraklat), ← → (önceki/sonraki bölüm), F (tam ekran), M (ses).
