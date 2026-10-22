import React, { useMemo, useState } from "react";
import { Button, Pagination, Select } from "@mantine/core";
import { searchIndex, buildSearchIndex } from "./search.mjs";
import { bestOffer } from "./domain.mjs";
import type { Product } from "./types";
type SearchDocument = ReturnType<typeof buildSearchIndex>[number];
export function SearchResults({
  index,
  query,
  go,
  openEquipment,
}: {
  index: SearchDocument[];
  query: string;
  go: (route: string) => void;
  openEquipment: (id: string) => void;
}) {
  const [kind, setKind] = useState<string | null>("all"),
    [page, setPage] = useState(1);
  const all = useMemo(() => searchIndex(index, query), [index, query]);
  const results = all.filter((r) => kind === "all" || r.kind === kind);
  const pageKey = query + "|" + kind;
  const [previous, setPrevious] = useState(pageKey);
  if (previous !== pageKey) {
    setPrevious(pageKey);
    setPage(1);
  }
  const labels: Record<string, string> = {
    machine: "Makine",
    equipment: "Ekipman",
    concept: "Kavram / veri alanı",
  };
  return (
    <section className="page-section search-page">
      <div className="eyebrow">TÜM ARAŞTIRMANIN İÇİNDE ARA</div>
      <h1>Her veri, tek aramada.</h1>
      <p className="page-intro">
        Marka, model, teknik değer, kavram, kabul şartı, puan gerekçesi, fiyat,
        satıcı, kaynak ve görsel adresleri aranır. Birden fazla sözcük birlikte
        aranır; tam ifade için çift tırnak kullanın. Türkçe karakter kullanmadan
        da arayabilirsiniz.
      </p>
      <div className="search-summary">
        <p role="status" aria-live="polite">
          {query.trim()
            ? `${results.length} sonuç · ${all.filter((r) => r.kind === "machine").length} makine, ${all.filter((r) => r.kind === "equipment").length} ekipman, ${all.filter((r) => r.kind === "concept").length} kavram / alan`
            : "Aramak için üstteki alana yazın."}
        </p>
        <Select
          aria-label="Arama sonuç türü"
          value={kind}
          onChange={setKind}
          data={[
            { value: "all", label: "Tüm sonuçlar" },
            { value: "machine", label: "Makineler" },
            { value: "equipment", label: "Ekipmanlar" },
            { value: "concept", label: "Kavramlar ve veri alanları" },
          ]}
        />
      </div>
      <p className="hint">
        Arama eşleşmesi, özelliğin bulunduğu veya doğrulandığı anlamına gelmez.
        “Yok”, eski fiyat ve açıklanmayan bilgi de aranır; karar verirken ürünün
        kaynak ve kabul durumunu inceleyin. Katalog filtreleri bu genel aramayı
        sınırlandırmaz.
      </p>
      {!query.trim() && (
        <div className="search-examples">
          {[
            "Lelit",
            "La Pavoni",
            "PID",
            "preinfusion",
            "çapaklı",
            "58 mm",
            "Pazarama",
          ].map((q) => (
            <span key={q}>{q}</span>
          ))}
        </div>
      )}
      {query.trim() && !results.length && (
        <div className="empty-state">
          <h2>Eşleşme bulunamadı.</h2>
          <p>
            Terimleri azaltın veya sonuç türünü “Tüm sonuçlar” yapın. Arama
            interneti taramaz; mevcut araştırma verisini arar.
          </p>
        </div>
      )}
      <div className="search-results">
        {results.slice((page - 1) * 12, page * 12).map((r) => {
          const product = r.product as Product | null;
          const offer = product ? bestOffer(product) : null;
          return (
            <article className="search-result" key={r.kind + r.id}>
              <div className="eyebrow">{labels[r.kind]}</div>
              <h2>{r.title}</h2>
              {product && (
                <p>
                  {offer
                    ? `${offer.price.toLocaleString("tr-TR")} TL · ${offer.seller}`
                    : "Uygun fiyat gözlemi bulunmuyor"}
                  {r.kind === "machine"
                    ? " · Teknik tercih puanı fiyat bağımsızdır."
                    : ""}
                </p>
              )}
              <dl>
                {r.matches.map((m, i) => (
                  <div key={i}>
                    <dt>{m.label}</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="hint">
                {r.matchCount} alanda eşleşme
                {r.matchCount > 4 ? " · ilk 4 alan gösteriliyor" : ""}
              </p>
              {r.kind === "machine" ? (
                <Button variant="light" onClick={() => go("product/" + r.id)}>
                  Ürünü ve kanıtlarını incele
                </Button>
              ) : r.kind === "equipment" ? (
                <Button variant="light" onClick={() => openEquipment(r.id)}>
                  Ekipman kaydını aç
                </Button>
              ) : (
                <Button variant="light" onClick={() => go("guide")}>
                  Espresso rehberini aç
                </Button>
              )}
            </article>
          );
        })}
      </div>
      {results.length > 12 && (
        <Pagination
          aria-label="Arama sonuç sayfaları"
          value={page}
          onChange={setPage}
          total={Math.ceil(results.length / 12)}
          siblings={0}
          boundaries={1}
        />
      )}
    </section>
  );
}
