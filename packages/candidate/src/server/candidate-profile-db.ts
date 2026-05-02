import type {
  CandidateProfile,
  CandidateProject,
  PentagonScoreMap,
  PentagonTraitId,
  RecommendationSnippet,
} from "@recai/shared";
import { ensureCandidateAuthSchema } from "./candidate-auth";
import { query } from "./candidate-database";
import {
  getSubmittedRecommendationsForCandidates,
  type RecommendationRequest,
} from "./recommendation-db";
import { ensureRecruiterJobsSchema } from "@recai/recruiter/server/recruiter-jobs";

type CandidateProfileRow = {
  bio: string | null;
  current_role: string | null;
  full_name: string;
  headline: string | null;
  id: string;
  location: string | null;
  slug: string;
  target_roles: string[] | null;
  years_experience: number | null;
};

const traitKeywordMap: Record<PentagonTraitId, string[]> = {
  technicalDepth: [
    "api",
    "architecture",
    "aws",
    "backend",
    "code",
    "database",
    "engineering",
    "fastapi",
    "implementation",
    "infrastructure",
    "observability",
    "platform",
    "python",
    "reliability",
    "scalability",
    "systems",
    "technical",
  ],
  execution: [
    "completed",
    "delivered",
    "delivery",
    "execution",
    "impact",
    "launched",
    "outcome",
    "results",
    "ship",
    "shipped",
    "timeline",
  ],
  ownership: [
    "ambiguity",
    "autonomous",
    "drove",
    "end-to-end",
    "end to end",
    "initiative",
    "owned",
    "owner",
    "ownership",
    "responsibility",
    "took the lead",
  ],
  leadership: [
    "coach",
    "cross-functional",
    "influence",
    "lead",
    "leadership",
    "mentor",
    "mentored",
    "stakeholder",
    "strategy",
    "team",
  ],
  communication: [
    "alignment",
    "clear",
    "clarity",
    "collaboration",
    "communicat",
    "documentation",
    "explain",
    "partner",
    "presentation",
    "wrote",
    "written",
  ],
};

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function firstSentence(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  const match = trimmed.match(/.+?[.!?](\s|$)/);
  return match ? match[0].trim() : trimmed;
}

function inferTraitsFromText(input: string) {
  const normalized = input.toLowerCase();
  const traits = Object.entries(traitKeywordMap)
    .filter(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword)))
    .map(([traitId]) => traitId as PentagonTraitId);

  if (traits.length > 0) {
    return traits;
  }

  return normalized.trim()
    ? (["technicalDepth", "execution"] as PentagonTraitId[])
    : ([] as PentagonTraitId[]);
}

function buildRecommendationSummary(recommendation: RecommendationRequest) {
  const candidateSummary = [
    firstSentence(recommendation.technicalResponse),
    firstSentence(recommendation.behavioralResponse),
  ]
    .filter(Boolean)
    .join(" ");

  if (candidateSummary) {
    return candidateSummary;
  }

  return firstSentence(recommendation.candidateContext);
}

function buildRecommendationSnippets(
  recommendations: RecommendationRequest[],
): RecommendationSnippet[] {
  return recommendations.map((recommendation) => {
    const projectSkills = uniqueStrings(
      recommendation.projects.flatMap((project) => project.skills),
    );

    return {
      id: recommendation.id,
      recommenderName:
        normalizeText(recommendation.recommenderName) || "Verified recommender",
      recommenderTitle:
        normalizeText(recommendation.recommenderTitle) || "Recommender",
      company: normalizeText(recommendation.recommenderCompany) || "Company not shared",
      relationship:
        normalizeText(recommendation.relationship) || "Worked together",
      submittedAt:
        recommendation.submittedAt?.slice(0, 10) ??
        recommendation.createdAt.slice(0, 10),
      summary:
        buildRecommendationSummary(recommendation) ||
        "A verified recommender submitted feedback for this candidate.",
      skillsMentioned: projectSkills,
      projectTitles: recommendation.projects
        .map((project) => project.title.trim())
        .filter(Boolean),
    };
  });
}

