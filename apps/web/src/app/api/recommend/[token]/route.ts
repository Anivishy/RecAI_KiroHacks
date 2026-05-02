import { getRecommendationByToken } from "@recai/candidate/server/recommendation-db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const rec = await getRecommendationByToken(token);
  if (!rec) return new Response("Not found", { status: 404 });
  // Don't expose email in GET response
  const { recommenderEmail: _email, ...safe } = rec;
  return Response.json(safe);
}
