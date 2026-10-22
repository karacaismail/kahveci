# Espresso Atlası

Mantine + React espresso karar uygulaması. Masaüstü yerleşimi korunur; kısa ekran kenarı600 CSS px altında, dokunmatik (touch-point veya touch-event desteği) ve coarse pointer yeteneği bulunan ekranlarda telefon görünümü seçilir. Tabletler masaüstünde kalır. Bu fiziksel cihaz kimliği garantisi değildir; UA kullanılmaz. Telefon yatay çevrilince aynı görünüm ve ortak durum korunur.

Yayın: https://karacaismail.github.io/kahveci/

Kaynak kod: https://github.com/karacaismail/kahveci

Lisans kullanıcı kararı bekliyor; public görünürlük kendi başına açık kaynak lisansı değildir. Ürün fotoğrafları üçüncü taraf kaynaklardan yüklenir, repo içine kopyalanmaz.

## Çalıştırma

Bu dizinde:

```sh
npm ci
npm run dev
```

Yerel adres: http://127.0.0.1:5173/ . Sunucu yalnız loopback arayüzüne bağlıdır.

Üretim çıktısı:

```sh
npm run build
npm run preview -- --port 4173
```

## Kullanım

- Katalogdaki filtrelerle marka, deneyim, kaynaklı özellik ve fiyat arayın. “Tüm araştırma listesi” teyitsiz başlangıç kayıtlarını da gösterir.
- Espresso kalite alanında 8 ana ve 4 ek ölçüt bulunur. Karşılıyor, bulunmuyor, sınırlı/kısmi, doğrulanmadı, ayrı ekipman gerekir, kaynakta açıklanmıyor ve uygulanamaz durumları ayrıdır. Birden çok kriter seçildiğinde hepsi aranan durumda olmalıdır. Aynı değerlendirme ürün, karşılaştırma ve CSV/JSON içinde kaynaklarıyla korunur.
- Her kaydın ayrı, doğrudan açılabilir `#product/ID` sayfası vardır. Teknik alanların kaynak bağlantıları, somut farklar, kurulum bütçesi ve satıcılar aynı dosyada görünür.
- `+` ile en fazla dört makine seçin; karşılaştırma tablosunda farklı değerleri süzün. Bilinmeyen alan “yok” diye işaretlenmez.
- Galeri küçük görseli seçer; ana görsel büyütme penceresini açar. Yakınlaştırma, kaydırma, önceki/sonraki ve kaynak görsel bağlantısı vardır. Harici görseller internet bağlantısı gerektirir.
- Makine dışı öğütücü, süt sistemi ve aksesuar kayıtları ayrı alandadır. Bazı kayıtlar satın alınabilir SKU yerine ekipman türüdür.
- Karar atölyesi makine + ayrı öğütücü + ekipman varsayımını toplar; bütçe, günlük içecek ve süt payını değiştirin. Her makine teknik kabul şartları ve kullanım tercihiyle 0–100 tercih puanı alır; nedenleri ve kaynak kapsamı görünürdür. Fiyat ve bütçe kabul/puan/sıralama dışında kalır. Bu bir laboratuvar tadımı değildir. Büyük yeşil Phosphor ikon gerekli başlığı gösterir; ürünün karşılaması ayrıca kaynakla işaretlenir.
- Alt bölümden CSV (makine teknik matrisi ve kaynaklar) veya JSON (makineler, ekipmanlar, görseller, teklifler, kaynaklar) dışa aktarılır. CSV, Sheets'e aktarılabilir; bu çalışma bir Google dosyası oluşturmaz.

## Veri ve kapsam

Güncel araştırma kapsamı ve sınırları [RESEARCH.md](RESEARCH.md) dosyasındadır. `src/catalog.json` çalışma zamanındaki veri kaynağıdır. İlk metinlerden aktarılan her kayıt bütün teknik özellikleri doğrulanmış bir ürün değildir. Kaynaklı alanlar da üretici/satıcı beyanıdır; ölçülmüş fincan performansı değildir. Ürün nesli, bölge ve SKU açıkça korunmalıdır.

Teklifler canlı fiyat API'si değildir. Arama indeksi kayıtlarının tarihi notlarda ayrıca bulunabilir; araştırma tarihi indeksin ödeme fiyatını güncellemez. Stok dışı teklifler minimum fiyat hesabından çıkarılır. Gerçek ödeme fiyatı, kargo, garanti ve satıcı koşulları satış sitesinden doğrulanmalıdır.

