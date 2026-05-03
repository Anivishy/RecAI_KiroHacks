import { technicalTraitMeta, behavioralTraitMeta } from "@recai/shared";
import type { PentagonTrait, PentagonProject } from "@recai/shared";
import type { ScorecardResult } from "./recruiter-trait-scoring";
import type { TraitEvidenceSegment } from "@recai/shared/server/trait-scoring";

const TECHNICAL_DISPLAY_NAMES: Record<string, string> = {
  technicalDepth: "Tech Depth",
  systemDesign: "Sys. Design",
  implementationQuality: "Impl. Quality",
  problemSolving: "Prob. Solving",
  technicalAdaptability: "Adaptability",
};

function evidenceProjects(
  evidenceSegmentIds: string[],
  segmentMap: Map<string, TraitEvidenceSegment>,
  confidence: number,
  usedIds: Set<string>,
): PentagonProject[] {
  // Prefer segments not already used by another trait for diversity
  const sorted = [...evidenceSegmentIds].sort((a, b) => {
    const aUsed = usedIds.has(a) ? 1 : 0;
    const bUsed = usedIds.has(b) ? 1 : 0;
    return aUsed - bUsed;
  });

  const results: PentagonProject[] = [];
  for (const id of sorted) {
    if (results.length >= 2) break;
    const seg = segmentMap.get(id);
    if (!seg || !seg.text.trim()) continue;
    // Skip if this exact text is already in results (dedup identical content)
    if (results.some((r) => r.description === seg.text)) continue;
    results.push({
      projectId: id,
      name: seg.recommenderName
        ? `${seg.recommenderName}${seg.company ? ` · ${seg.company}` : ""}`
        : seg.sourceLabel,
      description: seg.text,
      similarity: confidence / 100,
    });
    usedIds.add(id);
  }
  return results;
}

export function buildV2PentagonsForRecruiter(
  scorecard: ScorecardResult,
  segments: TraitEvidenceSegment[],
): {
  technical: PentagonTrait[];
  behavioral: PentagonTrait[];
} {
  const segmentMap = new Map(segments.map((s) => [s.segmentId, s]));
  const usedIds = new Set<string>();

  const technical: PentagonTrait[] = technicalTraitMeta.map((meta) => {
    const detail = scorecard.technical[meta.id as keyof typeof scorecard.technical];
    return {
      id: meta.id,
      name: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      shortLabel: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      score: detail?.score ?? 0,
      confidence: detail?.confidence ?? 0,
      rationale: detail?.rationale,
      projects: detail ? evidenceProjects(detail.evidenceSegmentIds, segmentMap, detail.confidence, usedIds) : [],
    };
  });

  const behavioral: PentagonTrait[] = behavioralTraitMeta.map((meta) => {
    const detail = scorecard.behavioral[meta.id as keyof typeof scorecard.behavioral];
    return {
      id: meta.id,
      name: meta.label,
      shortLabel: meta.label,
      score: detail?.score ?? 0,
      confidence: detail?.confidence ?? 0,
      rationale: detail?.rationale,
      projects: detail ? evidenceProjects(detail.evidenceSegmentIds, segmentMap, detail.confidence, usedIds) : [],
    };
  });

  return { technical, behavioral };
}
