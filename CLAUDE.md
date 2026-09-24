# Animasyon Lab — çalışma kuralları

Bu depo birden çok bağımsız eğitim animasyonu barındırır. Kullanıcı her yeni oturumda genellikle yeni bir animasyon ister; önceki animasyonlar örnek ve başlangıç noktası olarak kullanılır.

## Yeni animasyon isteğinde

1. `npm run new -- <slug> "<Başlık>"` ile başla. İstenen şeye en yakın animasyon varsa `--from <o-animasyon>` kullan (ör. karakterli bir açılış gerekiyorsa `--from lokumun-yolculugu`).
2. Yalnızca `animations/<slug>/` içinde çalış. Başka bir animasyonun dosyalarını değiştirme; ortak bir şey gerekiyorsa kopyala.
3. `animation.json` içindeki `slug`, `title`, `description`, `tech`, `build`, `output` alanlarını doldur. Sitenin kartı bunlardan üretilir.
4. Animasyonun `README.md` dosyasını yaz: ne anlattığı, bölümler, komutlar.
5. Kök `README.md` içindeki "Animasyonlar" tablosuna bir satır ekle.
6. `node build.mjs` (animasyon klasöründe) ve kökte `npm run build -- <slug>` çalıştır, ardından sayfayı tarayıcıda (headless Chrome ile ekran görüntüsü) kontrol et.
7. Kullanıcı isterse commit edip `main`'e gönder. Pages yayını otomatik.

## Teknik

- Animasyonlar farklı tekniklerle yazılabilir. Tek şart: `build` komutu `output` klasörüne kendi başına açılan bir `index.html` üretsin.
- Three.js animasyonlarında motor `src/engine/` altındadır (`shell.html`, `core.js`, `engine.js`); sahneler `src/scenes/` altında `defWorld` (3D dünya) ve `defChapter` (zaman çizelgesi bölümü) ile tanımlanır, sıralama `animation.json` → `scenes`.
- Test için sayfaya `?ch=<bölüm-id>&t=<saniye>&hud=0` eklenebilir; `?capture=1` video modudur.
- Video: animasyon klasöründe `npm install` sonra `npm run video` (Chrome + ffmpeg + PowerShell 7 ve Windows "Microsoft Tolga" sesi). Çıktı `renders/`.
- Ücretli dış servis kullanma (yapay zekâ ses/görsel API'leri). Yerel araçları tercih et; dışarıya bir şey gönderilecekse önce sor.

## Dil ve adlandırma

- Arayüz metinleri, README'ler ve commit mesajları Türkçe; kod tanımlayıcıları İngilizce.
- Klasör/slug adları Türkçe karakter içermez: `lokumun-yolculugu`, `kalbin-bir-atimi`.
