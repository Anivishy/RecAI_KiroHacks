import * as Icons from "../icons";
import { Mono } from "../mono";
import type { TrustStats } from "../../lib/profile-derivations";

export function TrustCard({ stats }: { stats: TrustStats }) {
  return (
    <section
      className="overflow-hidden rounded-[var(--r-lg)] text-[color:var(--verified-bg)] shadow-[var(--shadow-sm)]"
      style={{ background: "linear-gradient(135deg, var(--verified) 0%, var(--verified-2) 100%)" }}
    >
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--verified-bg)]/80">
          Recommendation trust
        </h3>
        <Mono className="text-[11px] text-white/50">v1 · sig</Mono>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-baseline gap-1 text-white">
          <span className="text-[44px] font-semibold leading-none tracking-[-0.02em]">{stats.totalRecs}</span>
          <span className="text-[12px] uppercase tracking-[0.12em] text-white/70">verified</span>
        </div>
        <p className="mt-1 text-[13px] leading-5 text-white/80">
          recommendations across {stats.verifiedDomains} independent verified domain{stats.verifiedDomains === 1 ? "" : "s"}
        </p>
        <div className="mt-4 grid gap-2 text-[13px] leading-5 text-white/85">
          <div className="flex items-center gap-2">
            <span>
              {stats.managerRecs} manager · {stats.peerRecs} peer · {Math.max(0, stats.totalRecs - stats.managerRecs - stats.peerRecs)} other
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Each domain confirmed against verified-company directory</span>
          </div>
          <div className="flex items-center gap-2">
            <span>No candidate-authored content surfaces in scoring</span>
          </div>
        </div>
      </div>
    </section>
  );
}
