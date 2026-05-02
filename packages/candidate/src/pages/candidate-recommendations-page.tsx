import Link from "next/link";
import { AppShell, SectionCard, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "../server/candidate-auth";
import { getRecommendationRequestsForCandidate } from "../server/recommendation-db";

type CandidateRecommendationsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
    token?: string | string[];
  }>;
};

const inputClassName =
  "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]";

const errorMessages: Record<string, string> = {
  "invalid-email": "Enter a valid recommender email so you can share the request link.",
  "missing-fields": "Add the recommender's name, email, and relationship to create the request.",
};

const noticeMessages: Record<string, string> = {
  "request-created":
    "Your recommendation request link is ready. Share it directly with your recommender.",
};

function readSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function buildPublicBaseUrl() {
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  return "https://recai-sigma.vercel.app";
}

export async function CandidateRecommendationsPage({
  searchParams,
}: CandidateRecommendationsPageProps) {
  const session = await requireCandidateSession();
  const recommendationRequests = await getRecommendationRequestsForCandidate(session.id);
  const resolvedSearchParams = await searchParams;
  const errorCode = readSearchParam(resolvedSearchParams.error);
  const noticeCode = readSearchParam(resolvedSearchParams.notice);
  const token = readSearchParam(resolvedSearchParams.token);
  const errorMessage = errorCode ? errorMessages[errorCode] : null;
  const noticeMessage = noticeCode ? noticeMessages[noticeCode] : null;
  const requestLink = token
    ? `${buildPublicBaseUrl()}${appRoutes.recommenderRequest(token)}`
    : null;

  return (
    <AppShell
      eyebrow="Request a Recommendation"
      title="Invite a real collaborator to write about your work."
      description="Create a recommendation request, share the generated link, and track every recommender you've invited from one place."
      breadcrumbs={[
        { label: "Home", href: appRoutes.home },
        { label: "Candidate dashboard", href: appRoutes.candidateDashboard },
        { label: "Request a recommendation" },
      ]}
      actions={
        <Link
          className="rounded-full bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
          href={appRoutes.candidateDashboard}
        >
          Back to dashboard
        </Link>
      }
    >
      <div className="grid gap-4">
        {errorMessage ? (
          <div className="rounded-[24px] border border-[rgba(220,38,38,0.22)] bg-[rgba(220,38,38,0.08)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div className="rounded-[24px] border border-[rgba(15,118,110,0.24)] bg-[rgba(15,118,110,0.10)] px-5 py-4 text-sm leading-6 text-[var(--foreground)]">
            {noticeMessage}
          </div>
        ) : null}

        {requestLink ? (
          <div className="rounded-[24px] border border-[color:var(--line)] bg-white/80 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
              Shareable link
            </p>
            <p className="mt-2 break-all font-mono text-sm text-[var(--foreground)]">
              {requestLink}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Email delivery is not wired yet, so copy this link and send it directly to your
              recommender.
            </p>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <SectionCard
          eyebrow="Create Request"
          title="Add a recommender and generate their form link"
          description="This request creates the recommender flow token immediately, so you can share it without waiting for an email service."
        >
          <form action="/api/candidate/recommendations" className="grid gap-4" method="post">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Recommender name
                <input
                  className={inputClassName}
                  name="recommenderName"
                  placeholder="Rafael Gomez"
                  required
                  type="text"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Recommender email
                <input
                  className={inputClassName}
                  name="recommenderEmail"
                  placeholder="rafael@company.com"
                  required
                  type="email"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Title
                <input
                  className={inputClassName}
                  name="recommenderTitle"
                  placeholder="Engineering Manager"
                  type="text"
                />
              </label>
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Company
                <input
                  className={inputClassName}
                  name="recommenderCompany"
                  placeholder="North Harbor"
                  type="text"
                />
              </label>
            </div>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Relationship
              <input
                className={inputClassName}
                name="relationship"
                placeholder="Former manager"
                required
                type="text"
              />
            </label>

            <label className="text-sm font-semibold text-[var(--foreground)]">
              Context for the recommender
              <textarea
                className="mt-2 min-h-32 w-full rounded-[18px] border border-[color:var(--line)] bg-white px-4 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                name="candidateContext"
                placeholder="What projects, role scope, or strengths do you want this recommender to reflect on?"
              />
            </label>

            <button
              className="rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              type="submit"
            >
              Generate recommendation link
            </button>
          </form>
        </SectionCard>

        <SectionCard
          eyebrow="Requests"
          title="Recommendation links you have already created"
          description="Use this list to keep track of who has a live link, who has submitted, and which requests still need a follow-up."
        >
          {recommendationRequests.length > 0 ? (
            <div className="grid gap-4">
              {recommendationRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-white/75 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--foreground)]">
                        {request.recommenderName || "Unnamed recommender"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {request.recommenderTitle || "Title pending"}
                        {request.recommenderCompany
                          ? ` - ${request.recommenderCompany}`
                          : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-[rgba(15,118,110,0.08)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                      {request.status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                    {request.relationship || "Relationship pending"} - expires{" "}
                    {new Date(request.expiresAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <p className="mt-3 break-all font-mono text-xs text-[var(--foreground)]">
                    {buildPublicBaseUrl()}
                    {appRoutes.recommenderRequest(request.token)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--line)] bg-white/55 p-6 text-sm leading-6 text-[var(--muted)]">
              You have not created any recommendation requests yet.
            </div>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
