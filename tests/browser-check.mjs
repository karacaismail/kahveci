import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { qualityCriteria, extraQualityCriteria } from "../src/quality.mjs";
import fs from "node:fs/promises";
await fs.mkdir("evidence/desktop", { recursive: true });
const url = process.env.ATLAS_URL || "http://127.0.0.1:4173";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1512, height: 1100 } });
const errors = [],
  requests = [],
  failed = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("requestfinished", (r) =>
  requests.push({ url: r.url(), type: r.resourceType() }),
);
page.on("requestfailed", (r) =>
  failed.push({ url: r.url(), error: r.failure()?.errorText }),
);
const report = {
  browser: "Google Chrome " + browser.version(),
  viewport: "1512×1100 and 1280×900",
  url,
  checks: [],
  images: [],
};
function pass(s) {
  report.checks.push({ check: s, status: "pass" });
  console.log("PASS", s);
}
async function route(name, heading) {
  await page.locator("nav").getByRole("button", { name, exact: true }).click();
  if (heading) await expect(page.locator("h1")).toHaveText(heading);
}
async function readyImage(locator) {
  await expect
    .poll(() => locator.evaluate((e) => e.complete && e.naturalWidth > 0), {
      timeout: 25000,
    })
    .toBe(true);
  await locator.evaluate((e) => e.decode());
}
async function minFont() {
  const small = await page.locator("body *").evaluateAll((xs) =>
    xs
      .filter(
        (e) =>
          e.getBoundingClientRect().width &&
          e.getBoundingClientRect().height &&
          e.textContent?.trim() &&
          parseFloat(getComputedStyle(e).fontSize) < 14,
      )
      .map((e) => ({
        tag: e.tagName,
        text: e.textContent.slice(0, 70),
        size: getComputedStyle(e).fontSize,
      })),
  );
  assert.deepEqual(small, []);
}
await page.goto(url);
await expect(page.locator(".product-card")).toHaveCount(12);
await expect(page.locator(".hero-machine img")).toBeVisible();
await minFont();
await expect(page.locator(".product-card .preference-mini")).toHaveCount(12);
for (const score of await page
  .locator(".product-card .preference-mini")
  .all()) {
  const value = Number(await score.getAttribute("data-score"));
  assert.ok(value >= 0 && value <= 100);
}
for (const c of [...qualityCriteria, ...extraQualityCriteria])
  await expect(
    page.getByRole("checkbox", { name: c.filterLabel, exact: true }),
  ).toHaveCount(1);
for (const format of ["CSV", "JSON"]) {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: format === "CSV" ? "CSV veri seti" : "JSON + kaynaklar",
      exact: true,
    })
    .click();
  const download = await pending;
  const file = await download.path();
  const text = await fs.readFile(file, "utf8");
  if (format === "JSON") {
    const data = JSON.parse(text);
    assert.equal(Object.keys(data.products[0].quality).length, 12);
    assert.ok(data.products[0].quality.PID.sources);
    assert.equal(data.products.length, 183);
    assert.ok(data.equipment.every((p) => Number.isFinite(p.preference.score)));
    assert.ok(
      data.products.every(
        (p) =>
          Number.isFinite(p.preference.score) && p.preference.reasons.length,
      ),
    );
  } else {
    assert.ok(text.includes("Demleme basıncı ve OPV — durum"));
    assert.ok(text.includes("Yedek parça, aksesuar ve servis — kaynak"));
  }
}
pass(
  "twelve filters and downloaded CSV/JSON carry derived quality states and evidence",
);
pass("catalog rendered; all visible text >=14px");
await page.screenshot({ path: "evidence/desktop/catalog.png" });
// Branded dropdown opens and changes selection, with keyboard path.
await page.getByRole("combobox", { name: "Makine tipi", exact: true }).click();
await expect(
  page.getByRole("option", { name: "Tam otomatik", exact: true }),
).toBeVisible();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Escape");
pass("Mantine dropdown keyboard open/close");
// All criterion filters toggle and clear without deferred event errors.
for (const text of [
  "Espresso öğütüm ayarı",
  "Demleme basıncı / OPV",
  "Buhar ve toparlanma",
  "Parça ve servis ekosistemi",
  "Sıcaklık kontrolü",
  "Tek duvarlı sepet",
  "Ön ıslatma",
  "Basınç tahliyesi",
]) {
  const c = page.getByRole("checkbox", { name: text, exact: true });
  await c.check();
  await expect(c).toBeChecked();
  await c.uncheck();
  await expect(c).not.toBeChecked();
}
await expect(
  page.locator(".mini-criteria").first().locator(":scope > span"),
).toHaveCount(8);
await page
  .getByRole("combobox", { name: "Kriterde aranan durum", exact: true })
  .click();
