---
name: youtube
description: Sitede yayınlanmış bir filmin YouTube paketini üretir. Altyazılı ve altyazısız MP4, .srt, bölüm listesi, kanalın seri kimliğinde ana kapak ve iki alternatif, başlık, açıklama ve etiketler; hepsi masaüstündeki YouTube klasörüne gider. Filmin görüntüsüne dokunmaz.
argument-hint: <slug>
disable-model-invocation: true
---

Film: **$ARGUMENTS**

Boşsa "Hangi filmin YouTube paketini hazırlayayım?" diye sor, `animations/` altındaki slug'ları listele ve dur.

Bu komutu çalıştırmak, bu film için commit ve push onayıdır. Arada soru sorma.

Filmin **görünümünü değiştirme.** Kusur görürsen düzeltme, son mesajında listele. Yalnızca bu dosyayı, filmin kendi klasörünü, `assets/thumbnail-kit/` klasörünü ve adı geçen araçları kullan; başka filmleri ve `docs/` klasörünü açma.

## Adımlar

1. **Video:**
   - `npm run video -- <slug>` şunları üretir (hepsi `renders/` altında):
     - `<slug>.mp4`: temiz görüntü; YouTube'da altyazı `.srt`'den CC ile açılır.
     - `<slug>-altyazili.mp4`: altyazı görüntüye basılı.
     - `<slug>.srt`
     - `<slug>-chapters.txt`
   - Altyazı kısa, tek satırlık parçalar hâlinde, sesi izleyerek akar. Görünüşü sitedeki oynatıcıyla aynıdır (`tools/lib/film.mjs` → `CUE`, `SUB_STYLE`).
   - Uzun iştir, arka planda çalıştır ve bitmesini bekle.
2. **Denetim:**
   - İki videodan da kareler çıkar. Siyah kare, kayık ses ya da taşan yazı var mı?
   - Altyazı okunuyor mu, filmin ekrandaki yazılarıyla çakışıyor mu?
   - Ses düzeyini ölç: tepe yaklaşık −1 dB olmalı. Anlatım müziğin belirgin üstünde olmalı (`--music -8` ayarı).
   - MP4'e sonradan dokunursan (ör. ses düzeyi), altyazılı sürümü `npm run subs -- <slug>` ile yeniden üret.
3. **Başlık:** YouTube başlığının 2–3 önerisini yaz. Her biri 70 karakterden kısa, merak uyandıran ama abartısız ve doğru olsun. Kapağın başlığı video başlığını tekrar etmesin, onu tamamlasın.
4. **Kapaklar:** kanalın seri kimliği `assets/thumbnail-kit/kit.js`'de. Başındaki kullanım yorumunu oku ve ona uy.
   - Her kapak aynı ızgarayı, kanal işaretini ve kategori rengini taşır. Hepsi aynı serinin parçası gibi durmalı, her biri de tek başına şık olmalı.
   - Filmin klasöründe `thumbnail.html` yoksa yaz: `?v=1` **ana kapak**, `?v=2` ve `?v=3` A/B denemesi için alternatifler.
   - Ana görsel filmin kendi karesinden ya da kendi kodundan gelir. Filmin ekrandaki yazıları kapağa girmemeli.
   - Başlık 2–4 kelime olmalı ve 168×94'lük mobil önizlemede de okunmalı. Sağ alt köşe (YouTube'un süre rozeti) boş kalmalı.
   - Üret: `npm run thumbnail -- <slug>`. Kareleri tam boyda ve 168×94'e küçültülmüş hâlde incele; zayıfsa yeniden yap.
5. **YouTube metni:** `youtube.txt` şunları içerir:
   - başlık önerileri,
   - 2–3 cümlelik açıklama,
   - bölüm listesi,
   - `RESEARCH.md`'den kısa bir kaynak listesi,
   - canlı sayfa bağlantısı (`https://eyupduran.github.io/animasyon-lab/<slug>/`),
   - 10–15 etiket.
6. **Doğruluk:** anlatımdaki ve kapaktaki her sayı `RESEARCH.md`'de mi? Bulunamayanları listele.
7. **Masaüstü klasörü:** `C:\Users\Eyüp\Desktop\YouTube\<slug>\` klasörüne şunları koy:
   - `<slug>.mp4` ve `<slug>-altyazili.mp4`
   - `<slug>.srt`
   - `bolumler.txt`
   - `kapak.jpg` (ana kapak), `kapak-2.jpg`, `kapak-3.jpg`
   - `youtube.txt`

   Klasörde eski dosyalar varsa üzerine yaz; artık kullanılmayan eski kapakları sil. İki MP4'ü de `ffprobe` ile denetle (süre, ses akışı).
8. **Kayıt:**
   - Filmin `thumbnail.html`'ini, kapak için eklenen dosyaları ve `youtube.txt`'yi commit'le ve push et.
   - MP4'ler git'e girmez (`renders/`).

## Son mesaj

Masaüstü klasörü ve içindekiler, süre, başlık önerileri, ana kapağın ne gösterdiği, bulunan kusurlar ve doğruluk listesi.
