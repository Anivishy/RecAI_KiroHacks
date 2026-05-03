import { deleteRecommendation } from "@recai/candidate/server/recommendation-db";
import { reindexCandidateAcrossPostings } from "@recai/recruiter/server/recruiter-search";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const deleted = await deleteRecommendation(token);
  if (!deleted) return new Response("Not found or not submitted", { status: 404 });

  const { candidateId, candidateSlug } = deleted;
  if (candidateId && candidateSlug) {
    // Fire-and-forget: keep the response fast, let Pinecone sync in the background
    void reindexCandidateAcrossPostings(candidateId, candidateSlug).catch((err) =>
      console.warn("[delete-rec] pinecone reindex failed", err),
    );
  }

  return Response.json({ ok: true });
}
