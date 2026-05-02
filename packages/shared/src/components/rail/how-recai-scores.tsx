import { Card, CardHead, CardPadTight } from "../card";
import { Mono } from "../mono";

export function HowRecAIScores() {
  return (
    <Card>
      <CardHead eyebrow="How recAI scores" />
      <CardPadTight>
        <ol className="grid gap-3 text-[13px] leading-5 text-[color:var(--ink-2)]">
          <li>
            <Mono className="mr-1 text-[11px] text-[color:var(--ink-3)]">// step 01</Mono>
            Each recommendation is split into technical, behavioral, and project units before indexing.
          </li>
          <li>
            <Mono className="mr-1 text-[11px] text-[color:var(--ink-3)]">// step 02</Mono>
            Indexed units are scored against trait embeddings to surface the strongest evidence per trait.
          </li>
          <li>
            <Mono className="mr-1 text-[11px] text-[color:var(--ink-3)]">// step 03</Mono>
            Pentagon scores reflect the maximum match, not the average — recruiters see the strongest signal.
          </li>
        </ol>
      </CardPadTight>
    </Card>
  );
}
