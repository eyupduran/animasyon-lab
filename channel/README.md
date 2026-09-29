# Kanal çizelgesi

**Şimdi Anladım** YouTube kanalında hangi gün hangi videonun çıkacağı burada durur. Filmlerin nasıl yapılacağıyla ilgili hiçbir şey burada yazmaz; burası yalnızca **ne zaman, hangi konu**.

Kanal filmleri `youtube/` klasöründe durur. `animations/` altındaki eski filmler denemedir; çizelgeye girmez, kanala yüklenmez.

| Dosya | Ne |
|---|---|
| `plan.json` | Tek kaynak. Günler, seriler, videolar, yedek konular, kaynaklar. |
| `PLAN.md` | Çizelgenin okunur hâli. Üretilir, elle düzenlenmez. |
| `plan.html` | Çizelge sayfası (Artifact olarak yayınlanır). Üretilir. |
| `page.template.html` | Sayfanın kalıbı. |

## Komutlar

```
/next                  sıradaki videoyu üretir, sitede yayınlar, çizelgeyi günceller
/next 12               12 numaralı videoyu üretir
/youtube <slug>        YouTube paketini çıkarır (video, altyazı, kapaklar, başlık)
/plan                  dönemi değerlendirir, sonraki dört ayı kurar
/plan <istek>          küçük düzeltme: kaydırma, konu değiştirme

npm run plan                           çizelgeyi tablo olarak yazdırır
npm run plan -- next                   sıradaki videoyu ve isteğini gösterir
npm run plan -- show <no|slug>         tek satırı gösterir
npm run plan -- set <no|slug> status=published youtube=<adres>
npm run plan -- check                  tutarlılık denetimi
npm run plan -- build                  PLAN.md ve plan.html üretir
npm run compile -- derleme-1           çizelgedeki derlemeyi tek video yapar
npm run topics -- suggest "<arama>"    konu araştırması (ayrıca: top, channels)
```

Durumlar: `planned` (planlandı) → `produced` (film sitede) → `packaged` (YouTube paketi hazır) → `published` (YouTube'da). Atlanan video `skipped`.

Çizelge dışı filmler serbesttir: `/animation <konu>` çizelgeye dokunmaz. O film de `youtube/` altına gider ve aynı yoldan yayınlanır; yalnızca istek "deneme" diyorsa `animations/` altına açılır.

## Kurallar

1. **İki gün.** İlk video hazır olur olmaz çıkar. Sonrası Pazar 19.00 ana video, Çarşamba 19.00 ikinci video. Pazar her hafta çıkar. Çarşamba yetişmezse atlanır; konu `reserve` listesine düşer, sıra kaymaz.
2. **Dönüşümlü seriler.** En çok dört ana seri ve iki deneme serisi. Pazar günü tarih ve coğrafya dönüşümlü; Çarşamba günü öbür seriler dönüşümlü.
3. **Her video tek başına izlenir.** "Geçen bölümde" diye başlayan video olmaz. Seri sırası YouTube'daki oynatma listesinde kurulur (seri oynatma listesi; bir video yalnızca bir seri listesinde olabilir).
4. **Her konunun dayanağı olur.** Ya insanların YouTube'da aradığı bir ifade ya da izlenmiş bir örnek video. Dayanak `evidence` alanına yazılır. Dayanaksız konu çizelgeye girmez.
5. **Takvim önce gelir.** Belirli bir güne bağlı konu o günden en geç bir gün, en erken bir hafta önce yayınlanır. Tarihi kaçmaması gerekenler `hook.fixed: true` ile işaretlenir.
6. **Müfredata bağlı değiliz.** Sınav hazırlığı ders anlatan kanalların işi. Okulda da işlenen konular `school: true` ile işaretlenir; öğrenci aradığında bulsun diye.
7. **İstek metni yalnızca konuyu söyler.** `brief` alanında konu, tür, süre, açı, kategori ve slug olur. Görünüm, teknik, renk, kamera yazılmaz; onlar filmi yapanın kararı.
8. **Türk tarihi Türk kaynaklarından.** İzleyici Türkiye'de ve bu konuları okulda öğrendi. Anlatı Türkiye'deki akademik tarih yazımına dayanır, adlar Türkiye'de öğretildiği gibi söylenir. Kurallar `.claude/skills/narration/formats/history.md` içinde; metin aşaması uygular.
9. **Uzak durulan konular.** Güncel siyaset; izleyiciyi ikiye bölen tartışmalar; "şöyle olsaydı ne olurdu" türünden kurgu tarih (doğruluk kuralıyla çelişir); kanal para kazanmaya başlayana kadar sağlık ve para konuları. YouTube'un kuralları sağlık, hukuk ve para konularında yapay zekâ kişiliğiyle tavsiye veren kanalları para kazanma dışında tutuyor. Biz tavsiye vermiyoruz, yalnızca nasıl çalıştığını anlatıyoruz; yine de başvuru incelenirken soru işareti bırakmamak için bu konular sonraya kalıyor.
10. **Derleme.** Bir seride beş altı video birikince `npm run compile` ile tek parça bir video çıkarılır. Yeni üretim gerektirmez.
11. **Değerlendirme.** Dördüncü haftada yayın saati, sekizinci haftada seriler gözden geçirilir. Karar sayılara göre verilir: video başına izlenme ve ortalama izlenme yüzdesi. Sayılar çizelge sayfasında videonun kartına yazılır.

## Bu çizelge neye dayanıyor

29 Eylül 2026'da yapılan araştırma:

- **Türkiye'de tarih en çok izlenen alan.** Harp Tarihi, DFT Tarih ve Anime Tarih'in en çok izlenen videoları 2–8 milyon arasında. Ortak kalıp: haritalı anlatım, "nasıl kuruldu", "neden yıkıldı", tek parça uzun video.
- **Coğrafyada sınav hazırlığı kanalları baskın.** Coğrafyanın Kodları 2,2 milyon abone; içerik ders anlatımı. Merak sorusu soran coğrafya videosu az.
- **"Nasıl çalışır" aramalarının yanına "animasyon" yazılıyor.** Kalp, beyin, borsa, buzdolabı, nükleer santral, deprem, piramitler: hepsinin "animasyon" ekli araması var.
- **Yurt dışındaki en büyük animasyonlu anlatım kanalları 6–12 dakikalık video yapıyor.** Kurzgesagt, TED-Ed, RealLifeLore, Primal Space.
- **Felsefe daha küçük ama sadık bir kitle.** Filozof ve düşünce deneyi videoları 300 bin – 1 milyon arasında.
- **1 Şubat 2027'de YouTube'un para kazanma eşiği yeni başvurular için iki katına çıkıyor.** Bu dönemin hedefi o tarihten önce 1.000 abone ve 4.000 saate ulaşmak.

Araştırma `npm run topics` ile yinelenebilir. Kaynakların tam listesi `PLAN.md`'nin sonunda.

## Bilinen sınırlar

- Yayın saati önerisi pazarlama bloglarından geliyor, resmî veri değil. Dördüncü haftada YouTube Studio'daki gerçek veriyle düzeltilir.
- Örnek videoların izlenme sayıları yıllar içinde birikmiş sayılar; yeni bir kanalın aynı sayıya ulaşacağı anlamına gelmez. Konunun ilgi çektiğini gösterir, o kadar.
- `npm run topics` YouTube'un herkese açık sayfalarını okur. YouTube sayfa biçimini değiştirince araç boş sonuç döner; o zaman ayrıştırıcı güncellenir.
