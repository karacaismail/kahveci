import { chromium, webkit, expect } from "@playwright/test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const engine = process.env.ATLAS_ENGINE || "chrome";
const browser =
  engine === "webkit"
    ? await webkit.launch()
    : await chromium.launch({ channel: "chrome" });
const base = process.env.ATLAS_URL || "http://127.0.0.1:4174/kahveci/";
const checks = [];
try {
  for (const width of [320, 360, 375, 390]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 320 ? 640 : 844 },
      screen: { width, height: width === 320 ? 640 : 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto(base);
    await expect(page.locator(".product-card")).toHaveCount(12);
    await page
      .getByRole("button", { name: "Filtreler ve kabul kriterleri" })
      .click();
    await page
      .getByRole("combobox", { name: "Marka", exact: true })
      .fill("Lelit");
    await page.getByRole("option", { name: "Lelit", exact: true }).click();
    await expect(
      page.getByRole("button", { name: /Sonuçları göster/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Sonuçları göster/ }).click();
    await expect(page.locator(".phone-filter-toggle")).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect
      .poll(
        async () => (await page.locator(".results-toolbar").boundingBox()).y,
      )
      .toBeLessThan(640);
    checks.push(`${width}: filter selection, results action and scroll return`);
    await page
      .getByRole("button", { name: "Filtreler ve kabul kriterleri" })
      .tap();
    await expect(
      page.getByRole("combobox", { name: "Marka", exact: true }),
    ).toHaveValue("Lelit");
    await page.getByRole("button", { name: /Sonuçları göster/ }).tap();
    await page
      .getByRole("button", { name: "Filtreler ve kabul kriterleri" })
      .click();
    await page.getByRole("button", { name: "Temizle", exact: true }).click();
    if (width === 320) {
      await page
        .getByRole("combobox", { name: "Kriterde aranan durum", exact: true })
        .click();
      await page
        .getByRole("option", { name: "Ayrı ekipman gerekir", exact: true })
        .click();
      await page
        .getByRole("checkbox", { name: "Espresso öğütüm ayarı", exact: true })
        .check();
      await page
        .getByRole("checkbox", { name: "Sıcaklık kontrolü", exact: true })
        .check();
      await page.getByRole("button", { name: /Sonuçları göster/ }).tap();
      await expect(
        page.getByText("Bu koşullarla makine bulunamadı.", { exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Filtreler ve kabul kriterleri" })
        .tap();
      await page.getByRole("button", { name: "Temizle", exact: true }).tap();
      await expect(
        page.getByRole("checkbox", {
          name: "Espresso öğütüm ayarı",
          exact: true,
        }),
      ).not.toBeChecked();
      checks.push(
        "320: combined quality filters, empty results and clear recovery",
      );
    }
    await page.getByRole("button", { name: /Sonuçları göster/ }).click();
    for (let i = 0; i < 4; i++)
      await page.locator(".compare-icon").nth(i).click();
    const dockButton = await page
      .locator(".compare-dock > .mantine-Button-root")
      .boundingBox();
    assert(
      dockButton.x >= 0 && dockButton.x + dockButton.width <= width,
      "comparison dock action stays within viewport",
    );
    await page.locator(".compare-icon").nth(4).click();
    await expect(page.locator(".toast")).toContainText("En fazla 4");
    await page.locator(".header-compare").click();
    await expect(page.locator(".comparison-table thead th")).toHaveCount(5);
    const labelWidth = await page
      .locator(".comparison-table tbody th")
      .first()
      .evaluate((e) => e.getBoundingClientRect().width);
    assert(
      labelWidth <= 120,
      "phone comparison label must leave room for a product",
    );
    await expect(
      page.getByRole("button", { name: "Karşılaştırmada 4. makineye git" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Karşılaştırmada 4. makineye git" })
      .click();
    assert(
      await page
        .locator(".comparison-scroll")
        .evaluate((e) => e.scrollLeft > 400),
    );
    const overflowing = await page
      .locator(".comparison-table tbody th:not([colspan])")
      .evaluateAll((els) =>
        els
          .filter((e) => e.scrollWidth > e.clientWidth + 1)
          .map((e) => e.textContent),
      );
    assert.deepEqual(
      overflowing,
      [],
      "criterion labels must not overflow their cells",
    );
    await page.screenshot({
      path: `evidence/phone-detail-${engine}-${width}-comparison.png`,
    });
    await page
      .getByRole("switch", { name: "Yalnız farklı değerleri göster" })
      .check();
    await page
      .getByRole("switch", { name: "Yalnız farklı değerleri göster" })
      .uncheck();
    checks.push(
      `${width}: four-product comparison, fifth rejection, differences and direct column navigation`,
    );
    await page.locator(".comparison-table .title-button").last().click();
    await page.locator("#quality .disclosure-trigger").first().click();
    await expect(
      page.locator("#quality .disclosure-trigger").first(),
    ).toHaveAttribute("aria-expanded", "true");
    await expect(
      page
        .locator("#quality .disclosure-trigger")
        .first()
        .locator("..")
        .getByRole("region"),
    ).toBeVisible();
    await page.locator("#quality .disclosure-trigger").first().click();
    const technical = page.getByRole("region", {
      name: "Ürün teknik özellik tablosu",
    });
    await expect(technical).toBeVisible();
    assert(await technical.evaluate((e) => e.scrollWidth > e.clientWidth));
    await page.locator(".gallery-main").tap();
    const close = page.getByRole("button", {
      name: "Görsel penceresini kapat",
    });
    await expect(close).toBeVisible();
    await expect
      .poll(async () => {
        const hit = await close.boundingBox();
        return Math.min(hit.width, hit.height);
      })
      .toBeGreaterThanOrEqual(48);
    await page
      .getByRole("button", { name: "Görseli büyüt", exact: true })
      .click();
    await expect(page.locator(".lightbox-toolbar")).toContainText("150%");
    assert(
      await page
        .locator(".zoom-viewport")
        .evaluate((e) => e.scrollWidth > e.clientWidth),
    );
    await expect
      .poll(
        () =>
          page
            .locator(".zoom-viewport img")
            .evaluate((e) => e.complete && e.naturalWidth > 0),
        { timeout: 25000 },
      )
      .toBe(true);
    await page.locator(".zoom-viewport").evaluate((e) => {
      e.scrollLeft = 60;
      e.scrollTop = 30;
    });
    assert(
      await page
        .locator(".zoom-viewport")
        .evaluate((e) => e.scrollLeft > 0 && e.scrollTop > 0),
    );
    if (engine === "chrome" && width === 320) {
      const pan = await page.locator(".zoom-viewport").boundingBox();
      const before = await page
        .locator(".zoom-viewport")
        .evaluate((e) => e.scrollLeft);
      const cdp = await context.newCDPSession(page);
      const x = pan.x + pan.width * 0.8,
        y = pan.y + pan.height * 0.6;
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x, y }],
      });
      for (const delta of [15, 30, 45, 60])
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ x: x - delta, y: y - delta / 3 }],
        });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect
        .poll(() =>
          page.locator(".zoom-viewport").evaluate((e) => e.scrollLeft),
        )
        .toBeGreaterThan(before);
      await cdp.detach();
      checks.push("320: actual emulated touch gesture pans zoomed photo");
    }
    await page.getByRole("button", { name: "Sonraki", exact: true }).tap();
    await expect(page.locator(".lightbox-toolbar")).toContainText("2 /");
    await expect(page.locator(".lightbox-toolbar")).toContainText("100%");
    await page.getByRole("button", { name: "Önceki", exact: true }).tap();
    await expect(page.locator(".lightbox-toolbar")).toContainText("1 /");
    await page.screenshot({
      path: `evidence/phone-detail-${engine}-${width}-portrait.png`,
    });
    await page.setViewportSize({ width: 844, height: 320 });
    for (const name of [
      "Görsel penceresini kapat",
      "Görseli büyüt",
      "Sonraki",
    ]) {
      const box = await page
        .getByRole("button", { name, exact: true })
        .boundingBox();
      assert(
        box.y >= 0 && box.y + box.height <= 320,
        name + " must remain on-screen in landscape",
      );
    }
    const viewport = await page.locator(".zoom-viewport").boundingBox();
    assert(viewport.height >= 100, "landscape photo usable height");
    await page.screenshot({
      path: `evidence/phone-detail-${engine}-${width}-landscape.png`,
    });
    await close.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const opener = page.locator(".gallery-main .photo-hit");
    await opener.focus();
    await opener.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(opener).toBeFocused();
    await page.locator(".header-compare").click();
    await expect(
      page.getByRole("button", { name: "Karşılaştırmada 1. makineye git" }),
    ).toHaveAttribute("aria-pressed", "true");
    checks.push(
      `${width}: product evidence disclosure, contained specs, loaded photo, zoom/pan, image navigation, close target, rotation controls and focus return`,
    );
    await context.close();
  }
  await fs.writeFile(
    `evidence/phone-detail-${engine}.json`,
    JSON.stringify({ engine, browser: browser.version(), checks }, null, 2),
  );
  console.log(checks);
} finally {
  await browser.close();
}
