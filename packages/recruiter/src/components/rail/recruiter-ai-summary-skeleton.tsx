export function RecruiterAISummarySkeleton() {
  return (
    <section className="overflow-hidden rounded-[var(--r-lg)] border border-[color:var(--hairline)] bg-[color:var(--surface)] shadow-[var(--shadow-sm)]">
      <div
        className="flex items-center justify-between gap-3 px-5 py-3 text-white"
        style={{ background: "var(--recruiter)" }}
      >
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em]">
          AI summary · synthesized from verified recs
        </h3>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-medium">
          Recruiter-only
        </span>
      </div>
      <div className="grid gap-3 px-5 py-5 text-[14px] leading-6 text-[color:var(--ink-3)]">
        <p className="italic">Generating AI summary…</p>
        <div className="animate-pulse space-y-2">
          <div className="h-3 rounded bg-[color:var(--hairline)]" />
          <div className="h-3 w-5/6 rounded bg-[color:var(--hairline)]" />
          <div className="h-3 w-4/6 rounded bg-[color:var(--hairline)]" />
        </div>
        <div className="animate-pulse space-y-2">
          <div className="h-3 rounded bg-[color:var(--hairline)]" />
          <div className="h-3 w-3/4 rounded bg-[color:var(--hairline)]" />
        </div>
      </div>
      <div className="border-t border-dashed border-[color:var(--hairline)] px-5 py-3">
        <div className="animate-pulse h-3 w-48 rounded bg-[color:var(--hairline)]" />
      </div>
      <div className="grid grid-cols-3 border-t border-[color:var(--hairline)] text-[12px]">
        <div className="border-r border-[color:var(--hairline)] px-5 py-4">
          <div className="h-7 w-10 animate-pulse rounded bg-[color:var(--hairline)]" />
          <div className="mt-1 text-[color:var(--ink-3)]">Avg trait score</div>
        </div>
        <div className="border-r border-[color:var(--hairline)] px-5 py-4">
          <div className="h-7 w-6 animate-pulse rounded bg-[color:var(--hairline)]" />
          <div className="mt-1 text-[color:var(--ink-3)]">Verified recs</div>
        </div>
        <div className="px-5 py-4">
          <div className="h-7 w-10 animate-pulse rounded bg-[color:var(--hairline)]" />
          <div className="mt-1 text-[color:var(--ink-3)]">Top trait</div>
        </div>
      </div>
    </section>
  );
}
