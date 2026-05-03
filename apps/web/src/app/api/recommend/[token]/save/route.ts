import {
  getRecommendationByToken,
  saveRecommendationDraft,
} from "@recai/candidate/server/recommendation-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return new Response("Not found", { status: 404 });
  if (rec.verificationStatus !== "verified") {
    return Response.json({ error: "verification_required" }, { status: 403 });
  }

  const body = await request.json();

  const updated = await saveRecommendationDraft(token, {
    technicalResponse: body.technicalResponse ?? "",
    behavioralResponse: body.behavioralResponse ?? "",
    projects: body.projects ?? [],
  });

  if (!updated) return new Response("Not found or already submitted", { status: 404 });
  return Response.json({ ok: true });
}
