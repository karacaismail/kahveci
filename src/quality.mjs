import {
  additionalQualityCriteria,
  evaluateAdditionalQuality,
} from "./additional-quality.mjs";
export const qualityCriteria = [
  {
    key: "Öğütüm kontrolü",
    label: "Espressoya uygun öğütüm kontrolü",
    filterLabel: "Espresso öğütüm ayarı",
    shortLabel: "Öğütüm",
    why: "Çapaklı değirmen ve espresso aralığında ayar önemlidir. Entegrasyon tek başına kalite kaybı değildir; ayrı değirmen ihtiyacı makine kusuru değildir.",
  },
  {
    key: "Gerçek demleme basıncı (bar)",
    label: "Demleme basıncı ve OPV",
    filterLabel: "Demleme basıncı / OPV",
    shortLabel: "Basınç",
    why: "Pompanın 15–20 bar tepe değeri demleme basıncı değildir. 9 bar geleneksel bir başlangıç referansıdır; farklı kontrollü profiller de kullanılabilir.",
  },
  {
    key: "PID",
    label: "Sıcaklık kontrolü ve kararlılık",
    filterLabel: "Sıcaklık kontrolü",
    shortLabel: "Sıcaklık",
    why: "PID veya ayarlı kontrol, tekrarlanabilirliği destekler. Thermoblock/kazan adı tek başına shot içindeki sıcaklık kararlılığını kanıtlamaz.",
  },
  {
    key: "Basınçsız basket",
    label: "Tek duvarlı sepet ve portafiltre",
    filterLabel: "Tek duvarlı sepet",
    shortLabel: "Sepet",
    why: "Tek duvarlı sepet öğütümle akış ayarını sağlar. 51/54/57/58 mm çapları tek başına kalite sıralaması değildir; bayonet ve sepet uyumu ayrıca gerekir.",
  },
  {
    key: "Buhar iş akışı",
    label: "Buhar, eşzamanlılık ve toparlanma",
    filterLabel: "Buhar ve toparlanma",
    shortLabel: "Buhar",
    why: "Süt sistemi, kahve–buhar geçişi ve ardışık servis ayrı değerlendirilir. Thermoblock her zaman zayıf buhar; çift kazan her koşulda sıfır bekleme anlamına gelmez.",
  },
  {
    key: "3 yollu solenoid",
    label: "Üç yollu solenoid valf",
    filterLabel: "Basınç tahliyesi",
    shortLabel: "3 yollu valf",
    why: "Shot sonrasında basınç tahliyesini ve temizliği kolaylaştırır. Kuru puck veya daha iyi tat her reçetede garanti değildir; kapalı tam otomatik üniteyle aynı ölçüt değildir.",
  },
  {
    key: "Ön demleme",
    label: "Ön ıslatma / pre-infusion",
    filterLabel: "Ön ıslatma",
    shortLabel: "Ön ıslatma",
    why: "Kahve yatağını tam akış öncesinde ıslatır. Sabit, ayarlı ve pasif yöntemler ayrıdır; tek başına kusursuz ekstraksiyon garantisi değildir.",
  },
  {
    key: "Parça ekosistemi",
    label: "Yedek parça, aksesuar ve servis",
    filterLabel: "Parça ve servis ekosistemi",
    shortLabel: "Parça / servis",
    why: "Ölçü uyumu, model için parça bulunabilirliği ve Türkiye servis kanalı ayrı kanıt ister. Metal gövde veya 58 mm tek başına 10 yıl ömür garantisi vermez.",
  },
];
export const extraQualityCriteria = [
  ...additionalQualityCriteria,
  {
    key: "Doz ve çıktı",
    label: "Doz ve fincan çıktısı kontrolü",
    filterLabel: "Doz / çıktı kontrolü",
    shortLabel: "Doz / çıktı",
    why: "Giren kahve dozu ile fincandaki ağırlık/hacmi yönetmek, aynı tarifi tekrar etmeyi kolaylaştırır.",
  },
  {
    key: "Ölçüm yardımcıları",
    label: "Terazi ve zamanlama yardımcıları",
    filterLabel: "Terazi / shot zamanlayıcı",
    shortLabel: "Ölçüm",
    why: "Dahili terazi, zamanlayıcı ve ağırlıkla durdurma aynı özellik değildir. Hangi aracın bulunduğu açıkça belirtilir.",
  },
  {
    key: "Bakım ve su",
    label: "Su ve temizlik yönetimi",
    filterLabel: "Su / bakım donanımı",
    shortLabel: "Bakım",
    why: "Su sertliği, kireç, yağ kalıntıları ve üreticinin temizlik yöntemi fincandaki tutarlılığı ve kullanım maliyetini etkiler.",
  },
  {
    key: "Kapasite kanıtı",
    label: "Ölçülmüş tutarlılık ve servis kapasitesi",
    filterLabel: "Ölçülmüş kapasite kanıtı",
    shortLabel: "Kapasite kanıtı",
    why: "Günde 25 içecek ile tek seferde 25 sütlü içecek aynı ihtiyaç değildir. Üretici donanım beyanı ölçülmüş toparlanma/tat testi sayılmaz.",
  },
];
const uncertain = (v) =>
  !v ||
  /^\?|^-$|^n\/a$|^unknown$|doğrulanmadı|çelişkili|belirsiz|not.verified|not.available/i.test(
    v,
  );
