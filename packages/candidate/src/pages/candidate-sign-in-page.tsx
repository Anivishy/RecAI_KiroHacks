import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
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
  "invalid-credentials":
    "That email and password combination did not match a candidate account.",
  "invalid-email": "Enter a valid email to create the candidate account.",
  "missing-fields": "Fill out all required candidate account fields to continue.",
  "server-error":
    "Something went wrong while contacting candidate auth. Please try again.",
  "setup-required":
    "Candidate account access is temporarily unavailable. Please try again shortly.",
  "invalid-invite":
    "That recruiter invite code is no longer valid. Ask the recruiter for a fresh RecAI link.",
  "weak-password": "Choose a password with at least 8 characters.",
};

const noticeMessages: Record<string, string> = {
  "already-joined":
    "You were already part of that recruiter candidate pool, so we sent you back to your workspace.",
  "joined-posting":
    "You were added to the recruiter candidate pool linked from that posting.",
  "signed-out": "You have been signed out of the candidate workspace.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export async function CandidateSignInPage({
  searchParams,
}: CandidateSignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const joinCode = readSearchParam(resolvedSearchParams.join);

  if (isCandidateDatabaseConfigured()) {
    const existingSession = await getCandidateSession();

    if (existingSession) {
      if (joinCode) {
        const result = await joinCandidateToPostingByInviteCode(
          existingSession.id,
          joinCode,
        );

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
    <AppShell
      eyebrow="Candidate Entry"
      title="Build a profile that is backed by people, not just polished copy."
      description="Create an account to manage your profile banner, request verified recommendations, and decide which trusted voices appear on your page."
      actions={
        <Link
          className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          href={appRoutes.home}
        >
          Back to landing
        </Link>
      }
    >
      <div className="grid gap-4">
        {joinCode ? (
          <div className="rounded-[24px] border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.10)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            Sign in or create an account to join the recruiter candidate pool linked from
            that job posting.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div className="rounded-[24px] border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.10)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {noticeMessage}
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <SectionCard
          eyebrow="Create Account"
          title="Open candidate signup"
          description="Create a candidate account so you can manage your profile banner and the recommendations that appear on your public profile."
        >
          <form action="/api/candidate/auth/sign-up" className="grid gap-4" method="post">
            {joinCode ? <input name="joinCode" type="hidden" value={joinCode} /> : null}
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Full name
              <input
                autoComplete="name"
                className={inputClassName}
                name="fullName"
                placeholder="Maya Chen"
                required
                type="text"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="maya@chen.dev"
                required
                type="email"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Password
              <input
                autoComplete="new-password"
                className={inputClassName}
                minLength={8}
                name="password"
                placeholder="At least 8 characters"
                required
                type="password"
              />
            </label>

            <button
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Create candidate account
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Sign In"
          title="Return to your candidate workspace"
          description="Existing candidates sign in here and return to their workspace."
        >
          <form action="/api/candidate/auth/sign-in" className="grid gap-4" method="post">
            {joinCode ? <input name="joinCode" type="hidden" value={joinCode} /> : null}
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="maya@chen.dev"
                required
                type="email"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Password
              <input
                autoComplete="current-password"
                className={inputClassName}
                name="password"
                placeholder="Enter your password"
                required
                type="password"
              />
            </label>

            <button
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--foreground)]"
              type="submit"
            >
              Sign in to candidate workspace
            </button>
          </form>

          <div className="mt-5 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Your candidate workspace is where you manage the contact links recruiters see,
              request verified recommendations, and review the recommendations submitted
              about your work.
            </p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
