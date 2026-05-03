import Link from "next/link";
import type { ReactNode } from "react";
import { appRoutes } from "../lib/routes";
import * as Icons from "./icons";

export type TopNavViewer =
  | { role: "guest" }
  | { role: "candidate"; fullName: string }
  | { role: "recruiter"; fullName: string; company: string }
  | { role: "recommender" };

type TopNavProps = {
  viewer: TopNavViewer;
  rightSlot?: ReactNode;
  showSearch?: boolean;
};

function getInitials(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

export function TopNav({ viewer, rightSlot, showSearch = false }: TopNavProps) {
  return (
    <nav className="sticky top-0 z-30 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/80 backdrop-blur-[10px] backdrop-saturate-[140%]">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-5 px-6 sm:px-8">
        <Link href={appRoutes.home} className="flex items-center gap-2 font-semibold text-[var(--ink)]">
          <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-[var(--ink)] text-[12px] font-semibold text-white">
            R
            <span className="absolute -right-1 -bottom-1 h-[6px] w-[6px] rounded-full bg-[var(--verified)]" />
          </span>
          <span className="text-[14px] tracking-[-0.01em]">recAI</span>
        </Link>

        {showSearch ? (
          <div className="ml-2 hidden flex-1 items-center gap-2 rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-3 py-1.5 text-[13px] text-[color:var(--ink-3)] sm:flex">
            <Icons.Search size={14} />
            <input
              aria-label="Search candidates, companies, and traits"
              placeholder="Search candidates, companies, traits…"
              className="flex-1 bg-transparent outline-none placeholder:text-[color:var(--ink-4)]"
            />
            <span className="mono text-[11px] text-[color:var(--ink-4)]">⌘K</span>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        <div className="flex items-center gap-3 text-[13px] text-[color:var(--ink-2)]">
          {rightSlot}
          {viewer.role === "candidate" ? (
            <Link className="hover:text-[var(--ink)]" href={appRoutes.candidateGroups}>
              Groups
            </Link>
          ) : null}
          {viewer.role === "recruiter" ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-[color:var(--recruiter)] px-3 py-1 text-[12px] font-medium text-white">
              <span className="relative flex h-[7px] w-[7px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--verified)] opacity-60" />
                <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-[var(--verified)]" />
              </span>
              Recruiter view · {viewer.company}
            </span>
          ) : null}
          {viewer.role === "candidate" || viewer.role === "recruiter" ? (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--ink)] text-[11px] font-semibold text-white">
              {getInitials(viewer.fullName)}
            </span>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
