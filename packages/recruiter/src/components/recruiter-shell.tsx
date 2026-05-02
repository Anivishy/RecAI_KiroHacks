import Link from "next/link";
import type { ReactNode } from "react";
import { appRoutes } from "@recai/shared";
import { RecruiterSignOutForm } from "./recruiter-sign-out-form";

type RecruiterShellProps = {
  children: ReactNode;
  recruiterName: string;
  recruiterCompany: string;
  pageTitle: string;
  pageSubtitle?: string;
  backHref?: string;
  backLabel?: string;
  headerActions?: ReactNode;
};

export function RecruiterShell({
  children,
  recruiterName,
  recruiterCompany,
  pageTitle,
  pageSubtitle,
  backHref,
  backLabel = "Back",
  headerActions,
}: RecruiterShellProps) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-pattern opacity-25" />

      <div className="relative flex min-h-screen flex-col">
        {/* Compact top navbar */}
        <header className="glass-panel sticky top-0 z-20 border-b border-[color:var(--line)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
            <Link
              className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
              href={appRoutes.home}
            >
              RecAI
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden text-sm text-[var(--muted)] sm:block">
                {recruiterName}
                <span className="mx-2 opacity-40">·</span>
                {recruiterCompany}
              </span>
              <RecruiterSignOutForm />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-6 py-8 sm:px-8">
          {/* Page title row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              {backHref ? (
                <Link
                  className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
                  href={backHref}
                >
                  <span>←</span>
                  <span>{backLabel}</span>
                </Link>
              ) : null}
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
                {pageTitle}
              </h1>
              {pageSubtitle ? (
                <p className="mt-1 text-sm text-[var(--muted)]">{pageSubtitle}</p>
              ) : null}
            </div>
            {headerActions ? (
              <div className="flex items-center gap-3">{headerActions}</div>
            ) : null}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
