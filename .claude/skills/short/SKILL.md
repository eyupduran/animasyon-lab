---
name: short
description: Sözsüz ya da az sözlü kısa film yapar (30–90 saniye); hikâye, karakter, görsel dil ve teknik tamamen modele aittir.
argument-hint: <fikir ya da brief; boş bırakılabilir>
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Boşsa brief şudur:

Yapabileceğin en etkileyici kısa kod animasyonunu üret. Hikâye, karakter, görsel dil ve süreyi sen seç. Sözsüz izleyen biri başlangıç, değişim ve sonucu anlayabilsin; güçlü bir doruk anı olsun. Hareketli slayt gösterisi yerine sahneleme, zamanlama ve karakter/nesne davranışı olan bitmiş bir kısa film istiyorum.

Yaratıcı seçimler senin: sahne, sanat yönü, kamera, mekanik, teknoloji ve etkileşimi önceden belirlenmiş sıradan kalıplara sıkıştırma. İlk akla gelen sıradan web demosuyla yetinme: önce kendi alanında birkaç fikri kısaca tart, videoda en güçlü görünecek özgün olanı seç, sonra onu çalışan bir ürüne dönüştür. Konuyu olduğundan kolay gösteren dekoratif taklit kabul edilmez. Sinematik ve estetik seçimler sonuçta görülsün.

Şart olan yalnızca `CLAUDE.md`'dekiler (yalnızca kod; `window.__film`). Klasör: `animations/short/<slug>/`. Bitince `npm run video -- <slug>` ile videoyu al ve kullanıcıya filmi nasıl izleyeceğini söyle. Commit, kapak, README, test ve yayın bu oturumun işi değil (`/package`).
