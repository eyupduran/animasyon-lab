---
name: animation
description: Yeni eğitim animasyonu yapar (araştırma, anlatım, ses, altyazı, test, commit ve push)
argument-hint: <konu ve istekler, ör. "telefonun içi nasıl çalışır, ortaokul, 5 dk">
disable-model-invocation: true
---

Kullanıcının isteği:

> $ARGUMENTS

İstek boşsa yalnızca "Hangi konuda animasyon yapayım?" diye sor ve dur. Doluysa aşağıdakileri uygula.

## Ne yapacaksın

`prompts/new-animation.md` dosyasını baştan sona oku ve uygula; `CLAUDE.md` kuralları geçerlidir. İsteği o dosyadaki "İSTEK" alanlarına çevir:

- **Konu:** istekte ne yazıyorsa. Kısa yazılmış olabilir ("telefon simülasyonu yap" gibi). Bunu "telefonun nasıl çalıştığını anlatan eğitim animasyonu" diye anla. "Simülasyon", "oyun", "harita" gibi sözcükler tür ya da his ipucudur; anlatım, ses ve altyazılı bir animasyon yine yapılır.
- **Video türü (format):** belgesel, açıklayıcı, yazılım, tarih ya da çocuklar için. İstekte yazmıyorsa konuya ve kitleye göre sen seç (doğa ve canlılar → belgesel; "nasıl/neden" soruları → açıklayıcı; bir teknolojinin içi → yazılım; olaylar ve dönemler → tarih; ilkokul → çocuklar). Tür, anlatımın sesini ve kamera dilini belirler; görsel stili (renk, yazı tipi, teknik) belirlemez.
- **Hedef kitle, süre, his, anlatıcı sesi:** istekte yoksa konuya göre sen seç. Süre verilmediyse konunun gerektirdiği kadar olsun (genelde 5–7 dakika).
- **Ek istekler:** istekte başka ne varsa onlar da uygulanır.
- **Kategori:** belgeseller her zaman `documentary` kategorisine girer (`animations/documentary/<slug>/`). Öteki türlerde konuya göre bir klasör seç: biology, history, geography, physics, chemistry, math, space, technology ya da software. Liste ve Türkçe karşılıkları `tools/lib/animations.mjs` → `CATEGORIES` içinde. Hiçbiri uymuyorsa yeni bir İngilizce ad aç ve Türkçe karşılığını listeye ekle. Klasörü `npm run new -- <kategori>/<slug> "<Başlık>"` ile aç; animasyon `animations/<kategori>/<slug>/` altında durur. Araçlara (voice, build, video, thumbnail) yalnızca slug verilir.

Kullanıcı beklemeden çalışmanı istiyor. Soru sorma, mantıklı kararı kendin ver ve sonunda neyi neden seçtiğini kısaca anlat. Her şey kodla; üretken görsel/video/ses modeli yok (`CLAUDE.md` → "Yalnızca kod").

## Kalite çıtası (CLAUDE.md → "Kalite tanımı")

Dört şey birlikte: (1) türe uygun, ucuz görünmeyen görsel dünya; (2) izleyiciyi saran hikâye (açılış sorusu, kahraman, gerilim, ödül); (3) insan yazmış gibi metin (yapay zekâ kalıpları yok, sesli okunup kesilmiş); (4) aynı ses baştan sona + ince ortam sesleri + **hiç donmama**. Bunlardan biri eksikse iş bitmemiştir.

## Yardımcı dosyalar (gerektiğinde oku)

- [craft.md](craft.md): teknik alet çantası. Işık, derinlik, perspektif, doku ve zamanlama teknikleri, "vay" anı kalıpları. Görsel dil ve stil önermez. Sahneleri kodlamaya başlamadan önce oku.
- [pitfalls.md](pitfalls.md): önceki oturumlarda bulunan tuzaklar ve çözümleri. Kodlamaya başlamadan önce oku. İş bitince yeni bulduklarını buraya ekle.
- [critique.md](critique.md): sanat yönetmeni turu. Ekran görüntüsü turlarında uygula.
- [documentary-tech.md](documentary-tech.md): belgesel türünün yeniden kullanılabilir tekniği (oynatıcı, zamanlama, sinema hattı, kalite kademeleri, kamera dili) ve referans uygulama. Belgesel yapıyorsan önce oku.
- [../../../docs/cartoon-style-in-code.md](../../../docs/cartoon-style-in-code.md): kodla çizgi film / düz vektör / kâğıt kesme / toon 3B görünümünün kuralları, karakter animasyonu, "ucuz görünmeme" listesi. Belgesel dışı türlerde önce oku.
- **Anlatım skilli** [../narration/SKILL.md](../narration/SKILL.md): anlatım metnini yazmadan önce oku. Seçilen türün dosyasını (`../narration/formats/<tür>.md`) ve `../narration/retention.md` dosyasını baştan sona uygula; beat sheet'i animasyon klasöründe `NARRATION.md` olarak yaz.

