# Teknik alet çantası

> Üretim aşamasında okunur (SKILL.md → Aşama 4). Treatment aşamasında okunmaz: görünüm kararları oradan önce, konudan çıkarak verilir.

Bu dosya **nasıl** yapılacağını anlatır, **neye benzeyeceğini** değil. Renk, yazı tipi, düzen ve teknoloji seçimi her animasyonun kendi tasarım kartından gelir. Aşağıdakiler bir menü değildir; konuya hizmet eden olursa kullan.

## 1. Işık ve derinlik (Canvas 2D ile, kütüphane gerekmez)

- **Işık saçılması (bloom):** parlayan öğeleri ayrı bir katmana çiz. Katmanın bulanık kopyasını `globalCompositeOperation = 'lighter'` ile iki üç kez üste bindir (farklı bulanıklıklarla, ör. 60, 26 ve 8 px), sonra keskin hâlini çiz.
  ```js
  dst.save(); dst.globalCompositeOperation = 'lighter'; dst.filter = `blur(${px}px)`; dst.drawImage(src.canvas, 0, 0); dst.restore();
  ```
- **Alan derinliği:** sahnenin bulanık kopyasını çıkar. `destination-in` ve dikey bir gradyanla yalnızca uzak (üst) kısmı bırak, sonra asıl sahnenin üstüne çiz.
- **Bokeh:** rastgele konumlu radyal gradyan diskler, `lighter` modunda. Renkleri sahnenin ışıklarından seç, az sayıda kullan.
- **Kararma (vignette) ve film greni:** kenarlara radyal karartma. SVG `feTurbulence` gürültüsü `mix-blend-mode: overlay` ile ve %10–14 opaklıkla. Dijital düzlüğü kırar.
- **Işık yönü:** tek bir ana ışık seç. Gölgeler (`shadowBlur`, kaydırılmış bulanık şekil) ve parlaklık gradyanları hep ona uysun.

## 2. Perspektif (3B motoru olmadan)

- **Zemin düzlemi kamerası:** zemindeki (X, Z) noktası ekranda `x = W/2 + X·f/Z`, `y = ufuk + h·f/Z` olur. Çizgi kalınlığı ve boyut `f/Z` ile ölçeklenir. Çizgileri kısa parçalara bölüp her parçayı kendi derinliğine göre çiz, yoksa perspektif bozulur.
- **Bir görseli eğik bir yüzeye oturtmak:** birim kareden dörtgene homografi hesapla. Görseli 20×20 ızgaraya böl; her üçgeni kendi afin dönüşümüyle ve üçgene kırpılmış olarak çiz. Masadaki kâğıt, duvardaki pano, eğik ekran için kullanılır.
- **3B'de döndürülmüş kart:** dikdörtgenin köşelerini `rx`, `ry`, `rz` açılarıyla döndür, `f/(f+Z)` ile izdüşür, sonra dörtgen eşlemesiyle doku bas.
- Gerçek 3B gerekiyorsa (organ, makine içi, gezegen) Three.js, Babylon.js ya da WebGPU kullan. Aynı ışık kuralları geçerlidir.

## 2b. Gerçekçi 3B (makro, belgesel)

Gerçekçilik istenen 3B sahnelerde en büyük farkı yaratanlar (ayrıntı: `animations/documentary/ant-documentary/REALISM.md`):
- **Uzun objektif:** dar görüş açısı, kamera geride; konu aynı boyda kalır, arka plan sıkışır ve erir. Hızlı yörünge yerine yavaş kaydırma, sabit kadraj, belli belirsiz el titremesi (zamanın saf fonksiyonu olarak).
- **Gerçek HDRI ile ortam ışığı:** Poly Haven (CC0, atıf gerekmez) bir `.hdr`, prosedürel gökyüzünden çok daha doğal yansıma ve dolgu ışığı verir. Güneşi ayrıca yönlü ışıkla ver.
- **Yumuşak ama temasta sertleşen gölge** (Babylon: `useContactHardeningShadow`); ayağın zemine "oturması" gerçekçiliğin ilk işaretidir.
- **Kırılan damla:** su ya da cam, ortam küpünü değil sahnenin kendisini kırmalı. En ucuz yolu: damlanın yerine bir yansıma sondası (bir kez çizilen küp doku) koyup kırılma dokusu yapmak.
- **Alan derinliği fiziksel ölçekte:** keskin bölge konunun gözü ve başı; odak kaydırma seyrek ve yavaş.
- **İpeksi yüzey:** şeffaf cila katmanına çok ince bir bump, `enableSpecularAntiAliasing`; ince uzuvlarda arkadan ışıkta yarı saydamlık.
- **Canlı hareket:** sabit hız yerine dur-kalk; antenler ve uzuvlar birbirinden bağımsız ritimde.
- **Son işlemeyi hafif tut:** keskinleştirme kapalı, renk sapması ve kenar karartması çok az, bloom yalnızca gerçek parıltılarda.

