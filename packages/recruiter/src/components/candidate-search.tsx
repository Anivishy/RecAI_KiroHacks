"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { appRoutes } from "@recai/shared";

type SearchResult = {
  candidateSlug: string;
  candidateName: string;
  score: number;
  chunks: string[];
};

type CandidateSearchProps = {
  jobId: string;
};

export function CandidateSearch({ jobId }: CandidateSearchProps) {
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function runSearch(query: string) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/recruiter/jobs/${jobId}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResults(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = inputRef.current?.value.trim();
    if (!query || isLoading) return;
    runSearch(query);
  }

  const exampleQueries = [
    "Strong Python systems experience and clear ownership",
    "Cross-functional leadership with measurable execution",
    "Backend engineers who communicate well with product teams",
  ];

  return (
    <div className="flex flex-col gap-4">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <input
          className="h-10 flex-1 rounded-xl border border-(--line) bg-white/90 px-3 text-sm text-foreground outline-none transition placeholder:text-(--muted) focus:border-(--accent) focus:ring-1 focus:ring-(--accent)"
          disabled={isLoading}
          placeholder='e.g. "Show me candidates with strong Python systems experience and ownership"'
          ref={inputRef}
          type="text"
        />
        <button
          className="h-10 shrink-0 rounded-xl bg-(--accent) px-4 text-sm font-semibold text-white transition hover:bg-foreground disabled:opacity-50"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Searching…" : "Search"}
        </button>
      </form>

      {!results && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {exampleQueries.map((q) => (
            <button
              className="rounded-lg border border-(--line) bg-white/70 px-3 py-1.5 text-xs text-(--muted) transition hover:border-(--accent) hover:text-(--accent)"
              key={q}
              onClick={() => {
                if (inputRef.current) inputRef.current.value = q;
                runSearch(q);
              }}
              type="button"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {isLoading && (
        <p className="text-sm text-(--muted)">Searching candidate pool…</p>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-(--muted)">No matching candidates found.</p>
      )}

      {results && results.length > 0 && (
        <div className="flex flex-col divide-y divide-(--line)">
          {results.map((r) => (
            <div className="py-4 first:pt-0" key={r.candidateSlug}>
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-sm text-foreground">
                    {r.candidateName}
                  </span>
                  <Link
                    className="rounded-full border border-(--line) bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-(--accent) hover:text-(--accent)"
                    href={appRoutes.recruiterCandidateProfile(jobId, r.candidateSlug)}
                  >
                    Open review
                  </Link>
                </div>
                <span className="text-xs text-(--muted) tabular-nums">
                  {(r.score * 100).toFixed(0)}% match
                </span>
              </div>
              {r.chunks.length > 0 && (
                <ul className="flex flex-col gap-1">
                  {r.chunks.map((chunk, i) => (
                    <li
                      className="rounded-lg bg-white/60 px-3 py-2 text-xs text-(--muted) leading-relaxed"
                      key={i}
                    >
                      {chunk}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
