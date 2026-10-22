import fs from "node:fs/promises";
import { bestOffer, csvText, preferenceScore } from "../src/domain.mjs";
import { qualityCriteria, evaluateQuality } from "../src/quality.mjs";
import { equipmentPreferenceScore } from "../src/preference.mjs";
const data = JSON.parse(
  await fs.readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const rows = data.products.map((p) => {
  const price = bestOffer(p),
    quality = evaluateQuality(p);
  const offers = p.offers.filter(
    (o) =>
      !o.superseded &&
      o.available !== false &&
      o.exact !== false &&
      o.price > 0,
  );
  const sellers = new Set(
    offers.map((o) => new URL(o.url).hostname.replace(/^www\./, "")),
  );
  return {
    id: p.id,
    brand: p.brand,
    model: p.name,
    category: p.category,
    researchStatus: p.researchStatus || null,
    preference: preferenceScore(p),
    price: price?.price ?? null,
    priceSource: price?.url ?? null,
    observedAt: price?.observedAt ?? null,
    withinBudget: !!price && price.price <= 50000,
    offers: offers.map((o) => ({
      seller: o.seller,
      price: o.price,
      url: o.url,
      evidence: o.evidence,
      observedAt: o.observedAt,
    })),
    alternativeSites: sellers.size,
    purchaseLinks: p.purchaseLinks || [],
    purchaseAlternativeSites: new Set([
      ...p.offers
        .filter((o) => !o.superseded && o.exact !== false)
        .map((o) => new URL(o.url).hostname.replace(/^www\./, "")),
      ...(p.purchaseLinks || [])
        .filter((l) => l.exact !== false)
        .map((l) => new URL(l.url).hostname.replace(/^www\./, "")),
    ]).size,
    images: p.images,
    criteria: Object.fromEntries(
      qualityCriteria.map((c) => [c.key, quality[c.key]]),
    ),
    unresearched: qualityCriteria
      .filter((c) => quality[c.key].state === "unknown")
      .map((c) => c.key),
    unpublished: qualityCriteria
      .filter((c) => quality[c.key].state === "unpublished")
      .map((c) => c.key),
  };
});
const budget = rows.filter((p) => p.withinBudget);
const result = {
  checked: "2026-10-22",
  ceiling: 50000,
  scope:
    "Listelenen uygun fiyat gözlemlerine göre; fiyatı bilinmeyen modeller bütçe dışında varsayılmaz. Fiyatlar canlı sepet garantisi değildir.",
  counts: {
    machines: rows.length,
    withinBudget: budget.length,
    allEightResearched: rows.filter((p) => !p.unresearched.length).length,
    needsSku: rows.filter((p) => p.researchStatus === "needs-sku").length,
    inaccessibleSources: rows.filter((p) =>
      /source-(unavailable|inaccessible)/.test(p.researchStatus || ""),
    ).length,
    budgetAllEightResearched: budget.filter((p) => !p.unresearched.length)
      .length,
    budgetWithAlternatives: budget.filter((p) => p.alternativeSites >= 2)
      .length,
    budgetWithPurchaseAlternatives: budget.filter(
      (p) => p.purchaseAlternativeSites >= 2,
    ).length,
    budgetWithMultipleImages: budget.filter((p) => p.images.length >= 2).length,
  },
  budget,
  missingPrice: rows
    .filter((p) => p.price === null)
    .map(({ id, brand, model }) => ({ id, brand, model })),
  aboveBudget: rows
    .filter((p) => p.price > 50000)
    .map(({ id, brand, model, price, priceSource }) => ({
      id,
      brand,
      model,
      price,
      priceSource,
    })),
};
await fs.mkdir(new URL("../public/", import.meta.url), { recursive: true });
await fs.writeFile(
  new URL("../public/butce-arastirmasi.json", import.meta.url),
  JSON.stringify(result, null, 2),
);
await fs.writeFile(
  new URL("../public/butce-arastirmasi.csv", import.meta.url),
  "\uFEFF" +
    csvText([
      [
        "Marka",
        "Model",
        "Gözlenen fiyat TL",
        "Fiyat kaynağı",
        "Kontrol tarihi",
        "Alternatif site",
        "Görsel sayısı",
        "Araştırılmamış kriter",
        ...qualityCriteria.flatMap((c) => [
          c.label + " — durum",
          c.label + " — bulgu",
          c.label + " — dayanak",
        ]),
      ],
      ...budget.map((p) => [
        p.brand,
        p.model,
        p.price,
        p.priceSource,
        p.observedAt,
        p.alternativeSites,
        p.images.length,
        p.unresearched.join(" | "),
        ...qualityCriteria.flatMap((c) => [
          p.criteria[c.key].state,
          p.criteria[c.key].value,
          p.criteria[c.key].sources.join(" | "),
        ]),
      ]),
    ]),
);
console.log(JSON.stringify(result.counts));

await fs.writeFile(
  new URL("../public/tercih-puanlari.json", import.meta.url),
  JSON.stringify(
    {
      context: {
        budget: 50000,
        grinder: 16000,
        accessories: 2500,
        cups: 5,
        milkShare: 50,
        goal: "control",
      },
      equipment: data.equipment.map((p) => ({
        id: p.id,
        brand: p.brand,
        model: p.name,
        ...equipmentPreferenceScore(p),
      })),
      models: rows.map(({ id, brand, model, preference }) => ({
        id,
        brand,
        model,
        ...preference,
      })),
    },
    null,
    2,
  ),
);
await fs.writeFile(
  new URL("../public/tercih-puanlari.csv", import.meta.url),
  "\uFEFF" +
    csvText([
      [
        "Marka",
        "Model",
        "Tercih puanı /100",
        "Kanıt kapsamı %",
        "Kurulum TL",
        "Bütçe durumu",
        "Kabul durumu",
        "Tercih nedenleri",
      ],
      ...rows.map((p) => [
        p.brand,
        p.model,
        p.preference.score,
        p.preference.evidence,
        p.preference.total,
        p.preference.budgetStatus,
        p.preference.acceptance,
        p.preference.reasons.map((r) => r.label + ": " + r.points).join(" | "),
      ]),
    ]),
);
