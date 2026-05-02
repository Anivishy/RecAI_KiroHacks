import Link from "next/link";
import { Card, CardHead, CardPad, Mono, TopNav, appRoutes } from "@recai/shared";
import { requireCandidateSession } from "../server/candidate-auth";
import { getRecommendationRequestsForCandidate } from "../server/recommendation-db";

type CandidateRecommendationsPageProps = {
  searchParams: Promise<{
    error?: string | string[];
    notice?: string | string[];
    token?: string | string[];
  }>;
};

const inputClass =
  "mt-1 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

const textareaClass =
  "mt-1 min-h-28 w-full rounded-[var(--r-md)] border border-[color:var(--hairline-2)] bg-[color:var(--surface)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none transition placeholder:text-[color:var(--ink-4)] focus:border-[color:var(--verified)] focus:ring-[3px] focus:ring-[color:var(--verified-bg)]";

const errorMessages: Record<string, string> = {
  "invalid-email": "Enter a valid recommender email so you can share the request link.",
  "missing-fields": "Add the recommender's name, email, and relationship to create the request.",
};

const noticeMessages: Record<string, string> = {
  "request-created":
    "Your recommendation request link is ready. Share it directly with your recommender.",
};

const statusToneClass: Record<string, string> = {
  pending:
    "bg-[color:var(--surface-2)] text-[color:var(--ink-2)] border-[color:var(--hairline)]",
  draft:
    "bg-[color:var(--surface-2)] text-[color:var(--ink-2)] border-[color:var(--hairline)]",
  submitted:
    "bg-[color:var(--verified-bg)] text-[color:var(--verified)] border-[color:var(--verified-bg-2)]",
  deleted:
    "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]",
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

function formatExpires(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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
    <>
      <TopNav viewer={{ role: "candidate", fullName: session.fullName }} showSearch={false} />
      <main className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col gap-6 px-6 py-7 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[color:var(--ink-3)]">
              Candidate workspace
            </p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.02em] text-[color:var(--ink)]">
              Request a recommendation
            </h1>
          </div>
          <Link
            className="inline-flex items-center rounded-full border border-[color:var(--hairline)] bg-[color:var(--surface)] px-4 py-2 text-[13px] font-semibold text-[color:var(--ink)] transition hover:border-[color:var(--ink-3)]"
            href={appRoutes.candidateDashboard}
          >
            Back to dashboard
          </Link>
        </div>

        {errorMessage ? (
          <div className="rounded-[var(--r-lg)] border border-[#fecaca] bg-[#fef2f2] px-5 py-3 text-[13px] text-[#b91c1c]">
            {errorMessage}
          </div>
        ) : null}

        {noticeMessage ? (
          <div className="rounded-[var(--r-lg)] border border-[color:var(--verified-bg-2)] bg-[color:var(--verified-bg)] px-5 py-3 text-[13px] text-[color:var(--ink)]">
            {noticeMessage}
          </div>
        ) : null}

        {requestLink ? (
          <Card>
            <CardHead eyebrow="Shareable link" meta={<Mono>copy & send</Mono>} />
            <CardPad>
              <p className="break-all font-mono text-[12px] text-[color:var(--ink)]">
                {requestLink}
              </p>
              <p className="mt-2 text-[12px] leading-5 text-[color:var(--ink-3)]">
                Email delivery is not wired yet, so copy this link and send it directly to your
                recommender.
              </p>
            </CardPad>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <Card>
            <CardHead eyebrow="New request" />
            <CardPad>
              <form action="/api/candidate/recommendations" className="grid gap-3" method="post">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Recommender name
                    <input
                      className={inputClass}
                      name="recommenderName"
                      placeholder="Rafael Gomez"
                      required
                      type="text"
                    />
                  </label>
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Recommender email
                    <input
                      className={inputClass}
                      name="recommenderEmail"
                      placeholder="rafael@company.com"
                      required
                      type="email"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Title
                    <input
                      className={inputClass}
                      name="recommenderTitle"
                      placeholder="Engineering Manager"
                      type="text"
                    />
                  </label>
                  <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                    Company
                    <input
                      className={inputClass}
                      name="recommenderCompany"
                      placeholder="North Harbor"
                      type="text"
                    />
                  </label>
                </div>

                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Relationship
                  <input
                    className={inputClass}
                    name="relationship"
                    placeholder="Former manager"
                    required
                    type="text"
                  />
                </label>

                <label className="text-[12px] font-semibold text-[color:var(--ink)]">
                  Context for the recommender
                  <textarea
                    className={textareaClass}
                    name="candidateContext"
                    placeholder="What projects, role scope, or strengths do you want this recommender to reflect on?"
                  />
                </label>

                <button
                  className="mt-1 inline-flex items-center justify-center self-start rounded-full bg-[color:var(--verified)] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[color:var(--verified-2)]"
                  type="submit"
                >
                  Generate recommendation link
                </button>
              </form>
            </CardPad>
          </Card>

          <Card>
            <CardHead
              eyebrow={`Active requests · ${recommendationRequests.length}`}
              meta={<Mono>{recommendationRequests.length === 1 ? "1 link" : `${recommendationRequests.length} links`}</Mono>}
            />
            <CardPad>
              {recommendationRequests.length === 0 ? (
                <p className="text-[13px] leading-6 text-[color:var(--ink-3)]">
                  You have not created any recommendation requests yet.
                </p>
              ) : (
                <ul className="grid gap-3">
                  {recommendationRequests.map((request) => {
                    const toneClass =
                      statusToneClass[request.status] ?? statusToneClass.pending;
                    return (
                      <li
                        key={request.id}
                        className="rounded-[var(--r-md)] border border-[color:var(--hairline)] bg-[color:var(--surface-2)] px-4 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-[14px] font-semibold text-[color:var(--ink)]">
                              {request.recommenderName || "Unnamed recommender"}
                            </div>
                            <div className="mt-0.5 text-[12px] text-[color:var(--ink-3)]">
                              {request.recommenderEmail || "Email pending"}
                            </div>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ${toneClass}`}
                          >
                            {request.status}
                          </span>
                        </div>

                        <p className="mt-2 text-[12px] leading-5 text-[color:var(--ink-3)]">
                          {request.relationship || "Relationship pending"}
                          {request.recommenderTitle ? ` · ${request.recommenderTitle}` : ""}
                          {request.recommenderCompany ? ` · ${request.recommenderCompany}` : ""}
                        </p>

                        <Mono className="mt-2 block text-[11px] text-[color:var(--ink-3)]">
                          expires {formatExpires(request.expiresAt)}
                        </Mono>

                        <p className="mt-2 break-all font-mono text-[11px] text-[color:var(--ink-2)]">
                          {buildPublicBaseUrl()}
                          {appRoutes.recommenderRequest(request.token)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardPad>
          </Card>
        </div>
      </main>
    </>
  );
}
