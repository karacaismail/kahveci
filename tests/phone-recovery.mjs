import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ channel: "chrome" });
try {
  const c = await b.newContext({
    viewport: { width: 320, height: 640 },
    screen: { width: 320, height: 640 },
    hasTouch: true,
    isMobile: true,
  });
  const p = await c.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.route(/phone-.*\.css/, (r) => r.abort());
  await p.goto(process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/");
  await expect(p.getByRole("alert")).toContainText(
    "Telefon görünümü yüklenemedi",
  );
  await p.unroute(/phone-.*\.css/);
  await p.getByRole("button", { name: "Yeniden dene" }).click();
  await expect(p.locator(".product-card").first()).toBeVisible();
  assert.deepEqual(errors, []);
  console.log(
    "PASS failed phone stylesheet has visible recovery and retry restores catalog",
  );
} finally {
  await b.close();
}
