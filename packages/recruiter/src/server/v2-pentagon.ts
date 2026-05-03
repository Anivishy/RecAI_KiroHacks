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
): PentagonProject[] {
  return evidenceSegmentIds
    .slice(0, 2)
    .flatMap((id) => {
      const seg = segmentMap.get(id);
      if (!seg || !seg.text.trim()) return [];
      return [{
        projectId: id,
        name: seg.recommenderName ? `${seg.recommenderName}${seg.company ? ` · ${seg.company}` : ""}` : seg.sourceLabel,
        description: seg.text,
        similarity: confidence / 100,
      }];
    });
}

export function buildV2PentagonsForRecruiter(
  scorecard: ScorecardResult,
  segments: TraitEvidenceSegment[],
): {
  technical: PentagonTrait[];
  behavioral: PentagonTrait[];
} {
  const segmentMap = new Map(segments.map((s) => [s.segmentId, s]));

  const technical: PentagonTrait[] = technicalTraitMeta.map((meta) => {
    const detail = scorecard.technical[meta.id as keyof typeof scorecard.technical];
    return {
      id: meta.id,
      name: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      shortLabel: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      score: detail?.score ?? 0,
      confidence: detail?.confidence ?? 0,
      rationale: detail?.rationale,
      projects: detail ? evidenceProjects(detail.evidenceSegmentIds, segmentMap, detail.confidence) : [],
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
      projects: detail ? evidenceProjects(detail.evidenceSegmentIds, segmentMap, detail.confidence) : [],
    };
  });

  return { technical, behavioral };
}
