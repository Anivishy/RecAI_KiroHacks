import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHead, CardPad, Mono, appRoutes } from "@recai/shared";
import { getRecommendationByToken } from "../server/recommendation-db";
import { RecommendationForm } from "../components/recommendation-form";

type Props = {
  params: Promise<{ requestId: string }>;
};

export async function RecommendationRequestPage({ params }: Props) {
  const { requestId: token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) notFound();

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-[color:var(--hairline)] bg-[color:var(--paper)]/80 backdrop-blur-[10px]">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-6 sm:px-8">
          <Link href={appRoutes.home} className="flex items-center gap-2 text-[14px] font-semibold text-[color:var(--ink)]">
            <span className="relative flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--ink)] text-[12px] font-semibold text-white">
              R
              <span className="absolute -right-1 -bottom-1 h-[6px] w-[6px] rounded-full bg-[color:var(--verified)]" />
            </span>
            recAI
          </Link>
          <span className="text-[12px] uppercase tracking-[0.12em] text-[color:var(--ink-3)]">
            Recommendation form
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
            Recommendation for {rec.candidateName}
          </h1>
          <p className="mt-1 text-[13px] text-[color:var(--ink-3)]">
            {rec.status === "submitted"
              ? "Your recommendation has been submitted."
              : rec.status === "deleted"
                ? "This recommendation has been removed."
                : new Date(rec.expiresAt) < new Date()
                  ? "This link has expired."
                  : `Link valid until ${new Date(rec.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
          </p>
        </div>

        <Card>
          <CardHead eyebrow="Recommendation" />
          <CardPad>
            <RecommendationForm rec={rec} />
            <Mono className="mt-5 block text-[11px] text-[color:var(--ink-4)]">
              // verified content — becomes a permanent searchable record across recAI candidate profiles
            </Mono>
          </CardPad>
        </Card>
      </main>
    </>
  );
}
