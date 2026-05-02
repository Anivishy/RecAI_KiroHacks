import Link from "next/link";
import type { ReactNode } from "react";
import { TopNav } from "@recai/shared";
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
    <>
      <TopNav
        viewer={{ role: "recruiter", fullName: recruiterName, company: recruiterCompany }}
        rightSlot={<RecruiterSignOutForm />}
      />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            {backHref ? (
              <Link
                className="mb-2 inline-flex items-center gap-1.5 text-[12px] font-medium text-[color:var(--ink-3)] transition hover:text-[color:var(--ink)]"
                href={backHref}
              >
                <span>←</span>
                <span>{backLabel}</span>
              </Link>
            ) : null}
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
              {pageTitle}
            </h1>
            {pageSubtitle ? (
              <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">{pageSubtitle}</p>
            ) : null}
          </div>
          {headerActions ? <div className="flex items-center gap-3">{headerActions}</div> : null}
        </div>
        {children}
      </main>
    </>
  );
}
