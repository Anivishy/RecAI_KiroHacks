import type { CompanyLookupResult, CompanyLookupService } from "./types";

type StubMap = Record<string, { companyId: string; companyName: string }>;

function loadStubMap(): StubMap {
  const raw = process.env.RECOMMENDER_STUB_COMPANY_MAP;
  if (!raw) {
    return {
      "acme.com": { companyId: "stub-acme", companyName: "Acme Inc." },
      "adobe.com": { companyId: "stub-adobe", companyName: "Adobe" },
      "airbnb.com": { companyId: "stub-airbnb", companyName: "Airbnb" },
      "amazon.com": { companyId: "stub-amazon", companyName: "Amazon" },
      "anthropic.com": { companyId: "stub-anthropic", companyName: "Anthropic" },
      "apple.com": { companyId: "stub-apple", companyName: "Apple" },
      "atlassian.com": { companyId: "stub-atlassian", companyName: "Atlassian" },
      "bloomberg.com": { companyId: "stub-bloomberg", companyName: "Bloomberg" },
      "cloudera.com": { companyId: "stub-cloudera", companyName: "Cloudera" },
      "clouderaits.com": { companyId: "stub-clouderaits", companyName: "Cloudera ITS" },
      "coinbase.com": { companyId: "stub-coinbase", companyName: "Coinbase" },
      "databricks.com": { companyId: "stub-databricks", companyName: "Databricks" },
      "datadog.com": { companyId: "stub-datadog", companyName: "Datadog" },
      "deloitte.com": { companyId: "stub-deloitte", companyName: "Deloitte" },
      "docker.com": { companyId: "stub-docker", companyName: "Docker" },
      "dropbox.com": { companyId: "stub-dropbox", companyName: "Dropbox" },
      "figma.com": { companyId: "stub-figma", companyName: "Figma" },
      "github.com": { companyId: "stub-github", companyName: "GitHub" },
      "gitlab.com": { companyId: "stub-gitlab", companyName: "GitLab" },
      "goldmansachs.com": { companyId: "stub-gs", companyName: "Goldman Sachs" },
      "google.com": { companyId: "stub-google", companyName: "Google" },
      "ibm.com": { companyId: "stub-ibm", companyName: "IBM" },
      "intel.com": { companyId: "stub-intel", companyName: "Intel" },
      "jpmorgan.com": { companyId: "stub-jpmorgan", companyName: "JPMorgan Chase" },
      "linkedin.com": { companyId: "stub-linkedin", companyName: "LinkedIn" },
      "lyft.com": { companyId: "stub-lyft", companyName: "Lyft" },
      "mckinsey.com": { companyId: "stub-mckinsey", companyName: "McKinsey" },
      "meta.com": { companyId: "stub-meta", companyName: "Meta" },
      "microsoft.com": { companyId: "stub-microsoft", companyName: "Microsoft" },
      "mongodb.com": { companyId: "stub-mongodb", companyName: "MongoDB" },
      "netflix.com": { companyId: "stub-netflix", companyName: "Netflix" },
      "notion.so": { companyId: "stub-notion", companyName: "Notion" },
      "nvidia.com": { companyId: "stub-nvidia", companyName: "NVIDIA" },
      "openai.com": { companyId: "stub-openai", companyName: "OpenAI" },
      "oracle.com": { companyId: "stub-oracle", companyName: "Oracle" },
      "palantir.com": { companyId: "stub-palantir", companyName: "Palantir" },
      "pinterest.com": { companyId: "stub-pinterest", companyName: "Pinterest" },
      "plaid.com": { companyId: "stub-plaid", companyName: "Plaid" },
      "reddit.com": { companyId: "stub-reddit", companyName: "Reddit" },
      "robinhood.com": { companyId: "stub-robinhood", companyName: "Robinhood" },
      "salesforce.com": { companyId: "stub-salesforce", companyName: "Salesforce" },
      "samsung.com": { companyId: "stub-samsung", companyName: "Samsung" },
      "shopify.com": { companyId: "stub-shopify", companyName: "Shopify" },
      "snap.com": { companyId: "stub-snap", companyName: "Snap" },
      "snowflake.com": { companyId: "stub-snowflake", companyName: "Snowflake" },
      "spotify.com": { companyId: "stub-spotify", companyName: "Spotify" },
      "square.com": { companyId: "stub-square", companyName: "Square" },
      "stripe.com": { companyId: "stub-stripe", companyName: "Stripe" },
      "tesla.com": { companyId: "stub-tesla", companyName: "Tesla" },
      "tiktok.com": { companyId: "stub-tiktok", companyName: "TikTok" },
      "twilio.com": { companyId: "stub-twilio", companyName: "Twilio" },
      "twitter.com": { companyId: "stub-twitter", companyName: "X (Twitter)" },
      "uber.com": { companyId: "stub-uber", companyName: "Uber" },
      "vercel.com": { companyId: "stub-vercel", companyName: "Vercel" },
      "vmware.com": { companyId: "stub-vmware", companyName: "VMware" },
      "zillow.com": { companyId: "stub-zillow", companyName: "Zillow" },
      "zoom.us": { companyId: "stub-zoom", companyName: "Zoom" },
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
