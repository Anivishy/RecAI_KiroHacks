import { saveRecommendationDraft } from "@recai/candidate/server/recommendation-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json();

  const updated = await saveRecommendationDraft(token, {
    technicalResponse: body.technicalResponse ?? "",
    behavioralResponse: body.behavioralResponse ?? "",
    projects: body.projects ?? [],
  });

  if (!updated) return new Response("Not found or already submitted", { status: 404 });
  return Response.json({ ok: true });
}
