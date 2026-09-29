---
name: youtube
description: Sitede yayınlanmış bir filmin YouTube paketini eksiksiz hazırlar. Altyazılı ve altyazısız MP4, .srt, bölümler, kanal kimliğinde kapak, seçilmiş başlık, yapıştırılmaya hazır açıklama, etiketler, oynatma listesi, yayın zamanı ve yükleme ayarları; hepsi masaüstündeki YouTube klasörüne gider. Filmin görüntüsüne dokunmaz.
argument-hint: <slug>
disable-model-invocation: true
---

Film: **$ARGUMENTS**

Boşsa `npm run plan -- next` çıktısındaki "filmi hazır, yayın bekleyenler" listesini göster, "Hangisinin YouTube paketini hazırlayayım?" diye sor ve dur.

Bu komutu çalıştırmak, bu film için commit ve push onayıdır. Arada soru sorma.

**Kullanıcıya seçim bırakma.** Başlığı sen seç, kapağı sen seç, açıklamayı yapıştırılacak hâlde yaz. Kullanıcı klasörü açıp dosyaları YouTube'a yükleyecek, metinleri kopyalayacak; başka hiçbir şeyle uğraşmayacak. Yedekler dosyanın sonunda durur.

Filmin **görünümünü değiştirme.** Kusur görürsen düzeltme, son mesajında listele. Yalnızca bu dosyayı, filmin kendi klasörünü, `assets/thumbnail-kit/` klasörünü ve adı geçen araçları kullan; başka filmleri, `docs/` ve `channel/` klasörlerini açma.

## Adımlar

1. **Video:**
   - `npm run video -- <slug>` şunları üretir (hepsi filmin `renders/` klasöründe):
     - `<slug>.mp4`: temiz görüntü; YouTube'da altyazı `.srt`'den CC ile açılır. **Yüklenecek dosya budur.**
     - `<slug>-altyazili.mp4`: altyazı görüntüye basılı (başka yerlerde paylaşmak için).
     - `<slug>.srt`
     - `<slug>-chapters.txt`
   - Altyazı sesle ilerler: en fazla iki satırlık parça baştan yerleşir, kelimeler söylendikçe tek tek belirir. Görünüşü sitedeki oynatıcıyla aynıdır (`tools/lib/film.mjs` → `CUE`, `SUB_STYLE`).
   - Uzun iştir, arka planda çalıştır ve bitmesini bekle.
2. **Denetim:**
   - İki videodan da kareler çıkar. Siyah kare, kayık ses ya da taşan yazı var mı?
   - Altyazı okunuyor mu, filmin ekrandaki yazılarıyla çakışıyor mu?
   - Ses düzeyini ölç: tepe yaklaşık −1 dB olmalı. Anlatım müziğin belirgin üstünde olmalı (`--music -8` ayarı).
   - MP4'e sonradan dokunursan (ör. ses düzeyi), altyazılı sürümü `npm run subs -- <slug>` ile yeniden üret.
3. **Çizelge bilgisi:** `npm run plan -- show <slug>`. Film çizelgedeyse yayın günü, saati ve serisi buradan gelir. Çizelgede yoksa yayın zamanını boş bırak, oynatma listesi olarak filmin kategorisini yaz.
4. **Başlık:** üç aday yaz, en iyisini **sen seç.**
   - 70 karakterden kısa. İzleyicinin arayacağı sözcükler başta ("Osmanlı nasıl kuruldu?", "GPS nasıl çalışır?").
   - Merak uyandırır ama abartmaz; filmde karşılığı olmayan söz vermez. Büyük harfle bağırma, ünlem yığma yok.
   - Kapağın yazısı başlığı tekrar etmesin, onu tamamlasın.
