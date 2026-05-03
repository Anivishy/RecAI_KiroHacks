import type { CompanyLookupResult, CompanyLookupService } from "./types";

type StubMap = Record<string, { companyId: string; companyName: string }>;

function loadStubMap(): StubMap {
  const raw = process.env.RECOMMENDER_STUB_COMPANY_MAP;
  if (!raw) {
    return {
      "acme.com": { companyId: "stub-acme", companyName: "Acme Inc." },
      "stripe.com": { companyId: "stub-stripe", companyName: "Stripe" },
      "vercel.com": { companyId: "stub-vercel", companyName: "Vercel" },
      "anthropic.com": { companyId: "stub-anthropic", companyName: "Anthropic" },
      "cloudera.com": { companyId: "stub-cloudera", companyName: "Cloudera" },
      "clouderaits.com": { companyId: "stub-clouderaits", companyName: "Cloudera ITS" },
    };
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as StubMap;
  } catch (err) {
    console.warn("[company-lookup] failed to parse RECOMMENDER_STUB_COMPANY_MAP:", err);
  }
  return {};
}

export class StubCompanyLookup implements CompanyLookupService {
  private readonly map: StubMap;
  constructor(map?: StubMap) {
    this.map = map ?? loadStubMap();
  }
  async lookupByDomain(domain: string): Promise<CompanyLookupResult | null> {
    const hit = this.map[domain.toLowerCase()];
    return hit ? { companyId: hit.companyId, companyName: hit.companyName } : null;
  }
}
