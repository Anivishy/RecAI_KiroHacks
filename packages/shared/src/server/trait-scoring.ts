import type { CandidateProfile } from "../lib/domain/types";
import {
  behavioralTraitMeta,
  technicalTraitMeta,
  type BehavioralTraitId,
  type TechnicalTraitId,
} from "../lib/scoring/rubric";
import { generateBedrockJson } from "./bedrock-client";

export type TraitEvidenceSegmentKind =
  | "recommendation_summary"
  | "technical_response"
  | "behavioral_response"
  | "project"
  | "retrieved_chunk";

export type TraitEvidenceSegment = {
  segmentId: string;
  kind: TraitEvidenceSegmentKind;
  sourceId: string;
  sourceLabel: string;
  text: string;
  recommenderName?: string;
  company?: string;
  relationship?: string;
  projectTitle?: string;
  skills?: string[];
};

export type TraitScoreDetail = {
  score: number;
  confidence: number;
  rationale: string;
  evidenceSegmentIds: string[];
};

export type CandidateTraitScorecard = {
  model: string;
  generatedAt: Date;
  technical: Record<TechnicalTraitId, TraitScoreDetail>;
  behavioral: Record<BehavioralTraitId, TraitScoreDetail>;
  overallNotes: string[];
};

type RawTraitScore = Partial<TraitScoreDetail>;

type RawCandidateTraitScorecard = {
  technical?: Record<string, RawTraitScore>;
  behavioral?: Record<string, RawTraitScore>;
  overallNotes?: string[];
};

type ScoreCandidateTraitsInput = {
  candidate: Pick<CandidateProfile, "fullName" | "currentRole">;
  segments: TraitEvidenceSegment[];
};

function clampScore(value: unknown) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeEvidenceIds(
  evidenceSegmentIds: unknown,
  knownIds: Set<string>,
): string[] {
  if (!Array.isArray(evidenceSegmentIds)) {
    return [];
  }

  return evidenceSegmentIds
    .map((value) => String(value))
    .filter((value) => knownIds.has(value));
}

function normalizeRationale(value: unknown) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : "No rationale returned.";
}

function emptyDetail(): TraitScoreDetail {
  return {
    score: 0,
    confidence: 0,
    rationale: "No verified evidence was selected for this trait.",
    evidenceSegmentIds: [],
  };
}

function normalizeGroupScores<TTraitId extends string>(
  rawGroup: Record<string, RawTraitScore> | undefined,
  traitIds: readonly TTraitId[],
  knownIds: Set<string>,
): Record<TTraitId, TraitScoreDetail> {
  return Object.fromEntries(
    traitIds.map((traitId) => {
      const raw = rawGroup?.[traitId];
      const detail: TraitScoreDetail = raw
        ? {
            score: clampScore(raw.score),
            confidence: clampScore(raw.confidence),
            rationale: normalizeRationale(raw.rationale),
            evidenceSegmentIds: normalizeEvidenceIds(raw.evidenceSegmentIds, knownIds),
          }
        : emptyDetail();

      return [traitId, detail];
    }),
  ) as Record<TTraitId, TraitScoreDetail>;
}

function buildRubricBlock() {
  const technicalBlock = technicalTraitMeta
    .map(
      (trait) =>
        [
          `- ${trait.id}: ${trait.label}`,
          `  Definition: ${trait.definition}`,
          `  Recruiter question: ${trait.recruiterQuestion}`,
          `  Strong signals: ${trait.positiveSignals.join("; ")}`,
          `  Caution signals: ${trait.cautionSignals.join("; ")}`,
        ].join("\n"),
    )
    .join("\n");

  const behavioralBlock = behavioralTraitMeta
    .map(
      (trait) =>
        [
          `- ${trait.id}: ${trait.label}`,
          `  Definition: ${trait.definition}`,
          `  Recruiter question: ${trait.recruiterQuestion}`,
          `  Strong signals: ${trait.positiveSignals.join("; ")}`,
          `  Caution signals: ${trait.cautionSignals.join("; ")}`,
        ].join("\n"),
    )
    .join("\n");

  return [
    "Technical traits:",
    technicalBlock,
    "",
    "Behavioral traits:",
    behavioralBlock,
  ].join("\n");
}

function buildEvidenceBlock(segments: TraitEvidenceSegment[]) {
  if (segments.length === 0) {
    return "No evidence segments were provided.";
  }

  return segments
    .map((segment) => {
      const meta = [
        `id=${segment.segmentId}`,
        `kind=${segment.kind}`,
        `source=${segment.sourceLabel}`,
        segment.recommenderName ? `recommender=${segment.recommenderName}` : null,
        segment.company ? `company=${segment.company}` : null,
        segment.relationship ? `relationship=${segment.relationship}` : null,
        segment.projectTitle ? `project=${segment.projectTitle}` : null,
        segment.skills && segment.skills.length > 0
          ? `skills=${segment.skills.join(", ")}`
          : null,
      ]
        .filter(Boolean)
        .join(" | ");

      return `[${meta}]\n${segment.text}`;
    })
    .join("\n\n");
}

