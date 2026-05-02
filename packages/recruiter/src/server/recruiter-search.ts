import { Pinecone } from "@pinecone-database/pinecone";
import { getCandidateProfilesForPosting } from "@recai/candidate/server/candidate-profile-db";
import type { CandidateProfile } from "@recai/shared";

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

  const host = process.env.PINECONE_INDEX_HOST;
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
  chunks: string[];
};

export async function searchCandidatePool(
  jobId: string,
  queryText: string,
  topK = 20,
): Promise<CandidateSearchContext[]> {
  const index = await ensureIndex();
  const ns = index.namespace(jobId);

  // Lazy-index on first search
  const stats = await index.describeIndexStats();
  const vectorCount =
    (stats as { namespaces?: Record<string, { vectorCount?: number }> })
      ?.namespaces?.[jobId]?.vectorCount ?? 0;

  if (vectorCount === 0) {
    await indexCandidatesForPosting(jobId);
  }

  const results = await ns.searchRecords({
    query: {
      topK,
      inputs: { text: queryText },
    },
    fields: ["candidateSlug", "candidateName", "chunkType", "text"],
  });

  const byCandidate = new Map<string, CandidateSearchContext>();

  for (const match of results.result?.hits ?? []) {
    const fields = match.fields as Record<string, string> | undefined;
    const slug = fields?.candidateSlug ?? "";
    const name = fields?.candidateName ?? "";
    const text = fields?.text ?? "";
    const score = match._score ?? 0;

    if (!byCandidate.has(slug)) {
      byCandidate.set(slug, { candidateSlug: slug, candidateName: name, score, chunks: [] });
    }

    const entry = byCandidate.get(slug)!;
    entry.score = Math.max(entry.score, score);
    if (text) entry.chunks.push(text);
  }

  return Array.from(byCandidate.values()).sort((a, b) => b.score - a.score);
}
