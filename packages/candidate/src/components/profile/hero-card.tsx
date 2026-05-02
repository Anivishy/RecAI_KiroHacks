import Link from "next/link";
import type { ReactNode } from "react";
import * as Icons from "@recai/shared/components/icons";
import { Mono, appRoutes } from "@recai/shared";

export type HeroLink = {
  kind: "email" | "github" | "linkedin" | "website";
  label: string;
  href: string;
};

type HeroCardProps = {
  fullName: string;
  initials: string;
  headline?: string | null;
  location?: string | null;
  pronouns?: string | null;
  joinedLabel?: string | null;
  contactLinks: HeroLink[];
  bannerSlot?: ReactNode;
  primaryActionHref?: string;
  primaryActionLabel?: string;
  shareSlot?: ReactNode;
};

function linkIcon(kind: HeroLink["kind"]) {
  switch (kind) {
    case "email":
      return <Icons.Mail size={13} />;
    case "github":
      return <Icons.Github size={13} />;
    case "linkedin":
      return <Icons.Linkedin size={13} />;
    default:
      return <Icons.Globe size={13} />;
  }
}

export function HeroCard({
  fullName,
  initials,
  headline,
  location,
  pronouns,
  joinedLabel,
  contactLinks,
  bannerSlot,
  primaryActionHref = appRoutes.candidateRecommendationNew,
  primaryActionLabel = "Request a recommendation",
  shareSlot,
}: HeroCardProps) {
  return (
    <section className="card overflow-hidden">
      <div
        className="h-[132px] w-full"
        style={{
          background:
            "radial-gradient(circle at 25% 30%, rgba(14,107,79,0.08), transparent 60%), repeating-linear-gradient(45deg, rgba(21,32,28,0.04) 0 1px, transparent 1px 16px), var(--surface-2)",
        }}
      />
      <div className="flex flex-col gap-5 px-6 pb-6 sm:px-8 sm:pb-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-end gap-5">
            <div className="relative -mt-16">
              <div
                aria-hidden="true"
                className="flex h-32 w-32 items-center justify-center rounded-full border-[5px] border-[color:var(--surface)] bg-[color:var(--ink)] text-[28px] font-semibold text-white shadow-[var(--shadow-sm)]"
              >
                {initials}
              </div>
              <div className="absolute right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--verified)] text-white shadow">
                <Icons.Check size={12} />
              </div>
            </div>
            <div className="pt-1">
              <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
                {fullName}
              </h1>
              {headline ? (
                <p className="mt-1 max-w-xl text-[14px] leading-6 text-[color:var(--ink-2)]">
                  {headline}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px] text-[color:var(--ink-3)]">
                {location ? (
                  <span className="inline-flex items-center gap-1">
                    <Icons.Pin size={13} /> {location}
                  </span>
                ) : null}
                {pronouns ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[color:var(--ink-4)]" />
                    <span>{pronouns}</span>
                  </>
                ) : null}
                {joinedLabel ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-[color:var(--ink-4)]" />
                    <span className="inline-flex items-center gap-1">
                      <Icons.Calendar size={13} /> {joinedLabel}
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={primaryActionHref}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--ink)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
            >
              <Icons.Plus /> {primaryActionLabel}
            </Link>
            {shareSlot}
          </div>
        </div>

        {bannerSlot ?? (
          <div className="flex flex-wrap items-center gap-2 rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-3 py-2 text-[13px] text-[color:var(--ink-2)]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-3)]">
              Contact
            </span>
            {contactLinks.length > 0 ? (
              contactLinks.map((link) => (
                <a
                  key={link.kind}
                  href={link.href}
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-1 text-[12px] text-[color:var(--ink)] transition hover:border-[color:var(--hairline-2)]"
                  rel="noreferrer"
                  target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                >
                  {linkIcon(link.kind)} {link.label}
                </a>
              ))
            ) : (
              <span className="text-[12px] italic text-[color:var(--ink-3)]">
                No contact links yet
              </span>
            )}
            <Mono className="ml-auto text-[11px] text-[color:var(--ink-4)]">
              // candidate-entered · not indexed
            </Mono>
          </div>
        )}
      </div>
    </section>
  );
}
