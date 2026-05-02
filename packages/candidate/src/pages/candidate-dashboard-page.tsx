import Link from "next/link";
import { CandidateBannerEditor } from "../components/candidate-banner-editor";
import { CandidateProfileHero } from "../components/candidate-profile-hero";
import { CandidateSignOutForm } from "../components/candidate-sign-out-form";
import {
  getCandidateBanner,
  requireCandidateSession,
} from "../server/candidate-auth";

type CandidateDashboardPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
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

export async function CandidateDashboardPage({
  searchParams,
}: CandidateDashboardPageProps) {
  const session = await requireCandidateSession();
  const banner = await getCandidateBanner(session.id);

  const resolvedSearchParams = await searchParams;
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const bannerStatus = bannerStatusFromParams(noticeCode, errorCode);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-35" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-12">
        <header className="glass-panel flex items-center justify-between rounded-full border border-[color:var(--line)] px-5 py-3">
          <Link
            className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
            href="/"
          >
            RecAI
          </Link>
          <p className="hidden text-xs uppercase tracking-[0.22em] text-[var(--muted)] sm:block">
            Candidate Workspace
          </p>
        </header>

        <CandidateProfileHero candidate={session} banner={banner} />

        <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div className="grid gap-6">
            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Experience
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Roles built from verified recommendations
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Each verified recommendation creates an experience row tied to the role
                you held at that time.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No recommendations submitted yet — your experience timeline will
                  appear here.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                  href="/candidate/recommendations/new"
                >
                  Request a recommendation
                </Link>
              </div>
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recommendations
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Verified voices about your work
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                All submitted recommendations appear here, with the same view recruiters
                and viewers see.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  No recommendations submitted about you yet.
                </p>
              </div>
            </section>

            <section className="glass-panel rounded-[28px] border border-[color:var(--line)] p-6 sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                Recruiter Groups
              </p>
              <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                Job pools you have joined
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                You join a recruiter group by clicking the RecAI link inside their
                external job posting.
              </p>
              <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-center">
                <p className="text-sm text-[var(--muted)]">
                  You haven&apos;t joined any recruiter groups yet.
                </p>
                <Link
                  className="mt-4 inline-flex rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  href="/candidate/groups"
                >
                  Open groups manager
                </Link>
              </div>
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
                  Coming next
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Enter a recommender&apos;s email and the role you want them to comment on.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-[var(--accent-warm)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
                href="/candidate/recommendations/new"
              >
                Start a request
              </Link>
            </section>

            <section className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--foreground)]">
                  Recruiter groups
                </h3>
                <span className="rounded-full bg-[rgba(95,112,134,0.18)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Coming next
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                Manage every recruiter group you&apos;ve joined.
              </p>
              <Link
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                href="/candidate/groups"
              >
                Manage groups
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