5. **Kapaklar:** tarz "büyük nesne, kısa dev yazı". Kanal kimliği `assets/thumbnail-kit/kit.js`'de; başındaki kullanım yorumunu oku ve ona uy. Bütün kapaklar aynı kimliği taşır, kanal sayfasında yan yana durduklarında bir seri gibi görünür.
   - Filmin klasöründe `thumbnail.html` yoksa yaz: `?v=1` **ana kapak**, `?v=2` ve `?v=3` farklı fikirlerle yedekler.
   - Ana görsel konunun kendisi olan tek, büyük, parlak, net bir nesnedir (yazıcı, arı, sur, gemi…). Filmde böyle bir kare yoksa kapak için kodla ayrıca çiz; filmin kodundan parça alınabilir.
   - Kapak yazısı konuyu doğrudan söyler, 2–3 kelime: "YAZICI NASIL ÇALIŞIR?" gibi.
   - Yasak: soyut film kareleri ve konuyu söylemeyen zekice yazılar ("GRİ YOK" gibi). Küçük açıklama yazısı da yok.
   - Üret: `npm run thumbnail -- <slug>`. Kareleri tam boyda ve 168×94'e küçültülmüş hâlde incele. Sor: "Gören biri konuyu anında anlar mı?" Anlamıyorsa yeniden yap. Sağ alt köşe (süre rozeti) boş kalmalı.
   - Üçünden en iyisini ana kapak yap (`kapak.jpg`).
6. **Doğruluk:** anlatımdaki, başlıktaki ve kapaktaki her sayı `RESEARCH.md`'de mi? Bulunamayanları listele.
7. **YouTube metni:** filmin klasörüne `youtube.txt`. Biçim her filmde aynı; kullanıcı yukarıdan aşağı kopyalar:

   ```
   BAŞLIK
   <seçilen başlık>

   AÇIKLAMA
   <2–3 cümle: filmin sorusu ve izleyicinin ne göreceği. İlk cümle arama sonucunda görünür; konuyu söylesin.>

   Bölümler
   0:00 <…>
   <renders/<slug>-chapters.txt içeriği>

   Kaynaklar
   - <RESEARCH.md'den en önemli 4–6 kaynak: ad ve adres>

   Tarayıcıda izle: https://eyupduran.github.io/animasyon-lab/<slug>/
   Bütün filmler: https://eyupduran.github.io/animasyon-lab/kanal/

   Görüntüler kodla çizildi, anlatım bilgisayar sesiyle yapıldı.

   ETİKETLER
   <10–15 etiket, virgülle ayrılmış, en önemlisi başta>

   OYNATMA LİSTESİ
   <serinin adı>

   YAYIN ZAMANI
   <gün, tarih, saat; ör. "Pazar, 4 Ekim 2026, 19.00">

   YÜKLEME AYARLARI
   Video: <slug>.mp4
   Kapak: kapak.jpg
   Altyazı: <slug>.srt (dil: Türkçe)
   Video dili: Türkçe
   Kategori: Eğitim
   Kitle: çocuklara özel değil
   Değiştirilmiş içerik: hayır (animasyon; gerçek bir kişi ya da olay taklit edilmiyor)

   İLK YORUM (sabitle)
   <izleyiciye tek soru; film çizelgedeyse sıradaki videonun konusunu haber ver>

   YEDEKLER
   Başlık 2: <…>
   Başlık 3: <…>
   Kapak 2: kapak-2.jpg, Kapak 3: kapak-3.jpg (YouTube'un "test et ve karşılaştır" özelliği için)
   ```
8. **Masaüstü klasörü:** `C:\Users\Eyüp\Desktop\YouTube\<slug>\` klasörüne şunları koy:
   - `<slug>.mp4` ve `<slug>-altyazili.mp4`
   - `<slug>.srt`
   - `bolumler.txt`
   - `kapak.jpg` (ana kapak), `kapak-2.jpg`, `kapak-3.jpg`
   - `youtube.txt`

   Klasörde eski dosyalar varsa üzerine yaz; artık kullanılmayan eski kapakları sil. İki MP4'ü de `ffprobe` ile denetle (süre, ses akışı).
9. **Kayıt:**
   - Film yayın çizelgesindeyse durumunu işle: `npm run plan -- set <slug> status=packaged`, ardından `npm run plan -- build`. Çizelgede yoksa komut bunu söyler; yapılacak bir şey yoktur.
   - Filmin `thumbnail.html`'ini, kapak için eklenen dosyaları, `youtube.txt`'yi ve `channel/` değişikliklerini commit'le ve push et.
   - MP4'ler git'e girmez (`renders/`).

## Son mesaj

Kısa tut: masaüstü klasörünün yolu, seçilen başlık, ana kapağın ne gösterdiği, yayın zamanı, videonun süresi. Ardından, varsa, bulunan kusurlar ve `RESEARCH.md`'de bulunamayan sayılar.
