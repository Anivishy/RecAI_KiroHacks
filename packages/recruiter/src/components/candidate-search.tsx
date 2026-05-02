"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { appRoutes, Card, Icons } from "@recai/shared";

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
          className="h-10 flex-1 rounded-xl border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 text-sm text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-3)] focus:border-[color:var(--verified)] focus:ring-1 focus:ring-[color:var(--verified)]"
          disabled={isLoading}
          placeholder='e.g. "Show me candidates with strong Python systems experience and ownership"'
          ref={inputRef}
          type="text"
        />
        <button
          className="h-10 shrink-0 rounded-xl bg-[color:var(--ink)] px-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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
              className="rounded-lg border border-[color:var(--hairline)] bg-[color:var(--surface)] px-3 py-1.5 text-xs text-[color:var(--ink-3)] transition hover:border-[color:var(--verified)] hover:text-[color:var(--verified)]"
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
        <p className="text-sm text-[color:var(--ink-3)]">Searching candidate pool…</p>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-[color:var(--ink-3)]">No matching candidates found.</p>
      )}

      {results && results.length > 0 && (
        <Card>
          <div className="flex flex-col divide-y divide-[color:var(--hairline)]">
            {results.map((r) => (
              <Link
                className="block px-5 py-4 transition hover:bg-[color:var(--surface-2)]"
                href={appRoutes.recruiterCandidateProfile(jobId, r.candidateSlug)}
                key={r.candidateSlug}
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-[color:var(--ink)]">
                      {r.candidateName}
                    </span>
                    <span
                      aria-label="Verified"
                      className="inline-flex items-center text-[color:var(--verified)]"
                      title="Verified"
                    >
                      <Icons.CheckBadge />
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="mono text-xs text-[color:var(--ink-3)]">
                      {(r.score * 100).toFixed(0)}% match
                    </span>
                    <span className="text-xs font-semibold text-[color:var(--ink)]">
                      Open →
                    </span>
                  </div>
                </div>
                {r.chunks.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {r.chunks.map((chunk, i) => (
                      <li
                        className="rounded-lg bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--ink-3)] leading-relaxed"
                        key={i}
                      >
                        {chunk}
                      </li>
                    ))}
                  </ul>
                )}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
