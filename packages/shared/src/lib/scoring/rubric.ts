export type TraitGroupId = "technical" | "behavioral";

export type TraitRubricDefinition<TId extends string> = {
  id: TId;
  label: string;
  definition: string;
  recruiterQuestion: string;
  retrievalQuery: string;
  positiveSignals: string[];
  cautionSignals: string[];
};

export const technicalTraitMeta = [
  {
    id: "technicalDepth",
    label: "Technical Depth",
    definition:
      "Strength in core engineering craft, complexity handling, and technical judgment.",
    recruiterQuestion:
      "Does the evidence show that this person can work confidently on difficult technical problems?",
    retrievalQuery:
      "evidence of deep technical judgment, engineering complexity, architecture quality, backend systems, scalability, reliability, debugging, and strong software engineering craft",
    positiveSignals: [
      "complex system work",
      "strong technical judgment",
      "handles ambiguity in engineering decisions",
      "credible ownership of difficult implementation details",
    ],
    cautionSignals: [
      "only shallow feature work is described",
      "technical contribution is vague",
      "impact is present but craft is not evidenced",
    ],
  },
  {
    id: "systemDesign",
    label: "System Design",
    definition:
      "Ability to design sound systems, reason about tradeoffs, and shape architecture.",
    recruiterQuestion:
      "Does the evidence show that this person can design scalable and maintainable systems?",
    retrievalQuery:
      "evidence of system design, architecture, tradeoffs, scalability, reliability, APIs, infrastructure design, data modeling, and platform decisions",
    positiveSignals: [
      "architected systems or platforms",
      "made explicit tradeoffs",
      "designed for scale, reliability, or maintainability",
      "drove structure rather than only implementation",
    ],
    cautionSignals: [
      "implementation is strong but design ownership is unclear",
      "architecture language is generic",
      "no explicit tradeoff or design rationale is shown",
    ],
  },
  {
    id: "implementationQuality",
    label: "Implementation Quality",
    definition:
      "Code quality, testing discipline, maintainability, and reliability of execution.",
    recruiterQuestion:
      "Does the evidence show that this person ships work with a high quality bar?",
    retrievalQuery:
      "evidence of code quality, maintainability, testing, reliability, observability, clean implementation, production readiness, and operational excellence",
    positiveSignals: [
      "strong testing or validation habits",
      "maintainable implementation",
      "reliability and production quality are mentioned",
      "quality bar improved team output",
    ],
    cautionSignals: [
      "speed is emphasized without quality evidence",
      "project results exist but engineering rigor is unclear",
      "no indication of testing, reliability, or maintainability",
    ],
  },
  {
    id: "problemSolving",
    label: "Problem Solving",
    definition:
      "Ability to debug, reason from first principles, and find strong solutions under uncertainty.",
    recruiterQuestion:
      "Does the evidence show that this person can break down hard problems and solve them well?",
    retrievalQuery:
      "evidence of debugging, root cause analysis, first principles reasoning, technical investigation, problem decomposition, and strong decision making under uncertainty",
    positiveSignals: [
      "root cause analysis is explicit",
      "solved unclear or novel problems",
      "diagnosed failures or bottlenecks well",
      "chose effective solutions under constraints",
    ],
    cautionSignals: [
      "outcomes are listed without reasoning quality",
      "candidate appears to execute but not diagnose",
      "problem framing is weak or generic",
    ],
  },
  {
    id: "technicalAdaptability",
    label: "Technical Adaptability",
    definition:
      "Ability to learn new tools, domains, and stacks quickly while staying effective.",
    recruiterQuestion:
      "Does the evidence show that this person can ramp quickly across changing technical contexts?",
    retrievalQuery:
      "evidence of learning new stacks quickly, adapting to unfamiliar systems, cross-domain engineering, rapid ramp-up, and technical versatility",
    positiveSignals: [
      "learned new systems quickly",
      "worked across multiple technical domains",
      "adapted effectively to changing scope or tooling",
      "ramped and contributed without long handholding",
    ],
    cautionSignals: [
      "only one narrow context is described",
      "breadth is implied but not supported",
      "adaptability is praised without examples",
    ],
  },
] as const satisfies readonly TraitRubricDefinition<string>[];

