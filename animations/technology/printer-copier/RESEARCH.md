# Araştırma notları: Yazıcı ve fotokopi

Tek cümlelik çekirdek: Lazer yazıcı mürekkeple yazmaz; ışıkla, durgun elektrikle bir toz resmi çizer ve onu kâğıda eritir. Fotokopi aynı yolu bir kez daha yürür: önce ışıkla okur, sonra yeniden yazar; her yeniden yazışta resim biraz değişir.

## Kaynaklar

| # | Kaynak | Adres |
|---|---|---|
| K1 | Wikipedia, "Xerography" | https://en.wikipedia.org/wiki/Xerography |
| K2 | Wikipedia, "Laser printing" | https://en.wikipedia.org/wiki/Laser_printing |
| K3 | Wikipedia, "Chester Carlson" | https://en.wikipedia.org/wiki/Chester_Carlson |
| K4 | Wikipedia, "Toner (printing)" | https://en.wikipedia.org/wiki/Toner_(printing) |
| K5 | Wikipedia, "Halftone" | https://en.wikipedia.org/wiki/Halftone |
| K6 | Wikipedia, "Machine Identification Code" | https://en.wikipedia.org/wiki/Machine_Identification_Code |
| K7 | Wikipedia, "Paper size" (ISO 216) | https://en.wikipedia.org/wiki/Paper_size |
| K8 | ETHW / IEEE Milestone, "Development of the Commercial Laser Printer, 1971-1977" | https://ethw.org/Milestones:Development_of_the_Commercial_Laser_Printer,_1971-1977 |
| K9 | Wikipedia, "Gary Starkweather" | https://en.wikipedia.org/wiki/Gary_Starkweather |
| K10 | Xerox, "Chester Carlson Xerography History" | https://www.xerox.com/en-us/innovation/insights/chester-carlson-xerography |
| K11 | Metro Fuser, "How The Laser Printer Works" (write white / write black) ve ABD patentleri 5402214, 4500198 (boşaltılmış alan geliştirme) | https://www.metrofuser.com/post/how-the-laserjet-printerworks |
| K12 | ABD patenti 10425557 "Frequency-adaptive descreening…" ve ScanTips "Descreen for moiré" | https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10425557 · https://www.scantips.com/basics6b.html |
| K13 | Wikipedia, "Generation loss" ve ABD patenti 4416530 (kopyanın kopyasında ince ayrıntı kaybı) | https://en.wikipedia.org/wiki/Generation_loss · https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4416530 |
| K14 | Fuser sıcaklığı: HP destek topluluğu (bir Color LaserJet için 175–215 °C), Boston Business Technology / Laser Tek Services (180–220 °C) | https://h30434.www3.hp.com/t5/LaserJet-Printing/Fusing-time-and-temperature-for-heavy-media/td-p/7106856 |
| K15 | Wikipedia, "Inkjet printing" | https://en.wikipedia.org/wiki/Inkjet_printing |
| K16 | Wikipedia, "Image scanner" (CCD ve CIS) | https://en.wikipedia.org/wiki/Image_scanner |

## Bilgiler

### Kâğıt
- A4: 210 × 297 mm. Bütün A boyutlarında kenar oranı √2 ≈ 1,414; ortadan katlayınca bir alt boyut çıkar (A4 → A5). A0 bir metrekare. (K7)
- Oranın bu özelliği 1786'da Lichtenberg tarafından fark edildi; standart 1922'de Almanya'da DIN 476 oldu. (K7)
- 80 g/m² kâğıttan bir A4 yaklaşık 5 gram. (K7)

### Kserografi süreci (lazer yazıcı ve fotokopinin ortak yolu)
- Adımlar: yükleme, pozlama, geliştirme (toner), aktarma, ayırma, sabitleme (fuser), temizleme. (K1, K2)
- Yükleme: korona teli ya da yeni makinelerde şarj silindiri tambura durgun elektrik yükler; K1 örnek değer olarak −600 volt veriyor. Filmde "yüzlerce volt" diye temkinli söylenir. (K1, K2)
- Tambur ışığa duyarlı bir kaplamadır (fotoiletken): karanlıkta yükü tutar, ışık düşen yerde yük akıp gider. Xerox 914'ün atılımı selenyum kaplı silindirik tamburdu. (K1)
- Lazer, mercekler ve aynalarla tambura yazar; K2'ye göre saniyede altmış beş milyona kadar piksel. Tarama dönen çokgen bir aynayla yapılır. (K2, K8)
- Toner ıslak mürekkep değil: kuru plastik toz, içinde karbon siyahı ya da renk verici. Polimer olarak stiren akrilat, polyester gibi. (K2, K4)
- Tanecik boyu: eski tonerlerde 14–16 mikrometre; 600 dpi için kabaca 5, 1200 dpi için 3 mikrometre gerekir. (K4)
- Aktarma: toner tamburdan kâğıda basınç ve elektrostatik çekimle geçer. (K1)
- Sabitleme: ısı ve basınç tozu eritip kâğıt liflerine bağlar; bu yüzden sayfa sıcak çıkar. Tipik ısıtıcı sıcaklığı yaklaşık 180–220 °C (K14). K2'deki "427 °C'ye kadar" ifadesi olağan ofis yazıcısı için yanıltıcı; kullanılmadı.
- Temizleme: kalan toner fırça ya da bıçakla alınır, tambur yeniden yüklenir. (K1, K2)
- Korona deşarjı az miktarda ozon üretir. (K2)

