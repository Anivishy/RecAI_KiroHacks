import { extractEmailDomain } from "@recai/shared";
import {
  getRecommendationByToken,
  recordCompanyPending,
  recordVerifiedCompany,
} from "@recai/candidate/server/recommendation-db";
import { verifyOtp } from "@recai/candidate/server/recommender-otp";
import { getCompanyLookupService } from "@recai/candidate/server/company-lookup";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const code =
    typeof (body as { code?: unknown })?.code === "string"
      ? (body as { code: string }).code.trim()
      : "";
  if (!/^\d{6}$/.test(code)) {
    return Response.json({ error: "invalid_code_format" }, { status: 400 });
  }

  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });
  if (rec.verificationStatus === "verified") {
    return Response.json({
      verificationStatus: "verified",
      verifiedDomain: rec.verifiedDomain,
      verifiedCompany: rec.verifiedCompany,
    });
  }

  const outcome = await verifyOtp(rec.id, code);
  if (!outcome.ok) {
    const statusByReason: Record<typeof outcome.reason, number> = {
      no_otp: 404,
      expired: 410,
      attempts_exhausted: 429,
      mismatch: 401,
    };
    return Response.json(
      { error: outcome.reason },
      { status: statusByReason[outcome.reason] },
    );
  }

  const verifiedEmail = outcome.email;
  const domain = extractEmailDomain(verifiedEmail);
  if (!domain) {
    return Response.json({ error: "invalid_email" }, { status: 400 });
  }

  const lookup = getCompanyLookupService();
  const company = await lookup.lookupByDomain(domain);

  if (company) {
    const updated = await recordVerifiedCompany(rec.id, {
      verifiedEmail,
      verifiedDomain: domain,
      verifiedCompany: company.companyName,
      verifiedCompanyId: company.companyId,
    });
    return Response.json({
      verificationStatus: "verified",
      verifiedDomain: updated?.verifiedDomain ?? domain,
      verifiedCompany: updated?.verifiedCompany ?? company.companyName,
    });
  }

  await recordCompanyPending(rec.id, { verifiedEmail, verifiedDomain: domain });
  return Response.json({
    verificationStatus: "company_pending",
    verifiedDomain: domain,
    verifiedCompany: null,
  });
}
