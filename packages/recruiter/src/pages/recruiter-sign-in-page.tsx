import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import {
  getRecruiterSession,
  isRecruiterDatabaseConfigured,
} from "../server/recruiter-auth";

type RecruiterSignInPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
  }>;
};

const errorMessages: Record<string, string> = {
  "auth-required": "Sign in to access the recruiter portal.",
  "email-in-use": "That recruiter email already has an account.",
  "invalid-credentials": "That email and password combination did not match a recruiter account.",
  "invalid-email": "Enter a valid work email to create the recruiter account.",
  "missing-fields": "Fill out all required recruiter account fields to continue.",
  "server-error": "Something went wrong while contacting recruiter auth. Please try again.",
  "setup-required": "Recruiter account access is temporarily unavailable. Please try again shortly.",
  "weak-password": "Choose a password with at least 8 characters.",
};

const noticeMessages: Record<string, string> = {
  "signed-out": "You have been signed out of the recruiter portal.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

export async function RecruiterSignInPage({
  searchParams,
}: RecruiterSignInPageProps) {
  if (isRecruiterDatabaseConfigured()) {
    const existingSession = await getRecruiterSession();

    if (existingSession) {
      redirect(appRoutes.recruiterDashboard);
    }
  }

  const resolvedSearchParams = await searchParams;
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;

  return (
    <AppShell
      eyebrow="Recruiter Entry"
      title="Create a recruiter account and start evaluating candidates through validated signals."
      description="Create a recruiter account, open your job posting workspace, and review candidates through validated recommendation evidence."
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
          title="Open recruiter signup"
          description="Create a recruiter account so you can manage job postings and evaluate candidates through validated experience signals."
        >
          <form action="/api/recruiter/auth/sign-up" className="grid gap-4" method="post">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Full name
                <input
                  autoComplete="name"
                  className={inputClassName}
                  name="fullName"
                  placeholder="Jordan Ellis"
                  required
                  type="text"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Work email
                <input
                  autoComplete="email"
                  className={inputClassName}
                  name="email"
                  placeholder="jordan@company.com"
                  required
                  type="email"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Company
                <input
                  autoComplete="organization"
                  className={inputClassName}
                  name="company"
                  placeholder="Northstar Systems"
                  required
                  type="text"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Title
                <input
                  autoComplete="organization-title"
                  className={inputClassName}
                  name="title"
                  placeholder="Lead Technical Recruiter"
                  required
                  type="text"
                />
              </label>
            </div>

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
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold transition hover:bg-(--accent-strong)"
              style={{ color: "white" }}
              type="submit"
            >
              Create recruiter account
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Sign In"
          title="Return to the recruiter portal"
          description="Existing recruiter accounts sign in here and return to their recruiter workspace."
        >
          <form action="/api/recruiter/auth/sign-in" className="grid gap-4" method="post">
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Work email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="jordan@company.com"
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
              className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold transition hover:bg-[var(--foreground)]"
              style={{ color: "white" }}
              type="submit"
            >
              Sign in to recruiter portal
            </button>
          </form>

          <div className="mt-5 rounded-[24px] border border-[color:var(--line)] bg-[rgba(15,118,110,0.08)] p-5">
            <p className="text-sm leading-6 text-[var(--muted)]">
              Recruiter accounts are designed around posting-specific talent pools,
              evidence-backed search, and fast access to candidate review pages.
            </p>
          </div>
        </SectionCard>
      </div>
    </AppShell>
  );
}