export const behavioralTraitMeta = [
  {
    id: "ownership",
    label: "Ownership",
    definition:
      "Tendency to take responsibility, drive work end to end, and act without needing repeated prompting.",
    recruiterQuestion:
      "Does the evidence show that this person truly owns outcomes rather than only assigned tasks?",
    retrievalQuery:
      "evidence of ownership, end to end responsibility, initiative, accountability, ambiguity handling, and proactive follow-through",
    positiveSignals: [
      "drove work end to end",
      "acted proactively in ambiguity",
      "took responsibility for outcomes",
      "closed loops without needing external pressure",
    ],
    cautionSignals: [
      "helpful but mostly task-based contribution",
      "initiative is mentioned without examples",
      "ownership appears shared but not individualized",
    ],
  },
  {
    id: "execution",
    label: "Execution",
    definition:
      "Ability to deliver consistently, prioritize well, and turn plans into outcomes.",
    recruiterQuestion:
      "Does the evidence show that this person reliably gets meaningful work done?",
    retrievalQuery:
      "evidence of execution, delivery, follow-through, shipping results, prioritization, timeliness, and dependable outcomes",
    positiveSignals: [
      "delivered meaningful results",
      "met timelines or handled changing priorities well",
      "turned plans into shipped outcomes",
      "created measurable impact",
    ],
    cautionSignals: [
      "strong intent but weak completion evidence",
      "impact is vague or unmeasured",
      "only isolated wins are described",
    ],
  },
  {
    id: "leadership",
    label: "Leadership",
    definition:
      "Ability to influence others, raise the bar, mentor teammates, and shape direction.",
    recruiterQuestion:
      "Does the evidence show that this person makes the team better, not just themselves?",
    retrievalQuery:
      "evidence of leadership, influence, mentoring, strategic direction, raising standards, stakeholder leadership, and team guidance",
    positiveSignals: [
      "influenced team direction",
      "mentored or leveled up others",
      "raised standards or aligned groups",
      "led through credibility rather than title alone",
    ],
    cautionSignals: [
      "seniority is implied but influence is unproven",
      "leadership language is generic",
      "coordination is present but team impact is unclear",
    ],
  },
  {
    id: "communication",
    label: "Communication",
    definition:
      "Clarity in written and verbal communication, expectation setting, and stakeholder alignment.",
    recruiterQuestion:
      "Does the evidence show that this person communicates clearly enough to move work forward?",
    retrievalQuery:
      "evidence of communication, clarity, writing, stakeholder alignment, expectation setting, concise explanations, and strong collaboration language",
    positiveSignals: [
      "sets expectations clearly",
      "communicates technical work understandably",
      "writes or presents clearly",
      "reduces confusion across stakeholders",
    ],
    cautionSignals: [
      "good collaborator but clarity is not explicit",
      "communication is praised without examples",
      "alignment quality is unclear",
    ],
  },
  {
    id: "collaboration",
    label: "Collaboration",
    definition:
      "Ability to work effectively across functions, build trust, and operate with low ego.",
    recruiterQuestion:
      "Does the evidence show that this person is a strong teammate across disciplines and personalities?",
    retrievalQuery:
      "evidence of collaboration, cross-functional teamwork, trust building, empathy, partnership, low ego, and healthy team dynamics",
    positiveSignals: [
      "works well across functions",
      "builds trust and momentum with others",
      "shows low-ego teamwork",
      "creates good working dynamics under pressure",
    ],
    cautionSignals: [
      "effective alone but team interaction is thin",
      "cross-functional work is mentioned without quality signals",
      "partnership quality is implied but not evidenced",
    ],
  },
] as const satisfies readonly TraitRubricDefinition<string>[];

export type TechnicalTraitId = (typeof technicalTraitMeta)[number]["id"];
export type BehavioralTraitId = (typeof behavioralTraitMeta)[number]["id"];

export type TechnicalTraitDefinition = TraitRubricDefinition<TechnicalTraitId>;
export type BehavioralTraitDefinition = TraitRubricDefinition<BehavioralTraitId>;

export function buildTraitSearchQueries() {
  return {
    technical: Object.fromEntries(
      technicalTraitMeta.map((trait) => [trait.id, trait.retrievalQuery]),
    ) as Record<TechnicalTraitId, string>,
    behavioral: Object.fromEntries(
      behavioralTraitMeta.map((trait) => [trait.id, trait.retrievalQuery]),
    ) as Record<BehavioralTraitId, string>,
  };
}
