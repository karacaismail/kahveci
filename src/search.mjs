/** @typedef {{label:string,value:string,normalized:string}} SearchField */
/** @typedef {{id:string,kind:string,title:string,product:import('./types').Product|null,fields:SearchField[],titleNormalized:string}} SearchDocument */
/** @typedef {SearchDocument & {matches:SearchField[],matchCount:number,relevance:number}} SearchResult */
import {
  qualityCriteria,
  extraQualityCriteria,
  qualityFor,
} from "./quality.mjs";
import { acceptancePolicy, equipmentPreferenceScore } from "./preference.mjs";
import { preferenceScore } from "./domain.mjs";
export function normalizeSearch(value) {
  return String(value)
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replaceAll("ı", "i")
    .replace(/(\d)[.,](?=\d{3}(?:\D|$))/g, "$1")
    .replace(/(\d)([a-z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
const states = {
  yes: "Karşılıyor var doğrulandı",
  no: "Bulunmuyor yok",
  limited: "Sınırlı kısmi",
  unknown: "Henüz doğrulanmadı",
  unpublished: "Kaynakta açıklanmıyor",
  external: "Ayrı ekipman gerekir harici",
  na: "Uygulanamaz",
};
const aliases = [
  ["preinfusion", "pre infusion", "ön ıslatma", "ön demleme"],
  ["burr", "çapaklı", "dişli"],
  ["thermoblock", "termoblok"],
  ["portafilter", "portafiltre"],
  ["boiler", "kazan"],
  ["grinder", "öğütücü", "değirmen"],
  ["single wall", "tek duvarlı", "basınçsız sepet"],
  ["dual boiler", "çift kazan"],
].map((g) => g.map(normalizeSearch));
function fieldsOf(value, path = "", out = []) {
  if (value === null || value === undefined) return out;
  if (typeof value === "object")
    for (const [key, v] of Object.entries(value))
      fieldsOf(v, path ? `${path} › ${key}` : key, out);
  else
    out.push({
      label: path,
      value:
        typeof value === "boolean"
          ? value
            ? "Evet var"
            : "Hayır yok"
          : String(value),
    });
  return out;
}
const fieldNames = {
  id: "Kayıt",
  brand: "Marka",
  name: "Model",
  category: "Tür",
  specs: "Teknik özellik",
  verified: "Özellik kaynağı",
  offers: "Fiyat gözlemi",
  purchaseLinks: "Satın alma seçeneği",
  price: "Fiyat (TL)",
  seller: "Satıcı",
  url: "Kaynak adresi",
  note: "Not",
  notes: "Araştırma notu",
  sources: "Kaynak",
  images: "Görsel adresi",
  checked: "Kontrol tarihi",
  observedAt: "Gözlem tarihi",
  available: "Stok",
  exact: "Model eşleşmesi",
  superseded: "Eski gözlem",
  researchChecks: "Kaynakta açıklanmayan bilgi",
  researchStatus: "Araştırma durumu",
  integrated: "Entegre öğütücü",
  score: "Puan",
  evidence: "Kaynak kapsamı",
  rows: "Puan katkısı",
  key: "Başlık",
  reason: "Gerekçe",
  contribution: "Katkı",
  weight: "Ağırlık",
  state: "Durum",
  value: "Değer",
  label: "Başlık",
};
function doc(id, kind, title, fields, product = null) {
  return {
    id,
    kind,
    title,
    product,
    fields: fields.map((f) => ({
      ...f,
      label: f.label
        .split(" › ")
        .map((k) => fieldNames[k] || k)
        .join(" › "),
      normalized: normalizeSearch(
        f.label +
          " " +
          f.label
            .split(" › ")
            .map((k) => fieldNames[k] || k)
            .join(" ") +
          " " +
          f.value,
      ),
    })),
    titleNormalized: normalizeSearch(title),
  };
}
/** @returns {SearchDocument[]} */
export function buildSearchIndex(products, equipment, options = {}) {
  const index = [];
  for (const [list, kind] of [
    [products, "machine"],
    [equipment, "equipment"],
  ])
    for (const p of list) {
      const fields = fieldsOf(p);
      if (kind === "machine")
        for (const c of [...qualityCriteria, ...extraQualityCriteria]) {
          const q = qualityFor(p, c.key);
          fields.push({
            label: c.key,
            value: `${states[q.state] || q.state} · ${q.value} · ${q.note || ""}`,
          });
        }
      fieldsOf(
        kind === "machine"
          ? preferenceScore(p, options)
          : equipmentPreferenceScore(p),
        "Tercih puanı",
        fields,
      );
      index.push(doc(p.id, kind, `${p.brand} ${p.name}`, fields, p));
    }
  const concepts = new Map();
  for (const c of [...qualityCriteria, ...extraQualityCriteria])
    concepts.set(c.key, {
      label: c.label,
      description: c.why + " " + (acceptancePolicy[c.key]?.rule || ""),
    });
  for (const key of new Set(
    [...products, ...equipment].flatMap((p) => Object.keys(p.specs)),
  ))
    if (!concepts.has(key))
      concepts.set(key, {
        label: key,
        description:
          "Ürün teknik veri alanı. Değerin anlamı ve doğrulama durumu ilgili ürün kaydında gösterilir.",
      });
  for (const [key, c] of concepts) {
    const examples = [
      ...new Set(
        [...products, ...equipment].map((p) => p.specs[key]).filter(Boolean),
      ),
    ].slice(0, 3);
    index.push(
      doc("concept-" + key, "concept", c.label, [
        { label: "Kavram", value: key },
        { label: "Açıklama", value: c.description },
        ...examples.map((value) => ({
          label: "Katalogdan örnek değer",
          value,
        })),
      ]),
    );
  }
  return index;
}
/** @param {SearchDocument[]} index
 * @returns {SearchResult[]} */
export function searchIndex(index, query, kind = "all") {
  const tokens = [...String(query).matchAll(/"([^"]+)"|(\S+)/g)]
    .map((m) => normalizeSearch(m[1] || m[2]))
    .filter(Boolean);
  if (!tokens.length) return [];
  const groups = tokens.map((t) => aliases.find((g) => g.includes(t)) || [t]);
  return index
    .filter((d) => kind === "all" || d.kind === kind)
    .flatMap((d) => {
      if (
        !groups.every((g) =>
          g.some((t) => d.fields.some((f) => f.normalized.includes(t))),
        )
      )
        return [];
      const matches = d.fields.filter((f) =>
        groups.some((g) => g.some((t) => f.normalized.includes(t))),
      );
      const score = groups.reduce(
        (sum, g) =>
          sum +
          (g.some((t) => d.titleNormalized === t)
            ? 100
            : g.some((t) => d.titleNormalized.includes(t))
              ? 30
              : 1),
        0,
      );
      return [
        {
          ...d,
          matches: matches.slice(0, 4),
          matchCount: matches.length,
          relevance: score,
        },
      ];
    })
    .sort(
      (a, b) =>
        b.relevance - a.relevance || a.title.localeCompare(b.title, "tr"),
    );
}
