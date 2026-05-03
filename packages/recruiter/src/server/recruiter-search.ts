import { Pinecone } from "@pinecone-database/pinecone";
import {
  getCandidateProfilesForPosting,
  getCandidateProfileBySlug,
} from "@recai/candidate/server/candidate-profile-db";
import type { CandidateProfile } from "@recai/shared";
import { generateBedrockJson } from "@recai/shared/server/bedrock-client";
import { getPostingIdsForCandidate } from "./recruiter-jobs";

const INDEX_NAME = "candidate-profile-index";

let pineconeClient: Pinecone | null = null;

function getPinecone() {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return pineconeClient;
}

async function ensureIndex() {
  const pc = getPinecone();

  await pc.createIndexForModel({
    name: INDEX_NAME,
    cloud: "aws",
    region: "us-east-1",
    embed: {
      model: "multilingual-e5-large",
      fieldMap: { text: "text" },
    },
    suppressConflicts: true,
    waitUntilReady: true,
  });

  const host = process.env.PINECONE_HOSTNAME;
  return host ? pc.index(INDEX_NAME, host) : pc.index(INDEX_NAME);
}

type CandidateRecord = {
  id: string;
  text: string;
  candidateSlug: string;
  candidateName: string;
  chunkType: string;
  [key: string]: string;
};

function buildRecords(jobId: string, profile: CandidateProfile): CandidateRecord[] {
  const records: CandidateRecord[] = [];
  const base = `${jobId}__${profile.slug}`;
  const baseMeta = {
    candidateSlug: profile.slug,
    candidateName: profile.fullName,
  };

  const scores = (Object.entries(profile.pentagonScores) as [string, number][])
    .map(([trait, score]) => `${trait}: ${score}/5`)
    .join(", ");

  records.push({
    id: `${base}__overview`,
    text: `${profile.fullName} (${profile.currentRole}, ${profile.yearsExperience} yrs experience): ${profile.headline}. ${profile.bio} Trait scores — ${scores}. Target roles: ${profile.targetRoles.join(", ")}.`,
    ...baseMeta,
    chunkType: "overview",
  });

  for (const [i, project] of profile.projects.entries()) {
    records.push({
      id: `${base}__project__${i}`,
      text: `${profile.fullName} – Project: ${project.title}. ${project.summary} Impact: ${project.impact}. Skills: ${project.skills.join(", ")}. Demonstrates: ${project.matchedTraits.join(", ")}.`,
      ...baseMeta,
      chunkType: "project",
      projectTitle: project.title,
    });
  }

  for (const [i, rec] of profile.recommendations.entries()) {
    records.push({
      id: `${base}__rec__${i}`,
      text: `${profile.fullName} – Recommendation from ${rec.recommenderName} (${rec.recommenderTitle} at ${rec.company}, ${rec.relationship}): "${rec.summary}" Skills highlighted: ${rec.skillsMentioned.join(", ")}.`,
      ...baseMeta,
      chunkType: "recommendation",
      recommenderName: rec.recommenderName,
    });
  }

  return records;
}

async function getCandidatesForPosting(jobId: string): Promise<CandidateProfile[]> {
  return getCandidateProfilesForPosting(jobId);
}

export async function indexCandidatesForPosting(jobId: string): Promise<void> {
  const index = await ensureIndex();
  const profiles = await getCandidatesForPosting(jobId);
  const ns = index.namespace(jobId);

  const allRecords = profiles.flatMap((p) => buildRecords(jobId, p));

  for (let i = 0; i < allRecords.length; i += 96) {
    await ns.upsertRecords({ records: allRecords.slice(i, i + 96) });
  }
}

export type CandidateSearchContext = {
  candidateSlug: string;
  candidateName: string;
  score: number;
  snippet: string;
};

type RawChunkHit = {
  slug: string;
  name: string;
  vectorScore: number;
  text: string;
};

type BedrockRanking = {
  rankings: Array<{ slug: string; score: number; snippet: string }>;
};

