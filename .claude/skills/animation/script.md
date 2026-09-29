# Metin aşaması

Bu aşamanın işi filmin **sözü ve sesi**. Filmin nasıl görüneceğine karar verme, görsel tarif yazma, kod yazma; onlar film aşamasının işi.

1. **Klasör.** Yeni film kanal filmidir ve `youtube/` altına açılır: `npm run new -- youtube/<kategori>/<slug> "<Başlık>"`. Kategori ve slug İngilizce; istekte verilmişse onları kullan. Yalnızca istek bunun bir deneme ya da test olduğunu söylüyorsa `animations/` altına aç: `npm run new -- <kategori>/<slug> "<Başlık>"`.
2. **Araştır** (internetten, güvenilir kaynaklar) → `RESEARCH.md`: kaynak adı, adresi, verdiği bilgi; ayrıca şaşırtan şeyler ve yaygın yanlışlar. Her sayı, tarih ve ad bir kaynağa dayansın; emin olunmayan yuvarlak ve temkinli söylensin.
   - **Konu Türk tarihiyse** (Türkler, Selçuklu, Osmanlı, Cumhuriyet, Türkiye'nin savaşları ve antlaşmaları): izleyici Türkiye'de ve bu konuyu okulda öğrendi. Anlatıyı Türkiye'deki akademik tarih yazımına dayandır. Kurallar `.claude/skills/narration/formats/history.md` → "Türk tarihi anlatırken" bölümünde; araştırmaya başlamadan önce oku.
   - Herkesi ilgilendiren konularda (teknoloji, bilim, coğrafya, dünya tarihi) kaynak dili serbesttir.
3. **Anlatımı yaz.** Önce `.claude/skills/narration/SKILL.md` ve konunun tür dosyasını (`formats/`) oku. Metin türünün diliyle, doğal Türkçe, insan yazmış gibi.
   - **Sade olsun.** Günlük Türkçe, kısa cümle, az terim, az sayı. Bir cümlede bir fikir. Lise öğrencisi de babası da aynı anda anlasın.
   - **Sıkmasın.** Bilgi yığma; her bölüm bir soruyla açılsın, bir cevapla kapansın. Konuyla ilgili her şeyi anlatmaya çalışma, en ilginç olanı seç.
   - Süre istekte verilmişse ona uy; verilmemişse genelde 6–10 dakika. Görüntünün konuşacağı yerlerde sus: anlatım her saniyeyi doldurmasın.
   - Bitince metni baştan sona sesli oku. Ağır, ders gibi ya da sıkıcı duran yeri yeniden yaz.
4. **Sesi üret:** `narration/lines.json` (biçimi `CLAUDE.md`'de; bölüm başına tek satır) → `npm run voice -- <slug>`. Aracın şüpheli bulduğu cümleleri düzeltip yeniden üret.
5. **Okunacak metin:** `NARRATION.md`: bölüm bölüm yazılı metin ve her bölümün süresi.

Son mesajın: slug, klasör, toplam süre, bölümler, emin olmadığın bilgiler.