await page
  .getByRole("option", { name: "Ayrı ekipman gerekir", exact: true })
  .click();
await page
  .getByRole("checkbox", { name: "Espresso öğütüm ayarı", exact: true })
  .check();
await expect(page.locator(".product-card").first()).toBeVisible();
await page
  .getByRole("checkbox", { name: "Espresso öğütüm ayarı", exact: true })
  .uncheck();
await page
  .getByRole("combobox", { name: "Kriterde aranan durum", exact: true })
  .click();
await page.getByRole("option", { name: "Karşılıyor", exact: true }).click();
pass(
  "eight primary criterion filters, eight card markers and separate-equipment status filter",
);
// Focus must remain on the same card button after state update.
const first = page.locator(".compare-icon").first();
await first.focus();
await page.keyboard.press("Space");
await expect(page.locator(".compare-icon.chosen")).toHaveCount(1);
assert.equal(await first.evaluate((e) => e === document.activeElement), true);
pass("compare add retains focus");
const remaining = page.locator(".compare-icon:not(.chosen)");
for (let i = 0; i < 3; i++) {
  await remaining.first().click();
  await expect(page.locator(".compare-icon.chosen")).toHaveCount(i + 2);
}
await remaining.first().click();
await expect(
  page.getByText("En fazla 4 makine karşılaştırabilirsiniz.", { exact: false }),
).toBeVisible();
await expect(page.locator(".compare-icon.chosen")).toHaveCount(4);
pass("fifth machine rejected at maximum four");
await page
  .getByRole("button", { name: "Yan yana karşılaştır", exact: false })
  .click();
await expect(page.locator(".comparison-table thead th")).toHaveCount(5);
await expect(page.locator(".toast")).toHaveCount(0);
assert.equal(
  (await page.locator(".comparison-table tbody tr").count()) > 30,
  true,
);
for (const text of [
  "Demleme basıncı ve OPV",
  "Buhar, eşzamanlılık ve toparlanma",
  "Yedek parça, aksesuar ve servis",
  "Ölçülmüş tutarlılık ve servis kapasitesi",
])
  await expect(
    page
      .locator(".comparison-table")
      .getByRole("rowheader", { name: text, exact: true }),
  ).toBeVisible();
await page
  .getByRole("switch", { name: "Yalnız farklı değerleri göster" })
  .check();
for (const img of await page
  .locator(".comparison-table thead .photo img")
  .all())
  await readyImage(img);
await page.screenshot({ path: "evidence/desktop/compare.png" });
pass("four-column detailed comparison and difference filter");
await route("Makineler");
await expect(page.locator(".product-card")).toHaveCount(12);
await page
  .getByRole("button", { name: "Ninja Luxe Café Premier incele", exact: true })
  .click();
await expect(page.locator("h1")).toContainText("Luxe Café");
await expect(page.locator(".quality-grid > div")).toHaveCount(12);
await expect(page.locator(".criterion-mark.required")).toHaveCount(7);
const icon = await page
  .locator(".criterion-mark.required svg")
  .first()
  .evaluate((e) => ({
    width: e.getBoundingClientRect().width,
    color: getComputedStyle(e).color,
  }));
