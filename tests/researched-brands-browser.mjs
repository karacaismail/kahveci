import { chromium, expect } from "@playwright/test";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
import { createRoutes } from "../src/routes.mjs";
const data = JSON.parse(
  await fs.readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const added = data.products.filter((p) => p.imageSources);
const base = process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/";
const root = new URL(base).pathname;
const routes = createRoutes(data.products, root);
await fs.mkdir("evidence/new-research", { recursive: true });
const b = await chromium.launch({ channel: "chrome" });
try {
  const p = await b.newPage();
  await p.goto(base);
  await p
    .getByRole("combobox", { name: "Marka", exact: true })
    .fill("La Spaziale");
  await p.getByRole("option", { name: "La Spaziale", exact: true }).click();
  await expect(p.locator(".product-card")).toHaveCount(3);
  await p.goto(base);

  const images = await p.evaluate(
    async (urls) => {
      const results = [];
      let next = 0;
      async function worker() {
        while (next < urls.length) {
          const url = urls[next++];
          results.push(
            await new Promise((resolve) => {
              const image = new Image();
              const timer = setTimeout(
                () => resolve({ url, loaded: false, reason: "timeout" }),
                25000,
              );
              image.onload = () => {
                clearTimeout(timer);
                resolve({
                  url,
                  loaded: true,
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                });
              };
              image.onerror = () => {
                clearTimeout(timer);
                resolve({ url, loaded: false, reason: "error" });
              };
              image.src = url;
            }),
          );
        }
      }
      await Promise.all(Array.from({ length: 6 }, worker));
      return results;
    },
    [...new Set(added.flatMap((p) => p.images))],
  );
  await fs.writeFile(
    "evidence/new-research/gallery.json",
    JSON.stringify(images, null, 2),
  );
  assert(
    images.every((i) => i.loaded),
    "all new gallery sources load in Chrome",
  );
  for (const model of added) {
    const response = await p.goto(
      new URL(routes.href("product/" + model.id), base).href,
    );
    assert.equal(response.status(), 200);
    await expect(p.locator(".product-hero h1")).toContainText(model.name);
    await expect(
      p.locator(".quality-grid:not(.quality-extended) > div"),
    ).toHaveCount(12);
    await p
      .locator(".gallery")
      .screenshot({ path: `evidence/new-research/${model.id}.png` });
  }
  await p.goto(new URL(routes.href("product/elektra-verve-mini"), base).href);
  await expect(
    p.getByRole("heading", { name: "Yurt dışı fiyatları", exact: true }),
  ).toBeVisible();
  await expect(p.locator(".offers")).toContainText("131.040");
  for (const width of [320, 1512]) {
    const c = await b.newContext({
      viewport: { width, height: 900 },
      screen: { width, height: 900 },
      hasTouch: width === 320,
      isMobile: width === 320,
    });
    const page = await c.newPage();
    await page.goto(new URL(routes.href("product/elektra-verve"), base).href);
    await expect(page.locator(".quality-grid").first()).toBeVisible();
    await page
      .locator(".quality-grid")
      .first()
      .screenshot({ path: `evidence/new-research/detail-${width}.png` });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await c.close();
  }
  console.log(
    "PASS eight new model pages, all new gallery images, foreign/TL separation, compact phone and desktop",
  );
} finally {
  await b.close();
}
