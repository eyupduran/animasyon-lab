---
name: animation
description: Anlatımlı bir filmi tek istekle baştan sona yapar ve yayınlar (belgesel, tarih, coğrafya, bilim, teknoloji, yazılım…): metin ve ses, film, paket. Her aşama temiz bir yardımcı ajanda çalışır; görsel ve teknik kararların tamamı filmi yapan modele aittir.
argument-hint: <konu ve istek, ör. "bal arısının bir günü, belgesel">
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Boşsa "Hangi konuda film yapayım?" diye sor ve dur.

Kullanıcı tek istek verir ve bitmiş, yayınlanmış filmi bekler; arada soru sorma, onay bekleme. Bu komutu çalıştırmak commit ve push için onaydır.

Sen **yürütücüsün**: işi üç aşamaya bölüp her birini sırayla, ayrı bir yardımcı ajana (Agent aracı, genel amaçlı, ön planda) verirsin. Aşamaları kendin yapma ve aşama dosyalarını kendin okuma; amaç, filmi yapan ajanın yalnızca kendi işini bilen temiz bir bağlamla çalışmasıdır.

1. **Metin ajanı.** Görevi: "`.claude/skills/animation/script.md` dosyasını oku ve uygula." + kullanıcının isteği, kelimesi kelimesine.
2. **Film ajanı.** Görevi: "`.claude/skills/animation/film.md` dosyasını oku ve uygula. Film: `<slug>`." + kullanıcının isteği, kelimesi kelimesine. **Başka hiçbir şey ekleme:** stil, teknik, kamera, renk, paket önerisi, önceki filmlerden söz, kendi fikrin yok.
3. **Paket ajanı.** Görevi: "`.claude/skills/package/SKILL.md` dosyasını oku ve `<slug>` için uygula."

Bir ajan işi bitirmeden dönerse (hata, yarım iş) aynı ajana devam etmesini söyle; filmi kendin düzeltmeye kalkma. Agent aracı yoksa aşamaları bu sırayla kendin yap ve her aşamanın dosyasını yalnızca o aşamaya gelince oku.

Son mesajın: canlı adres, video ve YouTube klasörünün yeri, süre, filmi yapanın kendi anlatımıyla ne yapıldığı, kullanıcıya bırakılan kusurlar ve emin olunmayan bilgiler.
