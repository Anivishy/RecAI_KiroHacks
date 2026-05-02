import { notFound } from "next/navigation";
import {
  AppShell,
  SectionCard,
  appRoutes,
  sampleRecommendationRequest,
} from "@recai/shared";

type RecommendationRequestPageProps = {
  params: Promise<{
    requestId: string;
  }>;
};

export async function RecommendationRequestPage({
  params,
}: RecommendationRequestPageProps) {
  const { requestId } = await params;

  if (requestId !== sampleRecommendationRequest.id) {
    notFound();
  }

  return (
    <AppShell
      eyebrow="Recommender Flow"
      title={`Recommendation request for ${sampleRecommendationRequest.candidateName}`}
      description="Recommenders verify through work email, then submit structured feedback that becomes trusted evidence on the candidate's profile."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Recommendation request" },
      ]}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {[
          {
            step: "01",
            title: "Verify work email",
            description:
              "The recommender enters the access code sent to their work email address.",
          },
          {
            step: "02",
            title: "Fill the recommendation",
            description:
              "The form collects technical, behavioral, and project-level feedback, with optional AI assistance.",
          },
          {
            step: "03",
            title: "Submit trusted evidence",
            description:
              "Once submitted, the candidate can choose whether to display the recommendation, but cannot change its content.",
          },
        ].map((card) => (
          <SectionCard
            key={card.step}
            eyebrow={`Step ${card.step}`}
            title={card.title}
            description={card.description}
          >
            <div className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5 text-sm leading-6 text-[var(--muted)]">
              This step is designed to keep recommendation submission trustworthy and tied
              to a real professional identity.
            </div>
          </SectionCard>
        ))}
      </div>
    </AppShell>
  );
}
