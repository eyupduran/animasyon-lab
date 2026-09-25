# Bilinen tuzaklar

Biçim: **belirti** → neden → çözüm. Her oturum sonunda yeni bulunanlar eklenir. Aynı konu varsa yenisini ekleme, var olanı güncelle.

## Oynatıcı ve altyazı

- **CC kapalıyken altyazı hâlâ görünüyor** → altyazının geçiş kodu her karede satır içi `opacity` yazıyor ve CSS'teki gizleme sınıfını eziyor → gizlemeyi `display: none` ile yap ve her karede CC durumuna bak. Testi tarayıcıda yap: düğmeye bas, 8 saniye boyunca altyazının görünüp görünmediğini ölç.
- **Altyazıda tek kelime kalıyor** → gerçek bir hata değil: kelimeler söylendikçe açılıyor. Ekran görüntüsü alırken bunu hata sanma.
- **Başlat ekranının arkası boş** → oynatma başlamadan `t = 0` çiziliyor → başlamadan önce animasyonun en güçlü karesini (ör. finali) arka planda göster.
- **Konsolda 404 hatası** → sayfanın favicon'u yok → satır içi bir SVG favicon ekle.

## Sahne ve kamera

- **Hareket eden işaretçi (paket, nokta) kutuların içinden geçip yazıları örtüyor** → yol, istasyon kutularının ortasından çizilmiş → paketi kutuların altından ya da üstünden giden ayrı bir hat üzerinde yürüt, istasyonları hatta kısa dikey çizgilerle bağla.
- **Kod paneli satırı kenardan taşıyor** → sabit yazı boyutu, uzun satır → kod sayfasında yazı boyutunu en uzun satıra göre küçült (alt sınırla); örnek kodu yine de ≤ 40 karakterlik satırlarla yaz.
- **Damga yazının üstüne düşünce okunmuyor** → damganın içi saydam → damgaya kâğıt renginde bir dolgu ver.
- **Çizim sırası yüzünden nesne kayboluyor** (raf, üstüne konan nesneyi örtüyor) → kap önce, içine konan sonra çizilir.
- **Yazılar çizgilerle kesişiyor** (durak adlarını birleşme çizgisi kesiyor) → yazının arkasında kontur yok → zemin renginde `strokeText` ile halo ver.
- **Etiketin altındaki bağlantı çizgisi dev gibi uzuyor** → çizgi hedef istasyona kadar çekiliyor, etiket ise kayarken arada kalıyor → bağlantı çizgisini sabit uzunlukta çiz.
- **Yakınlaşınca açıklama kartı anlatılan öğenin üstüne düşüyor** → kart ekranın ortasında → kamerayı öğeyi aşağıda tutacak biçimde kaydır, kartı üste koy ve ok ile öğeye bağla.
- **Mavi ile turuncu karışınca çamur gibi gri çıkıyor** → iki rengi RGB'de karıştırmak → karıştırma; yeni rengi eski rengin üstüne artan opaklıkla bindir.
- **Kullanılmayan dal etiketleri ekranı kalabalıklaştırıyor** → hepsi tam parlaklıkta kalıyor → işi biten etiketleri soldur.
- **Telefonda harita yazıları okunmuyor** → yatay görünüm için ayarlanmış kamera genişliği dikeyde de kullanılıyor → dikey ekranda görünen genişliği daralt (yaklaşık ×0,62); yan kenarlardan biraz kırpılmasına izin ver.
- **Açılışta dosya adları üst üste biniyor** → konumlar tamamen rastgele → ızgaraya oturtulmuş, hafifçe oynatılmış rastgele konumlar kullan.

## Ses

- **Kod terimleri (Spring, bean, @Transactional…) yanlış okunuyor** → söyleniş sözlüğü kur (`PRON`: "bean" → "bin", "@Transactional" → "et trenzekşınıl"), kesme işaretinden sonraki eki birleştir ("Tomcat'e" → "tomkete"), ek uyumuna dikkat et ("classpath'e" için "klaspet" → "klaspete"). Whisper doğru okunan İngilizce terimleri İngilizce yazdığı için yüzde 5–10 "fark" normaldir; yalnızca anlamı bozulan kelimeler için satırı yeniden kur.
- **O27 sesi** → kullanıcı "çok kötü" buldu, katalogdan çıkarıldı. Önerme.
- **Oyun, program ya da teknik adı yanlış okunuyor** (commit, merge, HEAD…) → OmniVoice İngilizceyi Türkçe gibi okuyor → söylenecek metinde okunuşu yaz (komit, mörç, hed), ekrandaki metin değişmesin.
- **Türkçe büyük harfle başlayan kelime yanlış okunuyor** → OmniVoice'un bilinen sorunu → `voice.mjs` bunu zaten küçük harfe çeviriyor; elle bir şey yapma.

## Video ve kapak

- **`chapters()` metin döndürünce video aracı çöküyor** → `render-video.mjs` `[{ t, title }]` dizisi bekliyor → sözleşmeyi aynen uygula. `srt(from, to)` ve `chapters(from)` aralığa göre kaydırılmış olmalı.
- **Video aracı bekleyip duruyor** → sayfa `window.__ready = true` ayarlamamış → video modunda bu işareti koy.
- **Kapakta "Git" "GİT" olmuş** → Türkçe sayfada CSS `text-transform: uppercase` → başlıkları elle büyük harfle yaz (GIT, İ ile I doğru).
- **Kapakta ana görsel başlığın altına giriyor** → görselin ağırlığı sol altta → ana görseli sağa yasla; beşini temas sayfasında yan yana kontrol et.
- **Görsel ya da kart kadrajdan taşıyor** → perspektif dörtgeni ekranın dışına çıkıyor → önemli öğeler (işaretçi, etiket) en az 40 px içeride kalsın.

## Araçlar

- **Klasör taşınırken "Permission denied" hatası** → Windows'ta VS Code ya da bir terminal klasörü açık tutuyor, içindeki dosyalar kilitli değil → klasörü değil içindekileri `mv` ile taşı, sonra `git add -A`. Boş kalan eski klasör zararsızdır.
- **Animasyon bulunamıyor** → animasyonlar `animations/<kategori>/<slug>/` altında → yol yazma; araçlara slug ver (`tools/lib/animations.mjs` → `findAnimation`).

- **Ekran görüntüsü yanlış anı gösteriyor** → `bolum.isaret+0.5` gibi bir ifade noktadan bölünüp `+0` diye okunuyor → bölüm adını yalnızca ilk noktadan ayır.
- **Bash'te `cat > dosya` komutu takılı kalıyor** → heredoc verilmemiş, komut girdi bekliyor → dosyayı Write aracıyla yaz ya da `<<'EOF'` kullan.
- **Headless Chrome'da sayfa yükleme zaman aşımına uğruyor** (`networkidle`) → ses dosyaları akarken ağ hiç boşalmıyor → `waitUntil: 'load'` kullan ve sayfanın hazır işaretini bekle.
