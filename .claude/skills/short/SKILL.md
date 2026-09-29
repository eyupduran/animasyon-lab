---
name: short
description: Sözsüz ya da az sözlü kısa filmi (30–90 saniye) tek istekle baştan sona yapar ve sitede video gibi oynayacak şekilde yayınlar; hikâye, karakter, görsel dil ve teknik tamamen filmi yapan modele aittir.
argument-hint: <fikir ya da brief; boş bırakılabilir>
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Kullanıcı tek istek verir ve bitmiş, yayınlanmış filmi bekler; arada soru sorma, onay bekleme. Bu komutu çalıştırmak commit ve push için onaydır.

Sen **yürütücüsün**: işi iki aşamada, sırayla, ayrı yardımcı ajanlara (Agent aracı, genel amaçlı, ön planda) verirsin. Aşamaları kendin yapma.

1. **Film ajanı.** Görevi aşağıdaki brief, kelimesi kelimesine; istek boş değilse brief'in başına kullanıcının isteğini koy. **Başka hiçbir şey ekleme:** stil, teknik, önceki filmlerden söz, kendi fikrin yok.
2. **Yayın ajanı.** Görevi: "`.claude/skills/animation/publish.md` dosyasını oku ve `<slug>` için uygula."

Agent aracı yoksa aşamaları bu sırayla kendin yap; yayın dosyasını film bitmeden okuma.

Son mesajın: canlı adres (sitede video gibi oynar), süre ve filmi yapanın kendi anlatımıyla ne yapıldığı.

## Brief (film ajanına)

Yapabileceğin en etkileyici kısa kod animasyonunu üret. Hikâye, karakter, görsel dil ve süreyi sen seç. Sözsüz izleyen biri başlangıç, değişim ve sonucu anlayabilsin; güçlü bir doruk anı olsun. Hareketli slayt gösterisi yerine sahneleme, zamanlama ve karakter/nesne davranışı olan bitmiş bir kısa film istiyorum.

Yaratıcı seçimler senin: sahne, sanat yönü, kamera, mekanik, teknoloji ve etkileşimi önceden belirlenmiş sıradan kalıplara sıkıştırma. İlk akla gelen sıradan web demosuyla yetinme: önce kendi alanında birkaç fikri kısaca tart, videoda en güçlü görünecek özgün olanı seç, sonra onu çalışan bir ürüne dönüştür. Konuyu olduğundan kolay gösteren dekoratif taklit kabul edilmez. Sinematik ve estetik seçimler sonuçta görülsün.

Şart olan yalnızca `CLAUDE.md`'dekiler (yalnızca kod; `window.__film`). Klasör: `npm run new -- short/<slug> "<Başlık>"`. Kendi işine acımasız bir gözle bak: kareleri çıkarıp incele, zayıf bulduğunu yeniden yap. Commit, kapak, README, test ve yayın senin işin değil. Son mesajın: slug, ne yaptığın, neden öyle yaptığın.
