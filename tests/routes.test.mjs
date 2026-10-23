import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { transliterate, createRoutes } from "../src/routes.mjs";
const { products } = JSON.parse(
  fs.readFileSync(new URL("../src/catalog.json", import.meta.url)),
);
test("Turkish and European model names become readable ASCII slugs", () => {
  assert.equal(
    transliterate("İçim Şöleni: Öğütücü 58 mm / Édition"),
    "icim-soleni-ogutucu-58-mm-edition",
  );
});
test("every exact product has a unique human-readable route and stable ID resolution", () => {
  const routes = createRoutes(products, "/kahveci/");
  assert.equal(
    new Set(routes.entries.map((x) => x.path)).size,
    products.length,
  );
  for (const { id, path } of routes.entries) {
    assert.match(path, /^\/kahveci\/makineler\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/);
    assert.equal(routes.resolve({ pathname: path, hash: "" }), "product/" + id);
    assert.equal(routes.href("product/" + id), path);
  }
  assert.equal(
    routes.resolve({
      pathname: "/kahveci/",
      hash: "#product/" + products[0].id,
    }),
    "product/" + products[0].id,
  );
  assert.equal(routes.href("compare"), "/kahveci/#compare");
  assert.equal(routes.href("catalog"), "/kahveci/");
  assert.equal(
    routes.resolve({ pathname: "/kahveci/makineler/unknown/", hash: "" }),
    "not-found",
  );
});
