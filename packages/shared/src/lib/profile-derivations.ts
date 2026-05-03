import type {
  CandidateProfile,
  CandidateProject,
  PentagonScoreMap,
  PentagonTraitId,
  RecommendationSnippet,
} from "./domain/types";
import { pentagonTraitMeta } from "./domain/types";

const KNOWN_DOMAINS: Record<string, string> = {
  "north harbor": "northharbor.io",
  "atlas loop": "atlasloop.com",
  stripe: "stripe.com",
  figma: "figma.com",
  vercel: "vercel.com",
  google: "google.com",
  meta: "meta.com",
};

const BRAND_PALETTE = [
  "#1F6FEB",
  "#0E6B4F",
  "#B5651D",
  "#6B3FA0",
  "#A33B5A",
  "#2B6E7E",
  "#7A5AF8",
  "#B33A3A",
  "#3F6B45",
  "#1F4F7A",
  "#A35E2A",
  "#475569",
];

function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function companyToDomain(company: string): string {
  const key = company.trim().toLowerCase();
  if (KNOWN_DOMAINS[key]) return KNOWN_DOMAINS[key];
  const slug = key.replace(/[^a-z0-9]+/g, "");
  return slug.length > 0 ? `${slug}.com` : "verified.com";
}

export function recommenderBrandColor(company: string): string {
  const idx = hashString(company.trim().toLowerCase()) % BRAND_PALETTE.length;
  return BRAND_PALETTE[idx];
}

export function deterministicSimilarity(seed: string): number {
  return Number((0.92 + (hashString(seed) % 700) / 10000).toFixed(2));
}

function trimToBlurb(text: string, max = 50): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const truncated = cleaned.slice(0, max);
  const lastSpace = truncated.lastIndexOf(" ");
  return `${truncated.slice(0, lastSpace > 20 ? lastSpace : max)}…`;
}

export type ExperienceRow = {
  id: string;
  company: string;
  domain: string;
  role: string;
  brandColor: string;
  shortBlurb: string;
  recommendationIds: string[];
  latestSubmittedAt: string;
};

export function buildExperienceRows(
  candidate: Pick<CandidateProfile, "currentRole">,
  recommendations: RecommendationSnippet[],
): ExperienceRow[] {
  const rows = new Map<string, ExperienceRow>();
  for (const rec of recommendations) {
    const role = candidate.currentRole;
    const id = `${rec.company}::${role}`;
    const existing = rows.get(id);
    if (existing) {
      existing.recommendationIds.push(rec.id);
      if (rec.submittedAt > existing.latestSubmittedAt) {
        existing.latestSubmittedAt = rec.submittedAt;
        existing.shortBlurb = trimToBlurb(rec.summary);
      }
      continue;
    }
    rows.set(id, {
      id,
      company: rec.company,
      domain: companyToDomain(rec.company),
      role,
      brandColor: recommenderBrandColor(rec.company),
      shortBlurb: trimToBlurb(rec.summary),
      recommendationIds: [rec.id],
      latestSubmittedAt: rec.submittedAt,
    });
  }
  return [...rows.values()].sort((a, b) =>
    a.latestSubmittedAt < b.latestSubmittedAt ? 1 : -1,
  );
}

export type RelationMixEntry = { label: string; count: number };

export function buildRelationMix(
  recommendations: RecommendationSnippet[],
): RelationMixEntry[] {
  const counts = new Map<string, number>();
  for (const rec of recommendations) {
    counts.set(rec.relationship, (counts.get(rec.relationship) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export type DomainEntry = { label: string; count: number };

export type TrustStats = {
  totalRecs: number;
  verifiedDomains: number;
  managerRecs: number;
  peerRecs: number;
  domains: DomainEntry[];
};

function isManagerRelationship(relationship: string): boolean {
  return /manager|lead|director|vp|chief/i.test(relationship);
}

function isPeerRelationship(relationship: string): boolean {
  return /peer|coworker|teammate|partner|colleague/i.test(relationship);
}

export function buildTrustStats(
  recommendations: RecommendationSnippet[],
): TrustStats {
  const domainCounts = new Map<string, number>();
  let managerRecs = 0;
  let peerRecs = 0;
  for (const rec of recommendations) {
    const domain = companyToDomain(rec.company);
    domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
    if (isManagerRelationship(rec.relationship)) managerRecs += 1;
    else if (isPeerRelationship(rec.relationship)) peerRecs += 1;
  }
  const domains: DomainEntry[] = [...domainCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
  return {
    totalRecs: recommendations.length,
    verifiedDomains: domainCounts.size,
    managerRecs,
    peerRecs,
    domains,
  };
}

export type PentagonProject = {
  projectId: string;
  name: string;
  description: string;
  similarity: number;
};

export type PentagonTrait = {
  id: string;
  name: string;
  shortLabel: string;
  score: number;
  confidence?: number;
  rationale?: string;
  projects: PentagonProject[];
};

function projectToPentagonProject(project: CandidateProject): PentagonProject {
  return {
    projectId: project.id,
    name: project.title,
    description: project.summary,
    similarity: deterministicSimilarity(project.id),
  };
}

export function buildPentagonForRecruiter(
  scores: PentagonScoreMap,
  projects: CandidateProject[],
): PentagonTrait[] {
  return pentagonTraitMeta.map((meta) => {
    const matched = projects
      .filter((project) => project.matchedTraits.includes(meta.id))
      .sort((a, b) => b.skills.length - a.skills.length)
      .map(projectToPentagonProject);
    return {
      id: meta.id,
      name: meta.label,
      shortLabel: meta.shortLabel,
      score: Math.round((scores[meta.id] / 5) * 100),
      projects: matched,
    };
  });
}
