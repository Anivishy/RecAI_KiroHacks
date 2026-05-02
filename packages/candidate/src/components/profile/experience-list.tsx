"use client";

import { useState } from "react";
import * as Icons from "@recai/shared/components/icons";
import {
  Card,
  CardHead,
  Mono,
  type ExperienceRow,
  type RecommendationSnippet,
} from "@recai/shared";
import { RecommendationCard } from "./recommendation-card";

type ExperienceListProps = {
  rows: ExperienceRow[];
  recommendations: RecommendationSnippet[];
};

export function ExperienceList({ rows, recommendations }: ExperienceListProps) {
  const [openId, setOpenId] = useState<string | null>(rows[0]?.id ?? null);
  const recById = new Map(recommendations.map((rec) => [rec.id, rec]));

  return (
    <Card>
      <CardHead
        eyebrow={`Experience · derived from ${recommendations.length} recommendations`}
        meta={<Mono>{rows.length} role{rows.length === 1 ? "" : "s"}</Mono>}
      />
      <div className="divide-y divide-[color:var(--hairline)]">
        {rows.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-[color:var(--ink-3)]">
            No verified roles yet. Once a recommender submits a recommendation, the role will appear here.
          </div>
        ) : null}

        {rows.map((row) => {
          const isOpen = openId === row.id;
          return (
            <div key={row.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : row.id)}
                className={`grid w-full grid-cols-[56px_1fr_auto] items-start gap-4 px-6 py-5 text-left transition ${
                  isOpen ? "bg-[color:var(--surface-2)]" : "hover:bg-[color:var(--surface-2)]"
                }`}
              >
                <div
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-[var(--r-md)] text-[18px] font-semibold text-white"
                  style={{ background: row.brandColor }}
                >
                  {row.company[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-[color:var(--ink)]">{row.role}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
                    <span>{row.company}</span>
                    <span className="text-[color:var(--verified)]">
                      <Icons.CheckBadge size={13} />
                    </span>
                  </div>
                  {row.shortBlurb ? (
                    <div className="mt-1 text-[13px] italic text-[color:var(--ink-3)]">
                      {row.shortBlurb}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--verified-bg)] px-2 py-1 text-[11px] font-medium text-[color:var(--verified)]">
                    <Icons.CheckBadge size={11} /> {row.recommendationIds.length} rec{row.recommendationIds.length === 1 ? "" : "s"}
                  </span>
                  <span
                    className={`text-[color:var(--ink-3)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  >
                    <Icons.Chevron size={18} />
                  </span>
                </div>
              </button>

              {isOpen ? (
                <div className="grid gap-3 bg-[color:var(--surface-2)] px-6 pb-6">
                  {row.recommendationIds.map((id) => {
                    const rec = recById.get(id);
                    return rec ? <RecommendationCard key={id} rec={rec} /> : null;
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
