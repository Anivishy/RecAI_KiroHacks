import type {
  CandidateProfile,
  JobPosting,
  RecommendationRequestPreview,
  RecruiterCandidateReview,
  RecruiterAccount,
} from "./types";

export const sampleRecruiter: RecruiterAccount = {
  id: "recruiter_001",
  email: "jordan.ellis@northstarsystems.com",
  fullName: "Jordan Ellis",
  title: "Lead Technical Recruiter",
  company: "Northstar Systems",
};

export const sampleJobPosting: JobPosting = {
  id: "senior-platform-engineer",
  title: "Senior Platform Engineer",
  team: "Platform Infrastructure",
  location: "San Francisco, CA",
  employmentType: "Full-time",
  experienceLevel: "Senior",
  candidatePoolSize: 18,
  searchPromptExample:
    "Show me candidates with strong Python systems experience and clear evidence of leadership and ownership.",
};

export const sampleCandidateProfiles: CandidateProfile[] = [
  {
    slug: "maya-chen",
    fullName: "Maya Chen",
    headline: "Platform engineer who turns messy internal systems into reliable product foundations.",
    currentRole: "Senior Backend Engineer",
    location: "Seattle, WA",
    yearsExperience: 6,
    targetRoles: ["Platform Engineer", "Backend Engineer", "Engineering Lead"],
    bio: "Maya has spent the last several years building Python services, internal developer tooling, and reliability systems that helped product teams ship faster with fewer incidents.",
    verifiedRecommendationCount: 3,
    pentagonScores: {
      technicalDepth: 5,
      execution: 4,
      ownership: 5,
      leadership: 4,
      communication: 4,
    },
    projects: [
      {
        id: "proj_reliability_control_plane",
        title: "Reliability Control Plane",
        summary:
          "Led the design of a Python-based orchestration service for service ownership, deployment guardrails, and incident metadata.",
        impact: "Reduced incident triage time by 38%",
        skills: ["Python", "FastAPI", "AWS", "Observability"],
        matchedTraits: ["technicalDepth", "ownership", "execution"],
      },
      {
        id: "proj_internal_dev_portal",
        title: "Internal Developer Portal",
        summary:
          "Worked cross-functionally with infra and product teams to launch a self-serve portal for provisioning and service onboarding.",
        impact: "Cut environment setup from days to hours",
        skills: ["TypeScript", "DX", "Systems Design", "Leadership"],
        matchedTraits: ["leadership", "communication", "execution"],
      },
    ],
    recommendations: [
      {
        id: "rec_maya_1",
        recommenderName: "Rafael Gomez",
        recommenderTitle: "Engineering Manager",
        company: "North Harbor",
        relationship: "Former manager",
        submittedAt: "2026-03-14",
        summary:
          "Maya consistently owned ambiguous infrastructure work, translated reliability problems into clear plans, and became the person teams trusted when a critical system needed both technical depth and calm execution.",
        skillsMentioned: ["Python", "Reliability", "Ownership"],
        projectTitles: ["Reliability Control Plane"],
      },
      {
        id: "rec_maya_2",
        recommenderName: "Sara Ibrahim",
        recommenderTitle: "Senior Engineering Manager",
        company: "Stripe",
        relationship: "Cross-functional partner",
        submittedAt: "2026-03-29",
        summary:
          "Maya communicated tradeoffs with uncommon clarity and helped product teams understand the operational realities behind backend and platform decisions.",
        skillsMentioned: ["Communication", "Leadership"],
        projectTitles: ["Internal Developer Portal"],
      },
      {
        id: "rec_maya_3",
        recommenderName: "Avery Park",
        recommenderTitle: "Director of Platform Engineering",
        company: "Figma",
        relationship: "Former manager",
        submittedAt: "2026-04-08",
        summary:
          "Maya is the engineer I trust to inherit the gnarliest reliability work and turn it into something the rest of the team can actually operate. She communicates tradeoffs clearly and writes great post-incident docs.",
        skillsMentioned: ["Reliability", "Communication", "Operability"],
        projectTitles: ["Reliability Control Plane"],
      },
    ],
  },
  {
    slug: "diego-alvarez",
    fullName: "Diego Alvarez",
    headline: "Full-stack builder with a strong track record of owning shipped customer-facing products.",
    currentRole: "Staff Software Engineer",
    location: "Austin, TX",
    yearsExperience: 8,
    targetRoles: ["Full-Stack Engineer", "Staff Engineer", "Technical Lead"],
    bio: "Diego blends product intuition with systems thinking and is strongest when leading cross-functional initiatives that need both front-end polish and backend pragmatism.",
    verifiedRecommendationCount: 1,
    pentagonScores: {
      technicalDepth: 4,
      execution: 5,
      ownership: 4,
      leadership: 5,
      communication: 5,
    },
    projects: [
      {
        id: "proj_customer_intelligence_console",
        title: "Customer Intelligence Console",
        summary:
          "Owned a cross-functional rebuild of an internal analytics console used by support and customer success teams.",
        impact: "Increased adoption by 2.3x",
        skills: ["React", "Node.js", "Data Products", "Product Collaboration"],
        matchedTraits: ["leadership", "communication", "execution"],
      },
      {
        id: "proj_workflow_automation",
        title: "Workflow Automation Platform",
        summary:
          "Designed a service layer that helped operations teams automate repetitive approval workflows and reduce manual escalations.",
        impact: "Saved 400+ hours per quarter",
        skills: ["APIs", "Automation", "Ownership", "Systems Thinking"],
        matchedTraits: ["technicalDepth", "ownership", "execution"],
      },
    ],
    recommendations: [
      {
        id: "rec_diego_1",
        recommenderName: "Priya Raman",
        recommenderTitle: "VP of Product",
        company: "Atlas Loop",
        relationship: "Product executive partner",
        submittedAt: "2026-02-11",
        summary:
          "Diego was one of the few engineers I trusted to carry both the product nuance and the execution detail needed to move a complex initiative from concept to launch.",
        skillsMentioned: ["Leadership", "Execution", "Communication"],
        projectTitles: ["Customer Intelligence Console"],
      },
    ],
  },
];