### Yazıcı "siyahı yazar", eski fotokopi "beyazı yazar"
- Analog fotokopi makinesi "write white": aslın beyaz yerlerinden yansıyan ışık tamburu boşaltır, toner ışık görmeyen yüklü yerlere tutunur. (K11)
- Lazer yazıcı "write black": lazer yalnızca tonerin gideceği noktaları boşaltır; toner boşaltılmış yerlere tutunur (boşaltılmış alan geliştirme). (K11)

### Tarih
- Chester Carlson, P. R. Mallory şirketinde patent bölümünün başıydı; patent metinlerinin ve çizimlerin kopyasını çıkarmanın kolay yolu yoktu (daktilo ve karbon kâğıdı). (K3)
- İlk deneyler mutfakta; kükürt yangınları yüzünden Queens'te bir oda kiraladı. (K3)
- 22 Ekim 1938, Astoria: Otto Kornei bir cam lama "10.-22.-38 ASTORIA." yazdı; kükürt kaplı çinko levha yüklendi, ışıkla pozlandı, likopodyum tozu serpildi, görüntü mumlu kâğıda aktarıldı. İlk kserografik görüntü. (K3, K10)
- 1939–1944 arasında yirmiden fazla şirket fon vermeyi reddetti; IBM bunlardan biri. 1944'te Battelle ilgilendi. (K3)
- 1946'da Haloid ile anlaşma. ABD patenti 2.297.691, 6 Ekim 1942. (K1, K3)
- Xerox 914: 16 Eylül 1959'da tanıtıldı; K1 ilk ticari otomatik fotokopi olarak 1960 veriyor (tanıtım 1959, satış 1960). Filmde "elli dokuzda tanıtıldı" denir. (K1, K3)
- "Kserografi": Yunanca kseros "kuru" + grafia "yazı". (K1)
- Gary Starkweather: 1969'da Xerox'ta fikir; 1971'de PARC'ta bir Xerox 7000 fotokopi makinesini temel alarak SLOT adlı ilk çalışan lazer yazıcıyı yaptı. Sonra EARS, ardından 1977'de Xerox 9700. (K2, K8, K9)
- HP LaserJet 1984, 3.500 dolar. (K2)

### Gri yok: yarım ton (halftone)
- Yarım ton, sürekli tonu değişen büyüklükte ya da aralıkta noktalarla taklit eder; göz uzaktan noktaları karıştırır. (K5)
- Renkte CMYK ekran açıları tipik olarak 15°, 75°, 0°, 45°; amaç hareli deseni (moiré) azaltmak. (K5)
- Gazete kâğıdı ~85 lpi, 600 dpi lazer yazıcı ~85–105 lpi. (K5)
- Fox Talbot 1852 patenti; ilk yarım ton fotoğraf 30 Ekim 1869, Canadian Illustrated News. (K5)
- AM (nokta büyüklüğü değişir) ve FM/stokastik (nokta aralığı değişir) tarama. (K5)

### Fotokopi bir fotoğrafı ne yapar
- Bugünkü dijital fotokopi önce tarar (sensör satırı ışıkla okur), sonra yazıcı gibi yeniden basar. CIS sensörü belgeye neredeyse değer; CCD mercek ve ayna kullanır. (K16)
- Yarım tonla basılmış bir sayfayı kopyalarken, aslın nokta ızgarası ile fotokopinin kendi ızgarası karışır ve hareli desen çıkar; bunu önlemek için makineler önce noktaları yumuşatır (descreen). (K12)
- Kopyanın kopyası: her kuşakta kalite düşer; ince ayrıntılar parçalanır ve sonunda kaybolur. (K13)

### Mürekkep püskürtmeli (yan bilgi)
- Isıl mürekkep püskürtme: direnç mürekkebi anında buharlaştırır, kabarcık damlayı iter. Canon'da Ichiro Endo, HP'de John Vaught birbirinden habersiz geliştirdi; Endo ekibinde bir havya şırıngayı ısıtınca mürekkep fışkırdı. Epson piezoelektrik kullanır. (K15)

### Takip noktaları
- Birçok renkli lazer yazıcı sayfaya çıplak gözle zor görülen sarı noktalar basar: çapı yaklaşık 0,1 mm, aralığı ~1 mm; seri numarası, tarih ve saat kodlanır. EFF 2005'te çözdü. (K6)

## Şaşırtan şeyler
- Lazer yazıcıda hiç mürekkep yok; siyah, eritilmiş plastik tozudur. Çıktı bu yüzden sıcaktır.
- Lazer kâğıda hiç dokunmaz; tambura yazar.
- Eski fotokopi beyazı "yazar", lazer yazıcı siyahı.
- İlk lazer yazıcı bir fotokopi makinesinden yapıldı.
- Bastığı fotoğrafta tek bir gri nokta yok.
- Renkli yazıcılar sayfaya görünmez sarı bir imza bırakabilir.

## Yaygın yanlışlar
- "Lazer, yazıyı kâğıda yakar." Yanlış: lazer tambura ışık düşürür; kâğıda ısıtıcı ile tutunur.
- "Toner bir çeşit mürekkep." Yanlış: kuru plastik tozdur.
- "Fotokopi, sayfanın fotoğrafını çeker." Kısmen: okur, ama sonra baştan yeniden yazar; aslındaki noktaları da kopyalar ve kendi noktalarıyla karıştırır.
- "Yazıcı gri basar." Yanlış: yalnızca nokta ya da boşluk vardır.

## Emin olunmayanlar (filmde temkinli)
- Tambur voltajı: makineden makineye değişir; "yüzlerce volt".
- Isıtıcı sıcaklığı: "iki yüz dereceye yakın".
- Sarı noktalar: "birçok renkli yazıcı"; hepsi değil.
