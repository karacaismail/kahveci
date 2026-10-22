import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  qualityCriteria,
  extraQualityCriteria,
  evaluateQuality,
  qualityFor,
  matchesQuality,
} from "../src/quality.mjs";
const url = "https://manufacturer.example/exact-model";
const model = (specs = {}, verifiedKeys = Object.keys(specs), extra = {}) => ({
  id: "test",
  category: "Yarı otomatik",
  integrated: false,
  specs,
  verified: Object.fromEntries(verifiedKeys.map((k) => [k, url])),
  ...extra,
});
test("the eight requested criteria are always explicit for every product", () => {
  assert.equal(qualityCriteria.length, 8);
  const d = JSON.parse(
    fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
  );
  for (const p of d.products) {
    const rows = evaluateQuality(p);
    for (const c of [...qualityCriteria, ...extraQualityCriteria]) {
      assert.ok(rows[c.key], p.name + " " + c.key);
      assert.ok(
        [
          "yes",
          "no",
          "limited",
          "unknown",
          "unpublished",
          "external",
          "na",
        ].includes(rows[c.key].state),
      );
      if (rows[c.key].state === "yes")
        assert.ok(
          rows[c.key].sources.length > 0,
          p.name + " source for " + c.key,
        );
    }
  }
});
test("imported unchecked yes values never satisfy a quality criterion", () => {
  const p = model(
    {
      PID: "Var",
      "Basınçsız basket": "Var",
      "Ön demleme": "Var",
      "3 yollu solenoid": "Var",
    },
    [],
  );
  for (const c of qualityCriteria)
    assert.equal(qualityFor(p, c.key).state, "unknown");
});
test("pump peak pressure never becomes a brewing pressure or OPV confirmation", () => {
  const p = model({ "Pompa tepe basıncı": "20 bar" });
  assert.equal(qualityFor(p, "Gerçek demleme basıncı (bar)").state, "unknown");
  const p2 = model({
    "Gerçek demleme basıncı (bar)": "9 bar (üretici demleme beyanı)",
  });
  assert.equal(qualityFor(p2, "Gerçek demleme basıncı (bar)").state, "yes");
  assert.match(qualityFor(p2, "Gerçek demleme basıncı (bar)").reason, /ölçüm/);
});
test("PID confirms temperature control, not measured shot stability; thermoblock is not a failure", () => {
  const p = model({ PID: "Var", "Kazan tipi": "ThermoJet" });
  assert.equal(qualityFor(p, "PID").state, "yes");
  assert.match(qualityFor(p, "PID").reason, /ölç/);
  assert.equal(
    qualityFor(model({ "Kazan tipi": "Thermoblock" }), "PID").state,
    "unknown",
  );
});
test("58mm alone proves neither single-wall basket nor ten-year spare support", () => {
  const p = model({ "Portafilter çapı (mm)": "58" });
  assert.equal(qualityFor(p, "Basınçsız basket").state, "unknown");
  assert.equal(qualityFor(p, "Parça ekosistemi").state, "limited");
  assert.match(qualityFor(p, "Parça ekosistemi").reason, /ömür/);
});
test("separate grinder need and blade unsuitability are distinct from machine failure", () => {
  assert.equal(
    qualityFor(model({ "Entegre öğütücü ve kademe": "Yok" }), "Öğütüm kontrolü")
      .state,
    "external",
  );
  assert.equal(
    qualityFor(
      model({ "Entegre öğütücü ve kademe": "Bıçaklı" }),
      "Öğütüm kontrolü",
    ).state,
    "no",
  );
  assert.equal(
    qualityFor(
      model({ "Entegre öğütücü ve kademe": "Çelik konik / 25 kademe" }),
      "Öğütüm kontrolü",
    ).state,
    "yes",
  );
});
test("steam existence does not fabricate measured recovery time or thermoblock steam weakness", () => {
  const row = qualityFor(
    model({
      "Süt sistemi": "Manuel buhar çubuğu",
      "Kazan tipi": "Thermoblock",
    }),
    "Buhar iş akışı",
  );
  assert.equal(row.state, "limited");
  assert.match(row.reason, /toparlanma/);
  assert.ok(!row.value.includes("30–60"));
});
test("three-way criterion is NA for closed automatic brew units and programmed preinfusion is recognized", () => {
  assert.equal(
    qualityFor(model({}, [], { category: "Tam otomatik" }), "3 yollu solenoid")
      .state,
    "na",
  );
  assert.equal(
    qualityFor(model({ "Ön demleme": "Programlanabilir" }), "Ön demleme").state,
    "yes",
  );
});
test("quality filters AND selected criteria and support unknown, external and limited explicitly", () => {
  const p = model({ PID: "Var", "Entegre öğütücü ve kademe": "Yok" });
  assert.equal(matchesQuality(p, ["PID"], "yes"), true);
  assert.equal(matchesQuality(p, ["PID", "Basınçsız basket"], "yes"), false);
  assert.equal(matchesQuality(p, ["Öğütüm kontrolü"], "external"), true);
  assert.equal(matchesQuality(p, ["Parça ekosistemi"], "unknown"), true);
});