## Doğrulama

```sh
npm run check
npm run preview -- --port 4173
npm run test:browser
node tests/gallery-audit.mjs
```

Browser kontrolü bilgisayarda kurulu Chrome'u ayrı geçici profille açar; kişisel oturumlar kullanılmaz. Varsayılan üretim URL'si `http://127.0.0.1:4173` olup `ATLAS_URL` ile değişebilir. Mobil ve diğer tarayıcılar kullanıcı kapsamı dışında bırakılmıştır. `tests/browser-check.mjs` ve `tests/gallery-audit.mjs` kanıtlarını çalışma dizininin iki üstündeki `work/` alanına yazar; teslim kanıtları `evidence/` altına kopyalanır.

Bağımlılıkların çözülmüş sürümleri package-lock.json içindedir. Bu teslim bir Git commit'i, public yayın veya seçilmiş açık kaynak lisansı içermez.

Build `public/tercih-puanlari.csv` ve JSON karşılığını tüm makineler için üretir. `public/butce-arastirmasi.csv` fiyatı50.000TLaltında gözlenen araştırma önceliğinin veri kümesidir; bu tutar teknik kabul kuralı değildir. Alternatif gerçek mağaza sayfasında fiyat/stok kesinleşmemişse purchaseLinks altında ayrıca gösterilir.

## Telefon ve yayın

`node tests/phone-browser.mjs` telefon akışını, tablet/masaüstü ayrımını ve telefon CSS isteğinin koşullu olmasını production build üzerinde doğrular. Ortak Mantine stilleri, iş kuralları ve katalog iki görünümde de kullanılır; yalnız telefon yerleşim stilleri dinamik yüklenir. Ayrı bir telefon uygulaması veya tablet tasarımı yoktur.

`PAGES_BUILD=1 npm run build` /kahveci/ taban yolunu kullanır. GitHub Actions ana branch değişiminde test eder, derler ve Pages artifact olarak yayınlar. Gizli anahtar gerekmez; workflow commit oluşturmaz. Mevcut büyük ortak JS paketi performans sınırı olarak kaydedilmiştir.

Kurulu WebKit için `ATLAS_ENGINE=webkit npm run test:phone` aynı akışı emülasyonda sınar. Bu gerçek iOS Safari sertifikasyonu değildir. Telefon stili yüklenmezse görünür yeniden deneme ekranı gösterilir.

## Genel arama

Üstteki “Tüm verilerde ara” alanı yazdıkça bütün183makineyi,47ekipmanı ve265kavram/veri alanını arar. Tüm iç içe katalog alanları, teknik değerler, kaynak/görsel adresleri, eski ve güncel fiyat gözlemleri, satıcılar, araştırma notları ve senaryodaki puan gerekçeleri kapsamdadır. Türkçe karakterler isteğe bağlıdır;58mm/58 mm ve41.999/41999 eşleşir. Sözcükler birlikte aranır, tırnaklı ifade aynı sırayı gerektirir. İnternet araması değildir. Eşleşme özellik onayı veya güncel stok iddiası değildir. Makine,ekipman,kavram türüyle süzülür ve eşleşen alan gösterilir. Katalogdaki yerel arama da aynı motoru kullanır; diğer filtreler korunur.

`node tests/search-browser.mjs`320pxtelefon ve1512pxmasaüstü arama akışını production build üzerinde doğrular.

## Ayrıntılı telefon QA

`npm run test:phone:detail`, 320/360/375/390 telefon profillerinde filtreleri, ürün kanıtlarını, dört makine karşılaştırmasını ve galeriyi sınar. 844×320 yatay görünüm, kapatma, klavye odağı ve karşılaştırmaya geri dönüş de kapsamdadır. Chrome 320 profilinde CDP dokunma hareketi denenir. `ATLAS_ENGINE=webkit npm run test:phone:detail`, kurulu WebKit ile aynı akışı emülasyonda doğrular.

Telefon karşılaştırmasında 104 px kriter ve 184 px ürün sütunu, ürüne geçiş düğmeleri ve sabit kriter sütunu bulunur. Galeri telefonda tam ekrandır; ürün kanıtları açılır bölümlerdedir. Masaüstü düzeni korunur. Ayrıntılar [evidence/PHONE_QA.md](evidence/PHONE_QA.md) dosyasındadır. Fiziksel cihaz testi yapılmadı.
