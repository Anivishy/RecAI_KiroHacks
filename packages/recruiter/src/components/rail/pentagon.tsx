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

export function Pentagon({ traits, label }: PentagonProps) {
  const [active, setActive] = useState<number | null>(null);
  const total = traits.length;
  const dataPoints = traits.map((t, i) => vertex(i, total, R * (t.score / 100)));
  const dataPath = dataPoints.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const labelPositions = traits.map((_, i) => vertex(i, total, R + 22));
  const activeTrait = active !== null ? traits[active] : null;
  const avg =
    traits.length === 0
      ? 0
      : Math.round(traits.reduce((sum, t) => sum + t.score, 0) / traits.length);

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
            return (
              <g
                key={`vertex-${i}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                tabIndex={0}
                style={{ cursor: "pointer" }}
              >
                <circle cx={x} cy={y} r={14} fill="transparent" />
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 5 : 3.5}
                  fill={isActive ? "var(--verified)" : "var(--ink)"}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={2} fill="var(--ink-4)" />
          {traits.map((trait, i) => {
            const [lx, ly] = labelPositions[i];
            const anchor = Math.abs(lx - cx) < 4 ? "middle" : lx < cx ? "end" : "start";
            const isActive = active === i;
            return (
              <g
                key={`label-${trait.id}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                style={{ cursor: "pointer" }}
              >
                <text
                  x={lx}
                  y={ly}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  style={{
                    fill: isActive ? "var(--ink)" : "var(--ink-2)",
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
        {activeTrait && (activeTrait.rationale ?? activeTrait.projects[0]) ? (
          <>
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <Mono className="uppercase tracking-[0.08em] text-[color:var(--ink-3)]">
                {activeTrait.rationale ? `${activeTrait.name} · reasoning` : `Top match · ${activeTrait.name}`}
              </Mono>
              {activeTrait.rationale && activeTrait.confidence !== undefined ? (
                <Mono className="text-[color:var(--verified)]">
                  {activeTrait.confidence}/100 conf
                </Mono>
              ) : activeTrait.projects[0] ? (
                <Mono className="text-[color:var(--verified)]">
                  {activeTrait.projects[0].similarity.toFixed(2)} sim
                </Mono>
              ) : null}
            </div>
            <div className="mt-1.5">
              {activeTrait.rationale ? (
                <p className="mt-1 line-clamp-4 text-[13px] leading-5 text-[color:var(--ink-2)]">
                  {activeTrait.rationale}
                </p>
              ) : activeTrait.projects[0] ? (
                <>
                  <strong className="text-[13px] text-[color:var(--ink)]">
                    {activeTrait.projects[0].name}
                  </strong>
                  <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-[color:var(--ink-2)]">
                    {activeTrait.projects[0].description}
                  </p>
                </>
              ) : null}
            </div>
          </>
        ) : (
          <Mono className="text-[12px] text-[color:var(--ink-4)]">
            // hover a vertex to inspect
          </Mono>
        )}
      </div>
    </Card>
  );
}
