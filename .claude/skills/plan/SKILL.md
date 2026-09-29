---
name: plan
description: Yayın çizelgesini gözden geçirir, düzeltir ya da yeni dönem için uzatır. Yayınlanan videoların sonuçlarına bakar, konu araştırır, channel/plan.json'a yeni haftaları ekler ve çizelge sayfasını günceller.
argument-hint: [istek; ör. "şubat–mayıs dönemini kur", "bir hafta geç başladım, kaydır", "12 numarayı yedekteki Roma ile değiştir"]
disable-model-invocation: true
---

İstek:

> $ARGUMENTS

Boşsa iş şudur: bitmekte olan dönemi değerlendir ve sonraki dört ayı kur.

Bu komut yalnızca çizelgeyle ilgilenir; film yapmaz, filmlerin klasörlerini açmaz. Bu komutu çalıştırmak `channel/` için commit ve push onayıdır.

## Önce oku

- `channel/README.md`: çizelgenin kuralları. Bu kurallara uy; bir kuralı değiştirmen gerekiyorsa nedenini kullanıcıya söyle.
- `npm run plan`: çizelgenin bugünkü hâli. Kaynak dosya `channel/plan.json`.

## Küçük işler

Kaydırma, bir konuyu değiştirme, bir videoyu atlama gibi isteklerde yalnızca isteneni yap: `channel/plan.json`'ı düzenle, sonra "Kaydet" adımına geç. Takvime bağlı (`hook.fixed`) videoların tarihini kaydırma; onların çevresindekileri kaydır.

## Yeni dönem

1. **Sonuçlara bak.** Çizelge sayfasının veritabanında kullanıcının girdiği sayılar durur: ArtifactData aracıyla `channel.artifact` adresindeki `marks` koleksiyonunu listele (`published`, `url`, `views`, `avg`). Sayı yoksa kullanıcıdan YouTube Studio'dan video başına izlenme ve ortalama izlenme yüzdesini iste; bu tek soru dışında soru sorma.
2. **Serileri karşılaştır.** Seri başına ortalama izlenme ve ortalama izlenme yüzdesi. Tek bir videonun patlaması seriyi kurtarmaz; ortancaya bak. Karar: en iyi seri fazladan hafta alır, en zayıf deneme serisi durur, yerine en çok bir yeni deneme serisi açılır.
3. **Konu araştır.** Her yeni konu için bir dayanak bul ve satırın `evidence` alanına yaz:
   - `npm run topics -- suggest "<arama başı>"`: insanların YouTube'da ne aradığı.
   - `npm run topics -- top <kanal>`: bir kanalın en çok izlenen videoları.
   - `npm run topics -- channels "<arama>"`: bir alandaki kanallar.
   Önce `reserve` listesine bak; oradaki konuların dayanağı hazır.
4. **Takvimi yerleştir.** Dönemdeki belirli günleri ve yıl dönümlerini bul, tarihlerini internetten doğrula, o konuları önce yerleştir. Kalan haftalara serileri sırayla dağıt.
5. **Satırları yaz.** Her satırda: `no`, `date`, `slot`, `series`, `category`, `slug`, `status: "planned"`, `minutes`, `title`, `angle`, `brief`, `hook`, `school`, `evidence`. `brief` konuyu, türü, süreyi, açıyı, kategoriyi ve slug'ı söyler; görünüm, teknik, renk ya da kamera söylemez. Eski dönemin satırlarını silme; `channel.period` bitişini yeni döneme uzat.
6. **Dönüm noktaları ve derlemeler.** Yeni dönemin dördüncü ve sekizinci haftasına birer değerlendirme, bir seride beş altı video biriktiyse bir derleme ekle.

## Kaydet

1. `npm run plan -- check`. Hata varsa düzelt.
2. `npm run plan -- build`.
3. `channel/` değişikliklerini Türkçe bir mesajla commit'le ve push et.
4. Çizelge sayfasını güncelle: Artifact aracıyla `channel.artifact` adresini oku (`action: "read"`), sonra `channel/plan.html` dosyasını aynı adrese yayınla (`url` ile; `capabilities` ve `icon` verme).

## Son mesaj

Ne değişti, neden; seri başına sonuçlar (varsa); yeni dönemin ilk dört haftası; çizelge sayfasının adresi; emin olmadığın tarihler.
