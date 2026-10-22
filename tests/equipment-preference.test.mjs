import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { equipmentPreferenceScore } from "../src/preference.mjs";
const source = "https://manufacturer.example/grinder";
const model = (specs) => ({
  category: "Öğütücü",
  specs,
  verified: Object.fromEntries(Object.keys(specs).map((k) => [k, source])),
});
test("all equipment gets a role-specific bounded score; unchecked legacy ratings cannot earn points", () => {
  const d = JSON.parse(
    fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
  );
  for (const p of d.equipment) {
    const r = equipmentPreferenceScore(p);
    assert.ok(r.score >= 0 && r.score <= 100);
    assert.ok(r.reasons.length);
  }
  assert.equal(
    equipmentPreferenceScore({
      category: "Öğütücü",
      specs: { "Espresso uygunluğu (1-5)": "5" },
      verified: {},
    }).score,
    0,
  );
});
test("blade grinding and a manufacturer filter-only scope fail espresso acceptance", () => {
  assert.ok(
    equipmentPreferenceScore(model({ Çark: "Çelik bıçak" })).failed.length,
  );
  assert.ok(
    equipmentPreferenceScore(
      model({
        Çark: "50 mm düz çark",
        Ayar: "Kademesiz mikrometrik",
        "Espresso kapsamı": "Güncel üretici önerisi Brew / filtre",
      }),
    ).failed.length,
  );
});
test("grinder burr and fine adjustment evidence earn points; price never affects equipment score", () => {
  const p = model({
      Çark: "Konik çelik burr",
      Ayar: "Kademesiz mikrometrik",
      "Espresso kapsamı": "Espresso için",
    }),
    r = equipmentPreferenceScore(p);
  assert.ok(r.score > 50);
  assert.equal(
    r.score,
    equipmentPreferenceScore({ ...p, offers: [{ price: 1 }] }).score,
  );
  assert.equal(
    r.score,
    equipmentPreferenceScore({ ...p, offers: [{ price: 1000000 }] }).score,
  );
});

test("material-only burr evidence remains partial and sourced absent helpers earn no points", () => {
  const r = equipmentPreferenceScore(
    model({ Çark: "Seramik", Ayar: "Kademesiz mikrometrik", Temizlik: "Yok" }),
  );
  assert.equal(r.rows[0].state, "limited");
  assert.equal(
    r.rows.find((row) => row.key === "Bakım ve parça erişimi").points,
    0,
  );
});

test("real catalog Nitro Blade branding, Bosch cutter and Ode exclusion are interpreted correctly", () => {
  const d = JSON.parse(
    fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
  );
  const c40 = equipmentPreferenceScore(
    d.equipment.find((p) => p.id === "comandantec40-mk4"),
  );
  const bosch = equipmentPreferenceScore(
    d.equipment.find((p) => p.id === "boschtsm6a"),
  );
  const ode = equipmentPreferenceScore(
    d.equipment.find((p) => p.name.includes("Ode")),
  );
  assert.ok(
    !c40.failed.some((r) => r.key === "Espressoya uygun çapaklı öğütüm"),
  );
  assert.ok(
    bosch.failed.some((r) => r.key === "Espressoya uygun çapaklı öğütüm"),
  );
  assert.ok(ode.failed.some((r) => r.key.includes("espresso kapsamı")));
  assert.ok(ode.score <= 49);
});
