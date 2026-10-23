import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { evaluateQuality, qualityCriteria } from "../src/quality.mjs";
import { preferenceScore, bestOffer } from "../src/domain.mjs";
const { products } = JSON.parse(
  fs.readFileSync(new URL("../src/catalog.json", import.meta.url)),
);
const ids = [
  "la-spaziale-s1-mini-vivaldi-ii",
  "la-spaziale-s1-vivaldi-ii",
  "la-spaziale-s1-dream",
  "elektra-micro-casa-leva",
  "elektra-verve-mini",
  "elektra-verve",
  "la-cimbali-m21-junior-s1",
  "la-cimbali-s-lite",
];
test("all eight new exact models have source-linked facts, gallery provenance and eight reviewed criteria", () => {
  for (const id of ids) {
    const p = products.find((p) => p.id === id);
    assert(p, id);
    assert(p.images.length >= 2);
    assert(
      p.images.every((url) =>
        p.imageSources.some((s) => s.url === url && s.sourcePage),
      ),
    );
    assert(p.sources.length > 0);
    assert(Object.keys(p.verified).length >= 5);
    assert(p.purchaseLinks.length >= 1);
    const q = evaluateQuality(p);
    for (const c of qualityCriteria)
      assert(q[c.key].state !== "unknown", id + " " + c.key);
    assert(Number.isFinite(preferenceScore(p).score));
    for (const o of p.offers) {
      assert(typeof o.exact === "boolean");
      assert(typeof o.available === "boolean");
      assert(o.price > 0);
    }
    for (const o of p.foreignOffers || [])
      assert(["EUR", "USD"].includes(o.currency));
  }
});
test("uncertain prices and variants are not cheapest eligible offers", () => {
  const mini = products.find((p) => p.id === "elektra-verve-mini");
  assert(mini);
  assert.equal(bestOffer(mini), null);
  const cimbali = products.find((p) => p.id === "la-cimbali-m21-junior-s1");
  assert.equal(bestOffer(cimbali).seller, "Barmarketim");
  const slite = products.find((p) => p.id === "la-cimbali-s-lite");
  assert.notEqual(evaluateQuality(slite)["Öğütüm kontrolü"].state, "no");
});
test("exact variant dosage and grinder warnings do not borrow unrelated controls", () => {
  const s1 = products.find((p) => p.id === "la-cimbali-m21-junior-s1");
  assert(!/programlanabilir/i.test(s1.specs.Dozlama || ""));
  const dream = products.find((p) => p.id === "la-spaziale-s1-dream");
  assert.notEqual(evaluateQuality(dream)["Öğütüm hassasiyeti"].state, "yes");
});
