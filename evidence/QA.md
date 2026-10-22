# Doğrulama kaydı — 22 Ekim 2026

## Telefon ve yayın güncellemesi

- `PAGES_BUILD=1 npm run check`: PASS. Formatter,57 domain/veri/kalite/puan/hareket/profil testi, TypeScript ve Vite build.
- Telefon profili: short side<600 CSS px + any-pointer:coarse + (maxTouchPoints>0 veya touch-event desteği); UA kullanılmaz. Bu bir fiziksel cihaz kimliği garantisi değildir. Tabletler masaüstünde; telefonun yatay çevrilmesi ortak durumu sıfırlamaz.
- `ATLAS_URL=http://127.0.0.1:4174/kahveci/ npm run test:phone`: PASS. Chrome155 emülasyonu;320/360/375/390, yatay844×320; katalog, filtre, detay, galeri, karar girdisi/rotasyon sürekliliği, ekipman, rehber, kapsayıcı içinde karşılaştırma kaydırması; en az14px ve sayfa taşması kontrolleri.
- Production manifestine göre telefon CSS dosyasının telefon tarafından istendiği;768×1024 dokunmatik tablet ve390px dar masaüstü penceresinde hiç istenmediği doğrulandı. Ortak Mantine CSS, JS, veri ve bileşenler bilinçli olarak ortaktır; telefon CSS yaklaşık1,7KB gzip eklenir. Ekran görüntüleri yeni telefon tasarımı adayıdır; bağımsız inceleme ilk ekranın okunaklı olduğunu belirtti.
- `node tests/phone-recovery.mjs`: önce RED (stil isteği iptalinde boş root), sonra GREEN. Görünür uyarı ve Yeniden dene kataloğu geri getirir; yakalanmamış hata yok.
- `ATLAS_URL=http://127.0.0.1:4174/kahveci/ npm run test:browser`:21 masaüstü kontrolü PASS.1280×900 ve1512×1100; max4, filtreler,puan,fiyat bağımsızlığı,galeri,erişilebilir klavye odağı,forced-colors,reduced-motion,simetrik hareket ve hata kontrolü.
- Bağımsız salt okunur inceleme: stil hatası boş ekranı ve CI preview başlangıç yarışını buldu. Regresyon ve bounded hazır olma kontrolü eklendi. Son hedefli yeniden incelemede açık bulgu kalmadı. İnceleyici komut çalıştırmadı.
- Ortam: macOS26.5.1, kurulu Google Chrome155.0.8059.85, izole headless profiller. Fiziksel telefon/iOS Safari/Android cihaz, gerçek sanal klavye: not_run. Firefox: not_run. WebKit27.2 emülasyonu aynı telefon suite’ini320/360/375/390 ve yatay görünümde PASS tamamladı. Bu gerçek iOS Safari testi değildir. WebKit’teki0 touch-point bildirimi için coarse+kısa ekran koşulları korunarak touch-event fallback eklendi; önce başarısız regresyon sonra başarılı kontrol kaydedildi. Uzun düğme taşması ve11,67px karşılaştırma notu telefon CSS kaynağında düzeltildi. Son bağımsız hedefli incelemede açık bulgu kalmadı. Masaüstü gerçek kişisel Chrome oturumu kullanılmadı.
- GitHub Pages /kahveci/ base ve hash derin bağlantıları desteklenir. CI ve canlı yayın sonucu GitHub Actions kaydından ayrıca doğrulanır; yerel sonuç CI sonucu değildir.
- Ortak JS büyük chunk uyarısı sürüyor: yaklaşık1,82MB ham/324KB gzip. Mobil saha performansı ölçülmedi; uyarı bastırılmadı.

## Araştırma sınırları

183 makine ve47 ekipmana gerekçeli rol puanı verilir; fiyat/bütçe kabul veya puana dahil değildir.164 makinenin8 başlığı araştırılmıştır;9 SKU ve10 erişilemeyen belge kaydı açık kalır.54 öncelikli fiyat gözlemi modelinin8 başlığı,çoklu görseli,farklı satın alma sayfaları vardır;35 modelde iki uygun fiyat gözlemi alan adı bulunur. Stok dışı/yurt dışı seçenekler etiketlidir.

Önceki920benzersizgörsel URL kontrolü korunur; bu görevde tüm uzak URL’ler tekrar taranmadı. Tat,sıcaklık,basınç veya25içecek kapasite laboratuvar testi yoktur. Eksik kanıt özellik yokluğu sayılmaz.
