---
name: package
description: Bitmiş ve kullanıcının izleyip onayladığı bir filmi yayına hazırlar (video, altyazı, bölüm listesi, kapaklar, README, site, commit ve push). Film oturumundan ayrı çalışır; filmin görüntüsüne dokunmaz.
argument-hint: <slug>
disable-model-invocation: true
---

Paketlenecek film: **$ARGUMENTS**

Bu iş filmin **görünümünü değiştirmez.** Kusur görürsen düzeltme; listele ve kullanıcıya sor. Amaç, serbestçe yapılmış filmi kanala hazır hâle getirmek.

## Adımlar

1. **Sözleşme:** sayfa `?video=1` ile `window.__film` sunuyor mu (`duration`, `renderAt`; varsa `narration`, `chapters`, `sound`)? Eksikse yalnızca bu küçük bağlayıcıyı ekle.
2. **Saflık:** `npm run verify -- <slug>` üç kez. Başarısızsa nedeni bul (rastgelelik, kare sayacı, sıfırlanmayan durum, geç yüklenen kaynak); filmin görünümünü değiştirmeden düzelt.
3. **Video:** `npm run video -- <slug>` → `renders/<slug>.mp4`, `.srt`, `-chapters.txt`. Videoyu izle (kareler çıkar): siyah kare, kayık ses, taşan yazı var mı? Ses düzeyi: tepe ≈ −1 dB, anlatım müziğin belirgin üstünde (`--music -8` ayarı).
4. **Doğruluk:** anlatımdaki her sayı `RESEARCH.md`'de mi? Bulunamayanları listele.
5. **Kapaklar:** `thumbnail.html` + `npm run thumbnail -- <slug>` (5 konsept; kanal kimliği `assets/thumbnail-kit`; ana görsel filmin kendi karesinden ya da koduyla). `poster.jpg` (16:9, filmin en güçlü karesi).
6. **Belgeler:** filmin `README.md` (ne anlattığı, bölümler, nasıl çalıştırılır, kaynak özeti), kök `README.md` tablosuna satır, `ref/style-ledger.md`'ye beş satırlık kimlik özeti (yalnızca kayıt için; film oturumlarında okunmaz), `COST.md`.
7. **Site ve yayın:** kökte `npm run build -- <slug>`; Türkçe commit; `main`'e push; canlı adresi doğrula (`https://eyupduran.github.io/animasyon-lab/<slug>/`).
8. **Web sürümü (isteğe bağlı):** kullanıcı filmi sitede de izletmek isterse ve film zayıf makinede ağır kalıyorsa, görünümü bozmadan çözünürlük düşürme gibi hafifletmeler; ayrıntı `ref/craft.md` → Performans.

## Başvuru dosyaları (`ref/`, yalnızca gerektiğinde)

Önceki çalışmalardan birikmiş teknik notlar: `craft.md` (teknikler, performans), `pitfalls.md` (tuzaklar), `critique.md` (kusur listeleri), `pipeline-tech.md`, `documentary-tech.md`, `formats/` (tür kartları), `style-ledger.md`. Bunlar **film oturumlarında okunmaz**; paketleme ve denetimde başvuru içindir. Yeni tuzakları `pitfalls.md`'ye ekle.

## Son mesaj

Canlı adres, video dosyasının yeri, süre, bulunan kusurlar (düzeltilen ve kullanıcıya bırakılan), doğruluk listesi.
