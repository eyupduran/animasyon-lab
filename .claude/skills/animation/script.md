# Metin aşaması

Bu aşamanın işi filmin **sözü ve sesi**. Filmin nasıl görüneceğine karar verme, görsel tarif yazma, kod yazma; onlar film aşamasının işi.

1. **Klasör:** `npm run new -- <kategori>/<slug> "<Başlık>"` (İngilizce kategori ve slug).
2. **Araştır** (internetten, güvenilir kaynaklar) → `RESEARCH.md`: kaynak adı, adresi, verdiği bilgi; ayrıca şaşırtan şeyler ve yaygın yanlışlar. Her sayı, tarih ve ad bir kaynağa dayansın; emin olunmayan yuvarlak ve temkinli söylensin.
3. **Anlatımı yaz:** önce `.claude/skills/narration/SKILL.md` ve konunun tür dosyasını (`formats/`) oku. Metin türünün diliyle, doğal Türkçe, insan yazmış gibi. Süre genelde 6–10 dakika; konu neyi gerektiriyorsa. Görüntünün konuşacağı yerlerde sus: anlatım her saniyeyi doldurmasın.
4. **Sesi üret:** `narration/lines.json` (biçimi `CLAUDE.md`'de; bölüm başına tek satır) → `npm run voice -- <slug>`. Aracın şüpheli bulduğu cümleleri düzeltip yeniden üret.
5. **Okunacak metin:** `NARRATION.md`: bölüm bölüm yazılı metin ve her bölümün süresi.

Son mesajın: slug, klasör, toplam süre, bölümler, emin olmadığın bilgiler.