function buildProjects(recommendations: RecommendationRequest[]): CandidateProject[] {
  const aggregatedProjects = new Map<
    string,
    {
      description: string;
      mentionCount: number;
      skills: string[];
      title: string;
      traits: PentagonTraitId[];
    }
  >();

  recommendations.forEach((recommendation) => {
    recommendation.projects.forEach((project, index) => {
      const title = project.title.trim() || `Project ${index + 1}`;
      const key = title.toLowerCase();
      const supportingText = [
        title,
        project.description,
        project.skills.join(" "),
        recommendation.technicalResponse,
        recommendation.behavioralResponse,
      ].join(" ");
      const traits = inferTraitsFromText(supportingText);
      const existing = aggregatedProjects.get(key);

      if (existing) {
        existing.description ||= project.description.trim();
        existing.mentionCount += 1;
        existing.skills = uniqueStrings([...existing.skills, ...project.skills]);
        existing.traits = uniqueStrings([...existing.traits, ...traits]) as PentagonTraitId[];
        return;
      }

      aggregatedProjects.set(key, {
        title,
        description: project.description.trim(),
        mentionCount: 1,
        skills: uniqueStrings(project.skills),
        traits,
      });
    });
  });

  return Array.from(aggregatedProjects.entries()).map(([key, project], index) => ({
    id: `${key.replace(/[^a-z0-9]+/g, "-") || `project-${index + 1}`}`,
    title: project.title,
    summary:
      project.description ||
      "This project was highlighted by a verified recommender.",
    impact:
      project.mentionCount === 1
        ? "Highlighted by 1 verified recommender"
        : `Highlighted by ${project.mentionCount} verified recommenders`,
    skills: project.skills,
    matchedTraits:
      project.traits.length > 0
        ? project.traits
        : (["execution"] as PentagonTraitId[]),
  }));
}

function buildPentagonScores(
  recommendations: RecommendationSnippet[],
  projects: CandidateProject[],
): PentagonScoreMap {
  const evidenceCounts = {
    technicalDepth: 0,
    execution: 0,
    ownership: 0,
    leadership: 0,
    communication: 0,
  } satisfies Record<PentagonTraitId, number>;

  recommendations.forEach((recommendation) => {
    inferTraitsFromText(
      `${recommendation.summary} ${recommendation.skillsMentioned.join(" ")}`,
    ).forEach((trait) => {
      evidenceCounts[trait] += 2;
    });
  });

  projects.forEach((project) => {
    project.matchedTraits.forEach((trait) => {
      evidenceCounts[trait] += 1;
    });
  });

  return {
    technicalDepth: Math.min(5, Math.max(1, Math.round(1 + evidenceCounts.technicalDepth / 2))),
    execution: Math.min(5, Math.max(1, Math.round(1 + evidenceCounts.execution / 2))),
    ownership: Math.min(5, Math.max(1, Math.round(1 + evidenceCounts.ownership / 2))),
    leadership: Math.min(5, Math.max(1, Math.round(1 + evidenceCounts.leadership / 2))),
    communication: Math.min(5, Math.max(1, Math.round(1 + evidenceCounts.communication / 2))),
  };
}

function buildHeadline(
  row: CandidateProfileRow,
  recommendations: RecommendationSnippet[],
) {
  const storedHeadline = normalizeText(row.headline);

  if (storedHeadline) {
    return storedHeadline;
  }

  const recommendationHeadline = recommendations[0]?.summary;

  if (recommendationHeadline) {
    return recommendationHeadline;
  }

  return `${row.full_name} is building a recommendation-backed profile on RecAI.`;
}

function buildBio(row: CandidateProfileRow, recommendations: RecommendationRequest[]) {
  const storedBio = normalizeText(row.bio);

  if (storedBio) {
    return storedBio;
  }

  const contextualBio = recommendations
    .map((recommendation) => normalizeText(recommendation.candidateContext))
    .find(Boolean);

  if (contextualBio) {
    return contextualBio;
  }

  return "This candidate is building a profile grounded in verified recommendation evidence.";
}

