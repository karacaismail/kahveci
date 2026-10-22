import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { bestOffer } from "../src/domain.mjs";
import { qualityCriteria, evaluateQuality } from "../src/quality.mjs";
const data = JSON.parse(
  fs.readFileSync(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
test("the completed priority research queue retains eight reviewed criteria, multi-image galleries and distinct purchase pages", () => {
  const priority = data.products.filter((p) => {
    const price = bestOffer(p);
    return price && price.price <= 50000;
  });
  assert.ok(priority.length);
  for (const p of priority) {
    const q = evaluateQuality(p);
    for (const c of qualityCriteria)
      assert.notEqual(q[c.key].state, "unknown", p.id + " " + c.key);
    assert.ok(p.images.length >= 2, p.id + " gallery");
    const urls = [
      ...p.offers
        .filter((o) => !o.superseded && o.exact !== false)
        .map((o) => o.url),
      ...(p.purchaseLinks || [])
        .filter((l) => l.exact !== false)
        .map((l) => l.url),
    ];
    assert.ok(
      new Set(urls.map((url) => new URL(url).hostname.replace(/^www\./, "")))
        .size >= 2,
      p.id + " purchase pages",
    );
  }
});
test("research absence, inaccessible documents and unidentified families remain distinct", () => {
  for (const p of data.products) {
    if (p.researchStatus === "needs-sku")
      assert.ok(
        Object.values(evaluateQuality(p)).every((q) => q.state === "unknown"),
      );
    for (const c of p.researchChecks || []) {
      assert.equal(c.result, "not-published");
      assert.ok(c.note && c.sources.length);
      assert.ok(c.sources.every((url) => url.startsWith("https://")));
    }
  }
});
