import * as Icons from "../icons";
import { Card, CardHead, CardPadTight } from "../card";
import { Mono } from "../mono";
import type { DomainEntry } from "../../lib/profile-derivations";

export function VerifiedDomains({ domains }: { domains: DomainEntry[] }) {
  return (
    <Card>
      <CardHead eyebrow="Verified domains" meta={<Mono>{domains.length}</Mono>} />
      <CardPadTight>
        <div className="grid gap-2">
          {domains.length === 0 ? (
            <p className="text-[13px] italic text-[color:var(--ink-3)]">No verified domains yet.</p>
          ) : (
            domains.map((domain) => (
              <div key={domain.label} className="flex items-center justify-between text-[13px]">
                <span className="inline-flex items-center gap-2">
                  <span className="text-[color:var(--verified)]"><Icons.CheckBadge size={14} /></span>
                  <Mono className="text-[12.5px] text-[color:var(--ink)]">{domain.label}</Mono>
                </span>
                <Mono className="text-[12px] text-[color:var(--ink-2)]">{domain.count}</Mono>
              </div>
            ))
          )}
        </div>
      </CardPadTight>
    </Card>
  );
}
