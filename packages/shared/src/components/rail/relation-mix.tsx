import { Card, CardHead, CardPadTight } from "../card";
import { Mono } from "../mono";
import type { RelationMixEntry } from "../../lib/profile-derivations";

export function RelationMix({ entries }: { entries: RelationMixEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  const total = entries.reduce((sum, e) => sum + e.count, 0);
  return (
    <Card>
      <CardHead eyebrow="Relation mix" meta={<Mono>n={total}</Mono>} />
      <CardPadTight>
        <div className="grid gap-2">
          {entries.length === 0 ? (
            <p className="text-[13px] italic text-[color:var(--ink-3)]">No recommendations yet.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.label} className="grid grid-cols-[1fr_minmax(80px,160px)_auto] items-center gap-3 text-[13px]">
                <span className="text-[color:var(--ink-2)]">{entry.label}</span>
                <span className="block h-[6px] w-full rounded-full bg-[color:var(--score-track)]">
                  <span
                    className="block h-full rounded-full bg-[color:var(--ink)]"
                    style={{ width: `${(entry.count / max) * 100}%` }}
                  />
                </span>
                <Mono className="w-6 text-right text-[12px] text-[color:var(--ink-2)]">{entry.count}</Mono>
              </div>
            ))
          )}
        </div>
      </CardPadTight>
    </Card>
  );
}