assert.equal(icon.width, 52);
assert.equal(icon.color, "rgb(34, 115, 68)");
await expect(page.locator("#preference .preference-panel")).toHaveCount(1);
const initialScore = Number(
  await page
    .locator("#preference .preference-panel")
    .getAttribute("data-score"),
);
const scoreDisclosure = page.getByRole("button", {
  name: "Puan dökümü ve kabul kuralları",
  exact: true,
});
await expect(scoreDisclosure).toHaveAttribute("aria-expanded", "false");
await scoreDisclosure.click();
await expect(scoreDisclosure).toHaveAttribute("aria-expanded", "true");
const scoreRegion = page.locator('#preference [role="region"]');
await expect(scoreRegion).toHaveAttribute("aria-hidden", "false");
await expect
  .poll(() =>
    scoreRegion.evaluate((e) => getComputedStyle(e).transitionDuration),
  )
  .toContain("0.18s");
await scoreDisclosure.click();
await expect(scoreDisclosure).toHaveAttribute("aria-expanded", "false");
await expect(scoreRegion).toHaveAttribute("aria-hidden", "true");
await scoreDisclosure.click();
pass(
  "score disclosure has immediate semantic states and positive reciprocal motion",
);
await expect(page.locator(".score-table-scroll tbody tr")).toHaveCount(14);
pass(
  "all-machine preference scores, seven large green Phosphor acceptance markers and 14-row score reasons",
);
await expect(page.locator("#quality")).toContainText(
  "Espresso kalite kriterleri",
);
await expect(page.locator("#quality")).toContainText(
  "Toparlanma süresi ölçülmedi",
);
await expect(page.locator("#quality a").first()).toHaveAttribute(
  "href",
  /^https:/,
);
pass(
  "product shows eight primary and four extra criteria with evidence and limitations",
);
await page
  .getByRole("button", { name: "2. görseli göster", exact: true })
  .click();
const second = page.locator(".gallery-main img");
await readyImage(second);
const src = await second.getAttribute("src");
await page.getByRole("button", { name: /Luxe Café.*görselini büyüt/ }).click();
await expect(page.getByRole("dialog")).toBeVisible();
await expect(page.locator(".zoom-viewport img")).toHaveAttribute("src", src);
await readyImage(page.locator(".zoom-viewport img"));
await minFont();
await page.getByRole("button", { name: "Görseli büyüt", exact: true }).click();
await expect(page.getByText("150%", { exact: true })).toBeVisible();
assert.equal(
  await page
    .locator(".zoom-viewport")
    .evaluate((e) => e.scrollWidth > e.clientWidth),
  true,
);
await page.getByRole("button", { name: "Sonraki", exact: true }).click();
await expect(page.getByText("100%", { exact: true })).toBeVisible();
await readyImage(page.locator(".zoom-viewport img"));
assert.notEqual(
  await page.locator(".zoom-viewport img").getAttribute("src"),
  src,
);
await minFont();
await page.screenshot({ path: "evidence/desktop/gallery.png" });
await page.keyboard.press("Escape");
await expect(page.getByRole("dialog")).toHaveCount(0);
await expect(
  page.getByRole("button", { name: "2. görseli göster", exact: true }),
).toHaveAttribute("aria-pressed", "true");
pass(
  "gallery selection survives modal open/close; zoom, scrolling and next image work",
);
await minFont();
await page.screenshot({ path: "evidence/desktop/product.png" });
await page.locator("#quality").scrollIntoViewIfNeeded();
await page
  .locator("#quality")
  .screenshot({ path: "evidence/desktop/quality.png" });
await page
  .locator("#preference")
  .screenshot({ path: "evidence/desktop/preference.png" });
pass("product detail and modal text >=14px");
await route("Karar atölyesi", "Makine değil, bir rutin seçin.");
await expect(page.locator(".rank-row")).toHaveCount(5);
const input = page.getByLabel("Günde kaç içecek?", { exact: true });
await input.fill("25");
await expect(
  page.getByText("15–25 fincan: arka arkaya hazırlama kritik.", {
    exact: true,
  }),
).toBeVisible();
await page.screenshot({ path: "evidence/desktop/decision.png" });
await page.locator(".method .disclosure-trigger").click();
await expect(page.locator(".method")).toContainText(
  "Fiyat, bütçe, indirim, marka ve üretim ülkesi puan vermez",
);
await expect(page.locator(".method")).not.toContainText(
  "Fiyatı bilinmeyen −100",
);
pass(
  "decision inputs update workload scenario and method matches price-independent scoring",
);
const budgetField = page.getByRole("textbox", {
  name: "Toplam başlangıç bütçesi",
});
await budgetField.fill("20000");
await route("Makineler");
await page
  .getByRole("button", { name: "Ninja Luxe Café Premier incele", exact: true })
  .click();
