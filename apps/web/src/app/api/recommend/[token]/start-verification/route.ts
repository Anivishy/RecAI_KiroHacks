import { extractEmailDomain, isPersonalEmailDomain } from "@recai/shared";
import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";
import { issueOtp } from "@recai/candidate/server/recommender-otp";
import { sendRecommenderOtpEmail } from "@recai/candidate/server/email/resend-client";

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

  const email =
    typeof (body as { email?: unknown })?.email === "string"
      ? (body as { email: string }).email.trim().toLowerCase()
      : "";
  if (!email) return Response.json({ error: "email_required" }, { status: 400 });

  const domain = extractEmailDomain(email);
  if (!domain) return Response.json({ error: "invalid_email" }, { status: 400 });
  if (isPersonalEmailDomain(domain)) {
    return Response.json({ error: "personal_domain", domain }, { status: 400 });
  }

  const rec = await getRecommendationByToken(token);
  if (!rec) return Response.json({ error: "not_found" }, { status: 404 });
  if (new Date(rec.expiresAt).getTime() <= Date.now()) {
    return Response.json({ error: "link_expired" }, { status: 410 });
  }
  if (rec.status === "submitted" || rec.status === "deleted") {
    return Response.json({ error: "request_closed" }, { status: 409 });
  }
  if (rec.verificationStatus === "verified") {
    return Response.json({ error: "already_verified" }, { status: 409 });
  }

  const { code } = await issueOtp({ requestId: rec.id, email });

  try {
    await sendRecommenderOtpEmail({
      to: email,
      code,
      candidateName: rec.candidateName,
    });
  } catch (err) {
    console.error("[start-verification] resend failed:", err);
    return Response.json({ error: "send_failed" }, { status: 502 });
  }

  return Response.json({ ok: true, verificationStatus: rec.verificationStatus });
}
