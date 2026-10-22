# Telefon ayrıntılı kabul kaydı — 22 Ekim 2026

Kapsam: filtreler, ürün detayları, görsel inceleme, dört makine karşılaştırma ve masaüstü regresyonu. Başlangıç commit’i: ca65dfb.

## Bulunan ve düzeltilen sorunlar

- Sabit kriter sütunu 225 px genişliğiyle 320 px ekranda ürün düğmelerinin önünü kesiyordu. Gerçek tıklama denemesi bu engeli doğruladı. Telefonda 104 px kriter ve 184 px ürün sütunları, doğrudan sütuna geçiş düğmeleri ve sabit kriter sütunu kullanılıyor. Kelime ortasından bölme yapılmıyor; hücre taşması ayrıca sınanıyor.
- Filtrelerin sonunda sonuçlara dönüş işlemi yoktu. “Sonuçları göster” düğmesi sonucu sayar, paneli kapatır ve odağı görünür filtre düğmesine döndürür. Seçimler korunur. ARIA/inert anında, sunum merkezi 180 ms hareket sözleşmesiyle güncellenir.
- Karşılaştırma çubuğunun uzun düğmesi 320 px ekranda taşıyordu. Gerçek düğme sınırı testi önce başarısız oldu. Telefon metni ve grid düzeni düzeltildi; öncesi/sonrası phone-detail-dock.png ve phone-detail-dock-after.png dosyalarındadır.
- Galeri telefonda tam ekran açılıyor. Kapatma hedefi en az 48 px; araç çubuğu ve görsel gezinmesi fotoğrafın dışında, erişilebilir kalıyor. Fotoğraf kalan alanda büyütülüp kaydırılıyor. Kaynak görselin yüklenmesi naturalWidth ile doğrulanıyor.
- Telefon ürün detayında durum ve temel değer görünür; uzun açıklama ve kaynaklar açılır bölümde. Teknik tablo kendi kapsayıcısında kayıyor.
- Üründen karşılaştırmaya dönünce eski dördüncü sütun seçimi sıfır kaydırmayla çelişiyordu. Bağımsız incelemenin bulgusu başarısız geri dönüş testiyle doğrulandı; rota girişinde sıfırlama ve seçim sayısına göre sınırlandırmayla düzeltildi.
- Chrome’da hızlı galeri açma/kapatma klavye odağını yanlış bırakabiliyordu. Telefonda açan düğme kaydedilip çıkış sonunda, yalnız pencere kapalı ve düğme bağlıysa odaklanıyor. Masaüstünün Mantine davranışı korunuyor.

## Çalıştırılan kontroller

- `PAGES_BUILD=1 npm run check`: PASS. 61 domain/veri/arama/hareket testi, TypeScript ve production build. Hareket kapısı telefon CSS’ini de tarıyor.
- `npm run test:phone:detail`: Chrome 155.0.8059.85, PASS. 320×640, 360×844, 375×844, 390×844 ve her birinden 844×320 yatay galeri dönüşü. 14 kontrol grubu; filtre, boş sonuç, sıfırlama, dört sütun, beşinci makinenin reddi, farklılık filtresi, açıklama, teknik tablo, gerçek görsel yükleme, yakınlaştırma/gezinme, kapatma ve klavye odağı.
- `ATLAS_ENGINE=webkit npm run test:phone:detail`: WebKit 27.2, aynı dört telefon ve yatay akışlar, 13 kontrol grubu PASS.
- Chrome 320 profilinde CDP touchStart/touchMove/touchEnd ile emüle dokunma kaydırması PASS. WebKit’te kaydırma kapasitesi, programatik pan ve touch tap sınandı; fiziksel parmak hareketi iddia edilmiyor.
- `npm run test:browser`: 21 masaüstü kontrolü PASS; 1512×1100 ve 1280×900. Puanlar, kriterler, galeri, karşılaştırma, odak, minimum 14 px, reduced-motion ve hata kontrolleri korundu.
- `npm run test:phone`: genel telefon akışları, tablet/dar masaüstü ayrımı ve telefon CSS’inin koşullu isteği PASS.
- Bağımsız salt okunur incelemelerde geri dönüş bulgusu düzeltildi; hedefli yeniden incelemelerde açık bulgu kalmadı. İnceleyici komut çalıştırmadı. Ekran görüntüleri kanıttır; masaüstü piksel eşitliği iddiası değildir.

Production önizleme: http://127.0.0.1:4174/kahveci/ . İzole headless tarayıcılar, macOS 26.5.1. GitHub Actions yayın öncesi ayrıntılı Chrome kapısını da çalıştırır. Yerel başarı tek başına CI başarısı değildir.

Fiziksel iOS/Android telefon, gerçek sanal klavye ve saha performansı: not_run. Firefox: not_run. Büyük ortak JS chunk uyarısı sürüyor; telefon CSS’i yaklaşık 2,4 KB gzip. Araştırma verileri ve teknik puan kuralları değiştirilmedi.
