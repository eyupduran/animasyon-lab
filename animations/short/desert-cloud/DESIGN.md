# Tasarım notları

## Elenen dört fikir (treatment → 3)

- **Fırıldak (yalnızlık → buluşma):** tepe ambarının çatısında paslanmış rüzgârgülü horoz, göç eden turnalarla aynı yöne dönmek ister. Elendi: kahraman sert metal, yumuşak eklentisi yok; iki renk durumu (pas / günbatımı) birbirine yakın; turna sürüsü bir günlük işi ikiye böler.
- **Kuyruk (kayıp → bulma):** ipi kopmuş uçurtma tuz gölünde kendi yansımasını ip sanıp izler. Elendi: "yansımayı ip sanmak" sözsüz okunmaz; kahraman yalnızca sürüklenir, isteğini eylemle göstermez.
- **Fener (korku → cesaret):** ışığından korkan yavru fener balığı. Cazibe kapısında elendi: gökyüzü yok, iki renk durumu da koyu; ışığın yayılması yasak "ışıklanan ağaç" sahnesine fazla yakın.
- **Kabuk (uyku → uyanış):** kar altında uyuyan salyangoz baharla uyanır. Elendi: kahraman çok yavaş, doruk anı (kar erimesi) kahramanın eylemi değil.

## Sağanak'ın kuralları

- **Tek kaynak:** bulutun davranışı (`hero`), hava (`env`) ve ışık (`look`) `src/score.js` içinde zamanın saf fonksiyonları. Görüntü de ses de bu tablodan okur; ses olayları aynı zaman sabitlerine (`CLIMAX`, `SIZZLE`, damla zamanları) bağlı.
- **Bulut:** 32 kabarcık + 5 kuyruk kabarcığı, tek `InstancedMesh`. Büyüme `grow` değeriyle kule kabarcıklarını sırayla "kaynatır" (geri esneyen giriş). Gözler yüz kabarcığının yüzeyine oturan iki dörtgen; göz kapağı, sevinç (alt kapak eğrisi) ve hüzün (içe eğik üst kapak) gölgelendiricide.
- **Duygu tempoyla:** varışta sönümlü yaylanma, sıkmadan önce çömelme, sıkarken titreme, üzülünce tepe kabarcıklarının sarkması, rüzgâra kapılmadan önce iki kez geri dönüş, sevinçte ezilip uzayan üç zıplama. Kuyruk hareketin ve rüzgârın tersine akar (ikincil hareket).
- **Işık dönüşümü:** altı durumlu palet (öğle → ikindi → günbatımı → fırtına → yağmur sonrası → alacakaranlık); A durumu turuncu kanyon + beyaz bulut, B durumu ultramarin/menekşe gök + zümrüt çayır + macenta çiçek. Gökkuşağı gök ve uzak arazi gölgelendiricisinde güneşin karşı noktasına göre hesaplanır.
- **Çayır:** 14 000 çiçek ve 16 000 çimen öbeği baştan yerleştirilir; büyümeleri tomurcuktan yayılan bir cephe yarıçapıyla (`uBloomR`) köşe gölgelendiricisinde açılır. Uzak çayırın rengi arazi gölgelendiricisinde boyanır.
- **Performans:** son işleme kendi hattı (yalnız sahne hedefi MSAA; 5 basamaklı dual-filter bloom; ton eşleme dahil tek bitiş geçişi). EffectComposer + UnrealBloom ile MSAA'lı ara hedefler Iris Xe'de kareyi 40 ms'ye çıkarıyordu. Görünmeyen çiçekler köşe gölgelendiricisinde erken çıkar; arazi çatlakları yalnızca 60 m içinde hesaplanır.