## Her seferinde yapılacaklar (kullanıcı ayrıca söylemese de)

1. **Başlangıç saatini not et:** ilk iş olarak `date "+%Y-%m-%d %H:%M:%S"` çalıştır.
2. İşi `prompts/new-animation.md` dosyasındaki sırayla yap:
   - araştırma (`RESEARCH.md`) ve tasarım kartı (`DESIGN.md`); tasarım kartına seçilen türü yaz,
   - anlatım: `narration` skilliyle beat sheet (`NARRATION.md`) → metin → sesli okuma süresi → %20 kesme,
   - anlatım ve ses (`npm run voice`), şüpheli satırları düzelt,
   - kod,
   - masaüstü ve telefon ekran görüntüleriyle birkaç düzeltme turu,
   - gerçek zamanlı oynatma testi: kayıt ortasında sarma 0, geri gitme 0, konsol hatası yok,
   - **performans:** kalite kademeleri + açılışta otomatik seçim + oynatmada düşürme kurulu; `dev/perftest.mjs` ve `dev/fpstest.mjs` ile her kademede ölç (hedefler `CLAUDE.md` → "Performans"); sonuçları README'ye yaz,
   - bölüm sonu testi (`dev/endtest.mjs fast`): kayıt başa dönmüyor, görüntü donmuyor,
   - CC ve anlatım düğmeleriyle altyazının ve sesin gerçekten kapanıp açıldığını tarayıcıda dene,
   - `critique.md` dosyasındaki eleştiri turları (en az üç tur),
   - `README.md` dosyaları, kök README tablosu ve `poster.jpg`,
   - YouTube'a hazırlık: `?video=1` video arayüzünü eksiksiz kur ve kısa bir `npm run video -- <slug> --from 60 --to 75` denemesiyle doğrula. Video sözleşmesi kök README'de ve `tools/render-video.mjs` içinde. Tam videoyu kullanıcı `/video` ile ister.
   - 5 YouTube kapağı: animasyon klasöründe `thumbnail.html`, `npm run thumbnail -- <slug>`. Kanal kimliği ortak kitten gelir (`assets/thumbnail-kit/kit.js`, `kit.brand(...)`); ana görsel animasyonun kendi konusundan kodla çizilir. Kurallar `.claude/skills/video/SKILL.md` dosyasının 3. adımında. Birkaç tur iyileştir.
   - kökte `npm run build -- <slug>`.
3. **Bu oturumda bulduğun yeni tuzakları** `.claude/skills/animation/pitfalls.md` dosyasına kısa maddeler olarak ekle (belirti → neden → çözüm).
4. **Bitiş saatini not et** ve animasyon klasörüne `COST.md` yaz:
   - başlangıç, bitiş ve süre,
   - kullanılan model, ödeme türü (abonelik),
   - yerel ses üretimi bilgisi.
   
   VS Code eklentisi abonelikte token ve dolar göstermiyor, bu yüzden tahmin yazma. Yalnızca "kullanıcı `/usage` çıktısını verirse eklenecek" diye not düş.
5. **Commit edip `main`'e push et.** Commit mesajı Türkçe olsun; bu komutu çalıştırmak bunun için onay sayılır. `docs/` gibi bu animasyona ait olmayan değişiklikleri commit'e katma.
6. **Son mesaj:** canlı adres (`https://eyupduran.github.io/animasyon-lab/<slug>/`), başlangıç ve bitiş saati, verilen kararların kısa özeti ve bilinen kısıtlar. Kullanıcı isterse `/usage` çıktısını yapıştırabileceğini, o zaman `COST.md`'ye ekleneceğini tek cümleyle söyle.
