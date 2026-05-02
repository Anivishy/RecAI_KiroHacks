"use client";

import { useState } from "react";
import * as Icons from "@recai/shared/components/icons";
import {
  Mono,
  companyToDomain,
  recommenderBrandColor,
  type RecommendationSnippet,
} from "@recai/shared";

type RecommendationCardProps = {
  rec: RecommendationSnippet;
};

function getInitials(fullName: string) {
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return `${first}${last}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecommendationCard({ rec }: RecommendationCardProps) {
  const [tab, setTab] = useState<"overview" | "projects">("overview");
  const brand = recommenderBrandColor(rec.company);
  const domain = companyToDomain(rec.company);
  const projects = rec.projectTitles ?? [];

  return (
    <article className="rounded-[var(--r-lg)] border border-[color:var(--hairline)] bg-[color:var(--surface)]">
      <header className="grid grid-cols-[44px_1fr_auto] items-start gap-3 px-5 pt-4 pb-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full text-[13px] font-semibold text-white"
          style={{ background: brand }}
        >
          {getInitials(rec.recommenderName)}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[color:var(--ink)]">{rec.recommenderName}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-[color:var(--ink-2)]">
            <span>
              {rec.recommenderTitle} at <strong className="font-semibold text-[color:var(--ink)]">{rec.company}</strong>
            </span>
            <span className="rounded-full border border-[color:var(--hairline)] px-2 py-0.5 text-[11px] text-[color:var(--ink-3)]">
              {rec.relationship}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--verified-bg)] px-2 py-1 text-[11px] font-medium text-[color:var(--verified)]">
            <span className="text-[color:var(--verified)]">
              <Icons.CheckBadge size={12} />
            </span>
            Verified · {domain}
          </span>
          <Mono className="text-[11px] text-[color:var(--ink-4)]">{formatDate(rec.submittedAt)}</Mono>
        </div>
      </header>

      <div className="flex gap-4 border-y border-[color:var(--hairline)] px-5">
        <button
          type="button"
          onClick={() => setTab("overview")}
          className={`relative py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition ${
            tab === "overview" ? "text-[color:var(--ink)]" : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]"
          }`}
        >
          Overview
          {tab === "overview" ? (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[color:var(--ink)]" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("projects")}
          className={`relative py-2.5 text-[12px] font-semibold uppercase tracking-[0.12em] transition ${
            tab === "projects" ? "text-[color:var(--ink)]" : "text-[color:var(--ink-3)] hover:text-[color:var(--ink-2)]"
          }`}
        >
          Projects <Mono className="ml-1 text-[11px] text-[color:var(--ink-3)]">{projects.length}</Mono>
          {tab === "projects" ? (
            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[color:var(--ink)]" />
          ) : null}
        </button>
      </div>

      <div className="px-5 py-4 text-[14px] leading-6 text-[color:var(--ink-2)]">
        {tab === "overview" ? (
          <div className="grid gap-4">
            <section>
              <h5 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">Technical feedback</h5>
              <p className="mt-1.5 whitespace-pre-line">{rec.summary}</p>
            </section>
            {rec.skillsMentioned.length > 0 ? (
              <section>
                <h5 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">Skills mentioned</h5>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rec.skillsMentioned.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-2.5 py-1 text-[11px] text-[color:var(--ink-2)]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-3">
            {projects.length > 0 ? (
              projects.map((project, idx) => (
                <div
                  key={`${project}-${idx}`}
                  className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <strong className="text-[14px] text-[color:var(--ink)]">{project}</strong>
                    <Mono className="text-[11px] text-[color:var(--ink-3)]">
                      // project {String(idx + 1).padStart(2, "0")}
                    </Mono>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[13px] italic text-[color:var(--ink-3)]">
                No project entries on this recommendation.
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
