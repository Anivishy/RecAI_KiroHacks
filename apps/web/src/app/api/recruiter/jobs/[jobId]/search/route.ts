import { getRecruiterSession } from "@recai/recruiter/server/recruiter-auth";
import { searchCandidatePool } from "@recai/recruiter/server/recruiter-search";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getRecruiterSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { jobId } = await params;
  const body = await request.json();
  const query: string = body.query ?? body.prompt ?? "";

  if (!query.trim()) {
    return new Response("Query is required", { status: 400 });
  }

  const results = await searchCandidatePool(jobId, query);
  return Response.json(results);
}