## 3. Doku ve malzeme (prosedürel)

- **Kâğıt:** açık zemin, binlerce düşük opaklıkta nokta, ince ızgara ya da lif.
- **Ahşap:** eğimli gradyan, sinüsle kıvrılan yüzlerce ince damar çizgisi, pencere ışığı.
- **Metal ve cam:** keskin parlama bandı, kenar ışığı (rim light), iç gölge.
- **Parşömen, taş, kumaş, deri, sıvı:** değer gürültüsü, fBm ya da Perlin gürültüsü; renk haritasıyla boyanır.
- **Rastgelelik:** her zaman sabit tohumla üret (`rand(seed)`), böylece aynı kare her seferinde aynı çıkar. Video ve test buna bağlıdır.

## 4. Yazı

- Harita ya da çizgi üzerindeki yazıya zemin renginde bir kontur (halo) ver: önce `strokeText`, sonra `fillText`. Çizgiler yazıyı kesmez.
- Yazı boyutlarını kamerayla ölçeklerken alt sınır koy; okunmayacak kadar küçülen yazıyı soldur.
- Türkçe büyük harfi elle yaz. CSS `text-transform` Türkçe sayfada "Git"i "GİT" yapar (bkz. `pitfalls.md`).

## 5. Hareket ve zamanlama

- Sahne durumu zamanın saf fonksiyonu olsun: `draw(t)`. Her olayın başlangıcı anlatımdaki bir kelimeye bağlanır.
- Yardımcılar: `ramp(t, t0, süre)`, `win(t, a, b)` (görünme ve kaybolma), `ease` (yumuşak giriş ve çıkış), `back` (hafif taşma ile belirme).
- Kamera anahtar kareleri görünen alanı "merkez + genişlik" olarak tanımlar. Ölçek logaritmik olarak ara değerlenir; 1,2–1,6 saniyelik geçişler iyi çalışır.
- Etiket ve işaretçi gibi bir yerden bir yere kayan öğelerin konumunu olay zamanlarından ara değerle. Aynı anda birden fazla olay varsa bir önceki ara konumdan devam et; yoksa sıçrar.

## 6. "Vay" anı kalıpları (konuya uyarlayarak)

- **Ölçek atlaması:** kameranın bir ayrıntıya dalıp gerçek boyutu göstermesi (41 baytlık dosya, hücre içi, galaksi ölçeği).
- **Zincirleme tepki:** bir değişikliğin sırayla yayılması (kimliklerin kızarması, domino, dalga).
- **Kaostan düzene:** dağınık öğelerin tek bir yapıya dizilmesi.
- **Önce ve sonra:** aynı kareyi bir silme çizgisi (wipe) ile iki hâlde göstermek.
- **Yanlış bilinenin çürütülmesi:** önce yanlış model gösterilir, sonra üstü çizilip doğrusu kurulur.
- **Gerçek sayının görünür hâli:** 100 noktalık ızgarada %93, gerçek oranlı uzunluklar.
- **Damga ve çarpışma anı:** titreme, kısa bir ses, büyükten küçüğe oturan damga.

## 7. Ses (Web Audio, dosyasız)

- Kısa efektler: gürültü ve bant geçiren filtreyle hava sesi (whoosh), deklanşör, tık; sinüs ya da üçgen dalgayla ses, çan ve uyarı sesleri.
- Anlatım sırasında efektleri kıs (ducking).
- Aynı sentez fonksiyonu hem canlı sayfada hem `OfflineAudioContext` içinde çalışmalı; video sesi böyle üretilir.