export const sampleRecommendationRequest: RecommendationRequestPreview = {
  id: "request_01",
  candidateName: "Maya Chen",
  recommenderName: "Rafael Gomez",
  relationshipPrompt: "Requesting feedback on platform ownership, backend system design, and collaboration during high-stakes reliability work.",
  status: "verification pending",
  expiresAt: "2026-05-15",
};

export const sampleRecruiterCandidateReviews: RecruiterCandidateReview[] = [
  {
    jobId: "senior-platform-engineer",
    candidateSlug: "maya-chen",
    fitScore: 92,
    fitLabel: "Strong fit",
    recruiterSummary:
      "Maya looks like a high-signal fit for the platform role because the recommendation evidence lines up tightly with the job's emphasis on Python systems work, ownership, and calm delivery under infrastructure pressure.",
    whyMatched: [
      "Multiple recommendations reinforce end-to-end ownership in ambiguous backend and reliability work.",
      "Highlighted project work is directly relevant to platform systems, service tooling, and operational maturity.",
      "The candidate profile shows strong technical depth without losing cross-functional communication clarity.",
    ],
    interviewFocus: [
      "Probe the depth of hands-on architecture decisions in the reliability control plane work.",
      "Validate how Maya prioritizes platform investments when product teams have conflicting needs.",
      "Ask for concrete examples of influencing stakeholders during reliability tradeoff decisions.",
    ],
    highlightedProjectIds: [
      "proj_reliability_control_plane",
      "proj_internal_dev_portal",
    ],
    highlightedRecommendationIds: ["rec_maya_1", "rec_maya_2"],
    traitEvidence: [
      {
        traitId: "technicalDepth",
        summary:
          "Technical evidence is strongest in Python service design, orchestration, and platform systems judgment.",
        projectIds: ["proj_reliability_control_plane"],
        recommendationIds: ["rec_maya_1"],
      },
      {
        traitId: "execution",
        summary:
          "The project history shows shipped internal systems with clear measurable impact and operational outcomes.",
        projectIds: [
          "proj_reliability_control_plane",
          "proj_internal_dev_portal",
        ],
        recommendationIds: ["rec_maya_1"],
      },
      {
        traitId: "ownership",
        summary:
          "Recommendation evidence repeatedly frames Maya as the person trusted to carry ambiguous infrastructure work end to end.",
        projectIds: ["proj_reliability_control_plane"],
        recommendationIds: ["rec_maya_1"],
      },
      {
        traitId: "leadership",
        summary:
          "Leadership appears through cross-functional influence and platform enablement, even without formal management framing.",
        projectIds: ["proj_internal_dev_portal"],
        recommendationIds: ["rec_maya_2"],
      },
      {
        traitId: "communication",
        summary:
          "Communication strength is reinforced by product-side feedback describing unusually clear tradeoff framing.",
        projectIds: ["proj_internal_dev_portal"],
        recommendationIds: ["rec_maya_2"],
      },
    ],
  },
  {
    jobId: "senior-platform-engineer",
    candidateSlug: "diego-alvarez",
    fitScore: 84,
    fitLabel: "Promising fit",
    recruiterSummary:
      "Diego appears especially strong for leadership, communication, and shipped execution. The main recruiter question is how closely his recent work maps to deep platform infrastructure compared with product-adjacent systems work.",
    whyMatched: [
      "Recommendation evidence points to strong cross-functional leadership and dependable execution.",
      "Project outcomes are measurable and indicate strong delivery ownership.",
      "Candidate could be attractive where the role benefits from platform work with partner-heavy execution.",
    ],
    interviewFocus: [
      "Test the depth of backend and systems design experience relative to infrastructure-heavy expectations.",
      "Ask where Diego has directly owned reliability, scalability, or operational engineering tradeoffs.",
      "Explore whether Diego wants a platform-focused role versus a broader product engineering lead role.",
    ],
    highlightedProjectIds: [
      "proj_workflow_automation",
      "proj_customer_intelligence_console",
    ],
    highlightedRecommendationIds: ["rec_diego_1"],
    traitEvidence: [
      {
        traitId: "technicalDepth",
        summary:
          "Technical signal is present, but the most compelling evidence is broader systems thinking rather than pure platform specialization.",
        projectIds: ["proj_workflow_automation"],
        recommendationIds: [],
      },
      {
        traitId: "execution",
        summary:
          "Execution is the clearest throughline in both project impact and recommendation-backed delivery language.",
        projectIds: [
          "proj_customer_intelligence_console",
          "proj_workflow_automation",
        ],
        recommendationIds: ["rec_diego_1"],
      },
      {
        traitId: "ownership",
        summary:
          "Ownership shows through cross-functional initiative leadership and direct product outcomes.",
        projectIds: ["proj_workflow_automation"],
        recommendationIds: ["rec_diego_1"],
      },
      {
        traitId: "leadership",
        summary:
          "Leadership is one of Diego's strongest signals, especially in complex cross-functional delivery.",
        projectIds: ["proj_customer_intelligence_console"],
        recommendationIds: ["rec_diego_1"],
      },
      {
        traitId: "communication",
        summary:
          "Recommendation evidence suggests Diego carries product nuance and communicates effectively across stakeholders.",
        projectIds: ["proj_customer_intelligence_console"],
        recommendationIds: ["rec_diego_1"],
      },
    ],
  },
];

export function getCandidateProfileBySlug(slug: string) {
  return sampleCandidateProfiles.find((candidate) => candidate.slug === slug);
}

export function getRecruiterCandidateReview(jobId: string, candidateSlug: string) {
  return sampleRecruiterCandidateReviews.find(
    (review) => review.jobId === jobId && review.candidateSlug === candidateSlug,
  );
}
