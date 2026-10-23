/** @type {Array<[string, string, RegExp, boolean, string]>} */
const definitions = [
  [
    "Öğütüm hassasiyeti",
    "İnce ayar",
    /Espresso aralığı|^Öğütme ayarı$|Öğütüm hassas|Kademesiz/i,
    false,
    "Öğütümde küçük değişiklik yapabilme. Toplam kademe sayısı tek başına hassasiyet ölçümü değildir.",
  ],
  [
    "Öğütücü doz tutarlılığı",
    "Doz tutarlılığı",
    /Öğütücü doz sapması|Doz SD|Doz standart sapma/i,
    true,
    "Aynı hedef dozun tekrarlardaki sapması; gram, tekrar sayısı ve test yöntemi birlikte gerekir.",
  ],
  [
    "Öğütücü retansiyonu",
    "Kalıntı",
    /Retansiyon|Retention/i,
    true,
    "Öğütücüde kalan kahve miktarı. Değişim retansiyonu ile toplam içeride kalan kahve aynı ölçüm değildir.",
  ],
  [
    "Ölçülmüş sıcaklık kararlılığı",
    "Isı tutarlılığı",
    /Ölçülmüş sıcaklık kararlılığı|Scace sıcaklık|Şotlar arası sıcaklık sapması/i,
    true,
    "Şot içi ve şotlar arası sıcaklık değişimi ayrı ölçülür. PID ve kazan tipi bu ölçümün yerine geçmez.",
  ],
  [
    "Sıcaklık ayarı",
    "Isı ayarı",
    /Sıcaklık seçimi|Sıcaklık ayarı|Demleme sıcaklığı ayarı/i,
    false,
    "Kullanıcının sıcaklık seviyesini veya derece değerini değiştirebilmesi.",
  ],
  [
    "Akış profili",
    "Akış ayarı",
    /Akış kontrolü|Akış profili|Basınç profili|Profil kontrolü/i,
    false,
    "Demleme sırasında akış veya basıncı yönetebilme. Sabit ön ıslatmadan ayrı bir kontrol.",
  ],
  [
    "Sepet doz aralığı",
    "Sepet dozu",
    /Basket kapasitesi|Sepet doz aralığı|Sepet kapasitesi/i,
    false,
    "Sepetin önerilen kahve doz aralığı; doz ile duş eleği arasındaki boşluğu doğru seçmeyi kolaylaştırır.",
  ],
  [
    "Çıktı kontrol yöntemi",
    "Çıktı ayarı",
    /Çıktı kontrolü|Tartıyla durdurma|Volumetrik dozlama|Su miktarı ayarı|Kahve miktarı/i,
    false,
    "Fincandaki miktarı manuel, süre, hacim veya tartımla durdurma. Dahili tartı ayrıca ikinci kez puan almaz.",
  ],
  [
    "Ölçülmüş çıktı tutarlılığı",
    "Çıktı tutarlılığı",
    /Çıktı sapması|Fincan kütlesi SD|Şot kütlesi sapması|TDS sapması/i,
    true,
    "Aynı reçetenin tekrarlarında fincan ağırlığı veya TDS değişimi. Doz sapmasıyla aynı ölçüt değildir.",
  ],
  [
    "Su sertliği yönetimi",
    "Su ayarı",
    /Su sertliği|Su filtresi|Su yumuşatıcı|Sertlik ayarı|Kireç çözme/i,
    false,
    "Üreticiye uygun su, sertlik ayarı ve kireç bakım yöntemi. Tek bir evrensel su reçetesi bütün makineler için geçerli değildir.",
  ],
  [
    "Süt sıcaklığı kontrolü",
    "Süt ısısı",
    /Süt.*sıcaklık ayarı|Süt sıcaklığı kontrolü/i,
    false,
    "Süt ısıtma sonunu kullanıcı veya otomatik sistemle kontrol edebilme.",
  ],
  [
    "Ölçülmüş süt dokusu",
    "Süt dokusu",
    /Ölçülmüş süt dokusu|Mikro köpük testi|Süt köpüğü ölçümü/i,
    true,
    "İnce kabarcıklı, akışkan süt dokusunun aynı süt ve yöntemle değerlendirilmesi.",
  ],
  [
    "Ardışık servis ölçümü",
    "Seri servis",
    /Bağımsız seri servis testi|Ölçülmüş toparlanma|Ardışık servis ölçümü/i,
    true,
    "Belirtilen tarif ve aralıkla arka arkaya içecek hazırlama deneyi; günlük fincan sayısı tek başına test değildir.",
  ],
  [
    "Temizlik erişimi",
    "Temizlik",
    /Temizlik|Bakım|Backflush|Çıkarılabilir demleme/i,
    false,
    "Kahve yağı ve süt kalıntılarını temizleme yöntemi ve erişim. Solenoid ile aynı temizlik avantajı tekrar puanlanmaz.",
  ],
  [
    "Türkiye servis kanalı",
    "Yerel servis",
    /Türkiye servis desteği|Türkiye.*servis|Türkiye garanti/i,
    false,
    "Türkiye için belirlenmiş servis veya garanti muhatabı; genel marka sayfasından varsayılmaz.",
  ],
  [
    "İlk fincan hazırlığı",
    "Hazır olma",
    /Isınma süresi|İlk fincan hazırlığı|Termal denge süresi/i,
    false,
    "Üreticinin hazır ışığı süresi ile grubun ve portafiltrenin tam ısınması farklı olabilir.",
  ],
];
export const additionalQualityCriteria = definitions.map(
  ([key, shortLabel, , measured, why]) => ({
    key,
    label: key,
    filterLabel: key,
    shortLabel,
    why,
    measured,
  }),
);
export function evaluateAdditionalQuality(p) {
  return Object.fromEntries(
    definitions.map(([key, , pattern, measured, why]) => {
      const rows =
        p.researchStatus === "needs-sku"
          ? []
          : Object.entries(p.verified || {})
              .filter(([k]) => pattern.test(k))
              .map(([k, url]) => ({ key: k, value: p.specs?.[k] || "", url }))
              .filter(
                (r) =>
                  r.value &&
                  !/^\?|doğrulanmadı|belirsiz|çelişkili/i.test(r.value),
              );
      const unknown = {
        state: "unknown",
        value: measured ? "Ölçüm yok" : "Bilgi yok",
        reason: why,
        sources: [],
      };
      if (!rows.length && !measured) return [key, unknown];
      const negative = rows.every((r) =>
        /^(yok|hayır|no\b)|\byok\b|bulunmuyor|sunulmuyor|desteklenmiyor|mevcut değil|ayarlanamıyor/i.test(
          r.value,
        ),
      );
      if (
        key === "Temizlik erişimi" &&
        !rows.some((r) =>
          /yıka|temiz|backflush|kireç|rinse|clean|çıkarılabilir/i.test(r.value),
        )
      )
        return [key, unknown];
      if (measured) {
        const m = p.measurements?.[key];
        const valid =
          m &&
          m.modelId === p.id &&
          Number.isFinite(m.value) &&
          m.value >= 0 &&
          typeof m.unit === "string" &&
          m.unit.trim() &&
          typeof m.protocol === "string" &&
          m.protocol.trim() &&
          Number.isInteger(m.sampleSize) &&
          m.sampleSize >= 2 &&
          typeof m.source === "string" &&
          URL.canParse(m.source) &&
          new URL(m.source).protocol === "https:" &&
          ["independent-measurement", "manufacturer-measurement"].includes(
            m.evidenceKind,
          ) &&
          (key !== "Ölçülmüş sıcaklık kararlılığı" ||
            (typeof m.location === "string" && m.location.trim()));
        if (!valid)
          return [key, { ...unknown, sources: rows.map((r) => r.url) }];
        return [
          key,
          {
            state: "limited",
            value: `${m.value} ${m.unit} · n=${m.sampleSize}`,
            reason:
              why +
              " " +
              m.protocol +
              (m.evidenceKind === "manufacturer-measurement"
                ? " Üretici ölçümü."
                : " Bağımsız ölçüm."),
            sources: [m.source],
          },
        ];
      }
      const ambiguous = rows.some((r) =>
        /kanıt(?:ı|a)?\s+değil|doğrulanmadı|açıklanmıyor|belirsiz|bilinmiyor|yok işaretli|ölçülmedi|bilgi bulunmadı/i.test(
          r.value,
        ),
      );
      if (ambiguous)
        return [
          key,
          { ...unknown, sources: [...new Set(rows.map((r) => r.url))] },
        ];
      if (
        negative &&
        ["Su sertliği yönetimi", "Temizlik erişimi"].includes(key)
      )
        return [key, { ...unknown, sources: rows.map((r) => r.url) }];
      if (
        key === "Sıcaklık ayarı" &&
        !negative &&
        !rows.some((r) =>
          /\d+\s*(kademe|seviye)|ayarlanabilir|seçilebilir|kullanıcı.*ayar|^(var|evet)$/i.test(
            r.value.split(";")[0],
          ),
        )
      )
        return [key, { ...unknown, sources: rows.map((r) => r.url) }];
      return [
        key,
        {
          state: negative ? "no" : "yes",
          value: rows.map((r) => r.value).join(" · "),
          reason: why,
          sources: [...new Set(rows.map((r) => r.url))],
        },
      ];
    }),
  );
}
