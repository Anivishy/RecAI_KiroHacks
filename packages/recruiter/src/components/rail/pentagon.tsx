"use client";

import { useState } from "react";
import { Card, CardHead, Mono, type PentagonTrait } from "@recai/shared";

type PentagonProps = {
  traits: PentagonTrait[];
  label?: string;
};

const W = 460;
const H = 340;
const cx = W / 2;
const cy = H / 2 + 6;
const R = 108;

function vertex(i: number, total: number, r: number): [number, number] {
  const angle = -Math.PI / 2 + (i * 2 * Math.PI) / total;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function ringPoints(total: number, factor: number): string {
  return Array.from({ length: total }, (_, i) => {
    const [x, y] = vertex(i, total, R * factor);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function TraitDetail({ trait }: { trait: PentagonTrait }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <Mono className="text-[11px] uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
          {trait.name} · bedrock scoring
        </Mono>
        {trait.confidence !== undefined ? (
          <Mono className="text-[11px] text-[color:var(--verified)]">
            {trait.confidence}/100 conf
          </Mono>
        ) : null}
      </div>
      {trait.rationale ? (
        <p className="text-[13px] leading-5 text-[color:var(--ink-2)]">
          {trait.rationale}
        </p>
      ) : null}
      {trait.projects[0] ? (
        <div className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-3 py-2.5">
          <Mono className="text-[10px] uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
            {trait.projects[0].name}
          </Mono>
          <p className="mt-1 line-clamp-4 text-[12px] leading-5 text-[color:var(--ink-2)]">
            {trait.projects[0].description}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function Pentagon({ traits, label }: PentagonProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const active = pinned ?? hovered;
  const total = traits.length;
  const dataPoints = traits.map((t, i) => vertex(i, total, R * (t.score / 100)));
  const dataPath = dataPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const labelPositions = traits.map((_, i) => vertex(i, total, R + 22));
  const activeTrait = active !== null ? traits[active] : null;
  const avg =
    traits.length === 0
      ? 0
      : Math.round(traits.reduce((sum, t) => sum + t.score, 0) / traits.length);

  function handleClick(i: number) {
    setPinned((prev) => (prev === i ? null : i));
  }

  return (
    <Card>
      <CardHead
        eyebrow={label ?? "Trait pentagon · recruiter view"}
        meta={<Mono>avg {avg} · n={traits.length}</Mono>}
      />
      <div className="px-2 pt-2 pb-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height={H}
          preserveAspectRatio="xMidYMid meet"
        >
          {[0.25, 0.5, 0.75, 1.0].map((factor) => (
            <polygon
              key={factor}
              points={ringPoints(total, factor)}
              fill="none"
              stroke="var(--hairline)"
              strokeWidth={factor === 1 ? 1.25 : 1}
              strokeDasharray={factor === 1 ? undefined : "2 4"}
            />
          ))}
          {traits.map((_, i) => {
            const [x, y] = vertex(i, total, R);
            return (
              <line
                key={`spoke-${i}`}
                x1={cx}
                y1={cy}
                x2={x}
                y2={y}
                stroke="var(--hairline)"
                strokeWidth={1}
                strokeDasharray="2 4"
              />
            );
          })}
          <polygon
            points={dataPath}
            fill="var(--verified)"
            fillOpacity={0.1}
            stroke="var(--verified)"
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          {dataPoints.map(([x, y], i) => {
            const isActive = active === i;
            const isPinned = pinned === i;
            return (
              <g
                key={`vertex-${i}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(i)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={y} r={14} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 5 : 3.5}
                  fill={isPinned ? "var(--verified)" : isActive ? "var(--verified)" : "var(--ink)"}
                  stroke={isPinned ? "var(--verified)" : "var(--surface)"}
                  strokeWidth={2}
                />
                {isPinned ? (
                  <circle
                    cx={x}
                    cy={y}
                    r={9}
                    fill="none"
                    stroke="var(--verified)"
                    strokeWidth={1.5}
                    strokeOpacity={0.4}
                  />
                ) : null}
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={2} fill="var(--ink-4)" />
          {traits.map((trait, i) => {
            const [lx, ly] = labelPositions[i];
            const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx < cx ? "end" : "start";
            const isActive = active === i;
            const isPinned = pinned === i;
            return (
              <g
                key={`label-${trait.id}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleClick(i)}
                style={{ cursor: "pointer" }}
              >
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  style={{
                    fill: isPinned ? "var(--verified)" : isActive ? "var(--ink)" : "var(--ink-2)",
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    letterSpacing: "0.02em",
                  }}
                >
                  {trait.name}
                </text>
                <text
                  x={lx}
                  y={ly + 14}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  className="mono"
                  style={{ fill: "var(--ink-3)", fontSize: 11 }}
                >
                  {trait.score}/100
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="border-t border-dashed border-[color:var(--hairline)] px-5 py-3 text-[13px]">
        {activeTrait ? (
          <div>
            {pinned !== null ? (
              <button
                onClick={() => setPinned(null)}
                className="mb-2 text-[11px] text-[color:var(--ink-4)] hover:text-[color:var(--ink-2)] transition-colors"
              >
                ✕ close
              </button>
            ) : null}
            <TraitDetail trait={activeTrait} />
          </div>
        ) : (
          <Mono className="text-[12px] text-[color:var(--ink-4)]">
            Hover to preview · click to pin
          </Mono>
        )}
      </div>
    </Card>
  );
}
