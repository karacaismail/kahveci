import { evaluatePreference } from "./preference.mjs";
export function toggleComparison(ids, id) {
  return ids.includes(id)
    ? ids.filter((x) => x !== id)
    : ids.length < 4
      ? [...ids, id]
      : ids;
}
export function bestOffer(p) {
  return (
    [...(p.offers || [])]
      .filter(
        (o) =>
          Number.isFinite(o.price) &&
          o.price > 0 &&
          o.available !== false &&
          o.exact !== false &&
          o.superseded !== true,
      )
      .sort((a, b) => a.price - b.price)[0] || null
  );
}
export function setupCost(p, grinder, accessories) {
  const b = bestOffer(p);
  if (
    !b ||
    !Number.isFinite(accessories) ||
    accessories < 0 ||
    (!p.integrated && (!Number.isFinite(grinder) || grinder < 0))
  )
    return null;
  return b.price + (p.integrated ? 0 : grinder) + accessories;
}
export function criterionState(value, verified) {
  if (!verified) return "unknown";
  if (!value || value === "?" || /belirsiz|doğrulan|çelişkili/i.test(value))
    return "unknown";
  if (/uygulanamaz/i.test(value)) return "na";
  if (/^yok/i.test(value)) return "no";
  if (/^(var|evet)/i.test(value)) return "yes";
  return "unknown";
}
export function csvText(rows) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let s = String(v ?? "");
          if (/^[=+@\-]/.test(s)) s = "'" + s;
          return '"' + s.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}
export function preferenceScore(product, options = {}) {
  const merged = {
    budget: 50000,
    grinder: 16000,
    accessories: 2500,
    cups: 5,
    milkShare: 50,
    goal: "control",
    ...options,
  };
  return evaluatePreference(product, {
    ...merged,
    price: bestOffer(product),
    total: setupCost(product, merged.grinder, merged.accessories),
  });
}
export function rankProducts(products, options) {
  return products
    .map((product) => ({ product, ...preferenceScore(product, options) }))
    .sort(
      (a, b) =>
        Number(a.failed.length > 0) - Number(b.failed.length > 0) ||
        Number(a.insufficientEvidence) - Number(b.insufficientEvidence) ||
        b.score - a.score ||
        b.evidence - a.evidence,
    );
}
