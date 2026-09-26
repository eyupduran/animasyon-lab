---
name: short
description: Sözsüz ya da az sözlü, 30–90 saniyelik sinematik kısa film yapar (kodla; hikâye, karakter, görsel dil ve süreyi kendisi seçer). Kullanıcı "kısa film", "sözsüz animasyon", "serbest brief" dediğinde ya da /short yazdığında kullanılır; eğitim anlatımı isteniyorsa /animation kullanılır.
argument-hint: <brief; boş bırakılabilir: "yapabileceğin en etkileyici kısa filmi yap">
disable-model-invocation: true
---

Kullanıcının brief'i:

> $ARGUMENTS

Boşsa şu brief geçerlidir: *"Yapabileceğin en etkileyici kısa kod animasyonunu üret. Hikâye, karakter, görsel dil ve süreyi sen seç. Sözsüz izleyen biri başlangıç, değişim ve sonucu anlayabilsin; güçlü bir doruk anı olsun. Hareketli slayt gösterisi değil; sahneleme, zamanlama ve karakter davranışı olan bitmiş bir kısa film."*

`CLAUDE.md` kuralları geçerli: yalnızca kod (üretken model yok), donma yasak, kalite tanımı. Soru sorma; karar ver, sonunda gerekçeni anlat.

## Bu tür nedir

Bir **kısa film**: tek fikir, tek karakter (ya da tek nesne), tek ortam, tek dönüşüm. 30–90 saniye, 16:9. Anlatım yok ya da en çok bir iki cümle. İzleyici sözsüz şunu anlamalı: **durum → değişim → sonuç**. Doruk anı filmin %60–75'inde gelir ve görsel olarak en güçlü karedir. Referans: `docs/short-film-notes.md` (KOR incelemesi).

## 0. Cazibe kapısı (özgünlükten önce gelir)

İlk deneme ("Karar", müzik kutusu dişi) özgündü ama sevimsizdi: gri metal, karanlık, yüzsüz kahraman, dünyasız. Ders: **özgünlük cazibenin yerine geçmez.** Her fikir şu dördünü sağlamalı; sağlamayan puanlanmaz:
1. **Sevilebilir kahraman:** tanınır bir siluet (uzaktan tek bakışta okunur), bir bakış yönü (göz ya da baş), bir yumuşak eklenti (atkı, kuyruk, anten, pelerin). Cansız nesne kahraman olabilir, ama bu üçü olmadan olmaz.
2. **Dünya:** gökyüzü ya da derinlikli bir mekân, hava (rüzgâr, kar, sis, yağmur, toz), ışığın değiştiği bir gün saati. Kapalı kutu içi, tek masa, tek makine yasak.
3. **Gösteri:** en az bir büyük görsel an (ışık yayılması, su, kar, ölçek sıçraması, kalabalık). Işık dönüşümü **serbesttir**; klişe olan sahne, malzeme değil.
4. **Renk:** iki durumlu palet, ikisi de doygun ve birbirinden uzak (soğuk→sıcak, gri→renk, gece→gün). İki koyu durum olmaz.
**Kapak testi:** filmin en güçlü karesi durağan hâlde bir YouTube kapağı olsa tıklanır mı? Hayırsa fikir elenir.

## 1. Fikir sprinti ve treatment (kodlamadan önce, `TREATMENT.md`)

İlk akla gelen fikir herkesin yapacağı fikirdir ("küp döner, parçacıklar uçuşur"). Bunu yap:
1. **Beş logline** yaz, her biri farklı **ortamda** ve farklı **duygu yayıyla** (yalnızlık→buluşma, korku→cesaret, kayıp→bulma, küçük→büyük, uyku→uyanış). Her logline tek cümle: kim, ne ister, ne değişir. Özgünlük **birleşimden** gelir: tanıdık bir duygu yayı + alışılmadık bir kahraman ya da mekân (ör. bir buz sarkıtı, bir yol işareti, göçmen bir tohum, ıssız bir istasyondaki tabela). Yasak olan sahneler: karlı gecede atkılı yuvarlak yaratık + ışıklanan ağaç, gün doğumunu ilk gören robot, parçacıkların logoya toplanması, yalnız deniz feneri, neon yağmurlu şehir. Yasak olan malzeme **yoktur**: kar, ağaç, ışık, yaratık serbest.
2. Her birini dört ölçütle puanla: **cazibe (×2)** (kapak testi, sevilebilir kahraman, dünya, gösteri), *sözsüz anlaşılır mı* (bir çocuk anlatabilir mi), *videoda en güçlü görünen*, *kodla 1 günde yapılır mı*. Özgünlük bir eleme ölçütüdür (yasak sahneler), puan ölçütü değil.
3. Kazananı seç, gerekçesini yaz. Diğer dördünü de `DESIGN.md`'de bırak.
4. **Treatment:** kazanan fikrin tek sayfası: logline, kimlik kartı, beat listesi. "Treatment'ı değiştirmek bir dakika, filmi değiştirmek bir saat": kod bundan sonra başlar.
5. **Yay:** 5–8 beat'lik bir liste: açılış görüntüsü (durum) → istek → engel → dönüm → doruk → sonuç → son görüntü/başlık. Her beat için: süre, kamera, ışık durumu, ses.
6. **Görsel kimlik:** iki durumlu palet (önce / sonra: ör. mavi-gri gece → altın şafak), yazı tipi (yalnızca başlık kartı), doku (kar, toz, yağmur, polen).

