import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { productImageUrl } from "../src/image-url.mjs";
const { products } = JSON.parse(
  fs.readFileSync(new URL("../src/catalog.json", import.meta.url)),
);
test("all eight model galleries use bundled files at root and Pages subpaths", () => {
  for (const p of products.filter((p) => p.imageSources))
    for (const source of p.images) {
      const src = productImageUrl(source, "/kahveci/");
      assert(src.startsWith("/kahveci/images/research/"));
      assert(
        fs.statSync(
          new URL(
            "../public/" + src.slice("/kahveci/".length),
            import.meta.url,
          ),
        ).size > 100,
      );
      assert.equal(productImageUrl(source, "/"), src.slice("/kahveci".length));
    }
  assert.equal(
    productImageUrl("https://example.com/old.jpg", "/kahveci/"),
    "https://example.com/old.jpg",
  );
});
