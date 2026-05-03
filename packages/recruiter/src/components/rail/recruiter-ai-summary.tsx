import { Mono } from "@recai/shared";
import * as Icons from "@recai/shared/components/icons";
import type { AISummaryResult } from "../../server/ai-summary";

const RELATIVE_DIVISIONS: Array<{ ms: number; label: string }> = [
  { ms: 60 * 1000, label: "moment" },
  { ms: 60 * 60 * 1000, label: "minute" },
  { ms: 24 * 60 * 60 * 1000, label: "hour" },
  { ms: 7 * 24 * 60 * 60 * 1000, label: "day" },
  { ms: 30 * 24 * 60 * 60 * 1000, label: "week" },
];

function formatRelative(date: Date): string {
  const diff = Math.max(0, Date.now() - date.getTime());
  if (diff < RELATIVE_DIVISIONS[0].ms) return "just now";
  for (let i = 1; i < RELATIVE_DIVISIONS.length; i += 1) {
    const division = RELATIVE_DIVISIONS[i];
    if (diff < division.ms) {
      const previous = RELATIVE_DIVISIONS[i - 1];
      const value = Math.round(diff / previous.ms);
      return `${value} ${previous.label}${value === 1 ? "" : "s"} ago`;
    }
  }
  const last = RELATIVE_DIVISIONS[RELATIVE_DIVISIONS.length - 1];
  const value = Math.round(diff / last.ms);
  return `${value} ${last.label}${value === 1 ? "" : "s"} ago`;
}

type Stats = {
  avgTraitScore: number;
  topTraitLabel: string;
  topTraitScore: number;
};

type RecruiterAISummaryProps = {
  summary: AISummaryResult;
  stats: Stats;
};

export function RecruiterAISummary({ summary, stats }: RecruiterAISummaryProps) {
  const isFallback = summary.model === "local-fallback";
  return (
    <section className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--hairline)] bg-[color:var(--surface)] shadow-[var(--shadow-sm)]">
      <div className="flex items-center justify-between gap-3 px-5 py-3 text-white" style={{ background: "var(--recruiter)" }}>
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em]">
          AI summary · synthesized from verified recs
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
          <Icons.Lock size={11} /> Recruiter-only
        </span>
      </div>
      <div className="grid gap-3 px-5 py-5 text-[14px] leading-6 text-[color:var(--ink-2)]">
        {summary.paragraphs.length === 0 ? (
          <p className="italic text-[color:var(--ink-3)]">
            No summary yet. The candidate has no submitted recommendations.
          </p>
        ) : (
          summary.paragraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
        )}
      </div>
      <div className="border-t border-dashed border-[color:var(--hairline)] px-5 py-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[color:var(--ink-3)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--verified)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--verified)]" />
            </span>
            <Mono>regenerated {formatRelative(summary.generatedAt)}</Mono>
          </span>
          <Mono>· {summary.recCount} recs in corpus</Mono>
          <Mono>· model: {summary.model}</Mono>
          {isFallback ? (
            <Mono className="text-[color:var(--ink-4)]">generated locally · bedrock unreachable</Mono>
          ) : null}
        </div>
      </div>
      <div className="grid grid-cols-3 border-t border-[color:var(--hairline)] text-[12px]">
        <div className="border-r border-[color:var(--hairline)] px-5 py-4">
          <div className="text-[24px] font-semibold text-[color:var(--ink)]">{stats.avgTraitScore}</div>
          <div className="text-[color:var(--ink-3)]">Avg trait score</div>
        </div>
        <div className="border-r border-[color:var(--hairline)] px-5 py-4">
          <div className="text-[24px] font-semibold text-[color:var(--ink)]">{summary.recCount}</div>
          <div className="text-[color:var(--ink-3)]">Verified recs</div>
        </div>
        <div className="px-5 py-4">
          <div className="text-[24px] font-semibold text-[color:var(--ink)]">{stats.topTraitScore}</div>
          <div className="text-[color:var(--ink-3)]">Top trait · {stats.topTraitLabel}</div>
        </div>
      </div>
    </section>
  );
}