## 8. Performans (donma yasak)

Ölçmeden tahmin etme. Karınca belgeselinde ölçüm şunu gösterdi: yük tek bir efektte değil, binlerce küçük nesnede toplanmıştı (16 bin kum tanesi × ~290 üçgen); son işleme efektlerini kapatmak bile kareyi 47 ms'den aşağı indirmedi.

- **Kalite kademeleri:** `ultra` (yalnız video), `high`, `mid`, `low`, `min`. Kademe çalışma anında değişir: piksel bütçesi (`setHardwareScalingLevel`), MSAA/FXAA, alan derinliği düzeyi, SSAO aç/kapa, gölge filtresi (PCSS → PCF → yok), ekran uzayı katmanları, gölge listesinden ucuz nesneleri çıkarma. Örnek: `ant-documentary/src/env.js` → `setTier`.
- **Açılışta seçim:** ısınmadan sonra ağır üç anı her kademede senkron (readPixels ile) ölç; bütçenin altındaki ilk kademeyi seç. Senkron ölçüm karamsardır: 27 ms senkron ≈ 50+ fps gerçek oynatma. Oynatma sırasında 2,5 sn boyunca kare > 45 ms ise bir kademe düş; yukarı çıkma (titreme yapar).
- **Bölgeleme (chunking):** binlerce küçük nesneyi (taneler, topaklar, yapraklar) 6×6 gibi bir ızgarada ayrı thin-instance mesh'lere böl; Babylon görünmeyen bölgeleri çizmez. `alwaysSelectAsActiveMesh` yalnızca her kare güncellenen tamponlarda.
- **Geometri piksel boyutuna göre:** ekranda birkaç piksel olan nesneye 4 dilimli küre yeter; 12 dilim 9 kat üçgen demektir.
- **Gölge geçişi ikinci bir render'dır:** ucuz nesneleri (`metadata.cheapShadow`) düşük kademelerde gölge listesinden çıkar.
- **Kaçınılacaklar:** TAA (zamanda atlamada hayalet), ekran uzayı temas gölgesi (pürüzsüz yüzeyde leke), oynatma sırasında doku/geometri üretmek, her karede DOM yeniden düzeni.
- **Ölçüm araçları:** `dev/perftest.mjs` (kare başına update/render/GPU/DOM ms, bölüm bölüm), `dev/fpstest.mjs` (gerçek rAF fps, 50 ms'yi aşan kare sayısı, otomatik seçilen kademe). Hedefler `CLAUDE.md` → "Performans".
- **2B'de:** SVG'de yalnızca `transform` ve `opacity` animasyonu; filtreli öğeyi animasyonla oynatma (filtre her karede yeniden hesaplanır); gren sabit ayrı katman; binlerce öğe için Canvas; tek `requestAnimationFrame`.

## 9. Çizgi film ve düz vektör görünümü (belgesel dışı türler)

Kurallar ve gerekçeleri `docs/cartoon-style-in-code.md` içinde; özet:
- 5–7 renklik palet, tek vurgu rengi; düz renk yerine iki duraklı yumuşak gradyan; zemin radyal gradyan + sabit gren.
- Dış hat ya hiç yok ya her yerde aynı kalınlıkta paletten koyu ton. Gölge bulanık değil: kaydırılmış şekil ya da kesik yarım.
- En az üç derinlik katmanı, paralaks; 10–20 sn'de %3–5 yavaş kamera nefesi.
- Easing asla lineer: giriş `easeOutExpo/back`, çıkış `easeIn`; 40–80 ms stagger; follow-through; squash & stretch %5–10; yay fizikli tepkiler.
- Karakter: gruplu SVG kukla, 2 eklemli IK, göz kırpma + nefes + ağırlık aktarma idle döngüsü; ağız yok ya da 6 viseme (Whisper kelime zamanlarından).
- Tipografi karakterdir: anahtar kelime harf/kelime stagger ile vurgu renginde gelir.
- Her vurguya ses efekti, anlatım altında müzik (ducking). Kodla üretilen kısa efektler (`craft.md` → 7).
- Ucuz görünme listesi (`docs/cartoon-style-in-code.md` → 7) her eleştiri turunda kontrol edilir.