const absent = (v) =>
  /^(?:(?:kutuda|dahili|fabrika çıkışında)\s+)?(yok|hayır|no\b|false\b|bulunmuyor)/i.test(
    v,
  );
const sources = (rows) => [...new Set(rows.map((r) => r.url).filter(Boolean))];
function evidence(p, selector) {
  return Object.entries(p.verified || {})
    .filter(([k]) =>
      typeof selector === "string" ? k === selector : selector.test(k),
    )
    .map(([key, url]) => ({ key, value: p.specs?.[key] || "", url }))
    .filter((r) => !uncertain(r.value));
}
function cell(state, value, reason, rows = []) {
  return { state, value, reason, sources: sources(rows) };
}
const unknown = (reason) => cell("unknown", "Doğrulanmadı", reason);
export function evaluateQuality(p) {
  if (p.researchStatus === "needs-sku")
    return Object.fromEntries(
      [...qualityCriteria, ...extraQualityCriteria].map((c) => [
        c.key,
        cell(
          "unknown",
          "Kesin model / nesil kodu gerekli",
          "Aile veya tek bir varyant için bulunan bilgiler, bu birleşik/kimliği belirsiz kaydın kabul onayı değildir. Satın alınacak tam SKU belirlenmeli.",
        ),
      ]),
    );
  const q = {};
  let e = evidence(p, /Entegre öğütücü|Öğütme ayarı|Öğütücü|Çark/);
  const external = e.some(
    (r) =>
      /Entegre öğütücü|^Öğütücü$/.test(r.key) &&
      /^(yok|harici|ayrı|external)\b/i.test(r.value),
  );
  if (external)
    q["Öğütüm kontrolü"] = cell(
      "external",
      "Ayrı espresso öğütücüsü gerekir",
      "Makineye ek bütçe ve uyumlu değirmen seçimi gerekir; bu, espresso kalitesinin düşük olduğunu söylemez.",
      e,
    );
  else if (
    e.some(
      (r) =>
        /bıçak|blade/i.test(r.value) &&
        !/seramik|çapak|burr|konik|flat|düz/i.test(r.value),
    )
  )
    q["Öğütüm kontrolü"] = cell(
      "no",
      "Bıçaklı öğütüm",
      "Espresso akışını tekrarlamak için uygun ince ayarlı çapaklı değirmen gerekir.",
      e,
    );
  else if (e.some((r) => /konik|çapak|burr|seramik|flat|düz/i.test(r.value))) {
    const adjustable = e.some(
      (r) =>
        /kademe|ayar|step|microm|mikrom/i.test(r.value) ||
        (/^Öğütme ayarı/.test(r.key) && !absent(r.value)),
    );
    q["Öğütüm kontrolü"] = cell(
      adjustable ? "yes" : "limited",
      e.map((r) => r.value).join(" · "),
      "Donanım/ayar beyanıdır; parçacık dağılımı, retansiyon ve gerçek dial-in hassasiyeti ölçülmedi.",
      e,
    );
  } else if (e.length)
    q["Öğütüm kontrolü"] = cell(
      "limited",
      e.map((r) => r.key + ": " + r.value).join(" · "),
      "Öğütücü veya ayar kapsamının bir bölümü belgeli; çapak geometrisi ve espresso aralığındaki hassasiyet ayrıca doğrulanmalı. Kısmi bilgi tam uygunluk onayı değildir.",
      e,
    );
  else
    q["Öğütüm kontrolü"] = unknown(
      "Espresso aralığındaki değirmen tipi ve ince ayar kapsamı kaynakla eşleştirilmedi.",
    );
  e = evidence(p, "Gerçek demleme basıncı (bar)");
  const opv = evidence(p, /OPV|aşırı basınç/i);
  if (e.length) {
    const v = e.map((r) => r.value).join(" · ");
    const fixedNine =
      /^(?:(?:fabrika|üretici)\s+)?(?:yaklaşık\s+)?9(?:[.,]0)?(?:\s|bar\b|$|[;(])/i.test(
        v,
      ) && !/9\s*[-–]\s*1\d/.test(v);
    q["Gerçek demleme basıncı (bar)"] = cell(
      fixedNine ? "yes" : "limited",
      v,
      "Bu değer teknik tasarım/üretici beyanıdır; bu çalışmada kahve yatağında bağımsız basınç ölçümü yapılmadı. " +
        (opv.length
          ? "OPV bilgisi ayrıca kaynaklıdır."
          : "OPV ayarı ayrıca doğrulanmadı."),
      [...e, ...opv],
    );
  } else if (opv.length && !opv.every((r) => absent(r.value)))
    q["Gerçek demleme basıncı (bar)"] = cell(
      "limited",
      "OPV / basınç kontrolü belgeli; 9 bar doğrulanmadı",
      "Bir tahliye/ayar mekanizmasının bulunması, Türkiye sürümünün fabrikadan tam 9 bar demlediğini kanıtlamaz.",
      opv,
    );
  else
    q["Gerçek demleme basıncı (bar)"] = unknown(
      "Pompa tepe basıncı bu işarete katılmaz. Demleme basıncı ve Türkiye sürümündeki OPV ayarı için kaynak/ölçüm gerekir.",
    );
  e = evidence(p, "PID");
  const temp = evidence(
    p,
    /Sıcaklık seçimi|Sıcaklık ayarı|Grup sıcaklık göstergesi/,
  ).filter((r) => !/kanıt(?:ı|a)?\s+değil|yok işaretli/i.test(r.value));
  const positivePid = e.some(
    (r) =>
      !absent(r.value) &&
      !/PID\s+(?:beyanı\s+)?(?:yok|bulunmuyor|açıklanmıyor)|without\s+PID|no\s+PID/i.test(
        r.value,
      ) &&
      /^(var|evet|yes)\b|\bPID\b|TermoPID/i.test(r.value),
  );
  if (positivePid)
    q["PID"] = cell(
      "yes",
      e.map((r) => r.value).join(" · "),
      "Sıcaklık kontrol donanımı belgeli; shot içi sıcaklık eğrisi ve shotlar arası kararlılık ölçülmedi.",
      [...e, ...temp],
    );
  else if (e.length || temp.length)
    q["PID"] = cell(
      "limited",
      temp.length
        ? temp.map((r) => r.value).join(" · ")
        : e.map((r) => r.value).join(" · "),
      "Termostat/sıcaklık seviyesi ile PID aynı şey değildir. Bu bilgi, tek başına kararsız veya kötü espresso anlamına gelmez.",
      [...e, ...temp],
    );
  else
    q["PID"] = unknown(
      "Isıtıcının adı kararlılık kanıtı değildir; PID/kontrol kapsamı ve gerçek sıcaklık ölçümü ayrı doğrulanmalı.",
    );
  e = evidence(p, "Basınçsız basket");
  const size = evidence(p, "Portafilter çapı (mm)");
  if (p.category?.includes("Tam otomatik"))
    q["Basınçsız basket"] = cell(
      "na",
      "Kapalı otomatik demleme ünitesi",
      "Harici portafiltre/sepet kriteri bu mimariye doğrudan uygulanmaz.",
    );
  else if (e.length)
    q["Basınçsız basket"] = cell(
      e.every((r) => absent(r.value))
        ? "no"
        : e.some((r) =>
              /^(var|evet|yes)\b|tek.?duvar|single.?wall|basınçsız|non.?pressuri|professional basket|naked/i.test(
                r.value,
              ),
            )
          ? "yes"
          : "limited",
      e.map((r) => r.value).join(" · ") +
        (size.length ? " · " + size[0].value + " mm" : ""),
      "Kutu içeriği ve tek duvarlı sepet durumu; çap, tek başına kahve kalitesi veya üçüncü parti portafiltre uyumu kanıtı değildir.",
      [...e, ...size],
    );
  else
    q["Basınçsız basket"] = unknown(
      "Portafiltre çapı bilinse bile kutuda tek duvarlı sepet bulunduğu varsayılmaz.",
    );
  e = evidence(p, /^Süt sistemi$|^Buhar$|^Buhar çubuğu$|^Buhar \/ sıcak su$/);
  const simultaneous = evidence(p, /Kahve.*buhar.*eşzamanlı|Eşzamanlı/);
  const recovery = evidence(p, /Buhar.*toparlanma|Ölçülmüş.*buhar/i);
  if (e.length && e.every((r) => absent(r.value)))
    q["Buhar iş akışı"] = cell(
      "no",
      "Süt/buhar sistemi yok",
      "Bu kriter sütlü içecek içindir; sade espresso kalitesinin ölçüsü değildir.",
      e,
    );
  else if (e.length || simultaneous.length || recovery.length) {
    const explicitParallel = simultaneous.some(
      (r) =>
        !absent(r.value) && /var|evet|aynı anda|eşzamanlı|yes/i.test(r.value),
    );
    q["Buhar iş akışı"] = cell(
      explicitParallel || recovery.length ? "yes" : "limited",
      [...e, ...simultaneous, ...recovery].map((r) => r.value).join(" · "),
      "Buhar sisteminin varlığı ile mikro köpük dokusu ve toparlanma süresi ayrıdır. " +
        (recovery.length
          ? "Kaynaklı süre beyanı belirtilmiştir; bağımsız seri servis testi yok."
          : "Toparlanma süresi ölçülmedi; 30–60 saniye gibi genel süre atanmadı."),
      [...e, ...simultaneous, ...recovery],
    );
  } else
    q["Buhar iş akışı"] = unknown(
      "Süt/buhar donanımı, kahve–buhar geçişi ve toparlanma verisi kaynakla eşleştirilmedi.",
    );
  e = evidence(p, "3 yollu solenoid");
  q["3 yollu solenoid"] = p.category?.includes("Tam otomatik")
    ? cell(
        "na",
        "Kapalı otomatik demleme ünitesi",
        "Portafiltre basıncı boşaltma iş akışıyla doğrudan aynı ölçüt değildir.",
      )
    : e.length
      ? cell(
          e.every((r) => absent(r.value)) ? "no" : "yes",
          e.map((r) => r.value).join(" · "),
          "Tahliye/temizlik donanımı; her shotta kuru puck, anında güvenli açma veya lezzet garantisi değildir.",
          e,
        )
      : unknown("Üç yollu tahliye valfi kaynakla doğrulanmadı.");
  e = evidence(p, "Ön demleme");
  q["Ön demleme"] = e.length
    ? cell(
        e.every((r) => absent(r.value)) ? "no" : "yes",
        e.map((r) => r.value).join(" · "),
        "Sabit/ayarlı/pasif yöntem kaynak değerinde belirtilir. Islatma desteği, otomatik olarak kanalsız ekstraksiyon kanıtı değildir.",
        e,
      )
    : unknown("Ön ıslatma varlığı ve kontrol tipi doğrulanmadı.");
  const parts = evidence(
    p,
    /Yedek parça desteği|Türkiye servis desteği|Parça kataloğu/,
  );
  const both =
    parts.some((r) => /parça/i.test(r.key) && !absent(r.value)) &&
    parts.some((r) => /servis/i.test(r.key) && !absent(r.value));
  if (parts.length)
    q["Parça ekosistemi"] = cell(
      parts.every((r) => absent(r.value)) ? "no" : both ? "yes" : "limited",
      parts.map((r) => r.value).join(" · "),
      "Model bazında parça ve yerel servis kapsamı ayrı okunmalıdır. Herhangi bir ömür veya 10 yıl garanti sonucu çıkarılmaz.",
      [...parts, ...size],
    );
  else if (size.length)
    q["Parça ekosistemi"] = cell(
      "limited",
      size[0].value + " mm ölçü belgeli; parça/servis kapsamı teyitsiz",
      "Standart çap yalnız başlangıç uyum bilgisidir; bayonet, sepet/tamper toleransı, Türkiye stoğu ve servis ayrıca kontrol edilir. 10 yıl ömür kanıtı değildir.",
      size,
    );
  else
    q["Parça ekosistemi"] = unknown(
      "Model için parça, aksesuar uyumu ve Türkiye servis kanalı doğrulanmadı; uzun ömür varsayılmadı.",
    );
  e = evidence(
    p,
    /^Doz ve çıktı$|Dozlama|Öğütme dozlama|Çıktı|Hacim|Kahve miktarı|Su miktarı ayarı|Kahve gücü ayarı|Tartıyla durdurma/i,
  );
  q["Doz ve çıktı"] = e.length
    ? cell(
        "yes",
        e.map((r) => r.value).join(" · "),
        "Hacim, süre ve ağırlık kontrolü aynı değildir; yalnız kaynakta belirtilen ayar olanağı işaretlenir.",
        e,
      )
    : unknown(
        "Giriş dozu ve fincandaki çıktı kontrolünün kapsamı kaynakla eşleştirilmedi.",
      );
  e = evidence(p, /Dahili terazi|Shot timer|Zamanlayıcı|Tartıyla durdurma/);
  e = [
    ...e,
    ...evidence(p, /^(PID|Dozlama)$/).filter((r) =>
      /shot timer|shot zamanlayıcı|ekstraksiyon zamanlayıcı/i.test(r.value),
    ),
  ];
  q["Ölçüm yardımcıları"] = e.length
    ? cell(
        e.every((r) => absent(r.value)) ? "no" : "yes",
        e.map((r) => r.key + ": " + r.value).join(" · "),
        "Terazi, shot zamanlayıcısı ve ağırlıkla durdurma farklı donanımlardır. Bulunmayan araç için harici ekipman gerekebilir.",
        e,
      )
    : unknown(
        "Dahili tartım/zamanlama yardımcısı doğrulanmadı; bulunmadığı varsayılmadı.",
      );
  e = evidence(
    p,
    /Temizlik|Su filtresi|Su yumuşatıcı|sertliği|sertlik ayarı|Çıkarılabilir demleme|Bakım|Backflush/i,
  );
  e = e.filter(
    (r) =>
      !/^Bakım$/i.test(r.key) ||
      /yıka|temiz|backflush|kireç|rinse|clean|çıkarılabilir/i.test(r.value),
  );
  q["Bakım ve su"] = e.length
    ? cell(
        e.every((r) => absent(r.value)) ? "no" : "yes",
        e
          .slice(0, 4)
          .map((r) => r.key + ": " + r.value)
          .join(" · "),
        "Yalnız belgelenen bakım/su özellikleri. Yumuşak veya filtrelenmiş su, ölçüm olmadan otomatik olarak espressoya uygun sayılmaz.",
        e,
      )
    : unknown(
        "Su sertliği ve modelin bakım yöntemleri için kaynaklı kapsam tamamlanmadı.",
      );
  e = evidence(
    p,
    /Ölçülmüş shot tutarlılığı|Günlük kapasite testi|Bağımsız seri servis testi/,
  );
  q["Kapasite kanıtı"] = e.length
    ? cell(
        "yes",
        e.map((r) => r.value).join(" · "),
        "Test koşulları ve kullanılan reçete/servis temposu kaynaktan okunmalı.",
        e,
      )
    : unknown(
        "Bu veri setinde bağımsız shot tutarlılığı veya 25 içeceklik servis kapasitesi testi yok. Donanımdan kapasite garantisi çıkarılmadı.",
      );
  Object.assign(q, evaluateAdditionalQuality(p));
  for (const [key, value] of Object.entries(q)) {
    if (value.state !== "unknown") continue;
    const checked = (p.researchChecks || []).filter(
      (check) =>
        check.criterion === key &&
        check.result === "not-published" &&
        Array.isArray(check.sources) &&
        check.sources.some((url) => /^https:\/\//.test(url)),
    );
    if (checked.length)
      q[key] = {
        state: "unpublished",
        value: "İncelenen kaynaklarda açıklanmıyor",
        reason:
          checked
            .map((check) => check.note)
            .filter(Boolean)
            .join(" · ") +
          " Bu, özelliğin bulunmadığı anlamına gelmez. Son araştırma: " +
          checked
            .map((check) => check.checked || "2026-10-22")
            .sort()
            .at(-1),
        sources: [
          ...new Set(
            checked
              .flatMap((check) => check.sources)
              .filter((url) => /^https:\/\//.test(url)),
          ),
        ],
      };
  }
  return q;
}
export function qualityFor(p, key) {
  return evaluateQuality(p)[key] || unknown("Bu ölçüt için eşleştirme yok.");
}
export function matchesQuality(p, keys, state = "yes") {
  const q = evaluateQuality(p);
  return keys.every((k) => q[k]?.state === state);
}
