# {{title}}

`animations/{{slug}}` — yeni animasyonun kendi klasörü.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `animation.json` | Başlık, giriş/bitiş metinleri, sahne dosyalarının sırası, gömülecek dosyalar, video ayarları |
| `scenes/*.js` | Sahneler: `defWorld` bir 3D dünya kurar, `defChapter` o dünyada geçen bir bölümü (süre, kamera, alt yazılar, etiketler) tanımlar |
| `scenes/main.js` | En son yüklenir ve motoru başlatır |
| `assets/` | Gömülecek dosyalar (ör. karakter GLB); `animation.json` → `embed` ile eklenir |
| `poster.jpg` | (isteğe bağlı) ana sayfadaki kart görseli, 16:9 |

## Komutlar

```
npm run build -- {{slug}}     # dist/{{slug}}/index.html
npm run video -- {{slug}}     # renders/{{slug}}/*.mp4
```
