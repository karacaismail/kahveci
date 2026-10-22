import { evaluateQuality } from "./quality.mjs";
export const acceptancePolicy = {
  "Öğütüm kontrolü": {
    tier: "required",
    weight: 16,
    rule: "Dahili veya ayrıca bütçelenmiş, espresso için ince ayarlanabilen çapaklı değirmen. Bıçaklı öğütücüyü kabul etme.",
  },
  "Gerçek demleme basıncı (bar)": {
    tier: "required",
    weight: 15,
    rule: "Demleme basıncı/kontrol yöntemi belgeli olmalı. Pompa tepe değeri yeterli değildir. 9 bar yaygın referanstır; üreticinin 6–9 bar gibi kontrollü kol profili ayrıca değerlendirilir, OPV her mimaride zorunlu değildir.",
  },
  PID: {
    tier: "required",
    weight: 15,
    rule: "Tekrarlanabilir demleme için sıcaklık kontrolü bulunmalı. PID güçlü bir donanım desteğidir; kararlılık ancak ölçümle doğrulanır. Kazan veya thermoblock adı tek başına geçer/kalır nedeni değildir.",
  },
  "Basınçsız basket": {
    tier: "required",
    weight: 10,
    rule: "Açık portafiltreli sistemde tek duvarlı sepet ve uyumlu aksesuar bulunmalı. 51/54/57/58 mm olabilir; 58 mm zorunlu değildir. Kapalı otomatik grup için uygulanamaz.",
  },
  "Buhar iş akışı": {
    tier: "conditional",
    weight: 6,
    rule: "Sütlü içecek isteniyorsa uygun süt sistemi ve servis temposu gerekir. Sade espresso için zorunlu değildir. Eşzamanlılık, gerçek köpük kalitesi veya toparlanma ölçümü yerine geçmez.",
  },
  "3 yollu solenoid": {
    tier: "optional",
    weight: 4,
    rule: "Tahliye ve temizliği kolaylaştıran tercih avantajı. Tek başına fincan kalitesinin zorunlu şartı değildir.",
  },
  "Ön demleme": {
    tier: "optional",
    weight: 5,
    rule: "Ekstraksiyon yönetimini kolaylaştıran tercih avantajı. Sabit, ayarlı ve kullanıcı kontrollü yöntemler ayrıdır.",
  },
  "Parça ekosistemi": {
    tier: "required",
    weight: 8,
    rule: "Kesin modele uyumlu parça/aksesuar kanalı ve güncel Türkiye servis/garanti muhatabı doğrulanmalı. Pirinç, metal veya 58 mm için otomatik ömür puanı verilmez.",
  },
  "Doz ve çıktı": {
    tier: "required",
    weight: 6,
    rule: "Kahve dozu ve fincan çıktısı tekrarlanabilir biçimde yönetilebilmeli. Harici terazi/zamanlayıcı kullanılabilir; dahili olması zorunlu değildir.",
  },
  "Ölçüm yardımcıları": {
    tier: "optional",
    weight: 3,
    rule: "Dahili tartım veya shot zamanlayıcısı iş akışını kolaylaştırır. Eksikse harici araçla tamamlanabilir.",
  },
  "Bakım ve su": {
    tier: "required",
    weight: 4,
    rule: "Üreticinin temizlik/kireç/su yöntemi ve erişilebilir bakım parçaları olmalı. Körlemesine su yumuşatma veya modifikasyon kabul gerekçesi değildir.",
  },
  "Kapasite kanıtı": {
    tier: "informational",
    weight: 0,
    rule: "Bağımsız seri servis/tutarlılık ölçümü varsa ayrıca okunur. Bu veri setinde ölçüm bulunmadığından varsayımsal kapasite puanı verilmez.",
  },
};
export function evaluatePreference(p, options) {
  const q = evaluateQuality(p),
    milk = Number.isFinite(options.milkShare) ? options.milkShare : 50;
  const rows = Object.entries(acceptancePolicy).map(([key, policy]) => {
    const value = q[key];
    let weight = policy.weight;
    if (value.state === "na" || (key === "Buhar iş akışı" && milk === 0))
      weight = 0;
    const factor =
      value.state === "yes"
        ? 1
        : ["limited", "external"].includes(value.state)
          ? 0.5
          : 0;
    return {
      key,
      label: key,
      weight,
      factor,
      points: weight * factor,
      state: value.state,
      value: value.value,
      reason: value.reason,
      sources: value.sources,
      tier: policy.tier,
    };
  });
  const validBudget = Number.isFinite(options.budget) && options.budget > 0;
  const knownTotal = Number.isFinite(options.total) && options.total >= 0;
  const ratio =
    knownTotal && validBudget ? options.total / options.budget : null;
  const auto = p.category?.includes("Tam otomatik"),
    manual =
      p.category?.toLowerCase().includes("manuel") &&
      !p.category?.toLowerCase().includes("yarı");
  const workflow =
    options.goal === "convenience"
      ? auto
        ? 1
        : p.integrated
          ? 0.75
          : manual
            ? 0.2
            : 0.45
      : auto
        ? 0.4
        : 1;
  rows.push({
    key: "Kullanım tercihi",
    label: "Kontrol / kolaylık tercihi",
    weight: 6,
    factor: workflow,
    points: 6 * workflow,
    state: "yes",
    value:
      options.goal === "convenience"
        ? "Kolay paylaşım önceliği"
        : "Reçete kontrolü önceliği",
    reason:
      "Seçtiğiniz iş akışı ile katalogdaki makine sınıfının eşleşmesi; otomatik veya manuel olma bir tat puanı değildir.",
    sources: [],
    tier: "preference",
  });
  const warmKey = Object.keys(p.verified || {}).find((k) =>
    /^Isınma süresi/.test(k),
  );
  const warmValue = warmKey ? p.specs[warmKey] : null;
  const warmSeconds =
    warmValue && !/\?|belirsiz|ölçülmedi/i.test(warmValue)
      ? Number.parseFloat(warmValue.replace(",", "."))
      : NaN;
  const validWarm = Number.isFinite(warmSeconds) && warmSeconds >= 0;
  const warmFactor = validWarm
    ? warmSeconds <= 60
      ? 1
      : warmSeconds <= 180
        ? 0.6
        : 0.3
    : 0;
  rows.push({
    key: "Isınma kolaylığı",
    label: "Kaynaklı ısınma süresi",
    weight: 2,
    factor: warmFactor,
    points: 2 * warmFactor,
    state: validWarm ? "yes" : "unknown",
    value: validWarm ? warmValue : "Doğrulanmadı",
    reason:
      "Yalnız saniye olarak kaynaklanan hazır olma beyanı. Grup/portafiltrenin tam ısındığını veya seri servis kararlılığını kanıtlamaz.",
    sources: warmKey ? [p.verified[warmKey]] : [],
    tier: "preference",
  });
  const rawPoints = rows.reduce((n, r) => n + r.points, 0),
    maxPoints = rows.reduce((n, r) => n + r.weight, 0);
  const penalty =
    options.cups >= 15 &&
    milk > 0 &&
    p.boilerArchitecture === "single" &&
    p.boilerArchitectureSource
      ? 15
      : 0;
  const score = Math.max(
    0,
    Math.min(100, Math.round((rawPoints / maxPoints) * 100) - penalty),
  );
  const missingWeight = rows
    .filter((r) => ["unknown", "unpublished"].includes(r.state))
    .reduce((n, r) => n + r.weight, 0);
  const unawardedPartial = rows
    .filter((r) => ["limited", "external"].includes(r.state))
    .reduce((n, r) => n + r.weight * (1 - r.factor), 0);
  const evidence = Math.round(((maxPoints - missingWeight) / maxPoints) * 100);
  const required = rows.filter(
    (r) =>
      (r.tier === "required" || (r.tier === "conditional" && milk > 0)) &&
      r.weight > 0,
  );
  const pending = required.filter((r) => !["yes", "no"].includes(r.state));
  const failed = required.filter((r) => r.state === "no");
  const reasons = rows
    .filter((r) => r.points > 0 && r.weight > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((r) => ({
      key: r.key,
      label: r.label,
      points: Math.round(r.points * 10) / 10,
      value: r.value,
      state: r.state,
    }));
  if (penalty)
    reasons.push({
      key: "Servis temposu",
      label: "Ardışık sütlü servis geçişi",
      points: -penalty,
      value:
        "Kaynaklı tek kazan; 15+ günlük içecek ve sütlü servis varsayımı. Ölçülmüş kapasite testi değildir.",
      state: "limited",
    });
  return {
    score,
    budgetStatus: ratio === null ? "unknown" : ratio <= 1 ? "within" : "over",
    evidence,
    possibleMax: Math.max(
      score,
      Math.min(
        100,
        Math.round(
          ((rawPoints + missingWeight + unawardedPartial) / maxPoints) * 100,
        ) - penalty,
      ),
    ),
    rawPoints,
    maxPoints,
    penalty,
    rows,
    pending,
    failed,
    reasons: reasons.length
      ? reasons
      : [
          {
            key: "Kanıt eksik",
            label: "Puanı destekleyecek bilgi yok",
            points: 0,
            value: "Araştırma eksikliği ürün kusuru sayılmaz.",
            state: "unknown",
          },
        ],
    total: knownTotal ? options.total : null,
    acceptance: failed.length
      ? "Karşılanmayan şart var"
      : pending.length
        ? "Şartlar tamamlanmalı"
        : "Belgelenen şartlar karşılanıyor",
  };
}

export function relatedPreferenceCriterion(key) {
  if (Object.hasOwn(acceptancePolicy, key)) return key;
  if (/Pompa|Güç|Menşei|Boyut|Ağırlık|Gövde|Malzeme|Kazan tipi/i.test(key))
    return null;
  if (/OPV|Demleme basıncı/i.test(key)) return "Gerçek demleme basıncı (bar)";
  if (/Öğüt|Çark|Burr/i.test(key)) return "Öğütüm kontrolü";
  if (/Sıcaklık|TermoPID/i.test(key)) return "PID";
  if (/Portafilter|Portafiltre|Sepet|Basket/i.test(key))
    return "Basınçsız basket";
  if (/Süt|Buhar|Eşzamanlı/i.test(key)) return "Buhar iş akışı";
  if (/Ön ıslatma|Pre.infusion/i.test(key)) return "Ön demleme";
  if (/Parça|Servis|Garanti/i.test(key)) return "Parça ekosistemi";
  if (/Doz|Çıktı|Hacim|Kahve miktarı/i.test(key)) return "Doz ve çıktı";
  if (/Terazi|Timer|Zamanlayıcı|Tartıyla/i.test(key))
    return "Ölçüm yardımcıları";
  if (/Temiz|Bakım|Su filt|Sertlik|Backflush/i.test(key)) return "Bakım ve su";
  if (/Isınma süresi/i.test(key)) return "Isınma kolaylığı";
  return null;
}

// Equipment uses its own role criteria; its score is not comparable with a machine score.
export function equipmentPreferenceScore(p) {
  const entries = Object.entries(p.verified || {})
    .map(([key, url]) => ({ key, url, value: p.specs?.[key] || "" }))
    .filter((r) => r.value && !/^\?|doğrulanmadı|belirsiz/i.test(r.value));
  const pick = (pattern) => entries.filter((r) => pattern.test(r.key));
  const rows = [];
  const add = (key, weight, evaluate, required = false) => {
    const found = evaluate();
    rows.push({
      key,
      weight,
      factor: found.factor,
      state: found.state,
      value:
        found.rows.map((r) => r.key + ": " + r.value).join(" · ") ||
        "Kaynaklı bilgi yok",
      sources: [...new Set(found.rows.map((r) => r.url))],
      points: weight * found.factor,
      required,
    });
  };
  const known = (rows) => {
    const absent =
      rows.length &&
      rows.every((r) => /^(yok|hayır|no\b|false\b)/i.test(r.value));
    return {
      rows,
      factor: rows.length && !absent ? 1 : 0,
      state: absent ? "no" : rows.length ? "yes" : "unknown",
    };
  };
  if (p.category === "Öğütücü") {
    add(
      "Espressoya uygun çapaklı öğütüm",
      32,
      () => {
        const e = pick(/Çark|Burr|Öğütücü tipi|Kesici/),
          text = e
            .map((r) => r.value)
            .join(" ")
            .replace(/Nitro\s*Blade/gi, "markalı çark");
        return {
          rows: e,
          factor: /bıçak|blade/i.test(text)
            ? 0
            : /konik|düz|flat|çapak|burr/i.test(text)
              ? 1
              : e.length
                ? 0.5
                : 0,
          state: /bıçak|blade/i.test(text)
            ? "no"
            : /konik|düz|flat|çapak|burr/i.test(text)
              ? "yes"
              : e.length
                ? "limited"
                : "unknown",
        };
      },
      true,
    );
    add(
      "Espresso aralığında ince ayar",
      28,
      () => {
        const e = pick(/Ayar|Kademe|Hassasiyet/),
          text = e.map((r) => r.value).join(" ");
        const fine =
          /kademesiz|stepless|mikrometrik|micrometric|mikron|micron|µm|μm/i.test(
            text,
          );
        return {
          rows: e,
          factor: fine ? 1 : e.length ? 0.5 : 0,
          state: fine ? "yes" : e.length ? "limited" : "unknown",
        };
      },
      true,
    );
    add(
      "Kaynakta belirtilen espresso kapsamı",
      20,
      () => {
        const e = pick(/Espresso kapsamı|Kullanım kapsamı|Uygunluk/),
          text = e.map((r) => r.value).join(" "),
          excluded =
            /^(uygun değil|hayır|yok|no\b|not\b)|Brew\s*\/\s*filtre|yalnız.*filtre|espresso.*değil|espresso.*önerilme/i.test(
              text,
            );
        return {
          rows: e,
          factor: excluded
            ? 0
            : /espresso/i.test(text)
              ? 1
              : e.length
                ? 0.5
                : 0,
          state: excluded
            ? "no"
            : /espresso/i.test(text)
              ? "yes"
              : e.length
                ? "limited"
                : "unknown",
        };
      },
      true,
    );
    add("Dozlama ve iş akışı", 10, () =>
      known(pick(/Dozlama|Retansiyon|Hazne değişimi/)),
    );
    add("Bakım ve parça erişimi", 10, () =>
      known(pick(/Temizlik|Bakım|Servis|Yedek parça|Kolay söküm/)),
    );
  } else if (p.category === "Süt sistemi") {
    add(
      "Köpük dokusu kontrolü",
      35,
      () => known(pick(/Mikro köpük kontrolü|Doku ayarı|Buhar kontrolü/)),
      true,
    );
    add(
      "Sıcaklık kontrolü",
      25,
      () => known(pick(/Sıcaklık kontrolü|Sıcaklık ayarı/)),
      true,
    );
    add("Kullanım ve servis akışı", 20, () =>
      known(pick(/Kapasite|Çalışma süresi|İş akışı/)),
    );
    add(
      "Temizlenebilirlik ve parça",
      20,
      () => known(pick(/Temizlik|Bakım|Parça|Bulaşık/)),
      true,
    );
  } else {
    add(
      "Kesin modele uyumluluk",
      40,
      () => known(pick(/Uyumluluk|Uyumlu model|Ölçü toleransı/)),
      true,
    );
    add(
      "Amaca uygun hassasiyet ve işlev",
      40,
      () => known(pick(/Hassasiyet|Ölçüm aralığı|Doğruluk|İşlev/)),
      true,
    );
    add("Bakım ve tekrar kullanım", 20, () =>
      known(pick(/Temizlik|Bakım|Parça|Malzeme standardı/)),
    );
  }
  const failed = rows.filter((r) => r.required && r.state === "no");
  const raw = rows.reduce((n, r) => n + r.points, 0);
  const score = Math.max(
    0,
    Math.min(failed.length ? 49 : 100, Math.round(raw)),
  );
  const evidence = rows
    .filter((r) => r.state !== "unknown")
    .reduce((n, r) => n + r.weight, 0);
  const reasons = rows
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 2)
    .map((r) => ({ label: r.key, points: r.points }));
  return {
    role: p.category,
    score,
    evidence,
    rows,
    failed,
    acceptance: failed.length
      ? "Espresso kabulünde karşılanmayan şart var"
      : rows.some((r) => r.required && r.state !== "yes")
        ? "Kaynak veya uygunluk tamamlanmalı"
        : "Rol kriterleri belgeli",
    reasons: reasons.length
      ? reasons
      : [
          {
            label:
              "Kesin ürün ve kaynaklı donanım bilgisi gerekli; eksik bilgi kalite yargısı değildir.",
            points: 0,
          },
        ],
  };
}
