// The narration: one recording per chapter. `text` is what the subtitles show, `say` (when given)
// is how the narrator reads it (numbers as words). `cues` name moments in the text; the scene
// ties its events to the time the narrator reaches that phrase (see timeline.js).
// Every statement is backed by RESEARCH.md.

export const CHAPTERS = [
  {
    id: 'acilis', title: 'Karıncanın Gözünde Hayat', short: 'Açılış',
    text: 'Bir karıncanın gözünden bakınca dünya nasıl görünür? Şu dev kayalara bakın: hepsi aslında birer kum tanesi. Arkadaki yeşil kuleler ise sıradan çim yaprakları. Bu dünyanın sakini şimdi yola çıkıyor: boyu dört beş milimetre olan bir siyah bahçe karıncası. Gelin, bir gün boyunca onun peşine takılalım.',
    cues: { rocks: 'Şu dev kayalara', grains: 'hepsi aslında', towers: 'Arkadaki yeşil', resident: 'Bu dünyanın sakini', size: 'boyu dört', follow: 'Gelin' },
  },
  {
    id: 'olcek', title: 'Dev Bir Dünya', short: 'Ölçek',
    text: 'Önce ölçeği anlayalım. Karıncamızı bir insan boyuna büyüttüğümüzü düşünelim. O zaman 7,5 santimlik bir çim yaprağı, otuz metreyi aşan, on katlı bir bina kadar olurdu. İri bir kum tanesi, belimize kadar gelen bir kaya. Büyükçe bir çiy damlası ise neredeyse karıncanın boyu kadar bir su küresi. Karıncamız her sabah bu dev manzaranın içinde yola çıkıyor.',
    say: 'Önce ölçeği anlayalım. Karıncamızı bir insan boyuna büyüttüğümüzü düşünelim. O zaman yedi buçuk santimlik bir çim yaprağı, otuz metreyi aşan, on katlı bir bina kadar olurdu. İri bir kum tanesi, belimize kadar gelen bir kaya. Büyükçe bir çiy damlası ise neredeyse karıncanın boyu kadar bir su küresi. Karıncamız her sabah bu dev manzaranın içinde yola çıkıyor.',
    cues: { human: 'Karıncamızı bir insan', blade: 'O zaman', grain: 'İri bir kum', drop: 'Büyükçe bir çiy', go: 'Karıncamız her sabah' },
  },
  {
    id: 'beden', title: 'Bir İşçinin Bedeni', short: 'Beden',
    text: 'Bu karınca bir işçi, yani bir dişi. Yuvadaki bütün işçiler dişidir; erkekler yalnızca çiftleşme zamanı ortaya çıkar. Okulda böceklerin baş, göğüs ve karından oluştuğunu öğreniriz. Karıncada iş biraz daha ilginç. Göğüs sandığımız parçanın arkasına karnın ilk halkası kaynaşmıştır; bu birleşik parçaya mezozoma denir. İnce bel ise aslında karnın ikinci halkasıdır. Altı bacağın hepsi mezozomaya bağlıdır. Karıncanın kemiği yoktur; bedenini dıştan, kitin denen sert bir zırh sarar. Akciğeri de yoktur: hava, yanlardaki minik deliklerden ince borucuklarla bütün bedene dağılır.',
    cues: { female: 'Bu karınca', school: 'Okulda', parts: 'baş, göğüs', fused: 'Göğüs sandığımız', meso: 'mezozoma denir', waist: 'İnce bel', legs: 'Altı bacağın', armor: 'Karıncanın kemiği', breath: 'Akciğeri de' },
  },
  {
    id: 'gozler', title: 'Bulanık Bir Mozaik', short: 'Gözler',
    text: 'Peki bu karınca bizi görebilir mi? Başının iki yanındaki parlak kabarcıklar bileşik gözlerdir. Her biri, bal peteği gibi dizilmiş minik merceklerden oluşur. Ama siyah bahçe karıncasının her gözünde yalnızca yüz kadar mercek vardır ve her mercek dünyadan tek bir nokta yakalar. Yani karıncamızın gördüğü dünya keskin bir fotoğraf değil, bulanık bir nokta mozaiğidir. Işığı, gölgeyi ve hareketi fark eder, ama bir yüzü asla seçemez. Bizim gördüğümüzden yüzlerce kat daha bulanık bir dünya bu.',
    cues: { eye: 'Başının iki', facets: 'Her biri, bal', hundred: 'yalnızca yüz', point: 'her mercek', mosaic: 'Yani karıncamızın', motion: 'Işığı, gölgeyi', blur: 'Bizim gördüğümüzden' },
  },
  {
    id: 'koku', title: 'Antenlerle Görmek', short: 'Koku',
    text: 'Karıncanın dünyası gözlerle değil, antenlerle kurulur. Bu dirsekli antenler on iki halkadan oluşur ve üzerleri minik algılayıcı tüylerle kaplıdır. Karınca onlarla koklar, tadar ve dokunur; nemi, sıcaklığı, titreşimi hisseder. Karıncalarda koku alma genlerinin sayısı üç yüzü, dört yüzü bulur; bir meyve sineğinde bu sayı altmış kadardır. Bizim göremediğimiz bir koku haritası, karıncanın önünde apaçık durur.',
    say: 'Karıncanın dünyası gözlerle değil, antenlerle kurulur. Bu dirsekli antenler on iki halkadan oluşur ve üzerleri minik algılayıcı tüylerle kaplıdır. Karınca onlarla koklar, tadar ve dokunur; nemi, sıcaklığı, titreşimi hisseder. Karıncalarda koku alma genlerinin sayısı üç yüzü, dört yüzü bulur; bir meyve sineğinde bu sayı altmış kadardır. Bizim göremediğimiz bir koku haritası, karıncanın önünde apaçık durur.',
    cues: { antenna: 'Bu dirsekli', senses: 'Karınca onlarla', genes: 'Karıncalarda koku', map: 'Bizim göremediğimiz' },
  },
  {
    id: 'kimlik', title: 'Kimlik Kontrolü', short: 'Kimlik',
    text: 'İki karınca karşılaştığında önce antenlerini birbirine dokundurur. Her koloninin kendine özgü bir kokusu vardır; bu koku, karıncanın zırhını kaplayan ince, yağlı bir tabakada saklıdır. Kokusu tanıdık gelen bir yuvadaştır. Yabancıysa kavga çıkabilir. Karıncalar kimlik kartlarını üzerlerinde taşır.',
    cues: { touch: 'İki karınca', odor: 'Her koloninin', mate: 'Kokusu tanıdık', foe: 'Yabancıysa', card: 'Karıncalar kimlik' },
  },
  {
    id: 'iz', title: 'Görünmez Yollar', short: 'Feromon izi',
    text: 'Karıncamız biraz sonra yere dökülmüş tatlı bir damla buluyor. Kursağını dolduruyor ve yuvaya dönüyor. Dönerken karnının ucunu yere değdirip bağırsağından gelen bir koku bırakıyor: bir feromon izi. Yuvadaki kardeşleri bu izi antenleriyle bulup kaynağa koşuyor. Yiyecek bulan her karınca, dönüşte izi biraz daha güçlendiriyor. Kaynak bitince iz yenilenmiyor ve bir saat içinde büyük ölçüde uçup gidiyor. Böylece yol, tam gerektiği kadar yaşıyor.',
    cues: { find: 'biraz sonra', drink: 'Kursağını', lay: 'Dönerken', trail: 'bir feromon izi', recruit: 'Yuvadaki kardeşleri', reinforce: 'Yiyecek bulan', fade: 'Kaynak bitince', end: 'Böylece yol' },
  },
  {
    id: 'kisayol', title: 'Lidersiz Akıl', short: 'Kısa yol',
    text: 'Peki bu yolları kim planlıyor? Hiç kimse. Bilim insanları bunu bir deneyle gösterdi: yuva ile yiyeceği, biri kısa biri uzun iki köprüyle bağladılar. Başta karıncalar iki yola da dağıldı. Ama kısa yoldan gidenler daha çabuk dönüp izlerini daha sık tazeledi. Koku kısa yolda birikti ve karıncalar giderek oraya yöneldi. Bir süre sonra trafiğin neredeyse tamamı kısa yoldaydı. Kraliçe emir vermiyor, harita yok, lider yok. Binlerce küçük karardan akıllıca bir düzen doğuyor. Buna kendiliğinden örgütlenme denir.',
    cues: { who: 'Peki bu', exp: 'Bilim insanları', bridges: 'yuva ile', split: 'Başta karıncalar', faster: 'Ama kısa', build: 'Koku kısa', win: 'Bir süre sonra', noleader: 'Kraliçe emir', order: 'Binlerce küçük', self: 'Buna kendiliğinden' },
  },
  {
    id: 'guc', title: 'Küçük ama Güçlü', short: 'Güç',
    text: 'Karıncaların gücü dillere destandır; bazı karıncalar kendi ağırlığının onlarca katını taşıyabilir. Ama bu bir süper güç değil, küçük olmanın sonucudur. Bir canlının boyunu iki katına çıkaralım: kaslarının kesiti dört kat büyür, ama ağırlığı sekiz kat artar. Boy büyüdükçe ağırlık, güçten hep daha hızlı artar. Bu yüzden insan boyunda bir karınca araba kaldıramazdı; büyük olasılıkla kendi ağırlığını bile zor taşırdı.',
    cues: { carry: 'Karıncaların gücü', notsuper: 'Ama bu', double: 'Bir canlının', area: 'kaslarının kesiti', volume: 'ağırlığı sekiz', faster: 'Boy büyüdükçe', giant: 'Bu yüzden' },
  },
  {
    id: 'fizik', title: 'Küçüklerin Fiziği', short: 'Fizik',
    text: 'Küçük olmak, fiziğin kurallarını da değiştirir. Bir çim yaprağından düşen karınca fazla hızlanamaz, çünkü hava onu frenler. Yüksek bir ağaçtan bile düşse çoğu zaman kalkıp yoluna devam eder. Bize zararsız görünen su ise onun için bir tehlikedir. İri bir yağmur damlası, bir karıncadan birkaç kat ağırdır. Suyun yüzey gerilimi küçük bir canlıyı yapışkan bir tuzak gibi tutabilir. Karıncamız bir çiy damlasından içerken bu yüzden temkinli.',
    cues: { fall: 'Bir çim yaprağından', land: 'Yüksek bir', water: 'Bize zararsız', rain: 'İri bir yağmur', tension: 'Suyun yüzey', sip: 'Karıncamız bir çiy' },
  },
  {
    id: 'ciftlik', title: 'Yaprak Biti Çobanları', short: 'Yaprak bitleri',
    text: 'Siyah bahçe karıncasının en şaşırtıcı işlerinden biri çobanlık. Bu bitkinin sapında yaprak bitleri yaşar. Bitkinin özsuyunu emerler; bu su şekerce zengin ama proteince fakirdir. Bitler fazla şekeri, ballı çiy denen tatlı damlalar olarak dışarı atar. Karınca bir biti antenleriyle okşar, bit bir damla verir. Karşılığında karıncalar bitleri uğur böceği gibi avcılardan korur. İki taraf da kazançlı. Buna karşılıklı yarar, yani mutualizm denir.',
    cues: { aphids: 'Bu bitkinin', sap: 'Bitkinin özsuyunu', honeydew: 'Bitler fazla', stroke: 'Karınca bir biti', drop: 'bit bir damla', guard: 'Karşılığında', mutual: 'İki taraf' },
  },
  {
    id: 'yuva', title: 'Yeraltı Şehri', short: 'Yuva',
    text: 'Karıncamız dolu kursağıyla yuvaya dönüyor. Toprağın altında odalardan ve tünellerden oluşan bir şehir var. Kraliçe burada; tek işi yumurta bırakmak. Laboratuvarda yaşayan bir siyah bahçe karıncası kraliçesi 28 yılı aşarak bir rekor kırdı. Yumurtadan larva çıkar; larva ipek bir koza örüp pupa olur. Bu iri beyaz taneleri çoğu zaman karınca yumurtası sanırız, aslında onlar kozadır. Genç işçiler içeride yavrulara bakar, yaşlandıkça dışarı çıkıp yiyecek toplar. En tehlikeli iş en yaşlılara düşer. Karıncamız kursağındaki tatlıyı ağızdan ağıza kardeşleriyle paylaşıyor. Tek bir karıncanın getirdiği besin, yüz kadar yuvadaşa dağılabilir.',
    say: 'Karıncamız dolu kursağıyla yuvaya dönüyor. Toprağın altında odalardan ve tünellerden oluşan bir şehir var. Kraliçe burada; tek işi yumurta bırakmak. Laboratuvarda yaşayan bir siyah bahçe karıncası kraliçesi yirmi sekiz yılı aşarak bir rekor kırdı. Yumurtadan larva çıkar; larva ipek bir koza örüp pupa olur. Bu iri beyaz taneleri çoğu zaman karınca yumurtası sanırız, aslında onlar kozadır. Genç işçiler içeride yavrulara bakar, yaşlandıkça dışarı çıkıp yiyecek toplar. En tehlikeli iş en yaşlılara düşer. Karıncamız kursağındaki tatlıyı ağızdan ağıza kardeşleriyle paylaşıyor. Tek bir karıncanın getirdiği besin, yüz kadar yuvadaşa dağılabilir.',
    cues: { enter: 'Karıncamız dolu', city: 'Toprağın altında', queen: 'Kraliçe burada', record: 'Laboratuvarda', brood: 'Yumurtadan', cocoon: 'Bu iri beyaz', young: 'Genç işçiler', old: 'En tehlikeli', share: 'Karıncamız kursağındaki', hundred: 'Tek bir karıncanın' },
  },
  {
    id: 'kapanis', title: 'Ayağımızın Altındaki Dünya', short: 'Kapanış',
    text: 'Şimdi başa dönelim. Bir karıncanın gözünden dünya nasıl görünür? Bulanık bir mozaik, ama kokularla örülmüş bir harita. Kum tanelerinin kaya, çiy damlalarının tuzak olduğu, fiziğin bile başka işlediği bir yer. Tek başına küçük bir canlı; ama birlikte, planı olmadan yolunu bulan dev bir zekâ. Bugün dünyada yaklaşık yirmi katrilyon karınca yaşıyor. Bir dahaki sefere yere baktığınızda, ayağınızın dibindeki bu dev dünyayı hatırlayın.',
    cues: { back: 'Şimdi başa', mosaic: 'Bulanık bir', world: 'Kum tanelerinin', together: 'Tek başına', count: 'Bugün dünyada', remember: 'Bir dahaki' },
  },
];
