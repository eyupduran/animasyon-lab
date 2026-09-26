# Teknik alet çantası

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
