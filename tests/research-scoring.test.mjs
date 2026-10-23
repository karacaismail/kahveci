import test from "node:test";
import assert from "node:assert/strict";
import { preferenceScore, rankProducts } from "../src/domain.mjs";
import { evaluateQuality, extraQualityCriteria } from "../src/quality.mjs";
const url = "https://manufacturer.example/model";
const model = (specs = {}, extra = {}) => ({
  id: "research-test",
  category: "Yarı otomatik",
  integrated: true,
  specs,
  verified: Object.fromEntries(Object.keys(specs).map((k) => [k, url])),
  offers: [],
  ...extra,
});
test("unknown and unpublished share full uncertainty; no inferred service penalty", () => {
  const p = model(
    { PID: "Var" },
    { boilerArchitecture: "single", boilerArchitectureSource: url },
  );
  const low = preferenceScore(p, { cups: 5, milkShare: 50 });
  const high = preferenceScore(p, { cups: 25, milkShare: 50 });
  assert.equal(high.penalty, 0);
  assert.equal(high.score, low.score);
  assert.ok(Number.isFinite(high.scoreMin));
  assert.ok(high.scoreMin <= high.score);
  assert.ok(high.score <= high.scoreMax);
  const unknown = preferenceScore(model(), { milkShare: 0 });
  assert.equal(unknown.insufficientEvidence, true);
  const unpublished = preferenceScore(
    model(
      {},
      {
        researchChecks: [
          {
            criterion: "PID",
            result: "not-published",
            sources: [url],
            note: "İncelenen belgede açıklanmıyor.",
          },
        ],
      },
    ),
    { milkShare: 0 },
  );
  assert.equal(unknown.scoreMax, unpublished.scoreMax);
});
test("new measured criteria never infer laboratory performance from hardware", () => {
  assert.ok(
    extraQualityCriteria.some((c) => c.key === "Ölçülmüş sıcaklık kararlılığı"),
  );
  const q = evaluateQuality(
    model({
      PID: "Var",
      "Kazan tipi": "Çift kazan",
      "Entegre öğütücü ve kademe": "Konik çelik çapak; 30 ayar",
    }),
  );
  assert.equal(q["Ölçülmüş sıcaklık kararlılığı"].state, "unknown");
  assert.equal(q["Öğütücü retansiyonu"].state, "unknown");
});
test("autostop weighing contributes once and milk profiles change relevant weights", () => {
  const p = model({ "Tartıyla durdurma": "Var", "Dahili terazi": "Var" });
  const r = preferenceScore(p, { milkShare: 50 });
  assert.equal(
    r.rows.filter((x) => x.weight > 0 && /Ölçüm yardımcıları/.test(x.key))
      .length,
    0,
  );
  const plain = preferenceScore(p, { milkShare: 0 }),
    milky = preferenceScore(p, { milkShare: 100 });
  assert.equal(plain.rows.find((x) => x.key === "Buhar iş akışı").weight, 0);
  assert.ok(milky.rows.find((x) => x.key === "Buhar iş akışı").weight > 0);
});
test("negated or unconfirmed manufacturer descriptions never prove user temperature adjustment", () => {
  for (const value of [
    "Isı Kontrol teknolojisi üretici beyanı; PID veya kullanıcı ayarına kanıt değil",
    "Programlanabilir kahve sıcaklığı üretici tabloda yok işaretli",
  ]) {
    const q = evaluateQuality(model({ "Sıcaklık seçimi": value }));
    assert.notEqual(q["Sıcaklık ayarı"].state, "yes");
    assert.equal(q.PID.state, "unknown");
  }
  assert.equal(
    evaluateQuality(model({ "Sıcaklık seçimi": "3 seviye" }))["Sıcaklık ayarı"]
      .state,
    "yes",
  );
});

test("measured quantities need exact model provenance and a protocol, not merely a digit", () => {
  const p = model({
    "Ölçülmüş sıcaklık kararlılığı": "2026 yeni model 1 derece PID",
  });
  assert.equal(
    evaluateQuality(p)["Ölçülmüş sıcaklık kararlılığı"].state,
    "unknown",
  );
  p.measurements = {
    "Ölçülmüş sıcaklık kararlılığı": {
      modelId: p.id,
      value: 0.8,
      unit: "°C SD",
      protocol: "Beş şot, 60 sn aralık, Scace; 30 dk ısınma",
      sampleSize: 5,
      source: url,
      evidenceKind: "independent-measurement",
      location: "Grup çıkışı",
    },
  };
  assert.equal(
    evaluateQuality(p)["Ölçülmüş sıcaklık kararlılığı"].state,
    "limited",
  );
  p.measurements["Ölçülmüş sıcaklık kararlılığı"].modelId = "different-model";
  assert.equal(
    evaluateQuality(p)["Ölçülmüş sıcaklık kararlılığı"].state,
    "unknown",
  );
});
test("failed requirements rank last across both evidence sufficiency groups", () => {
  const specs = {
    PID: "Var",
    "Gerçek demleme basıncı (bar)": "9 bar",
    "Basınçsız basket": "Var",
  };
  const good = model(specs, { id: "good" });
  const empty = model({}, { id: "empty" });
  const failed = model({ ...specs, "Süt sistemi": "Yok" }, { id: "failed" });
  const failedEmpty = model({ "Süt sistemi": "Yok" }, { id: "failed-empty" });
  const ranked = rankProducts([failed, failedEmpty, empty, good], {
    milkShare: 100,
  });
  assert.deepEqual(
    ranked.map((p) => p.product.id),
    ["good", "empty", "failed", "failed-empty"],
  );
});

test("known temperature adjustment is scored consistently regardless of PID documentation", () => {
  const a = preferenceScore(model({ "Sıcaklık seçimi": "3 seviye" }), {
    milkShare: 0,
  });
  const b = preferenceScore(
    model({ "Sıcaklık seçimi": "3 seviye", PID: "Yok" }),
    { milkShare: 0 },
  );
  assert.equal(
    a.rows.find((r) => r.key === "PID").factor,
    b.rows.find((r) => r.key === "PID").factor,
  );
});
test("invalid statistical measurement metadata is rejected", () => {
  const m = {
    modelId: "research-test",
    value: 0.8,
    unit: "°C SD",
    protocol: "5 şot Scace",
    sampleSize: 5,
    source: url,
    evidenceKind: "independent-measurement",
    location: "Grup çıkışı",
  };
  for (const patch of [
    { sampleSize: Infinity },
    { sampleSize: 2.5 },
    { sampleSize: "5" },
    { value: -1 },
    { unit: {} },
    { protocol: {} },
    { location: {} },
    { source: "https://" },
  ]) {
    const p = model(
      {},
      { measurements: { "Ölçülmüş sıcaklık kararlılığı": { ...m, ...patch } } },
    );
    assert.equal(
      evaluateQuality(p)["Ölçülmüş sıcaklık kararlılığı"].state,
      "unknown",
    );
  }
});
test("ceramic grinder teeth are not classified as a spinning blade grinder", () => {
  const q = evaluateQuality(
    model({
      "Entegre öğütücü ve kademe": "1 öğütücü, seramik bıçaklar; 750 g hazne",
    }),
  );
  assert.notEqual(q["Öğütüm kontrolü"].state, "no");
});
test("economy modes and fault alarms do not prove cleaning access", () => {
  const q = evaluateQuality(
    model({ Bakım: "Ekonomi modu; kazanı kapatma; arıza teşhis alarmı" }),
  );
  assert.equal(q["Temizlik erişimi"].state, "unknown");
  assert.equal(q["Bakım ve su"].state, "unknown");
});
