---
name: script
description: Anlatımlı bir filmin metin oturumu: konuyu araştırır, türünün diliyle anlatım metnini yazar ve yerel araçla Türkçe sesini üretir. Görüntü hakkında karar vermez; film ayrı oturumda yapılır.
argument-hint: <konu ve tür, ör. "lazer yazıcı nasıl çalışır, teknoloji" ya da "İpek Yolu, tarih">
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Boşsa "Hangi konuda film yapacağız?" diye sor ve dur.

Bu oturumun işi filmin **sözü ve sesi**. Filmin nasıl görüneceğine karar verme, görsel tarif yazma, kod yazma; onlar film oturumunun işi.

1. **Klasör:** `npm run new -- <kategori>/<slug> "<Başlık>"` (İngilizce kategori ve slug).
2. **Araştır** (internetten, güvenilir kaynaklar) → `RESEARCH.md`: kaynak adı, adresi, verdiği bilgi; ayrıca şaşırtan şeyler ve yaygın yanlışlar. Her sayı, tarih ve ad bir kaynağa dayansın; emin olunmayan yuvarlak ve temkinli söylensin.
3. **Anlatımı yaz:** önce `.claude/skills/narration/SKILL.md` ve konunun tür dosyasını (`formats/`) oku. Metin türünün diliyle, doğal Türkçe, insan yazmış gibi. Süre genelde 6–10 dakika; konu neyi gerektiriyorsa. Görüntünün konuşacağı yerlerde sus: anlatım her saniyeyi doldurmasın.
4. **Sesi üret:** `narration/lines.json` (biçimi `CLAUDE.md`'de; bölüm başına tek satır) → `npm run voice -- <slug>`. Aracın şüpheli bulduğu cümleleri düzeltip yeniden üret.
5. **Okunacak metin:** `NARRATION.md`: bölüm bölüm yazılı metin ve her bölümün süresi.

Bitince kullanıcıya şunları söyle: toplam süre, bölümler, seslerin yeri (dinlemesi için), emin olmadığın bilgiler. Sonraki adım: kullanıcı metni onaylayınca **yeni bir oturumda** `/animation <slug>`.