function buildSchemaHint() {
  return JSON.stringify(
    {
      technical: Object.fromEntries(
        technicalTraitMeta.map((trait) => [
          trait.id,
          {
            score: 0,
            confidence: 0,
            rationale: "string",
            evidenceSegmentIds: ["segment-id"],
          },
        ]),
      ),
      behavioral: Object.fromEntries(
        behavioralTraitMeta.map((trait) => [
          trait.id,
          {
            score: 0,
            confidence: 0,
            rationale: "string",
            evidenceSegmentIds: ["segment-id"],
          },
        ]),
      ),
      overallNotes: ["short note"],
    },
    null,
    2,
  );
}

function buildScoringPrompt({
  candidate,
  segments,
}: ScoreCandidateTraitsInput) {
  return [
    `Candidate: ${candidate.fullName}`,
    `Current role context: ${candidate.currentRole}`,
    "",
    "You are receiving the highest-value evidence segments retrieved for this candidate from the recommendation evidence corpus.",
    "Score demonstrated strength for each trait on a 0-100 scale.",
    "Confidence must also be 0-100 and should reflect evidence quality, specificity, and diversity of support.",
    "Use ONLY the provided evidence. Do not infer unstated strengths.",
    "Reward specificity, repeated corroboration, and clear outcome language.",
    "Be conservative when evidence is thin, generic, or duplicated.",
    "Select the exact evidence segment IDs that best justify each score.",
    "IMPORTANT: For each trait, select the evidence segments most SPECIFIC to that trait. Avoid reusing the same segment across many traits — prefer the segment that most directly demonstrates the trait in question. Each trait's rationale must be unique and describe what the evidence says about THAT specific trait, not a generic summary.",
    "",
    buildRubricBlock(),
    "",
    "Evidence segments:",
    buildEvidenceBlock(segments),
    "",
    "Return ONLY valid JSON matching this schema:",
    buildSchemaHint(),
  ].join("\n");
}

export function buildTraitEvidenceSegments(
  candidate: Pick<CandidateProfile, "projects" | "recommendations">,
): TraitEvidenceSegment[] {
  const recommendationSegments = candidate.recommendations.flatMap((recommendation) => {
    const segments: TraitEvidenceSegment[] = [
      {
        segmentId: `rec:${recommendation.id}:summary`,
        kind: "recommendation_summary",
        sourceId: recommendation.id,
        sourceLabel: `Recommendation from ${recommendation.recommenderName}`,
        text: recommendation.summary,
        recommenderName: recommendation.recommenderName,
        company: recommendation.company,
        relationship: recommendation.relationship,
        skills: recommendation.skillsMentioned,
      },
    ];

    if (recommendation.skillsMentioned.length > 0) {
      segments.push({
        segmentId: `rec:${recommendation.id}:skills`,
        kind: "technical_response",
        sourceId: recommendation.id,
        sourceLabel: `Skills from ${recommendation.recommenderName}`,
        text: `Skills highlighted: ${recommendation.skillsMentioned.join(", ")}`,
        recommenderName: recommendation.recommenderName,
        company: recommendation.company,
        relationship: recommendation.relationship,
        skills: recommendation.skillsMentioned,
      });
    }

    return segments;
  });

  const projectSegments = candidate.projects.map((project) => ({
    segmentId: `project:${project.id}`,
    kind: "project" as const,
    sourceId: project.id,
    sourceLabel: `Project ${project.title}`,
    text: `${project.title}. ${project.summary} Impact: ${project.impact}. Demonstrates: ${project.matchedTraits.join(", ")}.`,
    projectTitle: project.title,
    skills: project.skills,
  }));

  return [...recommendationSegments, ...projectSegments];
}

export async function scoreCandidateTraitEvidence(
  input: ScoreCandidateTraitsInput,
): Promise<CandidateTraitScorecard> {
  const knownIds = new Set(input.segments.map((segment) => segment.segmentId));
  const { data, model } = await generateBedrockJson<RawCandidateTraitScorecard>({
    systemPrompt:
      "You are a recruiter-facing evidence scoring assistant. Evaluate only externally verified recommendation evidence. Never use candidate self-claims or unstated assumptions.",
    userPrompt: buildScoringPrompt(input),
    maxTokens: 1800,
    temperature: 0,
  });

  return {
    model,
    generatedAt: new Date(),
    technical: normalizeGroupScores(
      data.technical,
      technicalTraitMeta.map((trait) => trait.id),
      knownIds,
    ),
    behavioral: normalizeGroupScores(
      data.behavioral,
      behavioralTraitMeta.map((trait) => trait.id),
      knownIds,
    ),
    overallNotes: Array.isArray(data.overallNotes)
      ? data.overallNotes.map((note) => String(note).trim()).filter(Boolean).slice(0, 6)
      : [],
  };
}
