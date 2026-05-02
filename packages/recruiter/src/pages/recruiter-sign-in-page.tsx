import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardHead, CardPad, TopNav, appRoutes } from "@recai/shared";
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

const inputClass =
  "mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

export async function RecruiterSignInPage({ searchParams }: RecruiterSignInPageProps) {
  if (isRecruiterDatabaseConfigured()) {
    const existing = await getRecruiterSession();
    if (existing) redirect(appRoutes.recruiterDashboard);
  }
  const resolved = await searchParams;
  const errorMessage = readSearchParam(resolved.error)
    ? errorMessages[readSearchParam(resolved.error)!]
    : null;
  const noticeMessage = readSearchParam(resolved.notice)
    ? noticeMessages[readSearchParam(resolved.notice)!]
    : null;

  return (
    <>
      <TopNav viewer={{ role: "guest" }} showSearch={false} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">Recruiter entry</p>
            <h1 className="mt-1 max-w-2xl text-[30px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
              Evaluate candidates through validated recommendation evidence.
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
              <form action="/api/recruiter/auth/sign-up" className="grid gap-3" method="post">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Full name
                    <input autoComplete="name" className={inputClass} name="fullName" placeholder="Jordan Ellis" required type="text" />
                  </label>
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Work email
                    <input autoComplete="email" className={inputClass} name="email" placeholder="jordan@company.com" required type="email" />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Company
                    <input autoComplete="organization" className={inputClass} name="company" placeholder="Northstar Systems" required type="text" />
                  </label>
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Title
                    <input autoComplete="organization-title" className={inputClass} name="title" placeholder="Lead Technical Recruiter" required type="text" />
                  </label>
                </div>
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Password
                  <input autoComplete="new-password" className={inputClass} minLength={8} name="password" placeholder="At least 8 characters" required type="password" />
                </label>
                <button
                  className="mt-1 inline-flex items-center justify-center rounded-full bg-[color:var(--ink)] px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                  type="submit"
                >
                  Create recruiter account
                </button>
              </form>
            </CardPad>
          </Card>

          <Card>
            <CardHead eyebrow="Sign in" />
            <CardPad>
              <form action="/api/recruiter/auth/sign-in" className="grid gap-3" method="post">
                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Work email
                  <input autoComplete="email" className={inputClass} name="email" placeholder="jordan@company.com" required type="email" />
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
