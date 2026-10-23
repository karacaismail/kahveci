import cache from "./image-cache.json" with { type: "json" };
/** Resolve bundled research images while retaining external source URLs in data. */
export function productImageUrl(source, base = "/") {
  const local = cache[source];
  return local ? `${base.replace(/\/?$/, "/")}${local}` : source;
}
