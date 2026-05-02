import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHead, CardPad, TopNav, appRoutes } from "@recai/shared";
import { joinCandidateToPostingByInviteCode } from "@recai/recruiter/server/recruiter-jobs";
import {
  getCandidateSession,
  isCandidateDatabaseConfigured,
} from "../server/candidate-auth";

type CandidateSignInPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    join?: string | string[];
    notice?: string | string[];
  }>;
};

const errorMessages: Record<string, string> = {
  "auth-required": "Sign in to access the candidate workspace.",
  "email-in-use": "That email already has a candidate account.",
  "invalid-credentials": "That email and password combination did not match a candidate account.",
  "invalid-email": "Enter a valid email to create the candidate account.",
  "missing-fields": "Fill out all required candidate account fields to continue.",
  "server-error": "Something went wrong while contacting candidate auth. Please try again.",
  "setup-required": "Candidate account access is temporarily unavailable. Please try again shortly.",
  "invalid-invite": "That recruiter invite code is no longer valid. Ask the recruiter for a fresh recAI link.",
  "weak-password": "Choose a password with at least 8 characters.",
};

const noticeMessages: Record<string, string> = {
  "already-joined": "You were already part of that recruiter candidate pool — your workspace is unchanged.",
  "joined-posting": "You were added to the recruiter candidate pool linked from that posting.",
  "signed-out": "You have been signed out of the candidate workspace.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const inputClass =
  "mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

export async function CandidateSignInPage({ searchParams }: CandidateSignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const joinCode = readSearchParam(resolvedSearchParams.join);

  if (isCandidateDatabaseConfigured()) {
    const existingSession = await getCandidateSession();
    if (existingSession) {
      if (joinCode) {
        const result = await joinCandidateToPostingByInviteCode(existingSession.id, joinCode);
        if (result.status === "invalid-invite") {
          redirect(`${appRoutes.candidateDashboard}?error=invalid-invite`);
        }
        redirect(
          `${appRoutes.candidateDashboard}?notice=${result.status === "joined" ? "joined-posting" : "already-joined"}`,
        );
      }
      redirect(appRoutes.candidateDashboard);
    }
  }

  const errorCode = readSearchParam(resolvedSearchParams.error);
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;

  return (
    <>
      <TopNav viewer={{ role: "guest" }} showSearch={false} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">
              Candidate entry
            </p>
            <h1 className="mt-1 max-w-2xl text-[30px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
              Build a profile that is backed by people, not just polished copy.
            </h1>
          </div>
          <Link
            className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
            href={appRoutes.home}
          >
            Back to landing
          </Link>
        </header>

        <div className="grid gap-3">
          {joinCode ? (
            <div className="rounded-[var(--r-lg)] border border-[color:var(--verified-bg-2)] bg-[color:var(--verified-bg)] px-5 py-3 text-[13px] text-[color:var(--ink)]">
              Sign in or create an account to join the recruiter candidate pool linked from that job posting.
            </div>
          ) : null}
          {errorMessage ? (
            <div className="rounded-[var(--r-lg)] border border-[#fecaca] bg-[#fef2f2] px-5 py-3 text-[13px] text-[#b91c1c]">
              {errorMessage}
            </div>
          ) : null}
          {noticeMessage ? (
            <div className="rounded-[var(--r-lg)] border border-[color:var(--verified-bg-2)] bg-[color:var(--verified-bg)] px-5 py-3 text-[13px] text-[color:var(--ink)]">
              {noticeMessage}
            </div>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHead eyebrow="Create account" />
            <CardPad>
              <form action="/api/candidate/auth/sign-up" className="grid gap-3" method="post">
                {joinCode ? <input name="joinCode" type="hidden" value={joinCode} /> : null}
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Full name
                  <input autoComplete="name" className={inputClass} name="fullName" placeholder="Maya Chen" required type="text" />
                </label>
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Email
                  <input autoComplete="email" className={inputClass} name="email" placeholder="maya@chen.dev" required type="email" />
                </label>
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Password
                  <input autoComplete="new-password" className={inputClass} minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
                </label>
                <button
                  className="mt-1 inline-flex items-center justify-center rounded-full bg-[color:var(--ink)] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                  type="submit"
                >
                  Create candidate account
                </button>
              </form>
            </CardPad>
          </Card>

          <Card>
            <CardHead eyebrow="Sign in" />
            <CardPad>
              <form action="/api/candidate/auth/sign-in" className="grid gap-3" method="post">
                {joinCode ? <input name="joinCode" type="hidden" value={joinCode} /> : null}
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Email
                  <input autoComplete="email" className={inputClass} name="email" placeholder="maya@chen.dev" required type="email" />
                </label>
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Password
                  <input autoComplete="current-password" className={inputClass} name="password" placeholder="Enter your password" required type="password" />
                </label>
                <button
                  className="mt-1 inline-flex items-center justify-center rounded-full bg-[color:var(--verified)] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                  type="submit"
                >
                  Sign in
                </button>
              </form>
            </CardPad>
          </Card>
        </div>
      </main>
    </>
  );
}
