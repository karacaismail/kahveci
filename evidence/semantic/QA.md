# Anlamlı ürün adresleri

23 Ekim 2026. Yeni biçim /kahveci/makineler/{marka-model}/. 183 ürünün ASCII ve benzersiz adresi oluşturuldu. Ürün IDleri, seçimler ve puanlar değişmedi.

RED: tests/semantic-browser.mjs yeni ürün adresini beklerken eski #product/ adresi bulundu.
GREEN: aynı test yeni URL, doğrudan yenileme, history geri/ileri ve eski hash geçişini doğruladı. Pages için build183statikindex üretti.

PAGES_BUILD=1 npm run check PASS. Masaüstü browser ve telefon detail320/360/375/390+yatay PASS. Fiziksel telefon kontrolü not_run. CI ve canlı adres sonucu yayın sonrasında izlenir.
