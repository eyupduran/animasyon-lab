# Bir Lokumun Yolculuğu

![Kafede lokumu ısıran karakter](poster.jpg)

Bir parça fıstıklı lokumun ağızdan beyne uzanan yolculuğu; yanında giden minik bir "kapsül kamera" gözünden. Kafede oturan gerçekçi bir karakter (Avaturn GLB) lokumu parmaklarıyla alıp ısırır, röntgen görünümünde dişler, dil ve yemek borusu görünür; kamera ağızdan içeri girer.

```
npm run build -- lokumun-yolculugu
npm run video -- lokumun-yolculugu
```

## Duraklar

| # | Durak | Sahne dosyası | Neler oluyor |
|---|---|---|---|
| 0 | İlk Isırık | `cafe.js` | Karakter lokumu alıp ısırıyor ve çiğniyor; röntgende dişler, dil, yutak, yemek borusu |
| 1 | Ağız | `upper-tract.js` | Kesici ve azı dişleri, tükürük ve amilaz, lokma oluşumu |
| 2 | Yutak | `upper-tract.js` | Yumuşak damak, gırtlak kapağı soluk borusunu kapatıyor |
| 3 | Yemek Borusu | `upper-tract.js` | Peristaltik dalga, mide ağzı |
| 4 | Mide | `stomach.js` | Mide özsuyu (HCl), pepsin, çalkalanma, kimus, pilor |
| 5 | Onikiparmak Bağırsağı | `intestine.js` | Safra ve pankreas özsuyu, yağ emülsiyonu, nişasta → maltoz |
| 6 | İnce Bağırsak | `intestine.js` | Salınan villuslar, bir villusa dalış |
| 7 | Kana Geçiş | `absorption.js` | Sükroz → glikoz + fruktoz, SGLT1, hücre içi, GLUT2, kılcal damar |
| 8 | Karaciğer | `blood.js` | Kapı toplardamarı, hepatositler, glikojen |
| 9 | Kalp | `heart.js` | Sağ kulakçık, triküspit kapakçık, sağ karıncık |
| 10 | Akciğerler | `blood.js` | Alveoller, O₂ ve CO₂ değişimi |
| 11 | Sol Kalp ve Aort | `heart.js` | Mitral ve aort kapakçıkları, aort kavsi, şah damarı |
| 12 | Beyin | `brain.js` | Kan-beyin bariyeri, GLUT1, nöronlar, ATP, tüm beyin |
| 13 | Kalın Bağırsak | `colon.js` | Haustra, bakteriler, lifler, su emilimi, rektum |
| – | Özet | `finale.js` | Tüm rota ve her durağın süresi |

Diğer dosyalar: `body-map.js` (sağ üstteki vücut haritası), `lokum.js` (lokum modeli), `main.js` (karakteri yükleyip motoru başlatır).

## Karakter

`assets/avatar.glb`, `cafe-avatars-glb/set-01-m01.glb` modelinden `npm run avatar` ile üretildi. Karakteri değiştirmek için aynı komutu başka bir modelle çalıştırıp yeniden derlemek yeterli. Oturma pozu, kol hareketi (ters kinematik), parmaklar ve yüz ifadeleri `cafe.js` içindeki `cafePose` ve bölüm güncellemesinde.

Eğitim amaçlıdır; ölçekler ve süreler yaklaşıktır, moleküller görünür olsun diye büyütülmüştür.
