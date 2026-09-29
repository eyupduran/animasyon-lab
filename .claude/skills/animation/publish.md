# Yayın aşaması

Bitmiş filmi sitede yayınla. Site filmi video gibi oynatır: oynatıcıyı, sesi ve altyazıyı araçlar ekler (`tools/player`, `tools/build-site.mjs`). MP4 ve kapak bu aşamanın işi **değil**.

Filmin **görünümünü değiştirme.** Kusur görürsen düzeltme, son mesajında listele. Yalnızca bu dosyayı, filmin kendi klasörünü ve adı geçen araçları kullan; başka filmleri ve `docs/` klasörünü açma.

## Adımlar

1. **Sözleşme:** sayfa `?video=1` ile `window.__film` sunuyor mu (`duration`, `renderAt`; varsa `narration`, `chapters`, `sound`)? Eksikse yalnızca bu küçük bağlayıcıyı ekle.
2. **Saflık:** `npm run verify -- <slug>` üç kez. Başarısızsa nedeni bul (rastgelelik, kare sayacı, sıfırlanmayan durum, geç yüklenen kaynak) ve filmin görünümünü değiştirmeden düzelt.
3. **Ses:** `npm run soundtrack -- <slug>`. Anlatımı ve filmin kendi sesini tek dosyada birleştirir, `soundtrack.m4a` üretir; oynatıcı bu dosyayla çalar. Anlatımın müziğin belirgin üstünde olduğunu dinleyerek ya da `ffmpeg -af volumedetect` ile denetle.
4. **Poster:**
   - `npm run poster -- <slug> --pick 10`: 10 aday kare çıkarır, `renders/poster-candidates/` altına.
   - Adaylara bak ve filmin en güçlü, yazısız ya da az yazılı karesini seç.
   - `npm run poster -- <slug> --t <saniye>`: seçtiğin kareyi `poster.jpg` yapar. Bu kare site kartında ve oynatıcının açılışında görünür.
5. **Belgeler:**
   - Filmin `README.md`'si: ne anlattığı, bölümler, nasıl çalıştırıldığı, kaynak özeti.
   - Kök `README.md` tablosuna bir satır.
   - `COST.md`.
6. **Site:**
   - Kökte `npm run build -- <slug>` çalıştır.
   - `dist/<slug>/` oynatıcıyla açılır: `index.html`, `film/`, `soundtrack.m4a`.
   - Oynatıcıyı yerelde bir sunucuyla aç. Oynat'a bas, birkaç noktaya atla. Görüntünün sesle birlikte ilerlediğini ve altyazının göründüğünü kareyle doğrula.
7. **Yayın:**
   - Türkçe bir commit mesajı yaz ve `main`'e push et.
   - Canlı adresi doğrula: `https://eyupduran.github.io/animasyon-lab/<slug>/`. Adres 200 dönmeli, oynatıcı açılmalı.

## Son mesaj

Canlı adres, süre, `soundtrack.m4a` boyutu, poster için seçilen an, bulunan kusurlar (düzeltilen ve kullanıcıya bırakılan) ve anlatımda `RESEARCH.md`'de bulunamayan sayılar.
