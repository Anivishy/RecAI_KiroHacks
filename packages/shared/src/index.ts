export {
  getCandidateProfileBySlug,
  getRecruiterCandidateReview,
  sampleCandidateProfiles,
  sampleJobPosting,
  sampleRecruiterCandidateReviews,
  sampleRecommendationRequest,
  sampleRecruiter,
} from "./lib/domain/mock-data";
export { pentagonTraitMeta } from "./lib/domain/types";
export type {
  CandidateAccount,
  CandidateBanner,
  CandidateProfile,
  CandidateProject,
  JobPosting,
  PentagonScoreMap,
  PentagonTraitId,
  RecruiterCandidateReview,
  RecommendationRequestPreview,
  RecommendationSnippet,
  RecruiterAccount,
  RecruiterTraitEvidence,
} from "./lib/domain/types";
export {
  behavioralTraitMeta,
  buildTraitSearchQueries,
  technicalTraitMeta,
} from "./lib/scoring/rubric";
export type {
  BehavioralTraitDefinition,
  BehavioralTraitId,
  TechnicalTraitDefinition,
  TechnicalTraitId,
  TraitGroupId,
  TraitRubricDefinition,
} from "./lib/scoring/rubric";
export { appRoutes } from "./lib/routes";
export {
  PERSONAL_EMAIL_DOMAINS,
  extractEmailDomain,
  isPersonalEmailDomain,
} from "./lib/domain/personal-email-domains";
export { LandingPage } from "./pages/landing-page";
export * as Icons from "./components/icons";
export { Card, CardHead, CardPad, CardPadTight } from "./components/card";
export { Mono } from "./components/mono";
export { TopNav } from "./components/top-nav";
export type { TopNavViewer } from "./components/top-nav";
export {
  buildExperienceRows,
  buildPentagonForRecruiter,
  buildRelationMix,
  buildTrustStats,
  companyToDomain,
  deterministicSimilarity,
  recommenderBrandColor,
} from "./lib/profile-derivations";
export type {
  DomainEntry,
  ExperienceRow,
  PentagonProject,
  PentagonTrait,
  RelationMixEntry,
  TrustStats,
} from "./lib/profile-derivations";
export { TrustCard } from "./components/rail/trust-card";
export { RelationMix } from "./components/rail/relation-mix";
export { VerifiedDomains } from "./components/rail/verified-domains";
export { HowRecAIScores } from "./components/rail/how-recai-scores";
