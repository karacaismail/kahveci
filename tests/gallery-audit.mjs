import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
const data = JSON.parse(
  await fs.readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const urls = [
  ...new Set([...data.products, ...data.equipment].flatMap((p) => p.images)),
];
let previous = [];
if (process.argv.includes("--new-only")) {
  try {
    previous = JSON.parse(
      await fs.readFile("../../work/gallery-audit.json", "utf8"),
    )
      .results.filter((r) => r.status === "loaded" && urls.includes(r.url))
      .map((r) => ({ ...r, carriedForward: true }));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const retained = new Set(previous.map((r) => r.url));
const pending = urls.filter((url) => !retained.has(url));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4173");
const fresh = await page.evaluate(async (urls) => {
  let next = 0;
  const results = [];
  async function worker() {
    while (next < urls.length) {
      const url = urls[next++];
      results.push(
        await new Promise((resolve) => {
          const img = new Image();
          const timer = setTimeout(() => {
            img.src = "";
            resolve({ url, status: "timeout" });
          }, 25000);
          img.onload = () => {
            clearTimeout(timer);
            resolve({
              url,
              status: "loaded",
              width: img.naturalWidth,
              height: img.naturalHeight,
            });
          };
          img.onerror = () => {
            clearTimeout(timer);
            resolve({ url, status: "error" });
          };
          img.src = url;
        }),
      );
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  return results;
}, pending);
const results = [
  ...previous,
  ...fresh.map((r) => ({ ...r, carriedForward: false })),
];
await fs.writeFile(
  "../../work/gallery-audit.json",
  JSON.stringify(
    {
      browser: browser.version(),
      checked: "2026-10-22",
      testedNow: pending.length,
      retained: previous.length,
      results,
    },
    null,
    2,
  ),
);
console.log(
  "total",
  urls.length,
  "loaded",
  results.filter((r) => r.status === "loaded").length,
  "unavailable",
  results.filter((r) => r.status !== "loaded"),
);
await browser.close();
