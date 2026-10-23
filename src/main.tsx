import React, { useState, useEffect, useMemo, useId, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  MantineProvider,
  createTheme,
  Button,
  TextInput,
  Select,
  NumberInput,
  Checkbox,
  Modal,
  Switch,
  Tooltip,
  SegmentedControl,
  Pagination,
  Notification,
  Collapse,
} from "@mantine/core";
import {
  IconSearch,
  IconArrowUpRight,
  IconArrowRight,
  IconAdjustmentsHorizontal,
  IconScale,
  IconX,
  IconPlus,
  IconCheck,
  IconMinus,
  IconQuestionMark,
  IconCoffee,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
  IconZoomIn,
  IconZoomOut,
  IconExternalLink,
  IconBook2,
  IconShoppingBag,
  IconFilter,
  IconArrowLeft,
  IconInfoCircle,
  IconHeart,
  IconClock,
  IconSettings,
  IconPhoto,
  IconMaximize,
} from "@tabler/icons-react";
import "@mantine/core/styles.css";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-600.css";
import "@fontsource/outfit/latin-700.css";
import "@fontsource/outfit/latin-ext-400.css";
import "@fontsource/outfit/latin-ext-500.css";
import "@fontsource/outfit/latin-ext-600.css";
import data from "./catalog.json";
import type { Product } from "./types";
import {
  toggleComparison,
  bestOffer,
  setupCost,
  criterionState,
  rankProducts,
  preferenceScore,
  csvText,
} from "./domain.mjs";
import {
  GaugeIcon,
  ThermometerIcon,
  FunnelIcon,
  CloudIcon,
  ArrowsDownUpIcon,
  DropIcon,
  WrenchIcon,
  ScalesIcon,
  TimerIcon,
  SparkleIcon,
  ChartLineIcon,
  GearSixIcon,
  SealCheckIcon,
} from "@phosphor-icons/react";
import {
  acceptancePolicy,
  relatedPreferenceCriterion,
  equipmentPreferenceScore,
} from "./preference.mjs";
import "./styles.css";
import { buildSearchIndex, searchIndex } from "./search.mjs";
import { SearchResults } from "./SearchResults";
import { selectLayout } from "./layout.mjs";
const layout = selectLayout({
  width: screen.width,
  height: screen.height,
  coarse: matchMedia("(any-pointer: coarse)").matches,
  touchPoints: navigator.maxTouchPoints,
  touchEvents: "ontouchstart" in window,
});
document.documentElement.dataset.layout = layout;
const phoneStyles =
  layout === "phone" ? import("./phone.css") : Promise.resolve();
import {
  qualityCriteria,
  extraQualityCriteria,
  qualityFor,
  matchesQuality,
} from "./quality.mjs";
import { motion, installMotionTokens } from "./motion";
installMotionTokens();
const products = data.products as unknown as Product[],
  equipment = data.equipment as unknown as Product[];
const theme = createTheme({
  respectReducedMotion: true,
  fontFamily: "Outfit, sans-serif",
  headings: { fontFamily: "Outfit, sans-serif" },
  primaryColor: "forest",
  colors: {
    forest: [
      "#edf5f1",
      "#d7e8df",
      "#b5d1c3",
      "#8db6a3",
      "#699e85",
      "#4e8d70",
      "#367357",
      "#285b45",
      "#193e34",
      "#112d26",
    ],
  },
  defaultRadius: "md",
  fontSizes: { xs: "14px", sm: "14px", md: "16px", lg: "18px", xl: "22px" },
  components: {
    Button: Button.extend({ defaultProps: { size: "md" } }),
    Modal: Modal.extend({
      defaultProps: {
        transitionProps: {
          duration: motion.duration,
          timingFunction: motion.easing,
        },
      },
    }),
    Tooltip: Tooltip.extend({
      defaultProps: {
        transitionProps: {
          duration: motion.duration,
          timingFunction: motion.easing,
        },
      },
    }),
    Select: Select.extend({
      defaultProps: {
        comboboxProps: {
          transitionProps: {
            duration: motion.duration,
            timingFunction: motion.easing,
          },
        },
      },
    }),
  },
});
const optionalAmount = (v: number | string) => {
  const amount = Number(v);
  return v === "" || !Number.isFinite(amount) || amount < 0 ? null : amount;
};
const money = (n: number | null | undefined) =>
  n == null || !Number.isFinite(n)
    ? "Fiyat doğrulanmadı"
    : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(n) +
      " TL";
const formatCategory = (p: Product) =>
  p.category.includes("Tam otomatik")
    ? "Tam otomatik"
    : p.integrated
      ? "Entegre öğütücülü"
      : p.category.toLowerCase().includes("manuel")
        ? "Manuel / kollu"
        : "Yarı otomatik";
const stateNames = {
  yes: "Karşılıyor",
  no: "Bulunmuyor",
  unknown: "Henüz doğrulanmadı",
  unpublished: "Kaynakta açıklanmıyor",
  limited: "Sınırlı / kısmi",
  external: "Ayrı ekipman gerekir",
  na: "Uygulanamaz",
};
const criteria = [...qualityCriteria, ...extraQualityCriteria];

