import { technicalTraitMeta, behavioralTraitMeta } from "@recai/shared";
import type { PentagonTrait } from "@recai/shared";
import type { ScorecardResult } from "./recruiter-trait-scoring";

const TECHNICAL_DISPLAY_NAMES: Record<string, string> = {
  technicalDepth: "Tech Depth",
  systemDesign: "System Design",
  implementationQuality: "Impl. Quality",
  problemSolving: "Prob. Solving",
  technicalAdaptability: "Adaptability",
};

export function buildV2PentagonsForRecruiter(scorecard: ScorecardResult): {
  technical: PentagonTrait[];
  behavioral: PentagonTrait[];
} {
  const technical: PentagonTrait[] = technicalTraitMeta.map((meta) => {
    const detail = scorecard.technical[meta.id as keyof typeof scorecard.technical];
    return {
      id: meta.id,
      name: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      shortLabel: TECHNICAL_DISPLAY_NAMES[meta.id] ?? meta.label,
      score: detail?.score ?? 0,
      confidence: detail?.confidence ?? 0,
      rationale: detail?.rationale,
      projects: [],
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
      projects: [],
    };
  });

  return { technical, behavioral };
}
