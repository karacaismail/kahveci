import { chromium, webkit, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const engine = process.env.ATLAS_ENGINE || "chrome";
const browser =
  engine === "webkit"
    ? await webkit.launch()
    : await chromium.launch({ channel: "chrome" });
const base = process.env.ATLAS_URL || "http://127.0.0.1:4173";
const manifest = JSON.parse(
  await fs.readFile("dist/.vite/manifest.json", "utf8"),
);
const phoneAsset = manifest["src/phone.css"].file;
const report = { browser: browser.version(), checks: [] };
const pass = (s) => {
  report.checks.push(s);
  console.log("PASS", s);
};
async function layout(page, name) {
  await expect(page.locator("html")).toHaveAttribute("data-layout", name);
  await expect(page.locator(".product-card").first()).toBeVisible();
}
async function readable(page, label) {
  const result = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth > innerWidth + 1,
    small: [...document.querySelectorAll("body *")]
      .filter(
        (e) =>
          e.getClientRects().length &&
          e.textContent.trim() &&
          [...e.childNodes].some(
            (n) => n.nodeType === 3 && n.textContent.trim(),
          ) &&
          parseFloat(getComputedStyle(e).fontSize) < 14,
      )
      .map((e) => e.className),
  }));
  assert.equal(result.overflow, false, label + " overflow");
  assert.deepEqual(result.small, [], label + " text");
}
for (const width of [320, 360, 375, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    screen: { width, height: 844 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  const requested = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requested.push(r.url()));
  await page.goto(base);
  await layout(page, "phone");
  await readable(page, "catalog" + width);
  assert(requested.some((u) => u.endsWith(phoneAsset)));
  pass("phone " + width + " catalog, fonts, no overflow and conditional CSS");
  if (width === 320) {
    await page
      .getByRole("button", { name: "Filtreler ve kabul kriterleri" })
      .click();
    await expect(page.locator("#catalog-filters")).toBeVisible();
    await readable(page, "filters");
    await page.getByRole("button", { name: "Filtreleri kapat" }).click();
    await page.locator(".compare-icon").first().click();
    await page.locator(".title-button").first().click();
    await expect(page.locator(".product-hero")).toBeVisible();
    await readable(page, "product");
    await page.screenshot({
      path: `evidence/${engine}-phone-product.png`,
      fullPage: true,
    });
    await page.locator(".gallery-main").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await readable(page, "gallery");
    await page.keyboard.press("Escape");
    await page
      .locator("header nav button")
      .filter({ hasText: "Karar atölyesi" })
      .click();
    await page.getByLabel("Günde kaç içecek?").fill("17");
    await page.setViewportSize({ width: 844, height: 320 });
    await expect(page.locator("html")).toHaveAttribute("data-layout", "phone");
    await expect(page.getByLabel("Günde kaç içecek?")).toHaveValue("17");
    await readable(page, "landscape decision");
    await page.setViewportSize({ width: 320, height: 844 });
    await readable(page, "decision");
    await page
      .locator("header nav button")
      .filter({ hasText: "Öğütücü" })
      .click();
    await readable(page, "equipment");
    await page
      .locator("header nav button")
      .filter({ hasText: "rehberi" })
      .click();
    await readable(page, "guide");
    await page.locator(".header-compare").click();
    await readable(page, "compare");
    assert(
      await page
        .locator(".comparison-scroll")
        .evaluate((e) => e.scrollWidth > e.clientWidth),
    );
    pass(
      "phone filters, product, gallery, decision, rotation state, equipment, guide and contained comparison scroll",
    );
  }
  if (width === 390)
    await page.screenshot({
      path: `evidence/${engine}-phone-catalog.png`,
      fullPage: true,
    });
  assert.deepEqual(errors, []);
  await context.close();
}
for (const props of [
  {
    viewport: { width: 768, height: 1024 },
    screen: { width: 768, height: 1024 },
    hasTouch: true,
    isMobile: true,
  },
  {
    viewport: { width: 390, height: 844 },
    screen: { width: 1512, height: 1100 },
    hasTouch: false,
  },
]) {
  const context = await browser.newContext(props);
  const page = await context.newPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(base);
  await layout(page, "desktop");
  assert(!requests.some((u) => u.endsWith(phoneAsset)));
  await context.close();
}
pass("tablet and narrow desktop retain desktop; neither requests phone CSS");
await fs.writeFile(
  `evidence/${engine}-phone-browser.json`,
  JSON.stringify(report, null, 2),
);
await browser.close();