type PreferenceOptions = {
  budget: number;
  grinder: number | null;
  accessories: number | null;
  goal: string;
  cups: number;
  milkShare: number;
};
const criterionIcons: Record<string, React.ElementType> = {
  "Öğütüm kontrolü": GearSixIcon,
  "Gerçek demleme basıncı (bar)": GaugeIcon,
  PID: ThermometerIcon,
  "Basınçsız basket": FunnelIcon,
  "Buhar iş akışı": CloudIcon,
  "3 yollu solenoid": ArrowsDownUpIcon,
  "Ön demleme": DropIcon,
  "Parça ekosistemi": WrenchIcon,
  "Doz ve çıktı": ScalesIcon,
  "Ölçüm yardımcıları": TimerIcon,
  "Bakım ve su": SparkleIcon,
  "Kapasite kanıtı": ChartLineIcon,
};
function CriterionMark({ criterion }: { criterion: string }) {
  const policy = acceptancePolicy[criterion as keyof typeof acceptancePolicy],
    Icon = criterionIcons[criterion] || SealCheckIcon;
  return (
    <div className={"criterion-mark " + policy.tier} data-criterion={criterion}>
      <Icon weight="duotone" aria-hidden="true" />
      <span>
        {policy.tier === "required"
          ? "Gerekli"
          : policy.tier === "conditional"
            ? "Süt için"
            : policy.tier === "optional"
              ? "Ek avantaj"
              : "Ölçüm bilgisi"}
      </span>
    </div>
  );
}
function Disclosure({
  label,
  children,
  className = "",
  accessibleLabel,
}: {
  label: string;
  accessibleLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [opened, setOpened] = useState(false),
    id = useId();
  return (
    <div className={"disclosure " + className}>
      <button
        id={id + "-trigger"}
        type="button"
        className="disclosure-trigger"
        aria-expanded={opened}
        aria-label={accessibleLabel}
        aria-controls={id}
        onClick={() => setOpened((value) => !value)}
      >
        <IconChevronRight
          className={opened ? "opened" : ""}
          aria-hidden="true"
          size={18}
        />
        {label}
      </button>
      <Collapse
        id={id}
        role="region"
        aria-labelledby={id + "-trigger"}
        aria-hidden={!opened}
        inert={!opened}
        expanded={opened}
        transitionDuration={motion.duration}
        transitionTimingFunction={motion.easing}
        keepMounted
        keepMountedMode="display-none"
      >
        {children}
      </Collapse>
    </div>
  );
}
function ScoreSummary({
  p,
  options,
  expanded = false,
}: {
  p: Product;
  options: PreferenceOptions;
  expanded?: boolean;
}) {
  const r = preferenceScore(p, options);
  return (
    <div
      className={expanded ? "preference-panel" : "preference-mini"}
      data-score={r.score}
    >
      <div className="preference-heading">
        <div>
          <small>TERCİH PUANINIZ</small>
          <strong>
            {r.score}
            <span>/100</span>
          </strong>
        </div>
        <div>
          <b>Kaynak kapsamı %{r.evidence}</b>
          <span>
            {r.budgetStatus === "within"
              ? "Varsayımlarla bütçe içinde"
              : r.budgetStatus === "over"
                ? "Kurulum bütçe üstünde"
                : "Kurulum maliyeti eksik"}
          </span>
          <span>{r.acceptance}</span>
        </div>
      </div>
      <ul>
        {r.reasons.slice(0, expanded ? 4 : 2).map((reason) => (
          <li key={reason.key}>
            <b>
              {reason.points > 0 ? "+" : ""}
              {reason.points}
            </b>
            <span>{reason.label}</span>
          </li>
        ))}
      </ul>
      {expanded && (
        <>
          <p>
            Ham hesap: {Number(r.rawPoints.toFixed(1))} / {r.maxPoints} × 100 −{" "}
            {r.penalty} = {r.score}/100. Eksik/kısmi başlıkların tam
            karşılandığı matematiksel tavan {r.possibleMax}/100. Bu bir tahmin
            veya kazanılacak puan vaadi değildir. Kısmen belgelenmiş başlıklar
            kaynak kapsamına dahildir; bu oran tam uygunluk oranı değildir.
            Kurulum: {money(r.total)}; bütçe: {money(options.budget)}. Fiyat ve
            bütçe puana/kabul şartlarına dahil değildir. Öğütücü/aksesuar
            değerleri yalnız maliyet planlaması için karar atölyesinde
            değiştirilebilir.
          </p>
          {r.penalty > 0 && (
            <p>
              Ardışık sütlü servis varsayımı ve kaynaklı tek kazan nedeniyle −
              {r.penalty} puan. Günlük fincan sayısı seri servis testi değildir.
            </p>
          )}
          <div className="score-gaps">
            <div>
              <h3>Karşılanmayan şartlar</h3>
              {r.failed.length ? (
                r.failed.map((row) => (
                  <p key={row.key}>
                    {row.key}: {row.value}
                  </p>
                ))
              ) : (
                <p>
                  Belgelenmiş bir yokluk tespit edilmedi; bu, tüm şartlar
                  karşılanıyor anlamına gelmez.
                </p>
              )}
            </div>
            <div>
              <h3>Tamamlanacak şartlar</h3>
              {r.pending.length ? (
                r.pending.map((row) => (
                  <p key={row.key}>
                    {row.key}: {row.value}
                  </p>
                ))
              ) : (
                <p>Zorunlu başlıkların belgelenen kapsamı tamam.</p>
              )}
            </div>
          </div>
          <Disclosure label="Puan dökümü ve kabul kuralları">
            <div className="score-table-scroll">
              <table className="spec-table">
                <thead>
                  <tr>
                    <th>Özellik</th>
                    <th>Katkı / ağırlık</th>
                    <th>Gerekçe</th>
                  </tr>
                </thead>
                <tbody>
                  {r.rows.map((row) => (
                    <tr key={row.key}>
                      <th>{row.label}</th>
                      <td>
                        {Number(row.points.toFixed(1))} / {row.weight}
                      </td>
                      <td>
                        {row.value}
                        <p>{row.reason}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Disclosure>
        </>
      )}
    </div>
  );
}
function EquipmentScore({ p }: { p: Product }) {
  const r = equipmentPreferenceScore(p);
  return (
    <div className="preference-mini">
      <div className="preference-heading">
        <div>
          <small>{p.category} TERCİH PUANI</small>
          <strong>
            {r.score}
            <span>/100</span>
          </strong>
        </div>
        <div>
          <b>Kaynak kapsamı %{r.evidence}</b>
          <span>{r.acceptance}</span>
        </div>
      </div>
      <p>
        Bu puan yalnız aynı ekipman rolü içinde okunur; makine puanıyla
        kıyaslanmaz. Fiyat puana girmez.
      </p>
      <ul>
        {r.reasons.map((reason, i) => (
          <li key={i}>
            <b>+{reason.points}</b>
            <span>{reason.label}</span>
          </li>
        ))}
      </ul>
      <Disclosure label="Ekipman puan dökümü">
        {r.rows.map((row) => (
          <p key={row.key}>
            <b>
              {row.key}: {row.points}/{row.weight}
            </b>{" "}
            · {row.value}
          </p>
        ))}
      </Disclosure>
    </div>
  );
}
function verifiedValue(p: Product, key: string) {
  return p.verified[key] ? p.specs[key] : "Doğrulanmadı";
}
function featureState(p: Product, key: string) {
  return qualityFor(p, key).state as keyof typeof stateNames;
}

function Status({
  p,
  k,
  compact = false,
}: {
  p: Product;
  k: string;
  compact?: boolean;
}) {
  const state = featureState(p, k);
  const Icon =
    state === "yes"
      ? IconCheck
      : state === "no"
        ? IconMinus
        : state === "na"
          ? IconMinus
          : IconQuestionMark;
  return (
    <span className={"status " + state}>
      <Icon size={16} />
      {!compact && stateNames[state]}
    </span>
  );
}
function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer">
      {children}
      <IconArrowUpRight size={15} />
    </a>
  );
}
function Photo({
  p,
  index = 0,
  className = "",
  onClick,
}: {
  p: Product;
  index?: number;
  className?: string;
  onClick?: (trigger: HTMLButtonElement) => void;
}) {
  const src = p.images[index];
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const ready = loadedSrc === src;
  return (
    <div
      className={"photo " + className}
      data-loading={!!src && !failed && !ready}
      aria-busy={!!src && !failed && !ready}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`${p.brand} ${p.name} — ürün görseli ${index + 1}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <div className="no-photo">
          <IconPhoto size={38} />
          <span>
            {src ? "Görsel kaynağı yüklenemedi" : "Doğrulanmış görsel yok"}
          </span>
        </div>
      )}
      {onClick && src && !failed && (
        <button
          className="photo-hit"
          aria-label={`${p.name} görselini büyüt`}
          onClick={(event) => onClick(event.currentTarget)}
        >
          <span>
            <IconZoomIn size={19} />
            Büyüt
          </span>
        </button>
      )}
    </div>
  );
}
function Card({
  p,
  go,
  selected,
  compare,
  scoreOptions,
}: {
  p: Product;
  go: (r: string) => void;
  selected: string[];
  compare: (p: Product) => void;
  scoreOptions: PreferenceOptions;
}) {
  const b = bestOffer(p);
  return (
    <article className="product-card">
      <div className="card-media">
        <button
          className="card-image-link"
          onClick={() => go("product/" + p.id)}
          aria-label={`${p.brand} ${p.name} ayrıntıları`}
        >
          <Photo p={p} />
        </button>
        <span
          className={
            "pill card-badge " + (p.id === "gaggia-classic-e24" ? "gold" : "")
          }
        >
          {p.id === "gaggia-classic-e24"
            ? "Klasik kontrol"
            : p.brand === "Ninja"
              ? "Yönlendirmeli deneyim"
              : formatCategory(p)}
        </span>
        <button
          aria-label={`${p.name} karşılaştırmaya ${selected.includes(p.id) ? "çıkar" : "ekle"}`}
          className={
            "compare-icon " + (selected.includes(p.id) ? "chosen" : "")
          }
          onClick={() => compare(p)}
        >
          {selected.includes(p.id) ? (
            <IconCheck size={19} />
          ) : (
            <IconPlus size={19} />
          )}
        </button>
      </div>
      <div className="card-content">
        <div className="eyebrow">{p.brand}</div>
        <button className="title-button" onClick={() => go("product/" + p.id)}>
          <h3>{p.name}</h3>
        </button>
        <p className="card-caption">
          {p.notes[0] ||
            "Başlangıç araştırmasından aktarıldı. Teknik bilgiler bağımsız olarak doğrulanmayı bekliyor."}
        </p>
        <div className="feature-chips">
          <span>
            {p.verified["Portafilter çapı (mm)"]
              ? p.specs["Portafilter çapı (mm)"] + " mm"
              : p.integrated
                ? "Dahili öğütücü"
                : "Ayrı öğütücü"}
          </span>
          <span>{Object.keys(p.verified).length} kaynaklı alan</span>
          {p.images.length > 0 && <span>{p.images.length} görsel</span>}
        </div>
        <ScoreSummary p={p} options={scoreOptions} />
        <div className="mini-criteria">
          {qualityCriteria.map((c) => (
            <Tooltip
              key={c.key}
              label={c.label + " · " + stateNames[featureState(p, c.key)]}
            >
              <span>
                <Status p={p} k={c.key} compact />
                {c.shortLabel}
              </span>
            </Tooltip>
          ))}
        </div>
        <div className="card-price">
          <div>
            <small>{b ? "Gözlenen en düşük teklif" : "Güncel teklif"}</small>
            <strong>{b ? money(b.price) : "Doğrulanmadı"}</strong>
            <small>
              {b?.conditional && "Koşullu kampanya · "}
              {b?.evidence === "search-index"
                ? "Arama indeksi · stok teyidi gerekir"
                : b
                  ? "Kaynak sayfası · sepet kontrolü gerekir"
                  : "Eski metin fiyatı kullanılmadı"}
            </small>
          </div>
          <button
            className="round-link"
            aria-label={`${p.name} incele`}
            onClick={() => go("product/" + p.id)}
          >
            <IconArrowUpRight size={22} />
          </button>
        </div>
      </div>
    </article>
  );
}
function Offers({ p }: { p: Product }) {
  return (
    <div className="offers">
      {!p.offers.some((o) => !o.superseded) ? (
        <div className="empty-inline">
          Bu model için doğrulanabilir Türkiye teklifi bulunamadı. Eski
          metindeki{" "}
          {p.legacyPrice && p.legacyPrice !== "?"
            ? p.legacyPrice + " TL"
            : "fiyat"}{" "}
          güncel teklif olarak kullanılmıyor.
          <div className="buy-search">
            <Link
              href={
                "https://www.akakce.com/arama/?q=" +
                encodeURIComponent(p.brand + " " + p.name)
              }
            >
              Akakçe’de ara
            </Link>
            <Link
              href={
                "https://www.cimri.com/arama?q=" +
                encodeURIComponent(p.brand + " " + p.name)
              }
            >
              Cimri’de ara
            </Link>
          </div>
        </div>
      ) : (
        <>
          {p.offers
            .filter((o) => !o.superseded)
            .sort((a, b) => a.price - b.price)
            .map((o, i) => (
              <div
                className={
                  "offer " + (o.available === false ? "unavailable" : "")
                }
                key={i}
              >
                <div>
                  <strong>{o.seller}</strong>
                  <small>
                    {o.evidence === "search-index"
                      ? "Arama indeksi"
                      : "Kaynak sayfası"}{" "}
                    · {o.observedAt}
                    {o.available === false
                      ? " · Stok/SKU uygunluğu teyitsiz veya stok dışı"
                      : ""}
                    {o.conditional ? " · Koşullu kampanya" : ""}
                  </small>
                  <p>{o.note}</p>
                </div>
                <strong>{money(o.price)}</strong>
                <Link href={o.url}>
                  {o.available === false ? "Kaydı gör" : "Teklifi incele"}
                </Link>
              </div>
            ))}
          <p className="fineprint">
            Bunlar araştırmada gözlenen teklif görüntüleridir. “En düşük”,
            listelenen uygun tekliflerin minimumudur; tüm pazarın canlı en ucuzu
            iddiası değildir. Kargo, satıcı, ürün nesli, garanti ve ödeme
            adımındaki toplamı kontrol edin.
          </p>
          <div className="buy-search">
            <Link
              href={
                "https://www.akakce.com/arama/?q=" +
                encodeURIComponent(p.brand + " " + p.name)
              }
            >
              Diğer Akakçe satıcılarını ara
            </Link>
            <Link
              href={
                "https://www.cimri.com/arama?q=" +
                encodeURIComponent(p.brand + " " + p.name)
              }
            >
              Cimri alternatiflerini ara
            </Link>
          </div>
        </>
      )}
      {!!p.purchaseLinks?.length && (
        <section className="purchase-alternatives">
          <h3>Alternatif mağaza ürün sayfaları</h3>
          <p className="fineprint">
            Bu bağlantılar gerçek ürün sayfalarıdır. Bu kayıtta fiyatı veya stok
            durumu kesinleştirilemeyen sayfalar en düşük fiyat hesabına girmez.
          </p>
          {p.purchaseLinks
            .filter((link) => link.exact !== false)
            .map((link) => (
              <div className="purchase-link" key={link.url}>
                <Link href={link.url}>{link.seller}</Link>
                <small>
                  {link.region || "TR"} · {link.checked}
                </small>
                <p>{link.note}</p>
              </div>
            ))}
        </section>
      )}
    </div>
  );
}
function Gallery({
  p,
  onOpen,
}: {
  p: Product;
  onOpen: (p: Product, index: number, trigger: HTMLButtonElement) => void;
}) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [p.id]);
  return (
    <div className="gallery">
      <Photo
        p={p}
        index={index}
        className="gallery-main"
        onClick={(trigger) => {
          onOpen(p, index, trigger);
        }}
      />
      <div className="thumbnails">
        {p.images.map((_, i) => (
          <button
            key={i}
            aria-label={`${i + 1}. görseli göster`}
            aria-pressed={index === i}
            className={index === i ? "active" : ""}
            onClick={() => setIndex(i)}
          >
            <Photo p={p} index={i} />
          </button>
        ))}
      </div>
      <small>
        Üretici/satıcı görselleri · {p.images.length} ayrı görsel · büyütmek
        için görsele tıklayın
      </small>
    </div>
  );
}
function Specs({
  p,
  showLegacy,
  setShowLegacy,
  scoreOptions,
}: {
  p: Product;
  showLegacy: boolean;
  setShowLegacy: (v: boolean) => void;
  scoreOptions: PreferenceOptions;
}) {
  const scoring = preferenceScore(p, scoreOptions);
  return (
    <div>
      <div className="section-head">
        <h2>Teknik dosya</h2>
        <Switch
          label="Başlangıç metnindeki teyitsiz bilgileri de göster"
          checked={showLegacy}
          onChange={(e) => setShowLegacy(e.currentTarget.checked)}
        />
      </div>
      {layout === "phone" && (
        <p className="hint">
          Teknik tabloyu yatay kaydırarak değerleri, kaynakları ve puan
          katkısını inceleyin.
        </p>
      )}
      <div
        className="spec-table-scroll"
        role="region"
        tabIndex={0}
        aria-label="Ürün teknik özellik tablosu"
      >
        <table className="spec-table">
          <tbody>
            {Object.entries(p.specs)
              .filter(([k]) => showLegacy || p.verified[k])
              .map(([k, v]) => (
                <tr key={k}>
                  <th>{k}</th>
                  <td>{v}</td>
                  <td>
                    {p.verified[k] ? (
                      <Link href={p.verified[k]}>
                        {p.evidenceKind?.[k] === "retailer"
                          ? "Satıcı kaydı"
                          : p.evidenceKind?.[k]?.includes("distributor")
                            ? "Dağıtıcı kaydı"
                            : "Teknik kaynak"}
                      </Link>
                    ) : (
                      <span className="unknown-text">Teyitsiz aktarım</span>
                    )}
                  </td>
                  <td className="spec-contribution">
                    {!p.verified[k] ? (
                      "Teyitsiz alan · 0"
                    ) : k === "Kazan tipi" && scoring.penalty > 0 ? (
                      <span>
                        Servis temposu: −{scoring.penalty} ortak puan (bir kez
                        uygulanır)
                      </span>
                    ) : relatedPreferenceCriterion(k) ? (
                      <>
                        {relatedPreferenceCriterion(k)}
                        <strong>
                          {Number(
                            (
                              scoring.rows.find(
                                (row) =>
                                  row.key === relatedPreferenceCriterion(k),
                              )?.points || 0
                            ).toFixed(1),
                          )}{" "}
                          ortak ağırlık katkısı
                        </strong>
                      </>
                    ) : (
                      "Bilgilendirici · 0"
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {!Object.keys(p.verified).length && (
        <p className="empty-inline">
          Bu kaydın teknik özellikleri henüz teknik belgeyle eşleştirilmedi.
          Teyitsiz alanları yukarıdaki anahtarla inceleyebilirsiniz.
        </p>
      )}
    </div>
  );
}

function App() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const comparisonNavRef = useRef<HTMLElement>(null);
  const galleryTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [activeComparison, setActiveComparison] = useState(0);
  const closeFilters = () => {
    setFiltersOpen(false);
    document.querySelector<HTMLButtonElement>(".phone-filter-toggle")?.focus();
  };
  const [globalQuery, setGlobalQuery] = useState("");
  const [equipmentTarget, setEquipmentTarget] = useState("");
  const [route, setRoute] = useState(location.hash.slice(1) || "catalog");
  const [selected, setSelected] = useState<string[]>(() => {
    try {
      const x = JSON.parse(localStorage.getItem("espresso-compare") || "[]");
      return Array.isArray(x)
        ? ([
            ...new Set(
              x.filter(
                (id: unknown) =>
                  typeof id === "string" && products.some((p) => p.id === id),
              ),
            ),
          ].slice(0, 4) as string[])
        : [];
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState(""),
    [brand, setBrand] = useState<string | null>(null),
    [category, setCategory] = useState<string | null>(null),
    [view, setView] = useState("curated"),
    [sort, setSort] = useState<string | null>("preference"),
    [page, setPage] = useState(1),
    [verifiedOnly, setVerifiedOnly] = useState(false),
    [withPhoto, setWithPhoto] = useState(false),
    [cap, setCap] = useState<number | string>(""),
    [criteriaFilter, setCriteriaFilter] = useState<string[]>([]),
    [qualityStatusFilter, setQualityStatusFilter] = useState<string | null>(
      "yes",
    ),
    [toast, setToast] = useState("");
  const [budget, setBudget] = useState<number | string>(50000),
    [grinder, setGrinder] = useState<number | string>(16000),
    [accessories, setAccessories] = useState<number | string>(2500),
    [goal, setGoal] = useState<string | null>("control"),
    [cups, setCups] = useState<number | string>(5),
    [milkShare, setMilkShare] = useState<number | string>(50),
    [diffOnly, setDiffOnly] = useState(false),
    [showLegacy, setShowLegacy] = useState(false),
    [imageModal, setImageModal] = useState<{
      p: Product;
      index: number;
    } | null>(null),
    [zoom, setZoom] = useState(1),
    [equipKind, setEquipKind] = useState("Tümü");
  useEffect(() => {
    const cb = () => {
      const nextRoute = location.hash.slice(1) || "catalog";
      setRoute(nextRoute);
      if (nextRoute === "compare") setActiveComparison(0);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", cb);
    return () => window.removeEventListener("hashchange", cb);
  }, []);
  useEffect(() => {
    localStorage.setItem("espresso-compare", JSON.stringify(selected));
  }, [selected]);
  useEffect(() => {
    setActiveComparison((i) => Math.min(i, Math.max(0, selected.length - 1)));
  }, [selected.length]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Tab") document.documentElement.dataset.keyboard = "true";
    };
    const pointer = () => {
      document.documentElement.dataset.keyboard = "false";
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", pointer);
    window.addEventListener("touchstart", pointer);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", pointer);
      window.removeEventListener("touchstart", pointer);
    };
  }, []);
  useEffect(() => {
    setPage(1);
  }, [
    query,
    brand,
    category,
    view,
    sort,
    verifiedOnly,
    withPhoto,
    cap,
    criteriaFilter,
    qualityStatusFilter,
    budget,
    grinder,
    accessories,
    goal,
    cups,
    milkShare,
  ]);
  const go = (r: string) => {
    setToast("");
    location.hash = r;
  };
  const compare = (p: Product) => {
    if (!selected.includes(p.id) && selected.length === 4) {
      setToast(
        "En fazla 4 makine karşılaştırabilirsiniz. Önce bir makineyi çıkarın.",
      );
      return;
    }
    setSelected((ids) => toggleComparison(ids, p.id));
  };
  const scoreOptions: PreferenceOptions = {
    budget: Number(budget),
    grinder: optionalAmount(grinder),
    accessories: optionalAmount(accessories),
    goal: goal || "control",
    cups: Number(cups),
    milkShare: Number(milkShare),
  };
  const searchNeeded = route === "search" || !!query.trim();
  const globalIndex = useMemo(
    () =>
      searchNeeded ? buildSearchIndex(products, equipment, scoreOptions) : [],
    [searchNeeded, budget, grinder, accessories, goal, cups, milkShare],
  );
  useEffect(() => {
    if (route === "equipment" && equipmentTarget)
      document
        .getElementById("equipment-" + equipmentTarget)
        ?.scrollIntoView({ block: "start" });
  }, [route, equipmentTarget, equipKind]);
  const compared = selected
    .map((id) => products.find((p) => p.id === id)!)
    .filter(Boolean);
  useEffect(() => {
    const nav = comparisonNavRef.current;
    const button = nav?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (nav && button) {
      if (button.offsetLeft < nav.scrollLeft)
        nav.scrollLeft = button.offsetLeft;
      else if (
        button.offsetLeft + button.offsetWidth >
        nav.scrollLeft + nav.clientWidth
      )
        nav.scrollLeft =
          button.offsetLeft + button.offsetWidth - nav.clientWidth;
    }
  }, [activeComparison, route]);
  const filtered = useMemo(() => {
    const matchedIds = new Set(
      searchIndex(globalIndex, query, "machine").map((r) => r.id),
    );
    let list = products.filter(
      (p) =>
        (view === "all" || !!query.trim() || p.featured) &&
        (!query.trim() || matchedIds.has(p.id)) &&
        (!brand || p.brand === brand) &&
        (!category || formatCategory(p) === category) &&
        (!verifiedOnly || Object.keys(p.verified).length > 0) &&
        (!withPhoto || p.images.length > 0) &&
        (!cap || (bestOffer(p) && bestOffer(p)!.price <= Number(cap))) &&
        matchesQuality(p, criteriaFilter, qualityStatusFilter || "yes"),
    );
    if (sort === "preference")
      list = rankProducts(list, scoreOptions).map(
        (r: { product: Product }) => r.product,
      );
    else if (sort === "price")
      list.sort(
        (a, b) =>
          (bestOffer(a)?.price ?? Infinity) - (bestOffer(b)?.price ?? Infinity),
      );
    else if (sort === "name")
      list.sort((a, b) =>
        (a.brand + a.name).localeCompare(b.brand + b.name, "tr"),
      );
    else
      list.sort(
        (a, b) =>
          Number(b.id.includes("ninja")) - Number(a.id.includes("ninja")) ||
          Number(b.id === "gaggia-classic-e24") -
            Number(a.id === "gaggia-classic-e24") ||
          Object.keys(b.verified).length - Object.keys(a.verified).length,
      );
    return list;
  }, [
    query,
    brand,
    category,
    view,
    sort,
    verifiedOnly,
    withPhoto,
    cap,
    criteriaFilter,
    qualityStatusFilter,
    globalIndex,
    budget,
    grinder,
    accessories,
    goal,
    cups,
    milkShare,
  ]);
  const current = route.startsWith("product/")
    ? products.find((p) => p.id === route.split("/")[1])
    : null;
  const exportData = (format: "csv" | "json") => {
    const out =
      format === "json"
        ? JSON.stringify(
            {
              updated: data.updated,
              products: products.map((p) => ({
                ...p,
                preference: preferenceScore(p, scoreOptions),
                quality: Object.fromEntries(
                  criteria.map((c) => [c.key, qualityFor(p, c.key)]),
                ),
              })),
              equipment: equipment.map((p) => ({
                ...p,
                preference: equipmentPreferenceScore(p),
              })),
            },
            null,
            2,
          )
        : "\uFEFF" +
          csvText([
            [
              "Marka",
              "Model",
              "Kategori",
              "En düşük gözlenen teklif TL",
              "Teklif kanıtı",
              "Teklif kaynağı",
              "Kontrol tarihi",
              "Tercih puanı /100",
              "Kanıt kapsamı %",
              "Tercih nedenleri",
              ...criteria.flatMap((c) => [
                c.label + " — durum",
                c.label + " — bulgu",
                c.label + " — kaynak",
              ]),
              ...allKeys,
              ...allKeys.map((k) => k + " — kaynak"),
            ],
            ...products.map((p) => {
              const o = bestOffer(p);
              return [
                p.brand,
                p.name,
                p.category,
                o?.price ?? "",
                o?.evidence ?? "",
                o?.url ?? "",
                o?.observedAt ?? "",
                preferenceScore(p, scoreOptions).score,
                preferenceScore(p, scoreOptions).evidence,
                preferenceScore(p, scoreOptions)
                  .reasons.map((r) => r.label + ": " + r.points)
                  .join(" | "),
                ...criteria.flatMap((c) => {
                  const q = qualityFor(p, c.key);
                  return [
                    stateNames[q.state as keyof typeof stateNames],
                    q.value,
                    q.sources.join(" | "),
                  ];
                }),
                ...allKeys.map((k) => verifiedValue(p, k)),
                ...allKeys.map(
                  (k) => p.verified[k] || "Doğrulanmamış başlangıç metni",
                ),
              ];
            }),
          ]);
    const url = URL.createObjectURL(
      new Blob([out], {
        type: format === "json" ? "application/json" : "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "espresso-atlasi." + format;
    a.click();
    URL.revokeObjectURL(url);
  };
  const comparisonKeys = [
    ...new Set([
      "PID",
      "Basınçsız basket",
      "Ön demleme",
      "3 yollu solenoid",
      "Kazan tipi",
      "Gerçek demleme basıncı (bar)",
      "Süt sistemi",
      "Su haznesi (L)",
      ...compared.flatMap((p) => Object.keys(p.verified)),
    ]),
  ];
  const hero = products.find((p) => p.brand === "Ninja")!;
  return (
    <>
      <div className="topbar">
        <span>Espresso seçimi, pazarlama vaatlerinden daha fazlası.</span>
        <span>
          Türkiye pazarı <span className="top-dot" /> 22 Ekim 2026 araştırma
          görüntüsü
        </span>
      </div>
      <header>
        <button className="brand" onClick={() => go("catalog")}>
          <span className="brand-mark">
            <IconCoffee size={27} />
          </span>
          <span>
            espresso<span className="brand-light">atlası</span>
            <small>İYİ KAHVEYE GİDEN YOL</small>
          </span>
        </button>
        <nav>
          {[
            ["catalog", "Makineler"],
            ["equipment", "Öğütücü & ekipman"],
            ["guide", "Kaliteli espresso rehberi"],
            ["decision", "Karar atölyesi"],
          ].map(([r, label]) => (
            <button
              key={r}
              className={route === r ? "active" : ""}
              onClick={() => go(r)}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="header-compare" onClick={() => go("compare")}>
          <IconScale size={20} />
          Karşılaştır<span>{selected.length}/4</span>
        </button>
      </header>
      <section className="universal-search" aria-label="Genel arama">
        <TextInput
          aria-label="Tüm verilerde ara"
          onKeyDown={(e) => {
            if (e.key === "Enter") go("search");
          }}
          placeholder="Her şeyi ara: marka, PID, 58 mm, satıcı, fiyat…"
          leftSection={<IconSearch size={18} />}
          value={globalQuery}
          onChange={(e) => {
            setGlobalQuery(e.currentTarget.value);
            if (route !== "search") go("search");
          }}
        />
        <Button variant="light" onClick={() => go("search")}>
          Genel arama
        </Button>
      </section>
      <main>
        {route === "search" && (
          <SearchResults
            index={globalIndex}
            query={globalQuery}
            go={go}
            openEquipment={(id) => {
              setEquipKind("Tümü");
              setEquipmentTarget(id);
              go("equipment");
            }}
          />
        )}
        {route === "catalog" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-line" />
                  EVDEKİ ESPRESSO DENEYİMİNİ TASARLA
                </div>
                <h1>
                  Doğru makine.
                  <br />
                  Sizin <em>kahveniz.</em>
                </h1>
                <p>
                  Barista olmadan başlayın, merak ettikçe derinleşin.
                  <br />
                  Makineleri kahveye etkileri, günlük emek ve gerçek
                  <br />
                  kurulum bütçesiyle yan yana değerlendirin.
                </p>
                <div className="hero-actions">
                  <Button
                    onClick={() =>
                      document.getElementById("catalog")?.scrollIntoView()
                    }
                    rightSection={<IconArrowRight size={18} />}
                  >
                    Makineleri keşfet
                  </Button>
                  <button className="text-link" onClick={() => go("decision")}>
                    Bana uygun yolu bul <IconArrowUpRight size={18} />
                  </button>
                </div>
                <div className="hero-facts">
                  <div>
                    <strong>{products.length}</strong>
                    <span>makine kaydı</span>
                  </div>
                  <div>
                    <strong>50.000 TL</strong>
                    <span>başlangıç bütçeniz</span>
                  </div>
                  <div>
                    <strong>4 makine</strong>
                    <span>yan yana karşılaştırma</span>
                  </div>
                </div>
              </div>
              <div className="hero-visual">
                <div className="hero-halo" />
                <div className="hero-label">
                  <span className="tiny-line" />
                  İLK KEŞİF
                </div>
                <Photo p={hero} className="hero-machine" />
                <div className="hero-product">
                  <div>
                    <span>NINJA LUXE CAFÉ PREMIER</span>
                    <strong>Öğüt. Tart. Keşfet.</strong>
                  </div>
                  <button
                    aria-label="Ninja Luxe Café Premier incele"
                    onClick={() => go("product/" + hero.id)}
                  >
                    <IconArrowUpRight size={24} />
                  </button>
                </div>
                <span className="hero-side">
                  ESPRESSO · FİLTRE · SOĞUK DEMLEME
                </span>
              </div>
            </section>
            <section className="trust-strip">
              <div>
                <IconAdjustmentsHorizontal />
                <span>
                  <strong>Kontrolün kahveye etkisi</strong>
                  <small>Pompa barından daha fazlası</small>
                </span>
              </div>
              <div>
                <IconScale />
                <span>
                  <strong>Makine değil, toplam kurulum</strong>
                  <small>Öğütücü ve ekipmanla hesaplayın</small>
                </span>
              </div>
              <div>
                <IconBook2 />
                <span>
                  <strong>Kaynağı görünen bilgi</strong>
                  <small>Beyan, yorum ve bilinmeyen ayrı</small>
                </span>
              </div>
              <button onClick={() => go("guide")}>
                Önce kriterleri tanıyın <IconArrowRight size={19} />
              </button>
            </section>
            <section id="catalog" className="catalog-section">
              <div className="section-head">
                <div>
                  <div className="eyebrow">KENDİ KAHVE KÖŞENİZİ KURUN</div>
                  <h2>Bir fincandan başlayın.</h2>
                </div>
                <div className="catalog-tabs">
                  <button
                    className={view === "curated" ? "active" : ""}
                    onClick={() => setView("curated")}
                  >
                    Kaynakla zenginleştirilenler{" "}
                    <span>{products.filter((p) => p.featured).length}</span>
                  </button>
                  <button
                    className={view === "all" ? "active" : ""}
                    onClick={() => setView("all")}
                  >
                    Tüm araştırma listesi <span>{products.length}</span>
                  </button>
                </div>
              </div>
              {layout === "phone" && (
                <Button
                  className="phone-filter-toggle"
                  variant="light"
                  aria-expanded={filtersOpen}
                  aria-controls="catalog-filters"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  leftSection={<IconFilter size={18} />}
                >
                  {filtersOpen
                    ? "Filtreleri kapat"
                    : "Filtreler ve kabul kriterleri"}
                </Button>
              )}
              <div className="catalog-layout">
                <Collapse
                  expanded={layout !== "phone" || filtersOpen}
                  transitionDuration={motion.duration}
                  transitionTimingFunction={motion.easing}
                  keepMounted
                  aria-hidden={layout === "phone" && !filtersOpen}
                  inert={layout === "phone" && !filtersOpen}
                >
                  <aside id="catalog-filters">
                    <div className="aside-title">
                      <IconFilter size={18} />
                      <strong>Seçimi daraltın</strong>
                      <button
                        onClick={() => {
                          setBrand(null);
                          setCategory(null);
                          setQuery("");
                          setCap("");
                          setCriteriaFilter([]);
                          setQualityStatusFilter("yes");
                          setVerifiedOnly(false);
                          setWithPhoto(false);
                        }}
                      >
                        Temizle
                      </button>
                    </div>
                    <label>Makine tipi</label>
                    <Select
                      aria-label="Makine tipi"
                      placeholder="Tüm deneyimler"
                      value={category}
                      onChange={setCategory}
                      data={[
                        "Yarı otomatik",
                        "Entegre öğütücülü",
                        "Tam otomatik",
                        "Manuel / kollu",
                      ]}
                      clearable
                    />
                    <label>Marka</label>
                    <Select
                      aria-label="Marka"
                      placeholder="Tüm markalar"
                      data={[...new Set(products.map((p) => p.brand))].sort()}
                      value={brand}
                      onChange={setBrand}
                      searchable
                      clearable
                    />
                    <label>Makine için üst sınır</label>
                    <NumberInput
                      aria-label="Makine için üst sınır"
                      placeholder="Sınır yok"
                      suffix=" TL"
                      value={cap}
                      onChange={setCap}
                      min={0}
                      step={5000}
                      thousandSeparator="."
                      decimalSeparator=","
                    />
                    <p className="hint">
                      Yalnız fiyatı bulunan ürünler filtrelenir. Toplam set
                      bütçesi için karar atölyesini kullanın.
                    </p>
                    <div className="filter-group">
                      <label>Espresso kalite kriterleri (8 + 4)</label>
                      <Select
                        aria-label="Kriterde aranan durum"
                        label="Kriterde aranan durum"
                        value={qualityStatusFilter}
                        onChange={setQualityStatusFilter}
                        data={Object.entries(stateNames).map(
                          ([value, label]) => ({ value, label }),
                        )}
                      />
                      <p className="hint">
                        Seçilen bütün ölçütler bu durumda olmalı. Boş seçim tüm
                        makineleri gösterir.
                      </p>
                      {criteria.map((c) => (
                        <Checkbox
                          key={c.key}
                          label={c.filterLabel}
                          checked={criteriaFilter.includes(c.key)}
                          onChange={(e) => {
                            const checked = e.currentTarget.checked;
                            setCriteriaFilter((v) =>
                              checked
                                ? [...v, c.key]
                                : v.filter((k) => k !== c.key),
                            );
                          }}
                        />
                      ))}
                      <Checkbox
                        label="Kaynaklı teknik alanı bulunanlar"
                        checked={verifiedOnly}
                        onChange={(e) =>
                          setVerifiedOnly(e.currentTarget.checked)
                        }
                      />
                      <Checkbox
                        label="Görseli bulunanlar"
                        checked={withPhoto}
                        onChange={(e) => setWithPhoto(e.currentTarget.checked)}
                      />
                    </div>
                    <div className="aside-note">
                      <IconInfoCircle size={21} />
                      <strong>Bir marka, tek bir kalite değil.</strong>
                      <p>
                        Aynı markanın portafiltreli ve tam otomatik modelleri
                        farklı kontrol olanakları sunabilir.
                      </p>
                      <button onClick={() => go("guide")}>
                        Nasıl değerlendiriyoruz? <IconArrowRight size={16} />
                      </button>
                    </div>
                    {layout === "phone" && (
                      <Button
                        className="phone-filter-apply"
                        onClick={closeFilters}
                      >
                        Sonuçları göster ({filtered.length})
                      </Button>
                    )}
                  </aside>
                </Collapse>
                <div className="catalog-results">
                  <div className="results-toolbar">
                    <TextInput
                      aria-label="Makine ara"
                      leftSection={<IconSearch size={18} />}
                      placeholder="Tüm makine verilerinde ara"
                      value={query}
                      onChange={(e) => setQuery(e.currentTarget.value)}
                    />
                    <span>{filtered.length} makine</span>
                    <Select
                      aria-label="Sıralama"
                      value={sort}
                      onChange={setSort}
                      data={[
                        { value: "featured", label: "Kaynak kapsamına göre" },
                        {
                          value: "preference",
                          label: "Tercih puanım: yüksekten düşüğe",
                        },
                        { value: "price", label: "Fiyat: düşükten yükseğe" },
                        { value: "name", label: "Marka / model: A–Z" },
                      ]}
                    />
                  </div>
                  <div className="coverage-note">
                    {
                      products.filter((p) => Object.keys(p.verified).length)
                        .length
                    }
                    /{products.length} kayıtta teknik alanları kaynakla
                    eşleştirildi. Geri kalanlar teyitsiz başlangıç kayıtlarıdır.
                    Eksik veri, özellik yok anlamına gelmez.
                  </div>
                  <div className="product-grid">
                    {filtered.slice((page - 1) * 12, page * 12).map((p) => (
                      <Card
                        key={p.id}
                        p={p}
                        go={go}
                        selected={selected}
                        compare={compare}
                        scoreOptions={scoreOptions}
                      />
                    ))}
                  </div>
                  {!filtered.length && (
                    <div className="empty-state">
                      <IconSearch size={40} />
                      <h3>Bu koşullarla makine bulunamadı.</h3>
                      <p>
                        “Doğrulanmadı”, “yok” anlamına gelmez. Filtreleri
                        azaltarak daha fazla kaydı inceleyin.
                      </p>
                      <Button
                        variant="light"
                        onClick={() => {
                          setQuery("");
                          setBrand(null);
                          setCategory(null);
                          setCap("");
                          setCriteriaFilter([]);
                          setQualityStatusFilter("yes");
                        }}
                      >
                        Filtreleri sıfırla
                      </Button>
                    </div>
                  )}
                  <Pagination
                    value={page}
                    onChange={setPage}
                    total={Math.max(1, Math.ceil(filtered.length / 12))}
                  />
                </div>
              </div>
            </section>
          </>
        )}
        {current && (
          <>
            <div className="breadcrumb">
              <button onClick={() => go("catalog")}>Makineler</button>
              <IconChevronRight size={16} />
              <span>{current.brand}</span>
              <IconChevronRight size={16} />
              <span>{current.name}</span>
            </div>
            <section className="product-hero">
              <Gallery
                p={current}
                onOpen={(p, index, trigger) => {
                  galleryTriggerRef.current = trigger;
                  setZoom(1);
                  setImageModal({ p, index });
                }}
              />
              <div className="product-intro">
                <div className="eyebrow">
                  {current.brand}{" "}
                  <span className="pill">{formatCategory(current)}</span>
                </div>
                <h1>{current.name}</h1>
                <p className="product-lede">
                  {current.notes[0] ||
                    "Bu modelin bağımsız teknik doğrulaması tamamlanmadı. Başlangıç kaydını, doğrulanmış ürün gibi değerlendirmeyin."}
                </p>
                <div className="intro-price">
                  <small>
                    Listelenen uygun teklifler içinde en düşük gözlenen fiyat
                  </small>
                  <strong>{money(bestOffer(current)?.price)}</strong>
                  <span>
                    {bestOffer(current)?.evidence === "search-index"
                      ? "Arama indeksi görüntüsü · canlı sepet doğrulaması yapılmadı"
                      : "Kaynak sayfası görüntüsü · ödeme fiyatını kontrol edin"}
                  </span>
                </div>
                <div className="product-ctas">
                  <Button
                    leftSection={<IconScale size={19} />}
                    onClick={() => compare(current)}
                    variant={selected.includes(current.id) ? "light" : "filled"}
                  >
                    {selected.includes(current.id)
                      ? "Karşılaştırmadan çıkar"
                      : "Karşılaştırmaya ekle"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("offers")?.scrollIntoView()
                    }
                  >
                    Satıcı ve fiyatlar <IconArrowRight size={17} />
                  </Button>
                </div>
                <div className="intro-stats">
                  {[
                    ["Isıtma", verifiedValue(current, "Kazan tipi")],
                    ["Öğütücü", current.integrated ? "Dahili" : "Ayrı gerekir"],
                    ["Su haznesi", verifiedValue(current, "Su haznesi (L)")],
                  ].map(([label, v]) => (
                    <div key={label}>
                      <small>{label}</small>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
                <div className="source-banner">
                  <IconBook2 size={20} />
                  <span>
                    {Object.keys(current.verified).length} teknik alan kaynakla
                    eşleştirildi. Diğer özellikler bilinmeyen olarak korunur.
                  </span>
                </div>
              </div>
            </section>
            <div className="product-anchor-nav">
              {[
                ["preference", "Tercih puanım"],
                ["quality", "Kabul şartları ve özellikler"],
                ["workflow", "Kullanım & bütçe"],
                ["specs", "Tüm teknik özellikler"],
                ["offers", "Satıcılar & teklifler"],
                ["sources", "Kaynaklar"],
              ].map(([id, t]) => (
                <a
                  key={id}
                  href={"#product/" + current.id}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(id)?.scrollIntoView();
                  }}
                >
                  {t}
                </a>
              ))}
            </div>
            <section id="preference" className="detail-section light-section">
              <div className="eyebrow">PUAN = TERCİH NEDENİNİZ</div>
              <h2>Bu makineyi neden seçmeliyim?</h2>
              <ScoreSummary p={current} options={scoreOptions} expanded />
            </section>
            <section id="quality" className="detail-section">
              <div className="eyebrow">FİNCANDA NE DEĞİŞİR?</div>
              <h2>Espresso kalite kriterleri</h2>
              {current.researchStatus === "needs-sku" && (
                <p className="research-status">
                  Bu kayıtta kesin model/nesil kodu gerekiyor. Aile düzeyindeki
                  bilgiler satın alınacak SKU için otomatik kabul değildir.
                </p>
              )}
              {/source-(unavailable|inaccessible)/.test(
                current.researchStatus || "",
              ) && (
                <p className="research-status">
                  Bu neslin teknik kaynağına erişim tamamlanamadı. Açık kalan
                  kriterler yok sayılmıyor; kaynak erişimi ve kesin SKU
                  doğrulaması gerekiyor.
                </p>
              )}
              <div className="quality-grid">
                {criteria.map((c) => (
                  <div key={c.key}>
                    <CriterionMark criterion={c.key} />
                    <div className="section-head">
                      <h3>{c.shortLabel}</h3>
                      <Status p={current} k={c.key} />
                    </div>
                    <strong className="quality-value">
                      {qualityFor(current, c.key).value}
                    </strong>
                    <Disclosure
                      label="Ayrıntı"
                      accessibleLabel={
                        "Ayrıntı: " + c.shortLabel + " açıklaması ve kaynakları"
                      }
                    >
                      <p>{qualityFor(current, c.key).value}</p>
                      <p>
                        {
                          acceptancePolicy[
                            c.key as keyof typeof acceptancePolicy
                          ].rule
                        }
                      </p>
                      <p>{c.why}</p>
                      <p>{qualityFor(current, c.key).reason}</p>
                      {qualityFor(current, c.key).sources.map(
                        (url: string, i: number) => (
                          <Link key={url} href={url}>
                            Kaynak {i + 1}
                          </Link>
                        ),
                      )}
                    </Disclosure>
                  </div>
                ))}
              </div>
              <div className="tradeoffs">
                <div>
                  <h3>Bu modelin somut farkları</h3>
                  {current.notes.map((n, i) => (
                    <p key={i}>
                      <IconArrowRight size={17} />
                      {n}
                    </p>
                  ))}
                </div>
                <div>
                  <h3>Satın almadan önce doğrulayın</h3>
                  <p>
                    Kesin SKU ve nesil, Türkiye garantisi, yedek parça ve servis
                    kanalı.
                  </p>
                  <p>
                    Tek duvarlı sepet/tamper/sürahi kutuda mı? Ek satın alma
                    gerekip gerekmediği satıcıdan doğrulanmalı.
                  </p>
                  <p>
                    Üretici güç ve basınç değerleri, bağımsız sıcaklık
                    kararlılığı veya tat ölçümü değildir.
                  </p>
                </div>
              </div>
            </section>
            <section id="workflow" className="detail-section light-section">
              <h2>Makineden kurulum bütçesine.</h2>
              <div className="budget-summary">
                <div>
                  <small>Makine</small>
                  <strong>{money(bestOffer(current)?.price)}</strong>
                </div>
                <span>+</span>
                <div>
                  <small>
                    {current.integrated
                      ? "Dahili öğütücü"
                      : "Ayrı öğütücü varsayımı"}
                  </small>
                  <strong>
                    {current.integrated
                      ? "Dahil"
                      : money(optionalAmount(grinder))}
                  </strong>
                </div>
                <span>+</span>
                <div>
                  <small>Ekipman varsayımı</small>
                  <strong>{money(optionalAmount(accessories))}</strong>
                </div>
                <span>=</span>
                <div>
                  <small>Tahmini başlangıç</small>
                  <strong>
                    {money(
                      setupCost(
                        current,
                        optionalAmount(grinder),
                        optionalAmount(accessories),
                      ),
                    )}
                  </strong>
                </div>
              </div>
              <p>
                Öğütücü ve ekipman tutarları kullanıcı tarafından
                değiştirilebilen varsayımlardır. Her ürün için uyumluluk ve kutu
                içeriği ayrıca kontrol edilmelidir.
              </p>
              <Button variant="light" onClick={() => go("decision")}>
                Bütçeyi ve günlük fincan sayısını değiştir{" "}
                <IconArrowRight size={18} />
              </Button>
            </section>
            <section id="specs" className="detail-section">
              <Specs
                p={current}
                showLegacy={showLegacy}
                setShowLegacy={setShowLegacy}
                scoreOptions={scoreOptions}
              />
            </section>
            <section id="offers" className="detail-section">
              <div className="eyebrow">TEKLİFİ OKUYUN, SONRA KARAR VERİN</div>
              <h2>Satın alma seçenekleri</h2>
              <Offers p={current} />
            </section>
            <section id="sources" className="detail-section">
              <h2>Kaynaklar & veri sınırları</h2>
              <div className="source-list">
                {current.sources.map((s, i) => (
                  <div key={i}>
                    {s.url ? (
                      <Link href={s.url}>{s.label}</Link>
                    ) : (
                      <span>{s.label}</span>
                    )}
                    <small>{s.checked || "Bağımsız kontrol yok"}</small>
                  </div>
                ))}
              </div>
              <p className="muted">
                Galeri görsellerinin hakları ilgili üretici/satıcıya aittir;
                kaynak sunucudan yüklenir. Fotoğraflar ürün nesli veya bölgesel
                kutu içeriğinin kesin kanıtı değildir.
              </p>
            </section>
          </>
        )}
        {route === "compare" && (
          <section className="page-section">
            <div className="section-head">
              <div>
                <div className="eyebrow">YAN YANA, AÇIKÇA</div>
                <h1>Karşılaştırma masanız.</h1>
                <p>
                  En fazla dört makine. Bilinmeyenler puan kaybetmez; görünür
                  kalır.
                </p>
              </div>
              <Button
                variant="light"
                onClick={() => go("catalog")}
                leftSection={<IconPlus size={18} />}
              >
                Makine ekle
              </Button>
            </div>
            {compared.length ? (
              <>
                <div className="compare-controls">
                  <Switch
                    label="Yalnız farklı değerleri göster"
                    checked={diffOnly}
                    onChange={(e) => setDiffOnly(e.currentTarget.checked)}
                  />
                  <span>
                    Toplam kurulum: ayrı öğütücü{" "}
                    {money(optionalAmount(grinder))} + ekipman{" "}
                    {money(optionalAmount(accessories))} varsayımı
                  </span>
                  <button onClick={() => setSelected([])}>Tümünü çıkar</button>
                </div>
                {layout === "phone" && (
                  <nav
                    ref={comparisonNavRef}
                    className="phone-comparison-nav"
                    aria-label="Karşılaştırılan makineler"
                  >
                    {compared.map((p, i) => (
                      <button
                        key={p.id}
                        aria-label={`Karşılaştırmada ${i + 1}. makineye git`}
                        aria-pressed={activeComparison === i}
                        onClick={() => {
                          const box = comparisonRef.current;
                          const cell =
                            box?.querySelectorAll<HTMLTableCellElement>(
                              "thead th",
                            )[i + 1];
                          const label =
                            box?.querySelector<HTMLTableCellElement>(
                              "thead th",
                            );
                          if (box && cell && label) {
                            box.scrollLeft =
                              cell.offsetLeft - label.offsetWidth;
                            setActiveComparison(i);
                          }
                        }}
                      >
                        {i + 1}. {p.brand} {p.name}
                      </button>
                    ))}
                  </nav>
                )}
                {layout === "phone" && (
                  <p className="hint">
                    Dört makine aynı tabloda. Numaralı düğmelerle ürüne gidin
                    veya tabloyu yatay kaydırın; kriter sütunu sabit kalır.
                  </p>
                )}
                <div
                  ref={comparisonRef}
                  onScroll={
                    layout === "phone"
                      ? (e) => {
                          const box = e.currentTarget;
                          const cells =
                            box.querySelectorAll<HTMLTableCellElement>(
                              "thead th",
                            );
                          if (cells.length > 1)
                            setActiveComparison(
                              Math.min(
                                compared.length - 1,
                                Math.max(
                                  0,
                                  Math.round(
                                    box.scrollLeft / cells[1].offsetWidth,
                                  ),
                                ),
                              ),
                            );
                        }
                      : undefined
                  }
                  className="comparison-scroll"
                  tabIndex={0}
                  aria-label="Makine karşılaştırma tablosu"
                >
                  <table
                    className="comparison-table"
                    style={
                      layout === "phone"
                        ? ({
                            "--compare-count": compared.length,
                          } as React.CSSProperties)
                        : undefined
                    }
                  >
                    <thead>
                      <tr>
                        <th>Karar kriteri</th>
                        {compared.map((p) => (
                          <th key={p.id}>
                            <button
                              className="compare-remove"
                              aria-label={`${p.name} çıkar`}
                              onClick={() => compare(p)}
                            >
                              <IconX size={18} />
                            </button>
                            <Photo p={p} />
                            <small>{p.brand}</small>
                            <button
                              className="title-button"
                              onClick={() => go("product/" + p.id)}
                            >
                              <h3>{p.name}</h3>
                            </button>
                            <strong>{money(bestOffer(p)?.price)}</strong>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <th>Tercih puanı / kanıt kapsamı</th>
                        {compared.map((p) => (
                          <td key={p.id}>
                            <ScoreSummary p={p} options={scoreOptions} />
                          </td>
                        ))}
                      </tr>
                      {[
                        {
                          label: "Kategori",
                          get: (p: Product) => formatCategory(p),
                        },
                        {
                          label: "Toplam başlangıç (varsayımlı)",
                          get: (p: Product) =>
                            money(
                              setupCost(
                                p,
                                optionalAmount(grinder),
                                optionalAmount(accessories),
                              ),
                            ),
                        },
                        {
                          label: "Öğütücü",
                          get: (p: Product) =>
                            p.integrated ? "Entegre" : "Ayrı gerekli",
                        },
                        ...comparisonKeys.map((k) => ({
                          label: k,
                          get: (p: Product) => verifiedValue(p, k),
                        })),
                      ]
                        .filter(
                          (row) =>
                            !diffOnly ||
                            new Set(compared.map(row.get)).size > 1,
                        )
                        .map((row) => (
                          <tr key={row.label}>
                            <th>{row.label}</th>
                            {compared.map((p) => (
                              <td key={p.id}>
                                {row.get(p)}
                                {p.verified[row.label] && (
                                  <a
                                    className="cell-source"
                                    href={p.verified[row.label]}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={`${p.name} ${row.label} kaynağı`}
                                  >
                                    <IconExternalLink size={14} />
                                  </a>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      <tr className="group-row">
                        <th colSpan={compared.length + 1}>
                          Espresso kalite kriterleri — 8 ana + 4 ek
                        </th>
                      </tr>
                      {criteria.map((c) => (
                        <tr key={c.key}>
                          <th>{c.label}</th>
                          {compared.map((p) => (
                            <td key={p.id}>
                              <Status p={p} k={c.key} />
                              <p>{qualityFor(p, c.key).value}</p>
                              <p className="muted">
                                {qualityFor(p, c.key).reason}
                              </p>
                              {qualityFor(p, c.key).sources.map(
                                (url: string, i: number) => (
                                  <Link key={url} href={url}>
                                    Dayanak {i + 1}{" "}
                                  </Link>
                                ),
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr>
                        <th>Somut farklar / sınırlamalar</th>
                        {compared.map((p) => (
                          <td key={p.id}>
                            {p.notes.map((n, i) => (
                              <p key={i}>{n}</p>
                            ))}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <th>Satıcı seçenekleri</th>
                        {compared.map((p) => (
                          <td key={p.id}>
                            {p.offers
                              .filter(
                                (o) => o.available !== false && !o.superseded,
                              )
                              .map((o, i) => (
                                <div className="compare-offer" key={i}>
                                  <Link href={o.url}>{o.seller}</Link>
                                  <strong>{money(o.price)}</strong>
                                  <small>
                                    {o.evidence === "search-index"
                                      ? "Arama indeksi"
                                      : "Kaynak sayfası"}{" "}
                                    · {o.observedAt}
                                  </small>
                                </div>
                              ))}
                            {!p.offers.some(
                              (o) => o.available !== false && !o.superseded,
                            ) && "Uygun teklif doğrulanmadı"}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <IconScale size={48} />
                <h2>İlk makinenizi masaya koyun.</h2>
                <p>
                  Katalogda + düğmesini kullanarak en fazla dört makine seçin.
                </p>
                <Button onClick={() => go("catalog")}>Makinelere dön</Button>
              </div>
            )}
          </section>
        )}
        {route === "equipment" && (
          <section className="page-section">
            <div className="eyebrow">FİNCANIN DİĞER YARISI</div>
            <h1>Öğütücü, süt & ekipman.</h1>
            <p className="page-intro">
              Makine dışındaki harcamaları görün. Entegre öğütücü ve süt sistemi
              varsa aynı işi yapan ekipmanı iki kere almayın. Aksesuar uyumunu
              makinenin kesin ölçüsüne göre kontrol edin.
            </p>
            <div className="equipment-controls">
              <SegmentedControl
                value={equipKind}
                onChange={setEquipKind}
                data={["Tümü", "Öğütücü", "Süt sistemi", "Aksesuar"]}
              />
              <span>
                {
                  equipment.filter(
                    (e) => equipKind === "Tümü" || e.category === equipKind,
                  ).length
                }{" "}
                kayıt
              </span>
            </div>
            <div className="equipment-grid">
              {equipment
                .filter((e) => equipKind === "Tümü" || e.category === equipKind)
                .map((p) => (
                  <article
                    className="equipment-item"
                    id={"equipment-" + p.id}
                    key={p.id}
                  >
                    {p.images.length > 0 && (
                      <Photo
                        p={p}
                        onClick={(trigger) => {
                          galleryTriggerRef.current = trigger;
                          setZoom(1);
                          setImageModal({ p, index: 0 });
                        }}
                      />
                    )}
                    <div className="eyebrow">
                      {p.category} {p.brand && " / " + p.brand}
                    </div>
                    <h2>{p.name}</h2>
                    <EquipmentScore p={p} />
                    <dl>
                      {Object.entries(p.specs)
                        .filter(
                          ([k]) =>
                            ![
                              "Espresso uygunluğu (1-5)",
                              "Mikro köpük kalitesi (1-5)",
                              "Türkiye fiyatı TL",
                            ].includes(k),
                        )
                        .map(([k, v]) => (
                          <div key={k}>
                            <dt>{k}</dt>
                            <dd>
                              {v}{" "}
                              <small>
                                {p.verified[k]
                                  ? "Kaynaklı teknik bilgi"
                                  : "Teyitsiz başlangıç bilgisi"}
                              </small>
                            </dd>
                          </div>
                        ))}
                    </dl>
                    {p.notes.map((n, i) => (
                      <p key={i}>{n}</p>
                    ))}
                    <Offers p={p} />
                    {p.sources
                      .filter((s) => s.url)
                      .map((s, i) => (
                        <Link key={i} href={s.url}>
                          {s.label}
                        </Link>
                      ))}
                  </article>
                ))}
            </div>
          </section>
        )}
        {route === "decision" && (
          <section className="page-section decision-page">
            <div className="eyebrow">SİZİN EVİNİZ, SİZİN RİTMİNİZ</div>
            <h1>Makine değil, bir rutin seçin.</h1>
            <p className="page-intro">
              Teknik kabul şartları ve kullanım tercihinize göre sıralama. Fiyat
              ve bütçe puana dahil değildir; maliyetler ayrıca gösterilir. Bu
              bir tat testi değildir.
            </p>
            <div className="decision-layout">
              <aside className="decision-inputs">
                <NumberInput
                  label="Toplam başlangıç bütçesi"
                  value={budget}
                  onChange={setBudget}
                  min={0}
                  step={5000}
                  suffix=" TL"
                  thousandSeparator="."
                  decimalSeparator=","
                />
                <Select
                  label="Önceliğiniz"
                  value={goal}
                  onChange={setGoal}
                  data={[
                    {
                      value: "control",
                      label: "Espresso kontrolü ve öğrenmek",
                    },
                    { value: "convenience", label: "Az emek, kolay paylaşım" },
                  ]}
                />
                <NumberInput
                  label="Günde kaç içecek?"
                  value={cups}
                  onChange={setCups}
                  min={1}
                  max={100}
                />
                <NumberInput
                  label="Sütlü içecek payı (varsayım)"
                  value={milkShare}
                  onChange={setMilkShare}
                  min={0}
                  max={100}
                  suffix=" %"
                />
                <NumberInput
                  label="Ayrı öğütücü için varsayım"
                  value={grinder}
                  onChange={setGrinder}
                  min={0}
                  step={1000}
                  suffix=" TL"
                  thousandSeparator="."
                  decimalSeparator=","
                />
                <NumberInput
                  label="Aksesuar / ilk kurulum varsayımı"
                  value={accessories}
                  onChange={setAccessories}
                  min={0}
                  step={500}
                  suffix=" TL"
                  thousandSeparator="."
                  decimalSeparator=","
                />
                <div className="hint">
                  Başlangıçta 16.000 TL öğütücü ve 2.500 TL ekipman kullanılır.
                  Bunlar her makineye ait doğrulanmış paket teklifi değildir.
                  Su, kahve ve bakım tüketimi ayrıca hesaplanır.
                </div>
              </aside>
              <div>
                <div className="scenario-note">
                  <IconClock size={24} />
                  <div>
                    <strong>
                      {Number(cups) >= 15
                        ? "15–25 fincan: arka arkaya hazırlama kritik."
                        : "5–10 fincan: günlük rutin daha belirleyici."}
                    </strong>
                    <p>
                      {Number(cups) >= 15
                        ? "Günlük toplam ile tek oturumdaki servis aynı değildir. Tek kazanlı makinelerde espresso–buhar geçişi bekletir. Ev tipi cihaz için 25 fincan ticari kapasite garantisi yoktur."
                        : "Yarı otomatikte tartım, öğütüm, dağıtma, tamping ve temizlik sizdedir. Eğitim zorunlu değildir; aynı tarifle tekrar yapmak öğrenmeyi kolaylaştırır."}
                    </p>
                  </div>
                </div>
                <div className="decision-rank">
                  {rankProducts(products, {
                    budget: Number(budget),
                    grinder: optionalAmount(grinder),
                    accessories: optionalAmount(accessories),
                    goal: goal || "control",
                    cups: Number(cups),
                    milkShare: Number(milkShare),
                  })
                    .slice(0, 5)
                    .map(
                      (
                        r: {
                          product: Product;
                          total: number | null;
                          score: number;
                        },
                        i: number,
                      ) => (
                        <div key={r.product.id} className="rank-row">
                          <span className="rank-number">
                            0{i + 1}
                            <small>{r.score}/100</small>
                          </span>
                          <Photo p={r.product} />
                          <div>
                            <small>
                              {r.product.brand} · {formatCategory(r.product)}
                            </small>
                            <h3>{r.product.name}</h3>
                            <p>{r.product.notes[0]}</p>
                            <span
                              className={
                                "pill " +
                                (r.total !== null && r.total <= Number(budget)
                                  ? ""
                                  : "gold")
                              }
                            >
                              {r.total === null
                                ? "Tam bütçe bilinmiyor"
                                : r.total <= Number(budget)
                                  ? "Varsayımlarla bütçe içinde"
                                  : money(r.total - Number(budget)) +
                                    " bütçe üstünde"}
                            </span>
                          </div>
                          <div className="rank-price">
                            <small>Toplam başlangıç</small>
                            <strong>{money(r.total)}</strong>
                            <Button
                              variant="light"
                              onClick={() => go("product/" + r.product.id)}
                            >
                              İncele
                            </Button>
                          </div>
                        </div>
                      ),
                    )}
                </div>
              </div>
            </div>
            <section className="ownership">
              <h2>Bir yıllık tüketimi görün</h2>
              <p>
                Çift shot için 18 g doz ve 800 TL/kg çekirdek varsayımıyla:
                günlük {Number(cups)} içecek → yıllık{" "}
                <strong>
                  {((Number(cups) * 18 * 365) / 1000).toLocaleString("tr-TR")}{" "}
                  kg
                </strong>{" "}
                çekirdek ve{" "}
                <strong>
                  {money(((Number(cups) * 18 * 365) / 1000) * 800)}
                </strong>
                . Bunlar hesap örneğidir; diyal-in kaybı, tek/çift shot
                dağılımı, süt, su, elektrik ve bakım dahil değildir.
              </p>
            </section>
          </section>
        )}
        {route === "guide" && (
          <section className="page-section guide-page">
            <div className="eyebrow">
              DAHA FAZLA BAR DEĞİL, DAHA FAZLA ANLAM
            </div>
            <h1>İyi espressoyu ne belirler?</h1>
            <p className="page-intro">
              Makine tek başına iyi kahve garantisi vermez. Taze çekirdek, uygun
              su, öğütüm dağılımı ve tutarlı bir tarif; donanımla birlikte
              çalışır. Bu rehberde özellik, fayda ve ölçülmemiş sonuç
              birbirinden ayrılır.
            </p>
            <div className="guide-grid">
              {[
                [
                  "01",
                  "Sıcaklığın tekrarlanabilirliği",
                  "PID, kazan veya ısıtıcı sıcaklığını kontrol eder. Termoblok / ThermoJet mimarisi tek başına kötü kahve anlamına gelmez; gerçek shot içi sıcaklık eğrisi ancak ölçümle bilinir.",
                ],
                [
                  "02",
                  "Basınç: kutudaki sayı farklıdır",
                  "15–20 bar genellikle pompanın tepe değeridir. Yaklaşık 9 bar geleneksel bir demleme referansıdır; tek doğru profil değildir. TR/AB sürümünün OPV ayarı belirsizse, 9 bar diye işaretlenmez.",
                ],
                [
                  "03",
                  "Öğütüm ve doz üzerinde kontrol",
                  "Espressoya uygun çapaklı değirmen, küçük ayar adımları ve tutarlı doz yardımcıdır. Düz veya konik çapak tek başına kalite sıralaması değildir. Entegre değirmen masrafı azaltabilir; ayrı değirmen yükseltmeyi kolaylaştırır.",
                ],
                [
                  "04",
                  "Sepet ve portafiltre",
                  "Tek duvarlı sepet, öğütümle akışı ayarlamayı sağlar. 58 mm yaygın bir ekosistemdir; 51/54/57 mm de iyi espresso üretebilir. Çap tek başına kalite kanıtı değildir. Basınçlı sepet hazır öğütülmüş kahvede daha toleranslıdır.",
                ],
                [
                  "05",
                  "Süt dokusu ve iş akışı",
                  "Manuel buhar çubuğu sıcaklık ve hava ekleme üzerinde kontrol sağlar. Otomatik buhar sistemleri öğrenme yükünü azaltır. Süt köpüğü hacmi ile latte art için dökülebilir mikro köpük aynı ölçüm değildir.",
                ],
                [
                  "06",
                  "Beş fincan ile yirmi beş fincan",
                  "Tek kazanda kahve ve buhar sıcaklığı arasında geçiş olur. HX/çift kazan paralel iş akışı sunabilir. Günlük toplam, art arda hazırlanacak sütlü içecek sayısı ve ev tipi duty cycle ayrı değerlendirilir.",
                ],
                [
                  "07",
                  "Marka, menşe ve servis",
                  "Çin üretimi olmak tek başına düşük kaliteyi; İtalya üretimi olmak tek başına üstün fincanı kanıtlamaz. Model mimarisi, yedek parça, garanti, servis ve tamir edilebilirliğe bakın.",
                ],
                [
                  "08",
                  "Barista eğitimi gerekli mi?",
                  "Başlamak için şart değildir. Tek bir çekirdekle sabit doz ve çıkış ağırlığı tutun, her seferinde bir değişkeni değiştirin. Sütlü içecek ve iş akışı eğitimi faydalı olabilir; zorunlu bir satın alma kalemi değildir.",
                ],
              ].map(([n, title, t]) => (
                <article key={n}>
                  <span>{n}</span>
                  <h2>{title}</h2>
                  <p>{t}</p>
                </article>
              ))}
            </div>
            <div className="pathways">
              <h2>Üç farklı deneyim</h2>
              <div>
                {[
                  [
                    "Yarı otomatik",
                    "Öğütüm, doz, tamping, shot ve süt üzerinde daha fazla kontrol. Günlük tekrar ve temizlik sorumluluğu daha yüksek.",
                  ],
                  [
                    "Asistli yarı otomatik",
                    "Portafiltre süreci korunur; tartım, öğütüm önerisi veya süt desteği bazı görevleri kolaylaştırır. Her model aynı yardımı sunmaz.",
                  ],
                  [
                    "Tam otomatik",
                    "Düğmeyle içecek, hane içinde kolay paylaşım. Ayarlanabilir öğütüm/doz/sıcaklık olsa da puck hazırlığı üzerinde erişim sınırlıdır. Kalitesiz olduğu otomatik olarak söylenemez.",
                  ],
                ].map(([a, b]) => (
                  <article key={a}>
                    <h3>{a}</h3>
                    <p>{b}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="methodology">
              <h2>Kahve makinelerini tanıyın</h2>
              <div className="guide-links">
                <Link href="https://www.sageappliances.com/en-gb/product/bes500">
                  Sage: sıcaklık / basınç mimarisi
                </Link>
                <Link href="https://www.gaggia.com/manual-machines/new-classic-e24/">
                  Gaggia: E24 donanımı
                </Link>
                <Link href="https://www.lelit.com/it/prodotto/anna-pl41tem/">
                  Lelit: kazan ve PID
                </Link>
                <Link href="https://www.philips.com.tr/c-p/PSA3218_01R0/philips-barista-brew-semi-automatic-espresso-machine">
                  Philips: portafiltreli model
                </Link>
              </div>
            </div>
          </section>
        )}
        {![
          "catalog",
          "compare",
          "equipment",
          "decision",
          "guide",
          "search",
        ].includes(route) &&
          !current && (
            <div className="empty-state">
              <h1>Ürün bulunamadı.</h1>
              <Button onClick={() => go("catalog")}>Kataloğa dön</Button>
            </div>
          )}
      </main>
      <footer>
        <div className="brand footer-brand">
          <IconCoffee size={25} />
          espresso atlası
        </div>
        <p>
          Bilgiyle seçin. Keyifle hazırlayın.
          <small>
            22 Ekim 2026 · Masaüstü ve telefon deneyimi · Bağımsız karar aracı
          </small>
        </p>
        <div>
          <button onClick={() => exportData("csv")}>
            <IconDownload size={17} />
            CSV veri seti
          </button>
          <button onClick={() => exportData("json")}>JSON + kaynaklar</button>
          <a href={`${import.meta.env.BASE_URL}butce-arastirmasi.csv`} download>
            50.000 TL altı veri seti
          </a>
        </div>
      </footer>
      {selected.length > 0 && route !== "compare" && (
        <div className="compare-dock">
          <div>
            <IconScale size={24} />
            <strong>
              {layout === "phone" ? "Seçilenler" : "Karşılaştırma masası"}{" "}
              <span>{selected.length}/4</span>
            </strong>
          </div>
          <div className="dock-items">
            {compared.map((p) => (
              <div key={p.id}>
                <span>
                  {p.brand} {p.name}
                </span>
                <button
                  aria-label={`${p.name} çıkar`}
                  onClick={() => compare(p)}
                >
                  <IconX size={16} />
                </button>
              </div>
            ))}
            {Array.from({ length: 4 - selected.length }, (_, i) => (
              <span className="dock-empty" key={i}>
                + Makine ekleyin
              </span>
            ))}
          </div>
          <Button
            aria-label="Yan yana karşılaştır"
            onClick={() => go("compare")}
          >
            {layout === "phone" ? "Karşılaştır" : "Yan yana karşılaştır"}{" "}
            <IconArrowRight size={18} />
          </Button>
        </div>
      )}
      {toast && (
        <Notification
          className="toast"
          title="Karşılaştırma sınırı"
          onClose={() => setToast("")}
        >
          {toast}
        </Notification>
      )}
      <Modal
        opened={!!imageModal}
        onClose={() => setImageModal(null)}
        title={imageModal ? imageModal.p.brand + " " + imageModal.p.name : ""}
        size="90vw"
        returnFocus={layout !== "phone"}
        onExitTransitionEnd={() => {
          if (
            layout === "phone" &&
            !imageModal &&
            galleryTriggerRef.current?.isConnected
          )
            galleryTriggerRef.current.focus({ preventScroll: true });
        }}
        fullScreen={layout === "phone"}
        closeButtonProps={
          layout === "phone"
            ? { "aria-label": "Görsel penceresini kapat" }
            : undefined
        }
        centered
        classNames={{ body: "lightbox-body" }}
      >
        <div className="lightbox-toolbar">
          <span>
            {imageModal ? imageModal.index + 1 : 0} /{" "}
            {imageModal?.p.images.length} görsel
          </span>
          <Button
            variant="light"
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
            aria-label="Görseli küçült"
          >
            <IconZoomOut />
          </Button>
          <span>{Math.round(zoom * 100)}%</span>
          <Button
            variant="light"
            onClick={() => setZoom((z) => Math.min(3, z + 0.5))}
            aria-label="Görseli büyüt"
          >
            <IconZoomIn />
          </Button>
          <Button variant="subtle" onClick={() => setZoom(1)}>
            Sıfırla
          </Button>
          {imageModal && (
            <Link href={imageModal.p.images[imageModal.index]}>
              Kaynak görsel
            </Link>
          )}
        </div>
        <div
          className="zoom-viewport"
          tabIndex={0}
          aria-label="Büyütülmüş ürün görseli; kaydırarak inceleyin"
        >
          {imageModal && (
            <img
              style={{
                width: zoom * 100 + "%",
                height: zoom * 100 + "%",
                maxWidth: "none",
                objectFit: "contain",
              }}
              src={imageModal.p.images[imageModal.index]}
              alt={imageModal.p.name + " büyütülmüş görsel"}
            />
          )}
        </div>
        <div className="lightbox-bottom">
          <Button
            variant="light"
            disabled={!imageModal || imageModal.index === 0}
            onClick={() => {
              setZoom(1);
              setImageModal((m) => (m ? { ...m, index: m.index - 1 } : m));
            }}
            leftSection={<IconChevronLeft size={18} />}
          >
            Önceki
          </Button>
          <div className="lightbox-thumbs">
            {imageModal?.p.images.map((_, i) => (
              <button
                key={i}
                aria-label={`Büyütülmüş ${i + 1}. görsel`}
                aria-pressed={i === imageModal.index}
                onClick={() => {
                  setZoom(1);
                  setImageModal((m) => (m ? { ...m, index: i } : m));
                }}
              >
                <Photo p={imageModal.p} index={i} />
              </button>
            ))}
          </div>
          <Button
            variant="light"
            disabled={
              !imageModal || imageModal.index >= imageModal.p.images.length - 1
            }
            onClick={() => {
              setZoom(1);
              setImageModal((m) => (m ? { ...m, index: m.index + 1 } : m));
            }}
            rightSection={<IconChevronRight size={18} />}
          >
            Sonraki
          </Button>
        </div>
      </Modal>
    </>
  );
}
const allKeys = [
  ...new Set(products.flatMap((p) => Object.keys(p.specs))),
].filter(
  (k) =>
    ![
      "Öne çıkan artı",
      "Öne çıkan eksi",
      "Türkiye'de satış durumu",
      "Menşei/Üretim yeri",
      "Yurt dışı fiyatı (EUR/USD)",
    ].includes(k),
);
const root = createRoot(document.getElementById("root")!);
phoneStyles
  .then(() =>
    root.render(
      <MantineProvider theme={theme}>
        <App />
      </MantineProvider>,
    ),
  )
  .catch(() => {
    document.body.classList.add("profile-error-mode");
    root.render(
      <div className="profile-error" role="alert">
        <h1>Telefon görünümü yüklenemedi</h1>
        <p>
          Bağlantınızı kontrol edip tekrar deneyin. Ürün seçimleriniz bu cihazda
          korunur.
        </p>
        <button onClick={() => location.reload()}>Yeniden dene</button>
      </div>,
    );
  });
