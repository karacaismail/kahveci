export function transliterate(value) {
  return String(value)
    .replace(
      /[ıİşŞğĞçÇöÖüÜæÆøØßłŁ]/g,
      (c) =>
        ({
          ı: "i",
          İ: "I",
          ş: "s",
          Ş: "S",
          ğ: "g",
          Ğ: "G",
          ç: "c",
          Ç: "C",
          ö: "o",
          Ö: "O",
          ü: "u",
          Ü: "U",
          æ: "ae",
          Æ: "AE",
          ø: "o",
          Ø: "O",
          ß: "ss",
          ł: "l",
          Ł: "L",
        })[c],
    )
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
export function createRoutes(products, base = "/") {
  const root = base.endsWith("/") ? base : base + "/";
  const bySlug = new Map(),
    byId = new Map();
  for (const p of products) {
    const name = transliterate(p.brand + " " + p.name);
    let slug = name;
    if (bySlug.has(slug)) slug = name + "-" + transliterate(p.id);
    if (bySlug.has(slug)) throw new Error("Duplicate product slug: " + slug);
    bySlug.set(slug, p.id);
    byId.set(p.id, slug);
  }
  function href(route) {
    if (route.startsWith("product/")) {
      const slug = byId.get(route.slice(8));
      if (slug) return root + "makineler/" + slug + "/";
    }
    return route === "catalog" ? root : root + "#" + route;
  }
  function resolve(location) {
    const hash = location.hash.slice(1);
    if (hash) return hash;
    if (location.pathname.startsWith(root + "makineler/")) {
      const slug = location.pathname
        .slice((root + "makineler/").length)
        .replace(/\/$/, "");
      const id = bySlug.get(slug);
      return id ? "product/" + id : "not-found";
    }
    return "catalog";
  }
  return {
    href,
    resolve,
    entries: [...byId].map(([id, slug]) => ({
      id,
      slug,
      path: root + "makineler/" + slug + "/",
    })),
  };
}
