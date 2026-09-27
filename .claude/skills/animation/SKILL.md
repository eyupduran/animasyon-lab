---
name: animation
description: Anlatımlı bir film yapar (belgesel, tarih, coğrafya, bilim, yazılım…): araştırma, türüne uygun anlatım, yerel ses ve filmin kendisi. Görsel ve teknik kararların tamamı modele aittir.
argument-hint: <konu, ör. "bal arısının bir günü, belgesel" ya da "İpek Yolu, tarih">
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Boşsa "Hangi konuda film yapayım?" diye sor ve dur.

Yapabileceğin en etkileyici filmi yap. Hikâyeyi, görsel dili, tekniği, kamerayı, süreyi (genelde 6–10 dakika) ve yapıyı sen seç. İlk akla gelen sıradan çözümle yetinme: önce birkaç fikri kısaca tart, videoda en güçlü görünecek ve konuyu en doğru anlatacak olanı seç, sonra onu bitmiş bir filme dönüştür. Hareketli slayt gösterisi değil; sahneleme, zamanlama ve davranışı olan bir film. Sinematik ve estetik seçimler sonuçta görülsün. Soru sorma; karar ver.

Şart olan yalnızca `CLAUDE.md`'dekiler. Sıra:

1. **Araştır** → `RESEARCH.md` (kaynak adı, adresi, verdiği bilgi; şaşırtan şeyler ve yaygın yanlışlar).
2. **Anlatımı yaz**: `.claude/skills/narration/SKILL.md` ve konunun tür dosyası. Metin türünün diliyle, doğal Türkçe.
3. **Sesi üret**: `narration/lines.json` → `npm run voice -- <slug>`; aracın listelediği şüpheli satırları düzelt.
4. **Filmi yap.** Tamamen serbestsin. Kendi işine acımasız bir göz ile bak: kareleri çıkarıp incele, zayıf bulduğunu yeniden yap.
5. `npm run video -- <slug> --from 30 --to 45` ile kısa bir deneme al; görüntü ve ses yerindeyse bitti.

Bitince kullanıcıya filmi nasıl izleyeceğini, ne yaptığını ve neden öyle yaptığını kısaca anlat. Commit, kapak, README, test ve yayın bu oturumun işi değil (`/package`).
