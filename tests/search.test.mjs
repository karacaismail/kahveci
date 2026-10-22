import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchIndex, searchIndex } from "../src/search.mjs";
const a = {
  id: "a",
  brand: "Lelit",
  name: "Anna",
  category: "Yarı otomatik",
  specs: { PID: "Var", Portafiltre: "57 mm" },
  verified: { PID: "https://lelit.com/anna" },
  offers: [
    {
      seller: "Mağaza",
      price: 41999,
      url: "https://shop.test/anna",
      observedAt: "2026-10-22",
    },
  ],
  notes: ["Pirinç kazan"],
  sources: [],
  images: [],
  researchChecks: [],
  integrated: false,
};
const b = {
  ...a,
  id: "b",
  brand: "Diğer",
  name: "Basit",
  specs: { PID: "Yok" },
  notes: ["Paslanmaz gövde"],
  offers: [],
};
const index = buildSearchIndex(
  [a, b],
  [{ ...a, id: "grinder", category: "Öğütücü", name: "İnce ayar değirmen" }],
);
test("all nested data, Turkish folding, numeric prices and multiple terms are searchable", () => {
  assert(searchIndex(index, "lelit pirinc").some((x) => x.id === "a"));
  assert(searchIndex(index, "41.999").some((x) => x.id === "a"));
  assert(searchIndex(index, "shop.test").some((x) => x.id === "a"));
  assert(searchIndex(index, "57mm").some((x) => x.id === "a"));
  assert(!searchIndex(index, "lelit olmayanterimxyz").length);
});
test("search includes equipment, concepts and unknown/absent evidence without converting it to yes", () => {
  assert(searchIndex(index, "degirmen").some((x) => x.kind === "equipment"));
  assert(searchIndex(index, "preinfusion").some((x) => x.kind === "concept"));
  const result = searchIndex(index, "PID Yok").find((x) => x.id === "b");
  assert(result);
  assert(result.matches.some((m) => m.value.includes("Yok")));
});
test("quoted phrases require order, unsafe text stays plain data and whitespace returns no results", () => {
  assert(searchIndex(index, '"pirinc kazan"').some((x) => x.id === "a"));
  assert(!searchIndex(index, '"kazan pirinc"').some((x) => x.id === "a"));
  assert.deepEqual(searchIndex(index, "   "), []);
  assert.deepEqual(searchIndex(index, "<script>alert(1)</script>"), []);
});

test("translated field names are searchable alongside their values", () => {
  assert(searchIndex(index, "fiyat 41999").some((x) => x.id === "a"));
});
