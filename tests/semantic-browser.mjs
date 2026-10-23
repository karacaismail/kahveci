import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const browser = await chromium.launch({ channel: "chrome" });
const base = process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/";
try {
  const page = await browser.newPage();
  await page.goto(base);
  await page
    .getByRole("button", { name: "Barista Pro SES878", exact: true })
    .click();
  await expect(page).toHaveURL(
    /\/makineler\/sage-breville-barista-pro-ses878\/$/,
  );
  const productUrl = page.url();
  await page.reload();
  await expect(page.locator(".product-hero h1")).toContainText("Barista Pro");
  await page.goBack();
  await expect(page.locator(".product-card")).toHaveCount(12);
  await page.goForward();
  await expect(page.locator(".product-hero h1")).toContainText("Barista Pro");
  const catalog = page
    .locator("nav")
    .getByRole("button", { name: "Makineler", exact: true });
  await catalog.click();
  await catalog.click();
  await page.goBack();
  await expect(page.locator(".product-hero h1")).toContainText("Barista Pro");
  await page.goto(base + "#product/sage-breville-barista-pro-ses878");
  await expect(page).toHaveURL(productUrl);
  const response = await page.goto(productUrl);
  assert.equal(response.status(), 200);
  console.log(
    "PASS semantic product URL, direct reload, history and legacy hash",
  );
} finally {
  await browser.close();
}
