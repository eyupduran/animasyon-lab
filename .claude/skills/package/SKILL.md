---
name: package
description: Bitmiş bir filmi yayına hazırlar (video, altyazı, bölüm listesi, kapaklar, YouTube metni ve masaüstü klasörü, README, site, commit ve push). Filmin görüntüsüne dokunmaz.
argument-hint: <slug>
disable-model-invocation: true
---

Paketlenecek film: **$ARGUMENTS**

Bu iş filmin **görünümünü değiştirmez.** Kusur görürsen düzeltme; son mesajında listele. Amaç, serbestçe yapılmış filmi kanala hazır hâle getirmek. Yalnızca bu dosyayı, filmin kendi klasörünü ve adı geçen araçları kullan; başka filmleri, `docs/` klasörünü ya da eski notları açma.

## Adımlar

1. **Sözleşme:** sayfa `?video=1` ile `window.__film` sunuyor mu (`duration`, `renderAt`; varsa `narration`, `chapters`, `sound`)? Eksikse yalnızca bu küçük bağlayıcıyı ekle.
2. **Saflık:** `npm run verify -- <slug>` üç kez. Başarısızsa nedeni bul (rastgelelik, kare sayacı, sıfırlanmayan durum, geç yüklenen kaynak); filmin görünümünü değiştirmeden düzelt.
3. **Video:** `npm run video -- <slug>` → `renders/<slug>.mp4`, `<slug>-altyazili.mp4` (altyazı görüntüye basılı), `.srt`, `-chapters.txt`. Videoyu izle (kareler çıkar): siyah kare, kayık ses, taşan yazı var mı? Altyazılı sürümden de birkaç kare çıkar: altyazı okunuyor mu, ekrandaki yazılarla çakışıyor mu? Ses düzeyi: tepe ≈ −1 dB, anlatım müziğin belirgin üstünde (`--music -8` ayarı). MP4'ü sonradan değiştirirsen (ör. ses düzeyi), altyazılı sürümü `npm run subs -- <slug>` ile yeniden üret.
4. **Doğruluk:** anlatımdaki her sayı `RESEARCH.md`'de mi? Bulunamayanları listele.
5. **Kapaklar:** `thumbnail.html` + `npm run thumbnail -- <slug>` (5 konsept; kanal kimliği `assets/thumbnail-kit`; ana görsel filmin kendi karesinden ya da koduyla). `poster.jpg` (16:9, filmin en güçlü karesi).
6. **Belgeler:** filmin `README.md` (ne anlattığı, bölümler, nasıl çalıştırılır, kaynak özeti), kök `README.md` tablosuna satır, `COST.md`.
7. **YouTube paketi:** `youtube.txt` (70 karakterden kısa 2–3 başlık önerisi; 2–3 cümlelik açıklama, bölüm listesi, `RESEARCH.md`'den kısa kaynak listesi, canlı sayfa bağlantısı; 10–15 etiket). Masaüstüne kopyala: `C:\Users\Eyüp\Desktop\YouTube\<slug>\` → `<slug>.mp4`, `<slug>-altyazili.mp4`, `<slug>.srt`, `bolumler.txt`, `kapak-1…5.jpg`, `youtube.txt`. İki MP4'ü de `ffprobe` ile denetle (süre, ses akışı).
8. **Site ve yayın:** kökte `npm run build -- <slug>`; Türkçe commit; `main`'e push; canlı adresi doğrula (`https://eyupduran.github.io/animasyon-lab/<slug>/`).

## Son mesaj

Canlı adres, masaüstü klasörü ve dosyaları, süre, bulunan kusurlar (düzeltilen ve kullanıcıya bırakılan), doğruluk listesi.
