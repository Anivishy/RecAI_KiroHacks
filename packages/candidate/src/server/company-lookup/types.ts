export type CompanyLookupResult = {
  companyId: string;
  companyName: string;
};

export interface CompanyLookupService {
  lookupByDomain(domain: string): Promise<CompanyLookupResult | null>;
}
