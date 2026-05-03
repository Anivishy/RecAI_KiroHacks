import Link from "next/link";
import { Card, CardHead, CardPad } from "../components/card";
import * as Icons from "../components/icons";
import { Mono } from "../components/mono";
import { TopNav } from "../components/top-nav";
import { appRoutes } from "../lib/routes";

const flowSteps = [
  {
    step: "01",
    title: "Candidates request proof from real collaborators",
    description:
      "Candidates choose which recommenders to invite. Recommendation content comes from people who actually worked with them, not from the candidate themselves.",
  },
  {
    step: "02",
    title: "Recommenders verify through work email",
    description:
      "Each recommender's email domain is checked against the verified-company directory before the form unlocks.",
  },
  {
    step: "03",
    title: "Recruiters search using evidence-backed signals",
    description:
      "Filters and natural-language search surface candidates by validated technical and behavioral strengths — never by self-reported claims.",
  },
];

export function LandingPage() {
  return (
    <>
      <TopNav viewer={{ role: "guest" }} showSearch={false} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-7 px-6 py-7 pb-20 sm:px-8">
        <Card>
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--verified)]">
                Hiring credibility, not candidate polish
              </p>
              <h1 className="mt-3 max-w-2xl text-[44px] font-semibold leading-[1.05] tracking-[-0.02em] text-[color:var(--ink)] sm:text-[52px]">
                Candidate profiles backed by people who actually worked with them.
              </h1>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-[color:var(--ink-2)]">
                recAI helps candidates stand out through verified recommendations and helps recruiters search for proven technical and behavioral traits — never self-reported claims.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                  href={appRoutes.recruiterSignIn}
                >
                  Open recruiter portal <Icons.ArrowRight />
                </Link>
                <Link
                  className="inline-flex items-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-5 py-2.5 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
                  href={appRoutes.candidateSignIn}
                >
                  Open candidate workspace
                </Link>
              </div>
            </div>
            <div className="grid gap-3 self-start">
              {[
                { eyebrow: "Shared truth", value: "1 profile", body: "Public candidate presence anchored by verified evidence." },
                { eyebrow: "Search scope", value: "1 job pool", body: "Recruiters search only candidates who opted in to a posting." },
                { eyebrow: "Verified voices", value: "External", body: "Content comes from managers and coworkers — never the candidate." },
              ].map((stat) => (
                <div key={stat.eyebrow} className="rounded-[var(--r-lg)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">{stat.eyebrow}</p>
                  <p className="mt-1.5 text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">{stat.value}</p>
                  <p className="mt-1 text-[13px] leading-5 text-[color:var(--ink-2)]">{stat.body}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="px-6 py-6 sm:px-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--verified-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--verified)]">
                Candidate path
              </span>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
                Show real work through verified voices
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-[color:var(--ink-2)]">
                Candidates build a profile, request recommendations, and let trusted external voices do the talking.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--verified)] hover:text-[color:var(--verified-2)]"
                href={appRoutes.candidateSignIn}
              >
                Open candidate workspace <Icons.ArrowRight />
              </Link>
            </div>
          </Card>
          <Card>
            <div className="px-6 py-6 sm:px-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--recruiter-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--recruiter)]">
                Recruiter path
              </span>
              <h2 className="mt-4 text-[24px] font-semibold tracking-[-0.01em] text-[color:var(--ink)]">
                Search by proof, not just polish
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-[color:var(--ink-2)]">
                Recruiters create posting-scoped pools and search by validated technical and behavioral signals.
              </p>
              <Link
                className="mt-5 inline-flex items-center gap-1 text-[13px] font-semibold text-[color:var(--recruiter)] hover:text-[color:var(--ink)]"
                href={appRoutes.recruiterSignIn}
              >
                Open recruiter portal <Icons.ArrowRight />
              </Link>
            </div>
          </Card>
        </div>

        <Card>
          <CardHead eyebrow="Trust flow" />
          <CardPad>
            <div className="grid gap-3">
              {flowSteps.map((step) => (
                <div key={step.step} className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-5 py-4">
                  <div className="flex items-start gap-4">
                    <Mono className="text-[13px] text-[color:var(--ink-3)]">{step.step}</Mono>
                    <div>
                      <h3 className="text-[15px] font-semibold text-[color:var(--ink)]">{step.title}</h3>
                      <p className="mt-1 text-[13px] leading-5 text-[color:var(--ink-2)]">{step.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardPad>
        </Card>

        <Card>
          <CardHead eyebrow="See it in action" />
          <CardPad>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">How it works</p>
                <h3 className="mt-1 text-[16px] font-semibold text-[color:var(--ink)]">Posting-scoped candidate pools</h3>
                <p className="mt-1 text-[13px] text-[color:var(--ink-2)]">
                  Each job posting has its own opt-in pool — recruiters search only candidates who chose to apply.
                </p>
              </div>
              <div className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">Get started</p>
                <Link
                  className="mt-1 inline-flex items-center gap-1 text-[15px] font-semibold text-[color:var(--verified)] hover:text-[color:var(--verified-2)]"
                  href={appRoutes.candidateSignIn}
                >
                  Build your candidate profile <Icons.ArrowRight />
                </Link>
              </div>
            </div>
          </CardPad>
        </Card>
      </main>
    </>
  );
}
