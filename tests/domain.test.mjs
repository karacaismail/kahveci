import test from "node:test";
import assert from "node:assert/strict";
import {
  toggleComparison,
  bestOffer,
  setupCost,
  criterionState,
  csvText,
  rankProducts,
} from "../src/domain.mjs";
test("comparison rejects fifth product, removes existing and preserves order", () => {
  assert.deepEqual(toggleComparison(["a", "b", "c", "d"], "e"), [
    "a",
    "b",
    "c",
    "d",
  ]);
  assert.deepEqual(toggleComparison(["a", "b", "c", "d"], "b"), [
    "a",
    "c",
    "d",
  ]);
  assert.deepEqual(toggleComparison(["a"], "b"), ["a", "b"]);
});
test("price excludes unavailable, mismatched or nonpositive offers", () => {
  assert.equal(
    bestOffer({
      offers: [
        { price: 10, available: false },
        { price: 5, exact: false },
        { price: 0 },
        { price: 40 },
        { price: 30 },
      ],
    }).price,
    30,
  );
  assert.equal(bestOffer({ offers: [] }), null);
});
test("unknown grinder price cannot produce fake complete setup total", () => {
  assert.equal(
    setupCost({ offers: [{ price: 20000 }], integrated: false }, null, 2500),
    null,
  );
  assert.equal(
    setupCost({ offers: [{ price: 20000 }], integrated: false }, 10000, 2500),
    32500,
  );
  assert.equal(
    setupCost({ offers: [{ price: 20000 }], integrated: true }, 10000, 2500),
    22500,
  );
});
test("unverified feature is never checked as confirmed, NA differs from absent", () => {
  assert.equal(criterionState("Var", false), "unknown");
  assert.equal(criterionState("Var", true), "yes");
  assert.equal(criterionState("Yok", true), "no");
  assert.equal(criterionState("Uygulanamaz", true), "na");
  assert.equal(criterionState("?", true), "unknown");
});
test("export escapes commas, quotations, lines and spreadsheet formulas", () => {
  assert.equal(
    csvText([["=SUM(1)", "a,b", 'a"b', "x\ny"]]),
    '"\'=SUM(1)","a,b","a""b","x\ny"',
  );
});
test("technical ranking does not use price availability as a quality signal", () => {
  const p = [
    {
      id: "u",
      offers: [],
      integrated: true,
      category: "Tam otomatik",
      verified: {},
    },
    {
      id: "k",
      offers: [{ price: 100 }],
      integrated: true,
      category: "Tam otomatik",
      verified: {},
    },
  ];
  assert.equal(
    rankProducts(p, {
      budget: 1000,
      grinder: 0,
      accessories: 0,
      goal: "convenience",
      cups: 5,
    })[0].product.id,
    "u",
  );
});
import fs from "node:fs";
const catalog = JSON.parse(
  fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
test("all verified single-boiler architectures get the same high-volume penalty", () => {
  for (const name of [
    "Anna PL41TEM",
    "Classic E24",
    "Silvia V6",
    "Victoria PL91T",
    "Go",
  ]) {
    const p = catalog.products.find((p) => p.name === name);
    assert.ok(p, name + " exists");
    const opts = {
      budget: 100000,
      grinder: 16000,
      accessories: 2500,
      goal: "control",
    };
    const low = rankProducts([p], { ...opts, cups: 5 })[0].score;
    const high = rankProducts([p], { ...opts, cups: 25 })[0].score;
    assert.equal(
      high,
      Math.max(0, low - 15),
      name + " bounded high-volume penalty",
    );
  }
});
test("unverified architecture cannot become a recommendation penalty", () => {
  const p = {
    id: "unverified",
    offers: [{ price: 100 }],
    integrated: true,
    category: "Yarı otomatik",
    specs: { "Kazan tipi": "Tek kazan" },
    verified: {},
  };
  assert.equal(
    rankProducts([p], { budget: 1000, cups: 5 })[0].score,
    rankProducts([p], { budget: 1000, cups: 25 })[0].score,
  );
});
test("catalog source and offer integrity", () => {
  assert.equal(
    new Set(catalog.products.map((p) => p.id)).size,
    catalog.products.length,
  );
  for (const p of [...catalog.products, ...catalog.equipment]) {
    for (const [k, url] of Object.entries(p.verified)) {
      assert.equal(typeof p.specs[k], "string", p.name + " " + k);
      assert.match(url, /^https:\/\//);
    }
    for (const o of p.offers) {
      assert.ok(o.price > 0 && Number.isFinite(o.price));
      assert.match(o.url, /^https:\/\//);
    }
    for (const url of p.images) assert.match(url, /^https:\/\//);
  }
});

test("unknown accessory allowance cannot become a zero-cost setup", () => {
  assert.equal(
    setupCost({ offers: [{ price: 100 }], integrated: true }, 0, null),
    null,
  );
});
test("espresso-only workload does not receive a steam-transition penalty", () => {
  const p = catalog.products.find((p) => p.name === "Anna PL41TEM");
  const opts = {
    budget: 100000,
    grinder: 16000,
    accessories: 2500,
    goal: "control",
    milkShare: 0,
  };
  assert.equal(
    rankProducts([p], { ...opts, cups: 5 })[0].score,
    rankProducts([p], { ...opts, cups: 25 })[0].score,
  );
});
test("invalid or negative setup allowances never produce a usable total", () => {
  const p = { offers: [{ price: 20000 }], integrated: false };
  for (const invalid of [NaN, Infinity, -1]) {
    assert.equal(setupCost(p, invalid, 2500), null);
    assert.equal(setupCost(p, 16000, invalid), null);
  }
});
test("same-name models never receive another brand manufacturer data", () => {
  const g = catalog.products.find(
    (p) => p.brand === "Gaggia" && p.name === "Babila",
  );
  const f = catalog.products.find(
    (p) => p.brand === "Fakir" && p.name === "Babila",
  );
  assert.ok(
    !Object.values(g.verified).some((url) => url.includes("fakir")),
    "Fakir data on Gaggia Babila",
  );
  assert.ok(
    Object.values(f.verified).some((url) => url.includes("fakir")),
    "Fakir Babila source retained",
  );
});

test("a superseded cheaper observation cannot defeat the refreshed seller set", () => {
  const p = {
    offers: [
      { price: 9999, superseded: true },
      { price: 14999, seller: "Güncel satıcı" },
    ],
  };
  assert.equal(bestOffer(p).price, 14999);
});
