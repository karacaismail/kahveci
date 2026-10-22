import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { preferenceScore, rankProducts } from "../src/domain.mjs";
import { acceptancePolicy } from "../src/preference.mjs";
const url = "https://manufacturer.example/model";
const model = (specs = {}, extra = {}) => ({
  id: "test",
  name: "Test",
  category: "Yarı otomatik",
  specs,
  verified: Object.fromEntries(Object.keys(specs).map((k) => [k, url])),
  offers: [{ price: 20000 }],
  integrated: true,
  ...extra,
});
const options = {
  budget: 50000,
  grinder: 16000,
  accessories: 2500,
  cups: 5,
  milkShare: 50,
  goal: "control",
};
test("every product receives a bounded preference score with traceable additive reasons", () => {
  const data = JSON.parse(
    fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
  );
  for (const p of data.products) {
    const r = preferenceScore(p, options);
    assert.ok(r.score >= 0 && r.score <= 100, p.id);
    assert.ok(r.evidence >= 0 && r.evidence <= 100);
    assert.ok(r.rows.length >= 14);
    assert.equal(
      r.rows.reduce((a, x) => a + x.points, 0),
      r.rawPoints,
    );
    assert.ok(r.reasons.length);
  }
});
test("unknown and unpublished never score as confirmed; evidence gaps remain visible", () => {
  const unknown = preferenceScore(model(), options),
    known = preferenceScore(model({ PID: "Var" }), options);
  assert.ok(known.score > unknown.score);
  assert.ok(known.evidence > unknown.evidence);
  const p = model(
    {},
    {
      researchChecks: [
        {
          criterion: "PID",
          result: "not-published",
          sources: [url],
          note: "Açıklanmıyor.",
        },
      ],
    },
  );
  assert.equal(preferenceScore(p, options).score, unknown.score);
  assert.ok(unknown.possibleMax >= unknown.score);
});
test("an external grinder creates a setup condition rather than proven grinder quality", () => {
  const p = model(
    { "Entegre öğütücü ve kademe": "Yok" },
    { integrated: false },
  );
  const r = preferenceScore(p, options);
  assert.ok(r.pending.some((x) => x.key === "Öğütüm kontrolü"));
  assert.equal(r.total, 38500);
});
test("budget uses full setup and ignores unavailable cheap offers", () => {
  const p = model(
    {},
    {
      integrated: false,
      offers: [{ price: 1000, available: false }, { price: 40000 }],
    },
  );
  const r = preferenceScore(p, options);
  assert.equal(r.total, 58500);
  assert.ok(!r.rows.some((x) => x.key === "Kurulum bütçesi"));
});
test("NA basket architecture is excluded, not called bad espresso", () => {
  const r = preferenceScore(model({}, { category: "Tam otomatik" }), options);
  assert.equal(r.rows.find((x) => x.key === "Basınçsız basket").weight, 0);
  assert.ok(!r.failed.some((x) => x.key === "Basınçsız basket"));
});
test("steam relevance follows milk requirement and single boiler penalty is explicit", () => {
  const p = model(
    { "Süt sistemi": "Manuel buhar çubuğu" },
    { boilerArchitecture: "single", boilerArchitectureSource: url },
  );
  const low = preferenceScore(p, options),
    busy = preferenceScore(p, { ...options, cups: 25 });
  assert.equal(busy.score, Math.max(0, low.score - 15));
  assert.equal(busy.penalty, 15);
  assert.equal(
    preferenceScore(p, { ...options, cups: 25, milkShare: 0 }).penalty,
    0,
  );
});
test("requirements and conveniences are distinct and brands/origin receive no score", () => {
  assert.equal(acceptancePolicy.PID.tier, "required");
  assert.equal(acceptancePolicy["3 yollu solenoid"].tier, "optional");
  const a = model({ PID: "Var" });
  assert.equal(
    preferenceScore(a, options).score,
    preferenceScore(
      {
        ...a,
        brand: "Other",
        specs: { ...a.specs, "Menşei/Üretim yeri": "Other" },
      },
      options,
    ).score,
  );
});
test("all-product ranking uses exactly the same preference score as product pages", () => {
  const a = model({ PID: "Var" }),
    b = model({}, { id: "other" });
  const ranked = rankProducts([b, a], options);
  assert.equal(ranked[0].product.id, "test");
  assert.equal(ranked[0].score, preferenceScore(a, options).score);
});

test("a required milk workflow fails when absent and is inactive for espresso-only use", () => {
  const p = model({ "Süt sistemi": "Yok" });
  assert.ok(
    preferenceScore(p, options).failed.some((r) => r.key === "Buhar iş akışı"),
  );
  assert.ok(
    !preferenceScore(p, { ...options, milkShare: 0 }).failed.some(
      (r) => r.key === "Buhar iş akışı",
    ),
  );
});
test("technical ranking can prefer an over-budget model without changing its displayed cost", () => {
  const affordable = model({}, { id: "within", offers: [{ price: 20000 }] }),
    over = model({ PID: "Var" }, { id: "over", offers: [{ price: 60000 }] }),
    unknown = model({ PID: "Var" }, { id: "unknown", offers: [] });
  const ranked = rankProducts([over, unknown, affordable], options);
  assert.equal(ranked[0].product.id, "over");
  assert.equal(ranked[0].budgetStatus, "over");
  assert.equal(preferenceScore(over, options).budgetStatus, "over");
  assert.equal(preferenceScore(unknown, options).budgetStatus, "unknown");
});

test("the mathematical ceiling includes partial documentation that can become complete", () => {
  const specs = {
    "Entegre öğütücü ve kademe": "Konik 25 kademe",
    "Gerçek demleme basıncı (bar)": "9",
    PID: "Var",
    "Basınçsız basket": "Var",
    "Süt sistemi": "Buhar çubuğu",
    "Kahve ve buhar eşzamanlı": "Var",
    "3 yollu solenoid": "Var",
    "Ön demleme": "Var",
    "Yedek parça desteği": "Model parça kataloğu var",
    Dozlama: "Programlanabilir",
    "Shot timer": "Var",
    Temizlik: "Kireç ve su sertliği programı",
    "Isınma süresi (sn)": "3",
  };
  const partial = preferenceScore(model(specs), options),
    complete = preferenceScore(
      model({ ...specs, "Türkiye servis desteği": "Yetkili servis kanalı" }),
      options,
    );
  assert.ok(complete.score > partial.score);
  assert.ok(partial.possibleMax >= complete.score);
});

test("price, missing price, budget and setup allowances cannot change technical preference or acceptance", () => {
  const technical = {
    PID: "Var",
    "Basınçsız basket": "Var",
    "Entegre öğütücü ve kademe": "Konik 25 kademe",
  };
  const cheap = model(technical, { offers: [{ price: 1 }] }),
    expensive = model(technical, { offers: [{ price: 1000000 }] }),
    unpriced = model(technical, { offers: [] });
  const baseline = preferenceScore(cheap, options);
  for (const p of [expensive, unpriced])
    for (const budget of [1, 50000, 10000000]) {
      const r = preferenceScore(p, {
        ...options,
        budget,
        grinder: 0,
        accessories: 0,
      });
      assert.equal(r.score, baseline.score);
      assert.equal(r.evidence, baseline.evidence);
      assert.deepEqual(r.rows, baseline.rows);
      assert.equal(r.acceptance, baseline.acceptance);
    }
  assert.ok(!baseline.rows.some((r) => /bütçe|fiyat/i.test(r.key)));
});
