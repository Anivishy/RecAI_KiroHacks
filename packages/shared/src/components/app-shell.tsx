import Link from "next/link";
import type { ReactNode } from "react";

type Breadcrumb = {
  label: string;
  href?: string;
};

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
};

export function AppShell({
  eyebrow,
  title,
  description,
  children,
  actions,
  breadcrumbs,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-35" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 sm:px-8 lg:px-12">
        <header className="glass-panel rounded-[32px] border border-[color:var(--line)] px-6 py-7 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <Link
                className="text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent)]"
                href="/"
              >
                RecAI
              </Link>
              {breadcrumbs?.length ? (
                <nav className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[var(--muted)]">
                  {breadcrumbs.map((crumb, index) => (
                    <span key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                      {crumb.href ? (
                        <Link
                          className="transition hover:text-[var(--foreground)]"
                          href={crumb.href}
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span>{crumb.label}</span>
                      )}
                      {index < breadcrumbs.length - 1 ? <span>/</span> : null}
                    </span>
                  ))}
                </nav>
              ) : null}
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
                {eyebrow}
              </p>
              <h1 className="display-face mt-3 text-4xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
                {title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
                {description}
              </p>
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </header>
        <main className="flex flex-col gap-6">{children}</main>
      </div>
    </div>
  );
}
