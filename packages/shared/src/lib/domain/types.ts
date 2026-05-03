export const pentagonTraitMeta = [
  {
    id: "technicalDepth",
    label: "Technical Depth",
    shortLabel: "Depth",
    description: "Strength in core craft, complexity, and technical judgment.",
  },
  {
    id: "execution",
    label: "Execution",
    shortLabel: "Execution",
    description: "Ability to consistently deliver meaningful outcomes.",
  },
  {
    id: "ownership",
    label: "Ownership",
    shortLabel: "Ownership",
    description: "Tendency to take responsibility and drive work end to end.",
  },
  {
    id: "leadership",
    label: "Leadership",
    shortLabel: "Leadership",
    description: "Ability to influence teams, decisions, and project direction.",
  },
  {
    id: "communication",
    label: "Communication",
    shortLabel: "Comms",
    description: "Clarity, alignment, and collaboration across stakeholders.",
  },
] as const;

export type PentagonTraitId = (typeof pentagonTraitMeta)[number]["id"];

export type PentagonScoreMap = Record<PentagonTraitId, number>;

export interface CandidateProject {
  id: string;
  title: string;
  summary: string;
  impact: string;
  skills: string[];
  matchedTraits: PentagonTraitId[];
}

export interface RecommendationSnippetProject {
  title: string;
  description: string;
  skills: string[];
}

export interface RecommendationSnippet {
  id: string;
  recommenderName: string;
  recommenderTitle: string;
  company: string;
  relationship: string;
  submittedAt: string;
  summary: string;
  skillsMentioned: string[];
  projectTitles: string[];
  technicalResponse: string;
  behavioralResponse: string;
  projects: RecommendationSnippetProject[];
}

export interface CandidateProfile {
  slug: string;
  fullName: string;
  headline: string;
  currentRole: string;
  location: string;
  yearsExperience: number;
  targetRoles: string[];
  bio: string;
  verifiedRecommendationCount: number;
  pentagonScores: PentagonScoreMap;
  projects: CandidateProject[];
  recommendations: RecommendationSnippet[];
}

export interface RecruiterAccount {
  id: string;
  email: string;
  fullName: string;
  title: string;
  company: string;
}

export interface JobPosting {
  id: string;
  title: string;
  team: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  candidatePoolSize: number;
  searchPromptExample: string;
}

export interface RecommendationRequestPreview {
  id: string;
  candidateName: string;
  recommenderName: string;
  relationshipPrompt: string;
  status: "verification pending" | "form in progress" | "submitted";
  expiresAt: string;
}

export interface RecruiterTraitEvidence {
  traitId: PentagonTraitId;
  summary: string;
  projectIds: string[];
  recommendationIds: string[];
}

export interface RecruiterCandidateReview {
  jobId: string;
  candidateSlug: string;
  fitScore: number;
  fitLabel: "Strong fit" | "Promising fit" | "Selective fit";
  recruiterSummary: string;
  whyMatched: string[];
  interviewFocus: string[];
  highlightedProjectIds: string[];
  highlightedRecommendationIds: string[];
  traitEvidence: RecruiterTraitEvidence[];
}

export interface CandidateAccount {
  id: string;
  email: string;
  fullName: string;
  slug: string;
}

export interface CandidateBanner {
  email: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}
