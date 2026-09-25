# Yeni animasyon isteği

<!--
KULLANIM
1. Aşağıdaki "İSTEK" bölümünü doldur. Bilmediğin alanları boş bırakabilirsin.
2. Yeni bir oturumda şunu yaz:
   "prompts/new-animation.md dosyasını oku ve uygula." (ardından doldurduğun bölümü yapıştır ya da dosyayı kaydetmiş ol)
   Kısa yol: "prompts/new-animation.md'ye göre yeni animasyon: <konu>. <ek isteklerin>"
Dosyanın geri kalanı yapay zekâ içindir, değiştirmen gerekmez.
-->

## İSTEK

- **Konu:** 
- **Hedef kitle:** (ör. 5. sınıf, lise, üniversite, genel izleyici)
- **Süre:** (ör. 4–6 dakika; boşsa konunun gerektirdiği kadar)
- **Tür / his:** (ör. belgesel, oyun, hikâye, deney, harita üzerinde yolculuk; boşsa sen seç)
- **Anlatıcı sesi:** (ör. O9; boşsa konuya uygun olanı sen seç)
- **Ek istekler:** 

---

Bundan sonrası animasyonu yapacak yapay zekâya yöneliktir.

## 0. Amaç

Bu animasyonu izleyen bir öğrenci konuyu **gerçekten anlamalı**. Yalnızca "güzel görüntüler" yetmez. İyi bir öğretmenin karşısına oturmuş gibi hissetmeli. Animasyon ilgi çekici, bilimsel ve tarihsel olarak doğru, akıcı ve okunaklı olmalı. Sesli anlatımı ve kelime kelime açılan altyazısı olmalı. İleride YouTube videosuna çevrilebilecek biçimde kurulmalı, ama **ilk aşamada video üretilmez** (bkz. bölüm 6).

Kullanıcı seni beklemeden çalışmanı ister. Soru sorma; mantıklı kararı kendin ver, sonunda neyi neden seçtiğini kısaca anlat. Dışarıya para ödenen bir servise hiçbir şey gönderme (bkz. `CLAUDE.md`).

### Çıta: yapabileceğin en iyi iş

Elinden gelenin en iyisini yap; sınırları zorla. "İdare eder" ya da "çalışıyor" yeterli değildir. Hedef, izleyenin "bu çok çok harika olmuş" dediği, arkadaşına göndermek istediği bir iş. Öğretmenin sınıfta gururla açacağı, öğrencinin bir daha izlemek istediği bir animasyon. Bir müze sergisindeki etkileşimli ekran ya da ödüllü bir belgeselin grafik bölümü kalitesini düşün, ve onu geçmeye çalış.

Bu ifadeler somut olarak şunları gerektirir:

- **Unutulmaz anlar:** Her animasyonda en az birkaç "vay" anı tasarla. Ölçeğin birden değiştiği bir kamera hareketi, beklenmedik bir kesit, bir sürecin gözler önünde kurulması, bir sayının gerçek boyutuyla gösterilmesi olabilir. Bunlar süs değil; konunun en önemli fikrini akılda kalıcı yapan anlar olmalı.
- **Ayrıntıya özen:** Işık, gölge, doku, geçişlerin yumuşaklığı, hareketin ağırlığı ve zamanlaması, sesin görüntüyle uyumu, boşlukların dengesi. Kimsenin fark etmeyeceğini düşündüğün ayrıntı, bütünün "profesyonel" hissettirmesini sağlayan şeydir.
- **İlk fikirle yetinme:** Aklına gelen ilk çözüm genellikle herkesin yapacağı çözümdür. Onu gördükten sonra "bunu nasıl daha etkileyici, daha açıklayıcı, daha özgün yapabilirim?" diye sor ve bir adım öteye götür.
- **Eleştirel göz:** Ekran görüntülerine acımasız bir sanat yönetmeni gibi bak. Boş, sıkıcı, karışık ya da ucuz görünen her kareyi düzelt. Kendi işini beğenmek için değil, kusurunu bulmak için izle. Birkaç tur iyileştirme yap.
- **Kolay yola kaçma:** Zor ama doğru olanı seç. Konuyu gerçekten gösteren bir benzetim, basit bir ikonun yerine anlamlı bir sahne, düz bir metin yerine canlanan bir açıklama tercih et. Süre ve emek konusunda cimri davranma.
- **Güzellik ile doğruluk birlikte:** Hiçbir görsel etki bilimsel ya da tarihsel doğruluğun önüne geçmez. En etkileyici an, doğru olanın en iyi gösterildiği andır.

