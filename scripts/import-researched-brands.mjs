import fs from "node:fs/promises";
const file = new URL("../src/catalog.json", import.meta.url);
const catalog = JSON.parse(await fs.readFile(file, "utf8"));
const raw = JSON.parse(
  await fs.readFile(
    new URL("../research/new-brands.json", import.meta.url),
    "utf8",
  ),
);
const date = "2026-10-23";
for (const model of raw.products) {
  const official =
    model.suggestedId === "la-cimbali-m21-junior-s1"
      ? "https://www.cimbali.fr/sites/default/files/documenti/m21-junior.pdf"
      : model.currentStatus.source || model.currentStatus.sources?.at(-1);
  const p = {
    id: model.suggestedId,
    brand: model.brand,
    name: model.name,
    category: model.category,
    specs: {},
    verified: {},
    evidenceKind: {},
    offers: [],
    purchaseLinks: [],
    foreignOffers: model.foreignPrices.map((o) => ({ ...o, exact: true })),
    images: [
      ...new Set(
        model.gallery
          .filter((g) => !g.url.includes("Colori_Macchine_S1_tutte"))
          .map((g) => g.url),
      ),
    ],
    imageSources: model.gallery.filter(
      (g) => !g.url.includes("Colori_Macchine_S1_tutte"),
    ),
    notes: [
      model.variantNote,
      model.usageFit.homeOrCompactPro,
      model.usageFit.water,
      model.usageFit.daily5to25,
    ].filter(Boolean),
    researchNotes: model.researchGaps.filter((n) => !n.includes("talwalkars")),
    sources: [],
    researchChecks: [],
    integrated: model.suggestedId === "la-cimbali-s-lite",
    featured: false,
    boilerArchitecture: "unknown",
  };
  const sources = new Set();
  const add = (key, value, source, kind = "manufacturer") => {
    p.specs[key] = String(value);
    p.verified[key] = source;
    p.evidenceKind[key] = kind;
    sources.add(source);
  };
  for (const [key, field] of Object.entries(model.fields)) {
    if (field.value === null || field.value === undefined) continue;
    p.specs[key] =
      field.state === "conflict"
        ? "Çelişkili: " + field.value
        : String(field.value);
    if (
      ["verified", "partial", "conflict"].includes(field.state) &&
      field.source
    ) {
      p.verified[key] = field.source;
      p.evidenceKind[key] = field.evidenceKind || "technical-source";
      sources.add(field.source);
    }
    for (const url of field.extraSources || []) sources.add(url);
  }
  if (p.id === "la-cimbali-s-lite" && p.specs["Çıktı"]) {
    p.specs["Üretici servis kapasitesi"] = p.specs["Çıktı"];
    p.verified["Üretici servis kapasitesi"] = p.verified["Çıktı"];
    p.evidenceKind["Üretici servis kapasitesi"] = p.evidenceKind["Çıktı"];
    delete p.specs["Çıktı"];
    delete p.verified["Çıktı"];
    delete p.evidenceKind["Çıktı"];
  }
  if (
    ["la-spaziale-s1-mini-vivaldi-ii", "la-spaziale-s1-vivaldi-ii"].includes(
      p.id,
    )
  ) {
    delete p.specs["Sıcaklık seçimi"];
    delete p.verified["Sıcaklık seçimi"];
    delete p.evidenceKind["Sıcaklık seçimi"];
    add(
      "Grup sıcaklık göstergesi",
      "LED sıcaklık gösterimi, 1 °C adım; PID algoritması ve kararlılık ölçümü açıklanmıyor",
      "https://www.laspaziale.com/wp-content/uploads/2024/10/Brochure_S1.pdf",
    );
  }
  const heat = model.fields["Kazan tipi"];
  if (heat?.state === "verified") {
    p.boilerArchitecture = /çift kazan/i.test(heat.value)
      ? "dual"
      : /thermoblock/i.test(heat.value)
        ? "thermoblock"
        : /tek kazan/i.test(heat.value)
          ? "single"
          : "unknown";
    if (p.boilerArchitecture !== "unknown")
      p.boilerArchitectureSource = heat.source;
  }
  if (!p.integrated)
    add(
      "Entegre öğütücü ve kademe",
      "Harici espresso öğütücüsü gerekir",
      official,
    );
  const steam = model.fields["Buhar / sıcak su"];
  if (steam?.state === "verified" && !p.verified["Süt sistemi"])
    add("Süt sistemi", "Manuel buhar çubuğu", steam.source);
  const steamCheck = model.qualityCriteria["Buhar iş akışı"];
  if (
    !p.verified["Süt sistemi"] &&
    !p.verified["Buhar / sıcak su"] &&
    steamCheck.candidateState === "partial" &&
    steamCheck.value
  )
    add("Buhar", steamCheck.value, steamCheck.sources[0]);
  if (p.id === "elektra-verve")
    add(
      "Çıktı kontrolü",
      "Manuel: kahve dağıtımı kol ile",
      model.fields.Kontrol.source,
    );
  const dosage = model.fields["Doz ve çıktı"];
  if (dosage?.state === "verified") add("Dozlama", dosage.value, dosage.source);
  if (
    p.id !== "la-cimbali-m21-junior-s1" &&
    /oranlı doz|programlanabilir doz/i.test(model.fields.Kontrol?.value || "")
  )
    add(
      "Dozlama",
      "Programlanabilir doz; kontrol yöntemi üretici açıklamasında",
      model.fields.Kontrol.source,
    );
  for (const [criterion, check] of Object.entries(model.qualityCriteria)) {
    const urls = (check.sources || []).filter(
      (u) => /^https:\/\//.test(u) && !u.includes("portal.laspaziale.net"),
    );
    urls.forEach((url) => sources.add(url));
    // Reviews record absence of published evidence, never manufacture a positive feature.
    p.researchChecks.push({
      criterion,
      result: "not-published",
      sources: urls.length ? urls : [official],
      note: check.note || "İncelenen model kaynağında ek ayrıntı açıklanmıyor.",
      checked: date,
    });
  }
  // A remote monitoring service is not proof of local spare parts or Turkish service.
  for (const offer of model.offersTRY) {
    p.offers.push({
      ...offer,
      exact: offer.exact === true,
      available: offer.available === true,
      conditional: offer.seller === "MDA Coffee",
      note:
        (offer.note || "") +
        (offer.available === null ? " Stok teyit edilmedi." : ""),
    });
    sources.add(offer.url);
  }
  for (const link of (model.purchaseLinksTR || []).filter(
    (l) => !/404|kategorisine yönlendi/i.test(l.note || ""),
  ))
    p.purchaseLinks.push({
      seller: link.seller,
      url: link.url,
      note: link.note || "",
      checked: date,
      region: "TR",
      exact: link.exact === true,
    });
  for (const offer of p.foreignOffers)
    p.purchaseLinks.push({
      seller: offer.seller,
      url: offer.url,
      note:
        offer.note || "Yurt dışı teklif; Türkiye teslimatı ve vergiler ayrıca.",
      checked: date,
      region: offer.currency === "USD" ? "ABD" : "Yurt dışı",
      exact: true,
    });
  p.purchaseLinks.push({
    seller: "Üretici / model bilgisi",
    url: official,
    note: "Model bilgisi ve iletişim",
    checked: date,
    region: "Üretici",
    exact: true,
  });
  sources.add(official);
  for (const image of model.gallery) sources.add(image.sourcePage);
  p.sources = [...sources]
    .filter(Boolean)
    .map((url) => ({ label: new URL(url).hostname, url, checked: date }));
  if (p.id === "la-cimbali-m21-junior-s1") {
    const url =
      "https://www.cimbali.fr/sites/default/files/documenti/m21-junior.pdf";
    add("Çıktı kontrolü", "Manuel başlat/durdur (S/1)", url);
    add("Çıktı kontrolü", "Manuel başlat/durdur (S/1)", url);
    add("Kazan hacmi (L)", "2,5 (S/1 üretici föyü)", url);
    add("Güç (W)", "1900–2300 (220–240 V, 50 Hz; üretici S/1 föyü)", url);
    add("Ağırlık", "33 kg (üretici S/1 föyü)", url);
    add("Su yumuşatıcı", "Dahili su yumuşatıcı (S/1 föyü)", url);
    p.sources.push({ label: "Üretici S/1 teknik föy", url, checked: date });
    const offer = p.offers.find((o) => o.seller === "Barmarketim");
    p.offers.push({
      ...offer,
      price: 176638.18,
      conditional: true,
      note: "Havale / EFT fiyatı. " + offer.note,
    });
  }
  if (p.id === "elektra-micro-casa-leva") {
    const offer = p.offers.find((o) => o.url.includes("bakir"));
    p.offers.push({
      ...offer,
      price: 142129.74,
      conditional: true,
      note: "S1 bakır: havale ile %3 indirim. " + offer.note,
    });
  }
  if (p.id === "la-spaziale-s1-dream") {
    const more = [
      {
        seller: "Ginex (Almanya)",
        currency: "EUR",
        amount: 2399,
        url: "https://ginex-espressomaschinen.de/La-Spaziale-S1-Dream/T3383",
        note: "KDV dahil; kargo hariç. Sayfa stok ve 6–8 hafta teslimi birlikte yazıyor.",
      },
      {
        seller: "Kavos Sinergija (Litvanya)",
        currency: "EUR",
        amount: 4089.8,
        url: "https://kavossinergija.lt/parduotuve/profesionalus-kavos-aparatai/s1-dream/",
        note: "KDV dahil; sayfa 2–3 hafta teslim diyor.",
      },
    ];
    for (const offer of more) {
      p.foreignOffers.push({
        ...offer,
        observedAt: date,
        evidence: "source-page",
        exact: true,
      });
      p.purchaseLinks.push({
        seller: offer.seller,
        url: offer.url,
        note: offer.note,
        checked: date,
        region: "Yurt dışı",
        exact: true,
      });
      p.sources.push({ label: offer.seller, url: offer.url, checked: date });
    }
  }
  const index = catalog.products.findIndex((old) => old.id === p.id);
  if (index < 0) catalog.products.push(p);
  else catalog.products[index] = p;
}
catalog.updated = date;
await fs.writeFile(file, JSON.stringify(catalog, null, 2) + "\n");
console.log(
  "Imported",
  raw.products.length,
  "researched models; catalog",
  catalog.products.length,
);
