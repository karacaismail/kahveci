import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const browser = await chromium.launch({ channel: "chrome" });
const base = process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/";
await fs.mkdir("evidence/compact", { recursive: true });
try {
  for (const width of [320, 390, 1512]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      screen: { width, height: 900 },
      hasTouch: width < 600,
      isMobile: width < 600,
    });
    const page = await context.newPage();
    await page.goto(base + "#product/sage-breville-barista-pro-ses878");
    const grid = page.locator(".quality-grid").first();
    await expect(grid.locator(":scope > div")).toHaveCount(12);
    await expect(grid.locator('[aria-expanded="true"]')).toHaveCount(0);
    const metrics = await grid.evaluate((element) => ({
      height: element.offsetHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
      small: [...element.querySelectorAll("*")].filter(
        (e) =>
          e.getClientRects().length &&
          e.textContent.trim() &&
          parseFloat(getComputedStyle(e).fontSize) < 14,
      ).length,
    }));
    assert(!metrics.overflow);
    assert.equal(metrics.small, 0);
    assert(metrics.height < (width < 600 ? 1700 : 1000));
    await grid.screenshot({ path: `evidence/compact/quality-${width}.png` });
    const trigger = page.getByRole("button", {
      name: "Ayrıntı: Basınç açıklaması ve kaynakları",
      exact: true,
    });
    await expect(trigger).toHaveText(/Ayrıntı/);
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger.locator("..").getByRole("region")).toBeVisible();
    const card = trigger.locator("../..");
    assert((await card.boundingBox()).width > 250);
    await expect(card.getByRole("link").first()).toBeVisible();
    await card.screenshot({
      path: `evidence/compact/quality-open-${width}.png`,
    });
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const more = page.getByRole("button", {
      name: "16 ölçüm ve kullanım ayrıntısı",
      exact: true,
    });
    await more.click();
    await expect(page.locator(".quality-extended > div")).toHaveCount(16);
    await expect(
      page
        .locator(".quality-extended")
        .getByRole("heading", { name: "Isı tutarlılığı", exact: true }),
    ).toBeVisible();
    await more.click();
    console.log(
      `PASS ${width}: compact height ${metrics.height}px, readable text, no overflow, accessible expandable criterion and sources`,
    );
    await context.close();
  }
} finally {
  await browser.close();
}