## 1. Özgünlük: bu animasyon kendi dünyasını kurar

Bu depo bir koleksiyondur; içindeki animasyonların ortak bir motoru ya da stili **yoktur ve olmamalıdır**. Önceki animasyonları kopyalamak hepsinin aynı kalıptan çıkmış gibi görünmesine yol açar. Kullanıcının en çok istemediği şey budur.

- `animations/` altındaki başka animasyonların kodunu, arayüzünü, renklerini, yazı tiplerini, kamera dilini ve dosya düzenini **açma, okuma, örnek alma**. İhtiyacın olan ortak teknik (ses, altyazı, video) bu dosyada anlatılmıştır; bunun için başka animasyona bakmana gerek yok.
- Yine de bir şekilde önceki bir animasyonu görürsen (kök README'deki tablo, site kartları, bir hata ayıklama sırasında): **onun stilini, mantığını ya da paketlerini uygulamak zorunda değilsin, uygulamamalısın da.** Depoda bir animasyonun Three.js, koyu tema ya da belli bir oynatıcı kullanması, yenisinin de öyle olması gerektiği anlamına gelmez. Bunlar o konu için verilmiş kararlardı; senin konun kendi kararlarını ister. Gördüğün şeyi "bu zaten yapıldı, ben başka türlü yapayım" diye oku, "depoda böyle yapılıyor" diye değil.
- Tutarlılık yalnızca teknikte aranır (bölüm başına tek kayıt, kelime kelime altyazı, zamanın fonksiyonu olan sahne durumu); görünümde, yapıda ve teknoloji seçiminde aranmaz. İki animasyonun yan yana konduğunda farklı ellerden çıkmış gibi görünmesi istenen sonuçtur.
- Kullanılabilecek ortak şeyler yalnızca kökteki araçlar ve varlıklardır: `tools/voice.mjs`, `tools/render-video.mjs`, `assets/voices/`, `assets/avatars/`. Bunlar görünüm dayatmaz.
- **Kodlamadan önce bir tasarım kartı yaz** (`animations/<kategori>/<slug>/DESIGN.md`):
  1. Konunun özü tek cümlede: izleyici sonunda neyi anlamış olmalı?
  2. Birbirinden **gerçekten farklı üç görsel/anlatısal yaklaşım** düşün. Her birinin tekniği, görsel dili ve anlatım yapısı farklı olsun. Her biri için bir paragraf yaz.
  3. Konuya ve hedef kitleye en uygun olanı seç ve gerekçesini yaz. "Alışkın olduğum için" gerekçe değildir.
  4. Seçilen yaklaşımın kimliğini yaz: renk paleti, yazı tipleri (Google Fonts'ta konuya uygun olanlar), hareket karakteri (ağır ve belgesel mi, oyunbaz ve zıplayan mı, mekanik ve kesin mi), ses dünyası ve arayüz dili.
- Konunun doğası tekniği belirlesin. Aşağıdaki liste yalnızca düşünmeyi açmak içindir; bir menü değildir.
  - **Tarih:** eski harita ve parşömen dokusu, zaman çizelgesi üzerinde gezinti, gravür ya da minyatür üslubu, arşiv fotoğrafı hissi, kâğıt kesiği (paper cut-out) katmanlar, belgesel yazı karakterleri.
  - **Coğrafya:** gerçek projeksiyonlu harita (d3-geo, SVG), kabartma ve yükselti, gökyüzünden alçalan kamera, iklim ve akıntı parçacıkları, uydu görünümü ile çizim arasında geçiş.
  - **Fen ve biyoloji:** mikroskobik ölçeğe inen 3B, kesit ve patlatılmış görünüm, parçacık benzetimleri, ölçek çubuğu, gerçek birimlerle hareket.
  - **Matematik:** vektörel, temiz, adım adım kurulan çizimler; dönüşümlerin sürekli hareketle gösterilmesi.
  - **Oyun biçimi:** izleyicinin karar verdiği, puanlanan ya da keşfedilen yapı; oyun hissi veren ses ve geri bildirim. Anlatım yine öğretici kalmalı.
  - **Teknoloji ve makineler:** kesit, iç mekanizma, zamanı yavaşlatma, "içeriden bakış".
- Teknik seçimi özgür: Canvas 2D, SVG, CSS, WebGL, Three.js, Babylon.js, PixiJS, WebGPU, GSAP, d3, Vite, React, düz HTML… Konuya en iyi hizmet eden ve en sade olanı seç. Aynı paketleri her seferinde yeniden seçmek zorunda değilsin.
- Kaçınılacak varsayılan refleksler (konudan gelen bir gerekçe yoksa): her şeyi koyu arka plan üzerinde neon renklerle yapmak, cam efektli (glassmorphism) paneller, her ekranın köşesine istatistik kutuları doldurmak, jenerik "teknoloji" yazı tipi, kahramansız ve hikâyesiz sahne dizisi.
- **Tüm görsel varlıkları kendin üret** (prosedürel geometri, SVG, shader, Canvas çizimi). Telifli görsel, logo ya da gerçek bir kurumun markasını kullanma. İnsan karakteri gerçekten gerekiyorsa `assets/avatars/` kullanılabilir (`npm run avatars -- list`).

## 2. Önce araştır

Tek satır kod yazmadan önce konuyu internetten araştır.

- Birden çok güvenilir kaynak kullan: ders kitapları, üniversite ve müze siteleri, bilimsel derlemeler, resmî kurumlar, ansiklopediler. Sayıları, tarihleri, adları ve süreçlerin sırasını en az iki kaynaktan doğrula.
- Hedef kitlenin müfredatta ne öğrendiğine bak; o seviyeye göre derinliği ayarla.
- Yaygın yanlış bilinenleri bul ve animasyonda doğrusunu göster ("Çoğumuz … sanırız, aslında …"). Bu bölümler akılda en çok kalanlardır.
- Konuyu somutlaştıran, şaşırtıcı ama doğru ayrıntılar topla: ölçek, hız, sayı, gündelik hayattan karşılaştırma.
- Notlarını ve kaynaklarını `animations/<kategori>/<slug>/RESEARCH.md` dosyasına yaz (kaynak adı, adresi ve hangi bilgiyi verdiği). Emin olamadığın bir bilgiyi kullanma ya da yuvarlak ve temkinli ifade et ("yaklaşık", "yaygın görüşe göre").
- Tarih ve coğrafyada tarihleri, sınırları ve yer adlarını dönemine uygun kullan. Tartışmalı konularda tek tarafın görüşünü gerçek gibi sunma.

## 3. Anlatım: bir insanın anlattığı gibi

Metin, animasyonun kalbidir. Görüntüden önce anlatımı yaz, sonra sahneleri anlatımın etrafında kur.

- **Yapı:**
  - Bir merak sorusuyla ya da tanıdık bir anla aç (ilk 10 saniyede).
  - Bölüm bölüm ilerle; her bölümün tek bir ana fikri olsun.
  - Sonda kısa bir özet ver ve açılıştaki soruyu yanıtla.
  - Bölüm sayısı ve uzunluğu konuya göre değişir; tipik olarak 6–16 bölüm, bölüm başına 10–35 saniye anlatım.
- **Dil:** doğal, sıcak, sohbet eden Türkçe. "Biz" ya da "sen" dili, kısa ve orta boy cümleler. Ders kitabı gibi değil, karşısındakine anlatan biri gibi. Yeni bir terimi önce basitçe açıkla, sonra adını ver. Benzetmeler kullan, ama bilimsel olarak yanıltmasınlar.
- **Görüntü ile söz birlikte:** anlatıcı neyi söylüyorsa ekranda o görünmeli, o anda. "Şimdi şuraya bakın" dediğinde kamera oraya gitmiş olmalı. Bir kavram söylenmeden önce ekranda belirmemeli ya da çok geç kalmamalı.
- **Ekran yazıları:** başlıklar, etiketler ve sayılar kısa olmalı ve anlatımla çelişmemeli. Her yazı, hızlı akışta bile okunabilecek kadar büyük ve uzun süre ekranda kalmalı. Masaüstünde gövde yazısı en az ~16 px olmalı, telefonda da okunmalı.
- **Tempo:** önemli anlarda yavaşla, nefes al. Arka arkaya yeni bilgi yığma. Her bölümün sonunda görüntü kısa bir an dinlensin.
- **Doğruluk:** her cümle araştırma notlarındaki bir bilgiye dayanmalı.

## 4. Seslendirme tekniği (ortak araç)

Ses yerelde, `tools/voice.mjs` ile üretilir. Seslerin listesi ve özellikleri `assets/voices/README.md` dosyasındadır (`npm run voice -- voices`).

- **Bölüm başına tek kayıt.** Cümleleri ayrı ayrı seslendirip art arda çalmak kesik ve robotik duyulur. Her bölümün bütün anlatımı tek bir satırdır ve tek parça okunur.
- Animasyon `narration/lines.json` dosyasını üretir, tercihen metinden otomatik üreten küçük bir betikle (`tools/lines.mjs` gibi):
  ```json
  {
    "voice": "omni-erkek-derin",
    "speed": 0.9,
    "out": "public/voice",
    "manifest": "narration/manifest.json",
    "lines": [
      { "id": "<bölüm-id>", "say": "Bölümün bütün anlatımı, söylendiği gibi yazılmış." }
    ]
  }
  ```
  - `out` kayıtların yazılacağı klasördür.
  - `url` (isteğe bağlı) sayfadaki yol önekidir; `out` bir `public/` klasörü değilse ver.
- **Söylenecek metin ekrandaki metinden ayrıdır.** Ekranda "%20, 37 °C, 1453, H₂O, CMYK, (yani…)" yazabilir. Söylenecek metinde bunlar okunduğu gibi olmalı: "yüzde yirmi, otuz yedi derece, bin dört yüz elli üç, ha iki o, ce me ye ka". Rakamları sözcüğe çevir, parantezleri cümleye yedir, kısaltmaları ve yabancı adları okunuşa göre yaz. Ekrandaki metin değişmesin.
- **Ses seçimi:** konuya ve kitleye uygun sesi seç. Kullanıcı belirttiyse onu kullan.
  - Belgesel ya da tarih için derin ya da yaşlı erkek sesi: O9, O10, O33.
  - Canlı bir anlatı için genç ses: O1.
  - OmniVoice sesleri (O…) en doğal olanlardır.
  - Hız genelde 0.85–0.95; dakikada ~140–150 kelime anlaşılır bir hızdır.
- Komutlar (depo kökünde):
  ```
  npm run voice -- <slug>                   # kayıtları üretir, Whisper ile denetler, manifest'i yazar
  npm run voice -- <slug> --voice <id>      # sesi değiştirir
  npm run voice -- <slug> --words-only      # var olan kayıtlara kelime zamanlarını ekler
  ```
- Araç yalnızca değişen satırları yeniden üretir. Her kaydı Whisper ile dinleyip yanlış okunanları tekrar dener; sonda şüpheli satırları listeler. **Listelenenleri düzelt** (yazımı söylenişe göre değiştir) ve yeniden üret.
- `narration/manifest.json` her kayıt için şunları verir:
  ```json
  { "lines": { "<bölüm-id>": { "file": "voice/<bölüm-id>.mp3", "dur": 18.4, "words": [[0.00, 0.31, "Bu,"], [0.42, 0.60, "çok"]] } } }
  ```
  `words` Whisper'ın kelime zamanlarıdır: `[başlangıç sn, bitiş sn, söylenen kelime]`. Kayıtlar git'e girer, çünkü site derlenirken model çalışmaz.

## 5. Zamanlama ve altyazı tekniği

Görsel stil animasyona özgüdür; aşağıdaki **teknik** ise her animasyonda aynı kalitede olmalı.

- **Bölüm süresi sesten gelir.** Bölüm süresi = kısa giriş payı (~0,6 sn) + kayıt süresi + kısa nefes (~0,9 sn). Kayıt yoksa okuma hızına göre bir yedek süre kullan (ör. 1,3 sn + karakter sayısı / 14,5).
- **Sahne olayları kelimelere bağlanır.** Bir olayın ("kamera mideye iner", "ordu nehri geçer") zamanını elle saniye olarak yazma. Onu anlatımda ilgili cümlenin ya da kelimenin başladığı ana bağla. Yazılı metindeki bir konumu (karakter oranı) kayıttaki zamana çeviren parçalı doğrusal bir fonksiyon kur:
  - Whisper kelimelerinin kümülatif karakter oranı → kelimenin başlangıç zamanı.
  - Bu fonksiyon, yazılı cümle ile söylenen cümle farklı olsa da (rakamlar, kısaltmalar) çalışır. Oranı söylenen metin üzerinden hesapla.
- **Oynatırken saat kayıttır:**
  - Kayıt çalarken hikâye zamanı kaydın `currentTime` değerini izler: fark küçükse yumuşakça yaklaşır, büyükse kayıt bir kez konumlandırılır.
  - Hikâye zamanı **hiçbir zaman geri gitmez**.
  - Kayıt yüklenirken (`readyState < 3` ya da `seeking`) görüntü bekler.
  - Çalan kayıt, bir kare takıldı diye asla ileri geri sarılmaz. Yalnızca bölüm değişince, kullanıcı atlayınca ya da duraklatıp devam edince konumlandırılır.
  - Hız değişiminde `playbackRate` ayarlanır (`preservesPitch`).
  - Geçerli ve sonraki bölümün kayıtları önceden yüklenir; uzaktakiler bırakılır.
- **Akıcılık:**
  - Ağır sahneleri ve shader'ları başlangıç ekranında önceden hazırla (ısınma çizimleri).
  - Çözünürlüğü oynatma sırasında durmadan değiştirme; başlangıçta ölç ve sabitle.
  - Tarayıcı otomatik oynatmayı engellediği için bir başlangıç ekranı ve "Başlat" düğmesi olsun.
- **Altyazı:**
  - En çok iki satır olsun. Uzun cümleler sesle birlikte ilerleyen parçalara bölünür (parça başına ~90 karakter, satır başına ~44). Önce cümle sonundan, sonra virgülden, sonra bağlaçtan böl.
  - **Kelimeler anlatıcı söyledikçe açılır.** Her yazılı kelimeye, cümle içindeki konumuna karşılık gelen kayıt zamanı verilir. Kelime o an yumuşak bir geçişle görünür (opaklık, hafif kayma, bulanıklıktan netleşme). Satırlar kelime açıldıkça yeniden dizilmemeli: bütün kelimeler baştan yerleşik ama görünmez olmalı.
  - Görünüm animasyonun görsel diline uyar (yazı tipi, renk, yer). Ama her zaman okunaklı olmalı: kutu yerine altta yumuşak bir karartma, gölgeli açık renk yazı, masaüstünde ~17–23 px. Başka bir dil konuya daha uygunsa (ör. tarih animasyonunda parşömen üzerine mürekkep) okunaklılığı koruyarak uyarlanabilir.
  - İzleyici altyazıyı ve anlatımı **ayrı ayrı** açıp kapatabilir. Düğmeler (CC, ses) ve kısayollar (C, N) olsun; seçim `localStorage` ile hatırlanır. Ayarlarda altyazı boyutu (küçük, orta, büyük) seçilebilir.
- Oynatıcı: oynat/duraklat, bölüm atlama, bölüm işaretli ilerleme çubuğu, hız, tam ekran, klavye (boşluk, oklar). Telefonda da kullanılabilir olmalı. Anlatım sırasında efekt sesleri kısılır (ducking). Efekt sesleri hazır dosyalardan değil, tercihen Web Audio ile üretilir.

## 6. Video (YouTube): şimdilik yok

**İlk aşamada video üretme** ve video için ayrıca uğraşma. Önce web sayfası, ses ve altyazı eksiksiz olsun; kullanıcı izleyip onaylasın. Video daha sonra, kullanıcı ayrıca isterse yapılır.

Şimdiden yapılacak tek şey, sonradan videoya çevirmeyi kolaylaştıran bir kuruluştur: sahne durumu **zamanın saf bir fonksiyonu** olsun, yani `durum = f(t)` (aynı t → aynı kare). Bu oynatıcıda atlamayı da kolaylaştırır.

Video istendiğinde sayfa `?video=1` ile açılınca kök aracın (`npm run video -- <slug>`) kullandığı şu nesneyi sunacak:

```js
window.__video = {
  duration,                       // saniye
  renderAt(t),                    // t anını kesin olarak çizer
  prepareSound(from, to, opts),   // film sesini OfflineAudioContext ile üretir (anlatım + efektler)
  soundChunk(i),                  // üretilen WAV'ı parça parça verir
  srt(),                          // altyazı dosyası metni
  chapters(),                     // YouTube bölüm listesi metni ("0:00 Başlık")
};
```

## 7. Klasör ve teslim

`CLAUDE.md` içindeki adımlar geçerlidir. Özetle:

1. Konuya uygun kategoriyi seç (biology, history, geography, physics, chemistry, math, space, technology, software; gerekirse yeni bir İngilizce ad) ve `npm run new -- <kategori>/<slug> "<Türkçe Başlık>"` komutunu çalıştır. Slug İngilizce olmalı (küçük harf ve tire); Türkçe yalnızca ekrandaki metinde kullanılır ve düzgün olmalı (ç, ğ, ı, İ, ö, ş, ü).
2. Yalnızca `animations/<kategori>/<slug>/` içinde çalış. `animation.json` dosyasını doldur (`slug`, `title`, `description`, `tech`, `build`, `output`). Kendi `package.json` dosyası olabilir: derleme paketleri `dependencies`, yerel araçlar `devDependencies` altına.
3. `DESIGN.md`, `RESEARCH.md` ve `README.md` (ne anlattığı, bölümleri, komutları) dosyalarını yaz. Kök `README.md` içindeki animasyon tablosuna bir satır ekle. İstersen 16:9 bir `poster.jpg` üret.
4. `npm run voice -- <slug>` ile sesi üret ve şüpheli satırları düzelt.
5. Kökte `npm run build -- <slug>` çalıştır.
6. **Kendin izle ve ölç** (headless Chrome, `puppeteer-core`, yol `CLAUDE.md`'de):
   - Masaüstü (1600×900) ve telefon (390×844) genişliğinde birçok anın ekran görüntüsünü al ve bak. Yazılar okunuyor mu, bir şey taşıyor ya da üst üste biniyor mu?
   - Gerçek zamanlı oynatma testi yaz. Araya yapay takılmalar ekle ve şunları ölç: kayıt ortasında sarma sayısı (0 olmalı), hikâye zamanının geri gitmesi (0 olmalı), ses–görüntü farkı (ortalama < 150 ms).
   - Konsol hatası olmamalı.
7. Kullanıcı isterse Türkçe bir commit mesajıyla `main`'e gönder. Pages yayını otomatiktir.

## 8. Bitirmeden önce kontrol listesi

- [ ] `DESIGN.md` içinde üç farklı yaklaşım ve seçimin gerekçesi var; animasyon depodaki diğerlerine benzemiyor.
- [ ] `RESEARCH.md` içinde kaynaklar var; her sayı ve tarih doğrulandı.
- [ ] Dürüstçe: bunu izleyen biri "çok çok harika olmuş" der mi? Demezse neyi eksik, iyileştir.
- [ ] Birkaç unutulmaz "vay" anı var ve her biri konunun ana fikrine hizmet ediyor.
- [ ] İlk 10 saniye merak uyandırıyor; sonunda özet ve açılış sorusunun yanıtı var.
- [ ] Anlatım bir insanın konuşması gibi akıyor; bölümler tek parça kayıt; Whisper şüpheli listesi boş ya da düzeltildi.
- [ ] Söylenen ile gösterilen aynı anda; sahne olayları kelime zamanlarına bağlı.
- [ ] Altyazı en çok iki satır, kelime kelime açılıyor, okunaklı; altyazı ve anlatım ayrı ayrı açılıp kapanıyor.
- [ ] Oynatma testinde sarma 0, geri gitme 0; takılma ya da donma yok.
- [ ] Masaüstü ve telefonda ekran görüntüleri kontrol edildi.
- [ ] Video üretilmedi; sahne durumu zamanın fonksiyonu, yani video sonradan eklenebilir.
- [ ] README'ler güncel; başka bir animasyonun dosyasına dokunulmadı.