function truncate(text: string, max = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  const cut = cleaned.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 100 ? lastSpace : max)}…`;
}

async function bedrockRerank(
  query: string,
  candidates: Map<string, { name: string; topChunks: string[] }>,
): Promise<Map<string, { score: number; snippet: string }>> {
  const candidateBlock = Array.from(candidates.entries())
    .map(([slug, c]) => {
      const evidence = c.topChunks.map((t) => `  - ${truncate(t)}`).join("\n");
      return `Candidate slug: ${slug}\nName: ${c.name}\nEvidence:\n${evidence}`;
    })
    .join("\n\n");

  const prompt = [
    `Search query: "${query}"`,
    "",
    "For each candidate below, score 0-100 how specifically their verified evidence matches this query.",
    "Be strict: only score above 70 when the evidence directly addresses the query.",
    "Write one short sentence (under 20 words) citing the specific evidence that best matches the query.",
    "Do not mention the candidate's name in the snippet.",
    "",
    candidateBlock,
    "",
    'Return ONLY valid JSON: { "rankings": [{ "slug": "...", "score": 0, "snippet": "..." }] }',
  ].join("\n");

  try {
    const { data } = await generateBedrockJson<BedrockRanking>({
      systemPrompt: "You are a precise recruiter search assistant. Rank candidates strictly by how well their verified recommendation evidence matches the search query.",
      userPrompt: prompt,
      maxTokens: 800,
      temperature: 0,
    });

    const resultMap = new Map<string, { score: number; snippet: string }>();
    for (const r of data.rankings ?? []) {
      if (typeof r.slug === "string" && typeof r.score === "number") {
        resultMap.set(r.slug, {
          score: Math.max(0, Math.min(100, Math.round(r.score))),
          snippet: typeof r.snippet === "string" ? r.snippet.trim() : "",
        });
      }
    }
    return resultMap;
  } catch {
    return new Map();
  }
}

export async function searchCandidatePool(
  jobId: string,
  queryText: string,
  topK = 30,
): Promise<CandidateSearchContext[]> {
  const index = await ensureIndex();
  const ns = index.namespace(jobId);

  const stats = await index.describeIndexStats();
  const vectorCount =
    (stats as { namespaces?: Record<string, { vectorCount?: number }> })
      ?.namespaces?.[jobId]?.vectorCount ?? 0;

  if (vectorCount === 0) {
    await indexCandidatesForPosting(jobId);
  }

  const results = await ns.searchRecords({
    query: { topK, inputs: { text: queryText } },
    fields: ["candidateSlug", "candidateName", "chunkType", "text"],
  });

  // Group hits by candidate, keeping the top-scoring chunks per candidate
  const hitsByCandidate = new Map<string, { name: string; hits: RawChunkHit[] }>();

  for (const match of results.result?.hits ?? []) {
    const fields = match.fields as Record<string, string> | undefined;
    const slug = fields?.candidateSlug ?? "";
    const name = fields?.candidateName ?? "";
    const text = fields?.text ?? "";
    const vectorScore = match._score ?? 0;
    if (!slug || !text) continue;

    if (!hitsByCandidate.has(slug)) {
      hitsByCandidate.set(slug, { name, hits: [] });
    }
    hitsByCandidate.get(slug)!.hits.push({ slug, name, vectorScore, text });
  }

  if (hitsByCandidate.size === 0) return [];

  // Build candidate map with top 3 chunks by vector score for Bedrock
  const candidatesForRanking = new Map<string, { name: string; topChunks: string[] }>();
  for (const [slug, { name, hits }] of hitsByCandidate) {
    const topChunks = hits
      .sort((a, b) => b.vectorScore - a.vectorScore)
      .slice(0, 3)
      .map((h) => h.text);
    candidatesForRanking.set(slug, { name, topChunks });
  }

  const rerankResults = await bedrockRerank(queryText, candidatesForRanking);

  // Merge: use Bedrock score when available, fall back to best vector score
  return Array.from(hitsByCandidate.entries())
    .map(([slug, { name, hits }]) => {
      const reranked = rerankResults.get(slug);
      const bestVectorScore = Math.max(...hits.map((h) => h.vectorScore));
      return {
        candidateSlug: slug,
        candidateName: name,
        score: reranked?.score ?? Math.round(bestVectorScore * 100),
        snippet: reranked?.snippet ?? truncate(hits.sort((a, b) => b.vectorScore - a.vectorScore)[0]?.text ?? ""),
      };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

export async function reindexCandidateAcrossPostings(
  candidateId: string,
  candidateSlug: string,
): Promise<void> {
  const [postingIds, freshProfile] = await Promise.all([
    getPostingIdsForCandidate(candidateId),
    getCandidateProfileBySlug(candidateSlug),
  ]);

  if (postingIds.length === 0 || !freshProfile) return;

  const index = await ensureIndex();

  for (const jobId of postingIds) {
    const ns = index.namespace(jobId);

    // Build the superset of IDs this candidate could have in this namespace
    // and delete them before re-upserting fresh data.
    const base = `${jobId}__${candidateSlug}`;
    const staleIds = [
      `${base}__overview`,
      ...Array.from({ length: 30 }, (_, i) => `${base}__project__${i}`),
      ...Array.from({ length: 30 }, (_, i) => `${base}__rec__${i}`),
    ];

    try {
      await ns.deleteMany(staleIds);
    } catch {
      // deleteMany may fail if namespace is empty; swallow and continue
    }

    const freshRecords = buildRecords(jobId, freshProfile);
    if (freshRecords.length > 0) {
      for (let i = 0; i < freshRecords.length; i += 96) {
        await ns.upsertRecords({ records: freshRecords.slice(i, i + 96) });
      }
    }
  }
}
