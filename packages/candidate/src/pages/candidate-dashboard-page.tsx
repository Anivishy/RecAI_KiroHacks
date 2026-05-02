import Link from "next/link";
import { appRoutes } from "@recai/shared";
import { getJoinedPostingsForCandidate } from "@recai/recruiter/server/recruiter-jobs";
import { CandidateBannerEditor } from "../components/candidate-banner-editor";
import { CandidateProfileHero } from "../components/candidate-profile-hero";
import { CandidateSignOutForm } from "../components/candidate-sign-out-form";
import {
  getCandidateBanner,
  requireCandidateSession,
} from "../server/candidate-auth";
import { getCandidateProfileById } from "../server/candidate-profile-db";
import { getRecommendationRequestsForCandidate } from "../server/recommendation-db";

type CandidateDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

const noticeMessages: Record<string, string> = {
  "already-joined":
    "You were already in that recruiter candidate pool, so your workspace stayed unchanged.",
  "joined-posting":
    "You were added to the recruiter candidate pool linked from that posting.",
};

const errorMessages: Record<string, string> = {
  "invalid-invite":
    "That recruiter invite link is no longer valid. Ask the recruiter for a fresh RecAI link.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function bannerStatusFromParams(
  noticeCode: string | undefined,
  errorCode: string | undefined,
): "saved" | "error" | null {
  if (noticeCode === "banner-saved") return "saved";
  if (errorCode === "banner-save-failed") return "error";
  return null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function countActiveRequests(statuses: string[]) {
  return statuses.filter((status) => status === "pending" || status === "draft").length;
}

export async function CandidateDashboardPage({
  searchParams,
}: CandidateDashboardPageProps) {
  const session = await requireCandidateSession();
  const [banner, candidateProfile, recommendationRequests, joinedPostings] =
    await Promise.all([
      getCandidateBanner(session.id),
      getCandidateProfileById(session.id),
      getRecommendationRequestsForCandidate(session.id),
      getJoinedPostingsForCandidate(session.id),
    ]);

  const resolvedSearchParams = await searchParams;
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const bannerStatus = bannerStatusFromParams(noticeCode, errorCode);
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const projects = candidateProfile?.projects ?? [];
  const recommendations = candidateProfile?.recommendations ?? [];
  const activeRequestCount = countActiveRequests(
    recommendationRequests.map((request) => request.status),
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-35" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-12">
        <header className="glass-panel flex items-center justify-between rounded-full border border-[color:var(--line)] px-5 py-3">
          <Link
            className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
            href={appRoutes.home}
          >
            RecAI
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.22em] text-[var(--muted)] sm:block">
            Candidate Workspace
          </p>
        </header>

        <div className="grid gap-4">
          {noticeMessage ? (
            <div className="rounded-[24px] border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.10)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
              {noticeMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <CandidateProfileHero
          banner={banner}
          candidate={session}
          headline={candidateProfile?.headline}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="grid gap-6">
            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Experience
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Projects surfaced from verified recommendations
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                When recommenders submit project-level evidence, it turns into the proof
                recruiters see on your profile.
              </p>

              {projects.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            {project.title}
                          </h3>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {project.summary}
                          </p>
                        </div>
                        <span className="text-sm font-medium text-[var(--accent-strong)]">
                          {project.impact}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[rgba(21,94,239,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                  <p className="text-sm text-[var(--muted)]">
                    No submitted recommendations have turned into project evidence yet.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                    href={appRoutes.candidateRecommendationNew}
                  >
                    Request a recommendation
                  </Link>
                </div>
              )}
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recommendations
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Verified voices about your work
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                These are the submitted recommendations that power your public profile and
                recruiter-facing evidence.
              </p>

              {recommendations.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            {recommendation.recommenderName}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {recommendation.recommenderTitle} - {recommendation.company}
                          </p>
                        </div>
                        <div className="text-right text-sm text-[var(--muted)]">
                          <p>{recommendation.relationship}</p>
                          <p className="mt-1">Submitted {formatDate(recommendation.submittedAt)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
                        {recommendation.summary}
                      </p>
                      {recommendation.skillsMentioned.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {recommendation.skillsMentioned.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full border border-[color:var(--line)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                  <p className="text-sm text-[var(--muted)]">
                    No recommendations have been submitted about you yet.
                  </p>
                </div>
              )}
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recruiter Groups
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Job pools you have joined
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Every recruiter invite link adds you to one posting-specific pool. This is
                the candidate set recruiters search against.
              </p>

              {joinedPostings.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {joinedPostings.map((posting) => (
                    <div
                      key={posting.jobId}
                      className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-[var(--foreground)]">
                            {posting.title}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {posting.location} - {posting.employmentType} -{" "}
                            {posting.experienceLevel}
                          </p>
                        </div>
                        <p className="text-sm text-[var(--muted)]">
                          Joined {formatDate(posting.joinedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                  <p className="text-sm text-[var(--muted)]">
                    You have not joined any recruiter groups yet.
                  </p>
                  <Link
                    className="mt-4 inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    href={appRoutes.candidateGroups}
                  >
                    Open groups manager
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className="grid gap-4">
            <CandidateBannerEditor banner={banner} status={bannerStatus} />

            <section className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(234,88,12,0.08)] p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Request a recommendation
                </h3>
                <span className="rounded-full bg-[rgba(234,88,12,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--accent-warm)]">
                  {activeRequestCount > 0 ? `${activeRequestCount} active` : "Ready"}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Create a recommender link, share it directly, and track whether it is still
                pending or already submitted.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                href={appRoutes.candidateRecommendationNew}
              >
                Manage requests
              </Link>
            </section>

            <section className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Recruiter groups
                </h3>
                <span className="rounded-full bg-[rgba(95,112,134,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  {joinedPostings.length} joined
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Review the job pools you have opted into through recruiter invite links.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                href={appRoutes.candidateGroups}
              >
                Open groups
              </Link>
            </section>

            <section className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-5">
              <h3 className="text-base font-semibold text-[var(--foreground)]">Account</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Sign out of the candidate workspace.
              </p>
              <div className="mt-4">
                <CandidateSignOutForm
                  className="inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
