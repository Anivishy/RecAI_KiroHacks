import Link from "next/link";
import type { CandidateAccount, CandidateBanner } from "@recai/shared";

type CandidateProfileHeroProps = {
  candidate: CandidateAccount;
  banner: CandidateBanner;
};

function getInitials(fullName: string): string {
  const parts = fullName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";

  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1][0] ?? "";
  return `${first}${last}`.toUpperCase();
}

type Pill = {
  key: string;
  filled: boolean;
  emptyLabel: string;
  filledLabel: string;
  href?: string;
};

function buildPills(banner: CandidateBanner): Pill[] {
  return [
    {
      key: "email",
      filled: Boolean(banner.email),
      emptyLabel: "＋ Add email",
      filledLabel: banner.email ?? "",
      href: banner.email ? `mailto:${banner.email}` : undefined,
    },
    {
      key: "github",
      filled: Boolean(banner.githubUrl),
      emptyLabel: "＋ Add GitHub",
      filledLabel: banner.githubUrl ?? "",
      href: banner.githubUrl ?? undefined,
    },
    {
      key: "linkedin",
      filled: Boolean(banner.linkedinUrl),
      emptyLabel: "＋ Add LinkedIn",
      filledLabel: banner.linkedinUrl ?? "",
      href: banner.linkedinUrl ?? undefined,
    },
    {
      key: "website",
      filled: Boolean(banner.websiteUrl),
      emptyLabel: "＋ Add personal website",
      filledLabel: banner.websiteUrl ?? "",
      href: banner.websiteUrl ?? undefined,
    },
  ];
}

export function CandidateProfileHero({
  candidate,
  banner,
}: CandidateProfileHeroProps) {
  const initials = getInitials(candidate.fullName);
  const pills = buildPills(banner);

  return (
    <section className="glass-panel overflow-hidden rounded-[32px] border border-[color:var(--line)]">
      <div className="cover-gradient h-24" />
      <div className="flex flex-col gap-5 px-6 pb-6 pt-0 sm:px-8 sm:pb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-5">
            <div
              aria-hidden="true"
              className="avatar-initials -mt-10 h-20 w-20 rounded-full text-2xl"
            >
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Candidate Workspace
              </p>
              <h1 className="display-face mt-1 text-3xl font-semibold tracking-[-0.025em] text-[var(--foreground)] sm:text-4xl">
                {candidate.fullName}
              </h1>
              <p className="mt-2 text-sm italic leading-6 text-[var(--muted)]">
                Your headline appears once verified recommendations are submitted.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              href={`/c/${candidate.slug}`}
            >
              View public profile
            </Link>
          </div>
        </div>

        <ul className="flex flex-wrap gap-2">
          {pills.map((pill) =>
            pill.filled && pill.href ? (
              <li key={pill.key}>
                <a
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(21,94,239,0.08)] px-3 py-2 text-xs font-semibold text-[var(--foreground)]"
                  href={pill.href}
                  rel="noreferrer"
                  target={pill.href.startsWith("mailto:") ? undefined : "_blank"}
                >
                  {pill.filledLabel}
                </a>
              </li>
            ) : (
              <li key={pill.key}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[rgba(95,112,134,0.06)] px-3 py-2 text-xs font-semibold italic text-[var(--muted)]">
                  {pill.emptyLabel}
                </span>
              </li>
            ),
          )}
        </ul>
      </div>
    </section>
  );
}