function mapCandidateProfile(
  row: CandidateProfileRow,
  recommendations: RecommendationRequest[],
): CandidateProfile {
  const recommendationSnippets = buildRecommendationSnippets(recommendations);
  const projects = buildProjects(recommendations);
  const pentagonScores = buildPentagonScores(recommendationSnippets, projects);
  const targetRoles = Array.isArray(row.target_roles)
    ? row.target_roles.filter(Boolean)
    : [];

  return {
    slug: row.slug,
    fullName: row.full_name,
    headline: buildHeadline(row, recommendationSnippets),
    currentRole: normalizeText(row.current_role) || "Candidate",
    location: normalizeText(row.location) || "Location not added yet",
    yearsExperience: Math.max(0, Number(row.years_experience ?? 0)),
    targetRoles,
    bio: buildBio(row, recommendations),
    verifiedRecommendationCount: recommendationSnippets.length,
    pentagonScores,
    projects,
    recommendations: recommendationSnippets,
  };
}

async function getCandidateProfileRowBySlug(slug: string) {
  await ensureCandidateAuthSchema();

  const result = await query<CandidateProfileRow>(
    `
      SELECT
        id,
        slug,
        full_name,
        headline,
        "current_role" AS current_role,
        location,
        years_experience,
        target_roles,
        bio
      FROM candidate_accounts
      WHERE slug = $1
      LIMIT 1
    `,
    [slug],
  );

  return result.rows[0] ?? null;
}

async function getCandidateProfileRowById(candidateId: string) {
  await ensureCandidateAuthSchema();

  const result = await query<CandidateProfileRow>(
    `
      SELECT
        id,
        slug,
        full_name,
        headline,
        "current_role" AS current_role,
        location,
        years_experience,
        target_roles,
        bio
      FROM candidate_accounts
      WHERE id = $1
      LIMIT 1
    `,
    [candidateId],
  );

  return result.rows[0] ?? null;
}

export async function getCandidateProfileBySlug(slug: string) {
  const row = await getCandidateProfileRowBySlug(slug);

  if (!row) {
    return null;
  }

  const recommendationsByCandidateId = await getSubmittedRecommendationsForCandidates([
    row.id,
  ]);
  const recommendations = recommendationsByCandidateId.get(row.id) ?? [];
  return mapCandidateProfile(row, recommendations);
}

export async function getCandidateProfileById(candidateId: string) {
  const row = await getCandidateProfileRowById(candidateId);

  if (!row) {
    return null;
  }

  const recommendationsByCandidateId = await getSubmittedRecommendationsForCandidates([
    row.id,
  ]);
  const recommendations = recommendationsByCandidateId.get(row.id) ?? [];
  return mapCandidateProfile(row, recommendations);
}

export async function getCandidateProfilesForPosting(jobId: string) {
  await ensureCandidateAuthSchema();
  await ensureRecruiterJobsSchema();

  const result = await query<CandidateProfileRow>(
    `
      SELECT
        candidate_accounts.id,
        candidate_accounts.slug,
        candidate_accounts.full_name,
        candidate_accounts.headline,
        candidate_accounts."current_role" AS current_role,
        candidate_accounts.location,
        candidate_accounts.years_experience,
        candidate_accounts.target_roles,
        candidate_accounts.bio
      FROM posting_candidates
      INNER JOIN candidate_accounts
        ON candidate_accounts.id = posting_candidates.candidate_id
      WHERE posting_candidates.job_id = $1
      ORDER BY posting_candidates.joined_at DESC
    `,
    [jobId],
  );

  const candidateRows = result.rows;
  const recommendationsByCandidateId = await getSubmittedRecommendationsForCandidates(
    candidateRows.map((row) => row.id),
  );

  return candidateRows.map((row) =>
    mapCandidateProfile(row, recommendationsByCandidateId.get(row.id) ?? []),
  );
}
