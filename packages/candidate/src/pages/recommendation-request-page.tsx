import { notFound } from "next/navigation";
import Link from "next/link";
import { appRoutes } from "@recai/shared";
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
    <div className="relative min-h-screen">
      <div className="absolute inset-0 grid-pattern opacity-25" />
      <div className="relative flex min-h-screen flex-col">
        <header className="glass-panel sticky top-0 z-20 border-b border-(--line)">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-3 sm:px-8">
            <Link
              className="text-sm font-semibold uppercase tracking-[0.28em] text-(--accent)"
              href={appRoutes.home}
            >
              RecAI
            </Link>
            <span className="text-sm text-(--muted)">Recommendation form</span>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-8 sm:px-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Recommendation for {rec.candidateName}
            </h1>
            <p className="mt-1 text-sm text-(--muted)">
              {rec.status === "submitted"
                ? "Your recommendation has been submitted."
                : rec.status === "deleted"
                  ? "This recommendation has been removed."
                  : new Date(rec.expiresAt) < new Date()
                    ? "This link has expired."
                    : `Link valid until ${new Date(rec.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
            </p>
          </div>

          <RecommendationForm rec={rec} />
        </main>
      </div>
    </div>
  );
}
