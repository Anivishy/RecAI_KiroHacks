import { submitRecommendation } from "@recai/candidate/server/recommendation-db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = await request.json();

  const updated = await submitRecommendation(token, {
    technicalResponse: body.technicalResponse ?? "",
    behavioralResponse: body.behavioralResponse ?? "",
    projects: body.projects ?? [],
  });

  if (!updated) {
    return new Response("Link expired or already submitted", { status: 409 });
  }
  return Response.json({ ok: true });
}
