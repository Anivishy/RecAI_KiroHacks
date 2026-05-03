import { Card, CardHead, Mono } from "@recai/shared";
import type { CandidateProfileSummary } from "../../server/candidate-summary";

type CandidateSummaryCardProps = {
  summary: CandidateProfileSummary;
};

export function CandidateSummaryCard({ summary }: CandidateSummaryCardProps) {
  return (
    <Card>
      <CardHead
        eyebrow="Profile summary · verified evidence only"
        meta={<Mono className="text-[color:var(--verified)]">{summary.model.replace("anthropic.", "")}</Mono>}
      />
      <div className="grid gap-3 px-5 py-4">
        {summary.paragraphs.map((paragraph, i) => (
          <p key={i} className="text-[14px] leading-6 text-[color:var(--ink-2)]">
            {paragraph}
          </p>
        ))}
      </div>
    </Card>
  );
}