test("grinder type alone does not confirm adjustment because the field heading contains kademe", () => {
  assert.equal(
    qualityFor(
      model({ "Entegre öğütücü ve kademe": "Seramik" }),
      "Öğütüm kontrolü",
    ).state,
    "limited",
  );
  assert.equal(
    qualityFor(
      model({ "Entegre öğütücü ve kademe": "Konik, 25 kademe" }),
      "Öğütüm kontrolü",
    ).state,
    "yes",
  );
});

test("explicit shot timer inside sourced PID description is recognized, power-on timer is distinct", () => {
  assert.equal(
    qualityFor(model({ PID: "Var, shot timer" }), "Ölçüm yardımcıları").state,
    "yes",
  );
  assert.equal(
    qualityFor(
      model({ PID: "Var, açılış zamanlayıcısı" }),
      "Ölçüm yardımcıları",
    ).state,
    "unknown",
  );
});

test("documented research absence is distinct from unresearched or feature absence", () => {
  const p = model({}, [], {
    researchChecks: [
      {
        criterion: "Gerçek demleme basıncı (bar)",
        result: "not-published",
        sources: [url],
        note: "Ürün sayfası ve kullanım kılavuzu pompa basıncını veriyor, demleme basıncını açıklamıyor.",
        checked: "2026-10-22",
      },
    ],
  });
  const q = qualityFor(p, "Gerçek demleme basıncı (bar)");
  assert.equal(q.state, "unpublished");
  assert.deepEqual(q.sources, [url]);
  assert.match(q.reason, /kılavuzu/);
  assert.equal(qualityFor(p, "PID").state, "unknown");
  assert.equal(
    matchesQuality(p, ["Gerçek demleme basıncı (bar)"], "unpublished"),
    true,
  );
  assert.equal(
    qualityFor(
      model({ "Gerçek demleme basıncı (bar)": "9" }, undefined, {
        researchChecks: p.researchChecks,
      }),
      "Gerçek demleme basıncı (bar)",
    ).state,
    "yes",
  );
});

test("documented grinder adjustment with undisclosed burr geometry is partial, not wholly unresearched", () => {
  const p = model({ "Öğütme ayarı": "13 kademe" });
  const q = qualityFor(p, "Öğütüm kontrolü");
  assert.equal(q.state, "limited");
  assert.deepEqual(q.sources, [url]);
  assert.match(q.value, /13/);
});

test("a basket explicitly missing from the box never receives a green confirmation", () => {
  assert.equal(
    qualityFor(
      model({ "Basınçsız basket": "Kutuda yok — basınçlı portafiltre" }),
      "Basınçsız basket",
    ).state,
    "no",
  );
  assert.equal(
    qualityFor(
      model({
        "Basınçsız basket": "1 fincan basınçlı; 2 fincan; ESE filtresi",
      }),
      "Basınçsız basket",
    ).state,
    "limited",
  );
  assert.equal(
    qualityFor(
      model({ "Basınçsız basket": "Var — tek duvarlı sepet" }),
      "Basınçsız basket",
    ).state,
    "yes",
  );
});

test("a documented thermostat or pressurestat with no PID claim cannot become PID confirmation", () => {
  for (const value of [
    "Grup iki kartuş ısıtıcı ve termostatla kontrol ediliyor; bu sayfada PID beyanı yok.",
    "Basınç şalteri (pressurestat); PID beyanı yok",
  ])
    assert.equal(qualityFor(model({ PID: value }), "PID").state, "limited");
});
test("a nine-bar number inside a disclaimer or manual profile is not a fixed-nine-bar claim", () => {
  const p = model({
    "Gerçek demleme basıncı (bar)":
      "Kullanıcıya bağlı — paddle akışı kontrol eder; sabit 9 bar beyanı yerine akış profilleme",
  });
  assert.equal(qualityFor(p, "Gerçek demleme basıncı (bar)").state, "limited");
  assert.equal(
    qualityFor(
      model({
        "Gerçek demleme basıncı (bar)": "9 bar — üretici ekstraksiyon tasarımı",
      }),
      "Gerçek demleme basıncı (bar)",
    ).state,
    "yes",
  );
});

test("an external-grinder requirement followed by a blade warning is not a built-in blade grinder", () => {
  const p = model({
    "Entegre öğütücü ve kademe":
      "Harici öğütücü gerekli — üretici bıçaklı öğütücülerin uygun olmadığını belirtiyor",
  });
  assert.equal(qualityFor(p, "Öğütüm kontrolü").state, "external");
});

test("family-level fields cannot approve an unidentified SKU", () => {
  const p = model({ PID: "Var", "Basınçsız basket": "Var" }, undefined, {
    researchStatus: "needs-sku",
  });
  assert.equal(qualityFor(p, "PID").state, "unknown");
  assert.equal(qualityFor(p, "Basınçsız basket").state, "unknown");
});
