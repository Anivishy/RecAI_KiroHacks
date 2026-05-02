export const appRoutes = {
  home: "/",
  candidateSignIn: "/candidate/sign-in",
  candidateDashboard: "/candidate/dashboard",
  candidateGroups: "/candidate/groups",
  candidateRecommendationNew: "/candidate/recommendations/new",
  recruiterSignIn: "/recruiter/sign-in",
  recruiterDashboard: "/recruiter/dashboard",
  recruiterJob: (jobId: string) => `/recruiter/jobs/${jobId}`,
  recruiterCandidateProfile: (jobId: string, candidateSlug: string) =>
    `/recruiter/jobs/${jobId}/candidates/${candidateSlug}`,
  publicCandidateProfile: (candidateSlug: string) => `/c/${candidateSlug}`,
  recommenderRequest: (requestId: string) => `/recommend/${requestId}`,
} as const;
