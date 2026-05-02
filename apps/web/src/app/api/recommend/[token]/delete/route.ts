import { deleteRecommendation } from "@recai/candidate/server/recommendation-db";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const deleted = await deleteRecommendation(token);
  if (!deleted) return new Response("Not found or not submitted", { status: 404 });
  return Response.json({ ok: true });
}
