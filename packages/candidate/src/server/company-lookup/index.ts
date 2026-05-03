import { StubCompanyLookup } from "./stub";
import { IcannRdapCompanyLookup } from "./icann-rdap";
import type { CompanyLookupService } from "./types";

export type { CompanyLookupResult, CompanyLookupService } from "./types";
export { StubCompanyLookup } from "./stub";
export { IcannRdapCompanyLookup } from "./icann-rdap";

let cached: CompanyLookupService | null = null;

class StubFirstThenRdap implements CompanyLookupService {
  constructor(
    private readonly stub: CompanyLookupService,
    private readonly rdap: CompanyLookupService,
  ) {}

  async lookupByDomain(domain: string) {
    const stubHit = await this.stub.lookupByDomain(domain);
    if (stubHit) return stubHit;
    return this.rdap.lookupByDomain(domain);
  }
}

export function getCompanyLookupService(): CompanyLookupService {
  if (cached) return cached;
  if (process.env.RECOMMENDER_USE_STUB_COMPANY_LOOKUP === "1") {
    cached = new StubCompanyLookup();
    return cached;
  }
  cached = new StubFirstThenRdap(new StubCompanyLookup(), new IcannRdapCompanyLookup());
  return cached;
}
