import {
  pentagonTraitMeta,
  type PentagonScoreMap,
} from "../lib/domain/types";

type Point = {
  x: number;
  y: number;
};

const CENTER = 120;
const OUTER_RADIUS = 82;

function getPoint(index: number, normalizedRadius: number): Point {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / pentagonTraitMeta.length;
  return {
    x: CENTER + normalizedRadius * Math.cos(angle),
    y: CENTER + normalizedRadius * Math.sin(angle),
  };
}

function polygonPoints(values: number[]): string {
  return values
    .map((value, index) => {
      const point = getPoint(index, (value / 5) * OUTER_RADIUS);
      return `${point.x},${point.y}`;
    })
    .join(" ");
}

export function PentagonChart({ scores }: { scores: PentagonScoreMap }) {
  const guides = [1, 2, 3, 4, 5];

  return (
    <section className="glass-panel rounded-[30px] border border-[color:var(--line)] p-6 sm:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="mx-auto w-full max-w-sm">
          <svg viewBox="0 0 240 240" className="w-full">
            {guides.map((guide) => (
              <polygon
                key={guide}
                points={polygonPoints(Array(pentagonTraitMeta.length).fill(guide))}
                fill="none"
                stroke="rgba(16,35,61,0.10)"
                strokeWidth="1"
              />
            ))}

            {pentagonTraitMeta.map((trait, index) => {
              const point = getPoint(index, OUTER_RADIUS);

              return (
                <line
                  key={trait.id}
                  x1={CENTER}
                  y1={CENTER}
                  x2={point.x}
                  y2={point.y}
                  stroke="rgba(16,35,61,0.10)"
                  strokeWidth="1"
                />
              );
            })}

            <polygon
              points={polygonPoints(
                pentagonTraitMeta.map((trait) => scores[trait.id]),
              )}
              fill="rgba(21,94,239,0.22)"
              stroke="rgba(21,94,239,0.95)"
              strokeWidth="3"
            />

            {pentagonTraitMeta.map((trait, index) => {
              const point = getPoint(index, (scores[trait.id] / 5) * OUTER_RADIUS);
              const labelPoint = getPoint(index, OUTER_RADIUS + 26);

              return (
                <g key={trait.id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4.5"
                    fill="rgba(21,94,239,1)"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    textAnchor="middle"
                    className="fill-[var(--foreground)] text-[10px] font-semibold uppercase tracking-[0.22em]"
                  >
                    {trait.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            Pentagon Preview
          </p>
          <h2 className="display-face mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
            Five recruiter-relevant traits
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            Each score summarizes recommendation-backed evidence across the traits that
            matter most in recruiter review.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {pentagonTraitMeta.map((trait) => (
              <div
                key={trait.id}
                className="rounded-[20px] border border-[color:var(--line)] bg-white/75 px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {trait.label}
                  </p>
                  <p className="text-sm font-semibold text-[var(--accent-strong)]">
                    {scores[trait.id]} / 5
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {trait.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