assert.equal(
  Number(
    await page
      .locator("#preference .preference-panel")
      .getAttribute("data-score"),
  ),
  initialScore,
);
pass(
  "budget changes displayed costs without changing technical preference score",
);
await route("Öğütücü & ekipman", "Öğütücü, süt & ekipman.");
await expect(page.locator(".equipment-item")).toHaveCount(47);
await expect(page.locator(".equipment-item .preference-mini")).toHaveCount(47);
pass("all separate equipment records rendered");
await route("Makineler");
await expect(page.locator(".product-card")).toHaveCount(12);
await page.locator("body").click({ position: { x: 10, y: 145 } });
await page.keyboard.press("Tab");
let focus = await page.locator(":focus").evaluate((el) => {
  const s = getComputedStyle(el);
  return {
    outline: s.outlineStyle,
    shadow: s.boxShadow,
    bg: s.backgroundImage,
    k: document.documentElement.dataset.keyboard,
  };
});
assert.equal(focus.k, "true");
assert.equal(focus.outline, "none");
assert.notEqual(focus.bg, "none");
pass("keyboard focus visible as non-enclosing underline");
await page.keyboard.press("Shift+Tab");
assert.equal(
  await page.evaluate(() => document.documentElement.dataset.keyboard),
  "true",
);
await page.keyboard.press("Escape");
assert.equal(
  await page.evaluate(() => document.documentElement.dataset.keyboard),
  "true",
);
await page.locator("button.brand").click();
assert.equal(
  await page.evaluate(() => document.documentElement.dataset.keyboard),
  "false",
);
await page.keyboard.press("ArrowDown");
assert.equal(
  await page.evaluate(() => document.documentElement.dataset.keyboard),
  "false",
);
pass("focus mode only starts with Tab and pointer hides visual mode");
await page.locator("button.brand").focus();
await page.keyboard.press("Tab");
await page.emulateMedia({ forcedColors: "active" });
focus = await page.locator(":focus").evaluate((el) => ({
  width: getComputedStyle(el).outlineWidth,
  style: getComputedStyle(el).outlineStyle,
}));
assert.deepEqual(focus, { width: "2px", style: "solid" });
await page.emulateMedia({ forcedColors: "none" });
pass("forced colors keyboard exception");
const motion = await page
  .locator(".mantine-Button-root")
  .first()
  .evaluate((el) => ({
    duration: getComputedStyle(el).transitionDuration,
    easing: getComputedStyle(el).transitionTimingFunction,
  }));
assert.ok(motion.duration.split(",").every((x) => parseFloat(x) > 0));
assert.ok(motion.easing.includes("0.65"));
await page.emulateMedia({ reducedMotion: "reduce" });
assert.ok(
  await page
    .locator(".mantine-Button-root")
    .first()
    .evaluate((el) =>
      getComputedStyle(el)
        .transitionDuration.split(",")
        .every((x) => parseFloat(x) === 0),
    ),
);
await page.emulateMedia({ reducedMotion: "no-preference" });
pass("positive symmetric motion and reduced-motion exception");
await page.setViewportSize({ width: 1280, height: 900 });
assert.equal(
  await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  ),
  true,
);
await minFont();
pass("desktop1280 no page overflow and >=14px text");
report.images = await page
  .locator(".photo img")
  .evaluateAll((xs) =>
    xs.map((x) => ({ url: x.src, loaded: x.complete && x.naturalWidth > 0 })),
  );
report.errors = errors;
report.requests = requests;
report.failedRequests = failed;
assert.deepEqual(errors, []);
pass("no uncaught application errors");
await fs.writeFile(
  "evidence/desktop/browser-report.json",
  JSON.stringify(report, null, 2),
);
await browser.close();