## 2. Karakter

- **Geometrik ve okunur siluet:** küre/kapsül gövde + 1–2 ayırt edici uzuv (kulak, anten, şapka) + **bir yumuşak eklenti** (atkı, kuyruk, pelerin, kablo) yalnızca ikincil hareket için. Yüz: en çok iki göz; ağız yok ya da tek çizgi.
- **Davranış = hareket:** yürüyüş döngüsü (dur-kalk), nefes, göz kırpma, başın bakış yönü, tereddüt (anticipation), koşu öncesi çökme. Duyguyu yüz değil **tempo ve duruş** anlatır (Kurzgesagt kuşları, Pixar'ın Luxo'su).
- Rüzgâr, kar, ışık gibi ortam kuvvetleri karakterin eklentisini oynatır; aynı rüzgâr alanı çimleri ve parçacıkları da oynatır (tek kaynak).

## 3. Dünya ve ışık

- Tek ortam; kamera değişse de yer değişmez. Uzak katman (dağ silueti, gökyüzü), orta (ağaç, kaya), ön (çim, kar) → derinlik.
- **İki ışık durumu** ve aralarında kesintisiz geçiş: dönüşümün kendisi ışıkla anlatılır (gece → gündüz, kül → kor, gri → renk).
- Hacimsel ışık / parıltı: bloom + ışık huzmesi, ama yalnızca doruk anında tam güç.
- Parçacıklar tek bir sistemden (kar, kıvılcım, toz); binlerce parçacık için thin instance ve bölgeleme (`craft.md` → 8).
- Sinema hattı ve kalite kademeleri `documentary-tech.md` tablosundaki gibi kopyalanabilir (`env.js`, `setTier`, `render-video` sözleşmesi).

## 4. Kamera

- 6–12 çekim; her çekim tek bir şeyi söyler. Kesme, dönüş yerine. Yörünge (orbit) yok. **Çekimlerin en az yarısı geniş ya da orta plan** (kahraman + dünya birlikte); makro yalnızca vurgu için.
- Uzun objektif ve alçak açı; karakter kadraja girer/çıkar; yavaş kaydırma; doruk anında bir kez geniş plan.
- Hafif el titremesi; doruk anında 200 ms'lik hızlı push-in ya da kısa ağır çekim.
- Başlık kartı en sonda, tek kelime, geniş harf aralığı, siyah üstüne.

## 5. Ses (Web Audio, kodla)

- Ortam katmanı (rüzgâr/yağmur/uğultu) + karakter sesleri (adım, atkı hışırtısı) + doruk anında tek bir "vuruş" ve yükselen pad + sonda sessizlik. `sound.js` yaklaşımı (hem canlı hem `OfflineAudioContext`).
- Ses görüntüden 100–200 ms önce gelmez; vuruş kareyle aynı anda.

## 6. Teknik ve teslim

- Sahne durumu zamanın saf fonksiyonu (`draw(t)`); `?video=1` ile `window.__video` sözleşmesi; `npm run video -- <slug>`.
- Klasör: `animations/short/<slug>/` (kategori `short`, Türkçe adı "Kısa Film"). `animation.json` → `format: "short"`.
- Sayfa: başlangıç ekranı + Başlat + ilerleme çubuğu + tam ekran; altyazı ve anlatım düğmeleri gerekmez.
- Testler: `dev/fpstest.mjs` her kademede; temas sayfası; `npm run video` ile tam render (kısa olduğu için tamamı alınır). Poster ve 5 kapak.
- README: logline, beat listesi, teknik, komutlar. `COST.md`, commit ve push (`/animation` skilliyle aynı kurallar).

## 7. Kontrol listesi

- [ ] Beş fikir yazıldı, biri gerekçeyle seçildi; seçilen "ilk akla gelen web demosu" değil.
- [ ] Sözsüz izleyen biri durum → değişim → sonucu anlatabilir (kendine sor: tek cümleyle ne oldu?).
- [ ] Doruk anı var, en güçlü kare o, sesle çakışıyor.
- [ ] Karakterin ikincil hareketi ve tereddütleri var; hiçbir hareket lineer değil.
- [ ] İki ışık durumu ve aralarında geçiş; sabit gren; tek palet.
- [ ] Her kademede akıcı; video render edildi; başlık kartı var.
