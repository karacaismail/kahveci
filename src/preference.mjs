import { evaluateQuality } from "./quality.mjs";
import { additionalQualityCriteria } from "./additional-quality.mjs";
import researchPolicy from "./research-policy.json" with { type: "json" };
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
for (const c of additionalQualityCriteria)
  acceptancePolicy[c.key] = {
    tier: c.measured ? "informational" : "optional",
    weight: 0,
    rule: c.why,
  };
acceptancePolicy["Su sertliği yönetimi"].tier = "required";
acceptancePolicy["Bakım ve su"].tier = "informational";
acceptancePolicy["Temizlik erişimi"].tier = "optional";
export function evaluatePreference(p, options = {}) {
  const q = evaluateQuality(p);
  const milk = Math.max(
    0,
    Math.min(100, Number.isFinite(options.milkShare) ? options.milkShare : 50),
  );
  const rows = researchPolicy.criteria.map((c) => {
    let value = q[c.key];
    // These are alternative controls within one benefit, never additive points.
    if (c.key === "PID" && q["Sıcaklık ayarı"].state === "yes")
      value = q["Sıcaklık ayarı"];
    if (c.key === "Ön demleme" && q["Akış profili"].state === "yes")
      value = q["Akış profili"];
    if (c.key === "Doz ve çıktı" && q["Çıktı kontrol yöntemi"].state === "yes")
      value = q["Çıktı kontrol yöntemi"];
    if (
      c.key === "Temizlik erişimi" &&
      ["unknown", "unpublished"].includes(value.state) &&
      q["3 yollu solenoid"].state === "yes"
    )
      value = q["3 yollu solenoid"];
    if (
      c.key === "Parça ekosistemi" &&
      !Object.keys(p.verified || {}).some((k) =>
        /Yedek parça|Türkiye.*servis|Parça kataloğu|Garanti/i.test(k),
      )
    )
      value = {
        state: "unknown",
        value: "Parça ve servis bilgisi yok",
        reason: "Portafiltre çapı tek başına parça ve servis desteği değildir.",
        sources: [],
      };
    let weight =
      c.weights.sade * (1 - milk / 100) + (c.weights.sutlu * milk) / 100;
    const external = c.key === "Öğütüm kontrolü" && value.state === "external";
    if (
      value.state === "na" ||
      external ||
      (c.key === "Buhar iş akışı" && milk === 0)
    )
      weight = 0;
    const known = ["yes", "limited", "no"].includes(value.state);
    const factor =
      value.state === "yes" ? 1 : value.state === "limited" ? 0.5 : 0;
    return {
      key: c.key,
      label: c.shortLabel,
      weight,
      factor,
      points: weight * factor,
      state: value.state,
      value: value.value,
      reason: value.reason,
      sources: value.sources,
      tier:
        c.tier === "zorunlu"
          ? "required"
          : c.tier === "koşullu"
            ? "conditional"
            : "optional",
      known,
    };
  });
  const rawPoints = rows.reduce((n, r) => n + r.points, 0);
  const maxPoints = rows.reduce((n, r) => n + r.weight, 0);
  const knownWeight = rows
    .filter((r) => r.known)
    .reduce((n, r) => n + r.weight, 0);
  const missingWeight = maxPoints - knownWeight;
  const score = knownWeight ? Math.round((rawPoints / knownWeight) * 100) : 0;
  const scoreMin = maxPoints ? Math.round((rawPoints / maxPoints) * 100) : 0;
  const partialWeight = rows
    .filter((r) => r.state === "limited")
    .reduce((n, r) => n + r.weight * 0.5, 0);
  const scoreMax = maxPoints
    ? Math.round(
        ((rawPoints + missingWeight + partialWeight) / maxPoints) * 100,
      )
    : 100;
  const evidence = maxPoints ? Math.round((knownWeight / maxPoints) * 100) : 0;
  const required = rows.filter(
    (r) => r.weight > 0 && ["required", "conditional"].includes(r.tier),
  );
  const pending = [
    ...required.filter((r) => !["yes", "no"].includes(r.state)),
    ...rows.filter(
      (r) => r.key === "Öğütüm kontrolü" && r.state === "external",
    ),
  ];
  const failed = required.filter((r) => r.state === "no");
  const insufficientEvidence = evidence < 30 || !required.some((r) => r.known);
  const reasons = rows
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 4)
    .map((r) => ({ ...r, points: Math.round(r.points * 10) / 10 }));
  // Keep detail-only information alongside scored groups without rewarding it twice.
  for (const c of additionalQualityCriteria)
    if (!rows.some((r) => r.key === c.key))
      rows.push({
        key: c.key,
        label: c.shortLabel,
        weight: 0,
        factor: 0,
        points: 0,
        ...q[c.key],
        tier: "informational",
      });
  const validBudget = Number.isFinite(options.budget) && options.budget > 0;
  const knownTotal = Number.isFinite(options.total) && options.total >= 0;
  const ratio =
    knownTotal && validBudget ? options.total / options.budget : null;
  const sensitivity = [];
  if (knownWeight)
    for (const row of rows.filter((r) => r.known && r.weight > 0))
      for (const change of [-0.25, 0.25])
        sensitivity.push(
          Math.round(
            ((rawPoints + row.points * change) /
              (knownWeight + row.weight * change)) *
              100,
          ),
        );
  return {
    score,
    scoreMin,
    scoreMax,
    knownWeight,
    evidence,
    insufficientEvidence,
    possibleMax: scoreMax,
    rawPoints,
    maxPoints,
    penalty: 0,
    rows,
    pending,
    failed,
    sensitivity: sensitivity.length
      ? [Math.min(...sensitivity), Math.max(...sensitivity)]
      : [0, 100],
    reasons: reasons.length
      ? reasons
      : [
          {
            key: "Kanıt eksik",
            label: "Puan için bilgi eksik",
            points: 0,
            value: "",
            state: "unknown",
          },
        ],
    total: knownTotal ? options.total : null,
    budgetStatus: ratio === null ? "unknown" : ratio <= 1 ? "within" : "over",
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
