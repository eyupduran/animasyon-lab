# {{title}}

`animations/{{slug}}` — Three.js şablonundan başlatılan animasyon. Bu dosyayı animasyonun kendi anlatımıyla güncelleyin (ne anlatıyor, bölümler, notlar).

## Komutlar

Bu klasörde:

```
node build.mjs          # → dist/index.html
npm install             # yalnızca video için
npm run video           # → renders/*.mp4
npm run video:test      # her bölümden bir kare
```

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `animation.json` | Başlık, açıklama, teknik, derleme komutu; giriş/bitiş metinleri; sahne dosyalarının sırası; gömülecek dosyalar; video ayarları |
| `src/engine/` | Motor: `shell.html` (arayüz), `core.js` (dokular, geometri, parçacıklar), `engine.js` (zaman çizelgesi, alt yazı, ses, video modu) |
| `src/scenes/*.js` | Sahneler: `defWorld` bir 3D dünya kurar, `defChapter` o dünyada geçen bir bölümü (süre, kamera, alt yazılar, etiketler) tanımlar |
| `src/scenes/main.js` | En son yüklenir ve motoru başlatır |
| `assets/` | Gömülecek dosyalar; `animation.json` → `embed` ile eklenir |
| `poster.jpg` | Sitedeki kart görseli (16:9, isteğe bağlı) |
