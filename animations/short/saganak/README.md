# Sağanak

Sözsüz kısa film (72 sn). Kavruk, kızıl bir kanyonda avuç kadar bir bulut, çatlak toprakta boynu bükük bir tomurcuk görür; damlaları yere varmadan buharlaşır. Rüzgâra kendini bırakır, yamaç boyunca yükselip dağ kadar büyür ve yağar; vadi çiçek açar.

Bu film bir **kıyas deneyinin** sonucudur: aynı hikâye ve aynı yaratıcı şartlar, ama proje kuralları, skiller ve teslim listesi olmadan, boş bir klasörde tek bir prompt'la üretildi (Opus 5.5, ~35 dk). Aynı hikâyenin kurallarla üretilmiş hâli `desert-cloud`. Sonuç, deponun "film oturumu serbest, paketleme ayrı" düzenine geçmesine yol açtı.

Teknik: tek `index.html`, Canvas 2D, katmanlı boyama, Web Audio ile sentezlenmiş ses. Klavye: F tam ekran, boşluk duraklat, R baştan, oklar 5 sn. `?t=<sn>` tek kare, `?video=1` video modu (`window.__film`).

```
npm run build -- saganak
npm run video -- saganak
```
