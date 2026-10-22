import { chromium, webkit, expect } from "@playwright/test";
import assert from "node:assert/strict";
const engine = process.env.ATLAS_ENGINE || "chrome";
const b =
  engine === "webkit"
    ? await webkit.launch()
    : await chromium.launch({ channel: "chrome" });
try {
  for (const width of [320, 1512]) {
    const c = await b.newContext(
      width === 320
        ? {
            viewport: { width, height: 844 },
            screen: { width, height: 844 },
            isMobile: true,
            hasTouch: true,
          }
        : { viewport: { width, height: 1100 } },
    );
    const p = await c.newPage();
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/");
    const search = p.getByRole("textbox", { name: "Tüm verilerde ara" });
    await search.fill("La Pavoni");
    await expect(
      p.locator(".search-result").filter({ hasText: "Europiccola" }),
    ).toBeVisible();
    await expect(search).toBeFocused();
    await expect(p.locator("h1")).toHaveCount(1);
    await expect(p.getByText("Ürün bulunamadı.", { exact: true })).toHaveCount(
      0,
    );
    await search.fill("lelit pirinc");
    await expect(p.locator(".search-result").first()).toBeVisible();
    await search.fill("preinfusion");
    await expect(p.locator(".search-result")).not.toHaveCount(0);
    await search.fill("olmayanxyzz");
    await expect(
      p.getByText("Eşleşme bulunamadı.", { exact: true }),
    ).toBeVisible();
    await search.fill("degirmen");
    await p.getByRole("combobox", { name: "Arama sonuç türü" }).click();
    await p.getByRole("option", { name: "Ekipmanlar", exact: true }).click();
    await expect(p.locator(".search-result").first()).toContainText("Ekipman");
    await p.getByRole("button", { name: "Ekipman kaydını aç" }).first().click();
    await expect(p.locator(".equipment-item").first()).toBeVisible();
    await search.fill("PID");
    await expect(p.locator(".search-result")).not.toHaveCount(0);
    const overflow = await p.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    assert.equal(overflow, false);
    await p.screenshot({ path: `evidence/search-${engine}-${width}.png` });
    assert.deepEqual(errors, []);
    console.log(
      "PASS search dynamic brand/technical/concept/equipment/no-result, focus and layout " +
        width,
    );
    await c.close();
  }
} finally {
  await b.close();
}
