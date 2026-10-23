# Kompakt kalite görünümü ve galeri kontrolü

23 Ekim 2026. macOS Chrome, Playwright telefon dokunma emülasyonu; fiziksel telefon testi yapılmadı.

Önceki CI başarısızlığı: sentetik 320px dokunma kaydırmasından hemen sonra Sonraki tap'i görseli değiştirmedi (1/10 ve150%). Yerelde eski test iki kez geçti. Sentetik hareket karelere yayıldı ve gerçek scroll konumu12kare sabitlenene kadar bekleniyor; zoom/pan/sonraki/önceki kontrolleri korunuyor. CI sonucu ayrıca doğrulanacak.

PAGES_BUILD=1 npm run check PASS. npm run test:phone:detail PASS:320/360/375/390,yatay844×320,zoom/nativepan/görselgeçişi/odakdönüşü/4makine. npm run test:browser PASS: masaüstü1512ve1280.

node tests/compact-browser.mjs PASS:320/390/1512,14pxminimum,taşmayok,kısa piktogramkutucukları,açılır tamdeğer/kaynak. Bölüm yüksekliği320'de1451px,390'da1400px,1512'de692px. Önceki tek sütun320 ölçümü2976px idi. Ekran görüntüleri bu klasörde; baseline onayı değildir. Ana ajan görüntüleri inceledi. Bağımsız incelemenin etiket ve kabul koşulunun korunması bulguları düzeltildi.
