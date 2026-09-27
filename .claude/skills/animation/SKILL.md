---
name: animation
description: Metni ve sesi hazır bir filmi yapar (belgesel, tarih, coğrafya, bilim, teknoloji, yazılım…). Görsel ve teknik kararların tamamı modele aittir.
argument-hint: <slug> [isteğe bağlı: kullanıcının kendi isteği]
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Filmin klasöründe (`animations/<kategori>/<slug>/`) anlatım hazır: `NARRATION.md` (metin), `RESEARCH.md` (bilgiler), `narration/manifest.json` (her kaydın süresi ve kelime zamanları), sesler `public/voice/`. Klasör ya da anlatım yoksa kullanıcıya önce `/script <konu>` çalıştırmasını söyle ve dur.

Bu anlatımın filmini yap; yapabileceğin en etkileyici filmi. Görsel dili, tekniği, kamerayı ve yapıyı sen seç. İlk akla gelen sıradan çözümle yetinme: önce birkaç fikri kısaca tart, videoda en güçlü görünecek ve konuyu en doğru anlatacak olanı seç, sonra onu bitmiş bir filme dönüştür. Hareketli slayt gösterisi değil; sahneleme, zamanlama ve davranışı olan bir film. Sinematik ve estetik seçimler sonuçta görülsün. Soru sorma; karar ver.

Görüntü sesi izler: olaylar anlatımdaki kelimelerin zamanına denk gelsin. Anlatım bir başlangıçtır, kafes değil: görsel fikrin gerektiriyorsa bir bölümün metnini değiştirip sesini yeniden üretebilirsin (`npm run voice -- <slug>`); bilgiler `RESEARCH.md`'ye sadık kalsın.

Kendi işine acımasız bir gözle bak: kareleri çıkarıp incele, zayıf bulduğunu yeniden yap. Sonunda `npm run video -- <slug> --from 30 --to 45` ile kısa bir deneme al; görüntü ve ses yerindeyse bitti.

Şart olan yalnızca `CLAUDE.md`'dekiler. Bitince kullanıcıya filmi nasıl izleyeceğini, ne yaptığını ve neden öyle yaptığını kısaca anlat. Commit, kapak, README, test ve yayın bu oturumun işi değil (`/package`).
