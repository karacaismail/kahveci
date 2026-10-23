import fs from "node:fs/promises";
import { createRoutes } from "../src/routes.mjs";
const data = JSON.parse(
  await fs.readFile(new URL("../src/catalog.json", import.meta.url), "utf8"),
);
const root = process.env.PAGES_BUILD ? "/kahveci/" : "/";
const routes = createRoutes(data.products, root);
const html = await fs.readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
for (const { slug } of routes.entries) {
  const directory = new URL("../dist/makineler/" + slug + "/", import.meta.url);
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(new URL("index.html", directory), html);
}
console.log("Static product pages:", routes.entries.length);
