# Araştırma entegrasyonu — 23 Ekim 2026

Claude'un sekiz araştırma notu ve nihai kriter raporu tamamlandı. İkinci çalışma sekiz exact model verdi. Birinci raporun yazarı API DNS hatası aldı; mevcut notlarla yeniden çalıştırılarak rapor/JSON teslimi alındı. Uygulama bu raporları körlemesine kullanmadı.

Uygulanan kapsam: 191 makine; mevcut12başlığa ek16araştırma ayrıntısı; sade/sütlü11puan grubu; bilgi kapsamı ve [alt,üst] aralığı. Kartta kriter listesi/not yok. Ek ayrıntılar ürün sayfasında kapalı bölümde.

Reddedilen öneriler: yayımlanmayan bilgiye yarım üst sınır; mimari servis cezası/bonusu; doğrulanmamış ölçüm eşiklerinden kalite cezası; süt gerekli iken yokluğu NA sayma. Sıcaklık kontrolü, ölçülmüş kararlılıktan ayrı. Kör tadım yokken tat puanı iddiası yok. Ekipman puanları makine puanıyla kıyaslanmaz.

Kaynak kontrolü: Cameron/Portsmouth, Smrke/Nature, Hendon/Bath, Breville sepet yapısı, CHOICE tadım/test yöntemi, Kaffeemacher ölçüm protokolü açıldı. İlk PMC bağlantısı doğrulama sayfasına düştü; aynı makale Nature üzerinden kontrol edildi. 'Hiçbir laboratuvar donanımı puanlamaz' genellemesi kabul edilmedi (KM yönteminde teknik özellikler de değerlendirilir). Üretici model sayfaları La Spaziale3/Elektra3/S-Lite ve M21S/1FransızüreticiPDF kontrol edildi. M21güç1900–2300W/33kg/2,5L veS/1başlat-durdur ayrı föyle eşlendi. VerveMini stok çelişkisi/M21veSLitevaryant belirsizlikleri uygun en düşük hesaptan çıkarıldı. Barmarketim/Mutfak10havale fiyatları kaynakta açık görüldü. Dream için iki gerçek EUR fiyat eklendi. Yabancı para TL'ye çevrilmedi. Tam ödeme/kargo testi not_run.

RED: yeni skor testleri eski −15cezası/eksik aralık/ölçüm kriteri/çift sayımı yakaladı. Negatif metinlerin özellik sayılması ve bıçak/seramik dişli karışıklığı ayrıREDtestleriyle yakalandı. Yeni marka testi önce eksik modellerde başarısızdı. Aynı testler değişiklikten sonra GREEN. Son toplam76Node testi PASS; formatter,TypeScript,Vite191statikürünsayfası PASS.

Chrome macOS: masaüstü1512/1280 mevcutsuite PASS; telefon dokunma emülasyonu320/360/375/390+yatay844×320 mevcutflows PASS; kompakt320/390/1512ve16ekayrıntı PASS. Sekiz yeni ürün sayfası ve32görsel Chrome'da yüklendi. Native EUR/USD ileTRYayrımı görüldü. Ekran görüntüleri bu klasörde. Ana ajan VerveMini galeri, Verve320 veM21/Vivaldi galerilerini gözle inceledi. Fiziksel telefon/iOS/Safari not_run. Bağımsız inceleme bulguları regresyon testleriyle düzeltildi; son inceleme/yayın sonucu ayrıca izlenir.

Son kontrol: 76/76 Node testi, formatter, TypeScript ve 191 statik ürün sayfası PASS. Yeni marka filtresi RED (0/3) sonrası GREEN (3/3). S/1 dozlama ve Dream uyarı regresyonları RED sonrası GREEN. Bağımsız salt okunur son incelemede açık bulgu kalmadı. Chrome son masaüstü, kompakt 320/390/1512, telefon detay/galeri/karşılaştırma ve 32 yeni görsel kontrolleri PASS.

Yayın galeri düzeltmesi: GitHub runner dış görsel yükleme kontrolünde FAIL verdi. 32 orijinal görsel (4.598.475 bayt) kaynak URL eşlemesi korunarak public/images/research altına alındı. Root/Pages yol regresyonu RED→GREEN; son 77/77 test ve build PASS; Chrome32/32 yerel görsel, telefon320 ve masaüstü1512 büyütülmüş görsel yükleme PASS. Canlı yayın aynı CI kapılarından yeniden geçer.
