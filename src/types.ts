export interface Offer {
  seller: string;
  price: number;
  url: string;
  note?: string;
  available?: boolean;
  exact?: boolean;
  conditional?: boolean;
  superseded?: boolean;
  observedAt: string;
  evidence: string;
}
export interface Product {
  id: string;
  brand: string;
  name: string;
  category: string;
  specs: Record<string, string>;
  verified: Record<string, string>;
  researchStatus?: string;
  measurements?: Record<
    string,
    {
      modelId: string;
      value: number;
      unit: string;
      protocol: string;
      sampleSize: number;
      source: string;
      evidenceKind: "independent-measurement" | "manufacturer-measurement";
      location?: string;
    }
  >;
  evidenceKind?: Record<string, string>;
  offers: Offer[];
  foreignOffers?: {
    seller: string;
    currency: string;
    amount: number;
    url: string;
    note: string;
    observedAt: string;
    evidence: string;
    exact?: boolean;
  }[];
  imageSources?: { url: string; sourcePage: string; angle?: string }[];
  researchNotes?: string[];
  purchaseLinks?: {
    seller: string;
    url: string;
    note: string;
    checked: string;
    exact?: boolean;
    region?: string;
  }[];
  images: string[];
  notes: string[];
  sources: { label: string; url: string; checked: string }[];
  researchChecks?: {
    criterion: string;
    result: "not-published";
    sources: string[];
    note: string;
    checked?: string;
  }[];
  integrated?: boolean;
  boilerArchitecture?: "single" | "dual" | "hx" | "thermoblock" | "unknown";
  boilerArchitectureSource?: string;
  imported?: boolean;
  featured?: boolean;
  legacyPrice?: string;
}
