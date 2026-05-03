import type { CompanyLookupResult, CompanyLookupService } from "./types";

const RDAP_BOOTSTRAP_ENDPOINT = "https://rdap.org/domain";

type RdapEntity = {
  handle?: unknown;
  roles?: unknown;
  vcardArray?: unknown;
  entities?: unknown;
};

type RdapResponse = {
  handle?: unknown;
  ldhName?: unknown;
  entities?: unknown;
};

function readVcardField(vcardArray: unknown, fieldName: string): string | null {
  if (!Array.isArray(vcardArray) || vcardArray.length < 2) return null;
  const properties = vcardArray[1];
  if (!Array.isArray(properties)) return null;
  for (const property of properties) {
    if (!Array.isArray(property) || property.length < 4) continue;
    if (property[0] !== fieldName) continue;
    const value = property[3];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (Array.isArray(value)) {
      const flat = value.filter((v) => typeof v === "string" && v).join(" ").trim();
      if (flat) return flat;
    }
  }
  return null;
}

function findRegistrantOrg(entities: unknown): { handle: string | null; org: string | null } {
  if (!Array.isArray(entities)) return { handle: null, org: null };
  for (const raw of entities) {
    const entity = raw as RdapEntity;
    const roles = Array.isArray(entity.roles) ? (entity.roles as unknown[]) : [];
    if (!roles.includes("registrant")) {
      // Recurse into nested entities — some registries nest the registrant.
      const nested = findRegistrantOrg(entity.entities);
      if (nested.org) return nested;
      continue;
    }
    const org =
      readVcardField(entity.vcardArray, "org") ?? readVcardField(entity.vcardArray, "fn");
    const handle = typeof entity.handle === "string" ? entity.handle : null;
    if (org) return { handle, org };
  }
  return { handle: null, org: null };
}

function isRedactedOrPlaceholder(value: string): boolean {
  const lowered = value.toLowerCase();
  return (
    lowered.includes("redacted") ||
    lowered.includes("privacy") ||
    lowered.includes("data protected") ||
    lowered.includes("whois") ||
    lowered.includes("not disclosed") ||
    lowered.includes("withheld")
  );
}

export class IcannRdapCompanyLookup implements CompanyLookupService {
  async lookupByDomain(domain: string): Promise<CompanyLookupResult | null> {
    try {
      const url = `${RDAP_BOOTSTRAP_ENDPOINT}/${encodeURIComponent(domain.toLowerCase())}`;
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/rdap+json" },
      });
      if (response.status === 404) return null;
      if (!response.ok) {
        console.warn(`[icann-rdap] lookup failed for ${domain}: ${response.status}`);
        return null;
      }
      const body = (await response.json()) as RdapResponse;
      const { handle, org } = findRegistrantOrg(body.entities);
      if (!org || isRedactedOrPlaceholder(org)) return null;

      const companyId = handle ?? (typeof body.handle === "string" ? body.handle : domain);
      return { companyId, companyName: org };
    } catch (err) {
      console.warn(`[icann-rdap] lookup error for ${domain}:`, err);
      return null;
    }
  }
}
