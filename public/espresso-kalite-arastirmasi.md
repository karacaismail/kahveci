# Espresso seçimi için incelenmiş kriterler

23 Ekim 2026. Claude'un sekiz araştırma notu ve nihai raporu kontrol edilerek hazırlanan uygulama kararları.

Makine seçiminde öğütüm ayarı, sıcaklık yönetimi, gerçek demleme basıncı, ön ıslatma/akış kontrolü, tek duvarlı sepet, fincan çıktısı, süt sistemi, su bakımı, temizlik ve parça/servis desteği birlikte değerlendirilir. Bağımsız ölçümler ayrı kaydedilir. Tek bir etiket ya da marka fincan sonucunu garanti etmez.

## Ürün sayfasındaki 16 yeni ayrıntı

İnce öğütüm ayarı; öğütücü doz tutarlılığı; retansiyon; ölçülmüş sıcaklık kararlılığı; sıcaklık ayarı; akış profili; sepet doz aralığı; çıktı kontrol yöntemi; ölçülmüş çıktı tutarlılığı; su sertliği yönetimi; süt sıcaklığı kontrolü; ölçülmüş süt dokusu; ardışık servis ölçümü; temizlik erişimi; Türkiye servis kanalı; ilk fincan hazırlığı.

Ölçüm alanları ancak tam model, sayısal değer/birim, yöntem, örnek sayısı ve kaynakla doldurulur. Sıcaklık için ölçüm konumu da gerekir. PID, kazan tipi veya bir metinde sayı bulunması ölçüm değildir. Ölçüm yoksa iyi/kötü eşik puanı uydurulmaz.

## Tercih puanının yapısı

Aşağıdaki ağırlıklar kişisel seçim için editoryal tercihlerdir; bilimsel sabitler değildir. Süt oranı değiştirildikçe iki profil arasında geçiş yapılır.

| Başlık | Sade espresso | Sütlü içecek |
|---|---:|---:|
| Öğütüm ayarı |18|14|
| Sıcaklık yönetimi |17|13|
| Demleme basıncı |16|12|
| Ön ıslatma/akış |5|3|
| Sepet |12|9|
| Çıktı kontrolü |10|8|
| Süt sistemi |0|22|
| Su bakımı |7|6|
| Temizlik |6|6|
| Parça ve servis |9|7|

Bilinen, uygulanabilir özellikler üzerinden tercih puanı hesaplanır. Bilinmeyen ve kaynakta açıklanmayan özellikler aynı tam belirsizlik aralığına sahiptir; yok kabul edilmez. Ayrıntıda alt/üst aralık ve bilgi kapsamı görülür. Kapsam %30 altındaysa veya bilinen temel şart yoksa kartta sayı gösterilmez. Bu eşik de editoryal seçimdir. Kaynaklı karşılanmayan temel ihtiyacı olanlar sıralamanın son grubundadır.

Harici değirmen ihtiyacı makine puanından çıkarılır, kurulum ihtiyacı olarak kalır. Süt isteyen kullanıcı için süt sisteminin yokluğu karşılanmayan ihtiyaçtır. Aynı tartım/temizlik avantajı iki kez puan almaz. Günlük fincan sayısından tek kazan cezası veya çift kazan bonusu çıkarılmaz. Fiyat, marka ve menşe puana girmez.

Ayrıntıdaki ağırlık duyarlılığı, her bilinen ağırlığı tek tek ±%25 değiştirerek hesaplanır; eksik veri için olasılık veya tahmin üretmez.

## Doğrulanan temel kaynaklar

- Cameron ve ark., 2020: öğütüm ile ekstraksiyon arasındaki ilişkinin her koşulda tek yönlü olmadığını gösteren model ve deney: https://researchportal.port.ac.uk/en/publications/systematically-improving-espresso-insights-from-mathematical-mode/
- Smrke ve ark., 2024: ince parçacıkların yatak geçirgenliği ve ekstraksiyon üzerindeki etkisi: https://www.nature.com/articles/s41598-024-55831-x
- Hendon ve ark., 2014: suda çözünmüş minerallerin ekstraksiyonla ilişkisi: https://researchportal.bath.ac.uk/en/publications/the-role-of-dissolved-cations-in-coffee-extraction/
- Breville: basınçlı ve basınçsız sepetlerin yapısı ve kontrol farkı: https://www.breville.com/us/en/blog/coffee-and-espresso/pressurized-vs-non-pressurized-portafilter.html
- CHOICE: kör tadım, süt ve ardışık sıcaklık tutarlılığı ayrı değerlendirmeler: https://www.choice.com.au/home-and-living/kitchen/coffee-machines/articles/how-we-test-coffee-machines
- Kaffeemacher: Scace ile sıcaklık, çıktı ve farklı test protokollerinin açıklaması: https://kaffeemacher.de/en/blogs/kaffeewissen/espresso-machines-test-protocol

## Claude önerilerinden uygulanmayanlar

Yayımlanmayan bilginin üst sınırını otomatik yarıya indirme; kazan mimarisine göre seri servis puanı; doğrulanmamış sıcaklık/basınç eşikleriyle ceza veya puan tavanı; süt sistemi yokluğunu sütlü profilde NA sayma uygulanmadı. “Hiçbir bağımsız inceleme donanımı puanlamaz” genellemesi kabul edilmedi: Kaffeemacher'ın kendi protokolünde ölçülen teknik özellikler ve kontrol olanakları da değerlendirilir. Eski tarihli su raporları veya ikincil mevzuat aktarımları güncel ürün kalite eşiğine çevrilmedi.
