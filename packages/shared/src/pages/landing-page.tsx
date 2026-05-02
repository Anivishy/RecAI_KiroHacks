import Link from "next/link";
import { RoleCard } from "../components/role-card";
import { SectionCard } from "../components/section-card";
import { sampleCandidateProfiles, sampleJobPosting } from "../lib/domain/mock-data";
import { appRoutes } from "../lib/routes";

const flowSteps = [
  {
    step: "01",
    title: "Candidates request proof from real collaborators",
    description:
      "Candidates choose which recommenders to invite and which verified recommendations to showcase on their profile.",
  },
  {
    step: "02",
    title: "Recommenders verify through work email",
    description:
      "Recommendation content comes from a validated external voice, not from the candidate themselves.",
  },
  {
    step: "03",
    title: "Recruiters search using evidence-backed signals",
    description:
      "Structured filters and natural-language search surface candidates by validated technical and behavioral strengths.",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-45" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-12">
        <header className="glass-panel flex items-center justify-between rounded-full border border-[color:var(--line)] px-5 py-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]">
              RecAI
            </p>
            <p className="text-sm text-[var(--muted)]">
              Verified recommendations for stronger hiring signals
            </p>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Link
              className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent-strong)] hover:text-[var(--foreground)]"
              href={appRoutes.candidateSignIn}
            >
              I&apos;m a candidate
            </Link>
            <Link
              className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              href={appRoutes.recruiterSignIn}
            >
              I&apos;m a recruiter
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-8 py-8">
          <section className="glass-panel accent-ring relative overflow-hidden rounded-[36px] border border-[color:var(--line)] px-6 py-10 sm:px-8 lg:px-10 lg:py-12">
            <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-[rgba(21,94,239,0.12)] blur-3xl" />
            <div className="absolute bottom-0 left-0 h-44 w-44 rounded-full bg-[rgba(15,118,110,0.12)] blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1.25fr_0.95fr] lg:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                  Hiring credibility, not just candidate polish
                </p>
                <h1 className="display-face mt-4 text-5xl leading-[1.02] font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-6xl">
                  Candidate profiles backed by people who actually worked with them.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                  RecAI helps candidates stand out through verified recommendations and
                  helps recruiters search for proven technical and behavioral traits
                  instead of relying on self-reported claims alone.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                    href={appRoutes.recruiterSignIn}
                  >
                    Enter recruiter flow
                  </Link>
                  <Link
                    className="rounded-full border border-[color:var(--line)] bg-white/70 px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    href={appRoutes.candidateSignIn}
                  >
                    Enter candidate flow
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[28px] border border-[color:var(--line)] bg-white/80 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                    Shared truth
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                    1 profile
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Public candidate presence anchored by verified recommendation
                    evidence.
                  </p>
                </div>
                <div className="rounded-[28px] border border-[color:var(--line)] bg-white/80 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                    Search scope
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                    1 job pool
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Recruiters search only candidates who opted into a posting they own.
                  </p>
                </div>
                <div className="rounded-[28px] border border-[color:var(--line)] bg-white/80 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                    Parallel build
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-[var(--foreground)]">
                    2 lanes
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Candidate and recruiter routes are already separated for parallel
                    implementation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <RoleCard
              audience="Candidate Path"
              title="Show real work through verified voices"
              description="Candidates build a profile, request recommendations, and curate which external validations appear publicly."
              href={appRoutes.candidateSignIn}
              cta="Open candidate entry"
              bullets={[
                "Manage recommendation requests",
                "Join relevant job postings",
                "Publish a trust-backed profile",
              ]}
              tone="teal"
            />
            <RoleCard
              audience="Recruiter Path"
              title="Search by proof, not just polish"
              description="Recruiters create a job posting and search only within its opted-in candidate pool using filters and natural language."
              href={appRoutes.recruiterSignIn}
              cta="Open recruiter entry"
              bullets={[
                "Create job-scoped candidate pools",
                "Filter with pentagon minimums",
                "Ask natural-language talent queries",
              ]}
              tone="amber"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <SectionCard
              eyebrow="Trust Flow"
              title="How credibility moves through the product"
              description="The product keeps the candidate in control of visibility, while keeping the recommendation content in the recommender's hands."
            >
              <div className="grid gap-4">
                {flowSteps.map((step) => (
                  <div
                    key={step.step}
                    className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5"
                  >
                    <div className="flex items-start gap-4">
                      <p className="display-face text-2xl font-semibold text-[var(--accent-strong)]">
                        {step.step}
                      </p>
                      <div>
                        <h3 className="text-lg font-semibold text-[var(--foreground)]">
                          {step.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="Build Lanes"
              title="Set up to work in parallel immediately"
              description="The scaffold already separates the recruiter and candidate workstreams, while preserving shared docs and domain contracts."
            >
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    Recruiter lane
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Focus on the portal, job postings, search system, and recruiter-facing
                    candidate evaluation.
                  </p>
                  <Link
                    className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    href={appRoutes.recruiterDashboard}
                  >
                    View recruiter dashboard shell
                  </Link>
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-warm)]">
                    Candidate lane
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Focus on profiles, recommendation request management, and opt-in job
                    interest workflows.
                  </p>
                  <Link
                    className="mt-4 inline-flex text-sm font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    href={appRoutes.candidateDashboard}
                  >
                    View candidate dashboard shell
                  </Link>
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]">
                    Shared contract
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    All changes now require specs in `docs/specs/` so both teammates and
                    AI agents stay synchronized.
                  </p>
                </div>
              </div>
            </SectionCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <SectionCard
              eyebrow="Mock Preview"
              title="Scaffold data already reflects the product story"
              description="We are using realistic mock entities from day one so recruiter and candidate UI work can move before the backend is wired."
            >
              <div className="grid gap-4">
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                    Sample posting
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--foreground)]">
                    {sampleJobPosting.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {sampleJobPosting.team} team · {sampleJobPosting.location} ·{" "}
                    {sampleJobPosting.candidatePoolSize} opted-in candidates
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm uppercase tracking-[0.22em] text-[var(--muted)]">
                    Public profile route
                  </p>
                  <Link
                    className="mt-2 inline-flex text-lg font-semibold text-[var(--accent-strong)] hover:text-[var(--accent)]"
                    href={appRoutes.publicCandidateProfile(
                      sampleCandidateProfiles[0].slug,
                    )}
                  >
                    View {sampleCandidateProfiles[0].fullName}&apos;s profile
                  </Link>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              eyebrow="What Comes Next"
              title="Best next slice after this scaffold"
              description="The right next step is recruiter implementation, starting at the dashboard and job posting shell, while candidate work can begin independently in parallel."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                    Recruiter
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Implement job creation, candidate-pool search scaffolding, and the
                    results-to-profile flow.
                  </p>
                </div>
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent-warm)]">
                    Candidate
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    Implement profile editing, recommendation requests, and job-interest
                    management.
                  </p>
                </div>
              </div>
            </SectionCard>
          </section>
        </main>
      </div>
    </div>
  );
}
