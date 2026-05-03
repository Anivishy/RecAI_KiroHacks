import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";
import { hasActiveOtp } from "@recai/candidate/server/recommender-otp";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });

  const otpPending = await hasActiveOtp(rec.id);

  return Response.json({
    verificationStatus: rec.verificationStatus,
    verifiedEmail: rec.verifiedEmail,
    verifiedDomain: rec.verifiedDomain,
    verifiedCompany: rec.verifiedCompany,
    otpPending,
  });
}
