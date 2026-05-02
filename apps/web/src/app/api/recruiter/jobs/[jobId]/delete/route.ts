import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  buildRecruiterSignInUrl,
  getRecruiterSession,
} from "@recai/recruiter/server/recruiter-auth";
import { deleteJobPosting } from "@recai/recruiter/server/recruiter-jobs";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await getRecruiterSession();

  if (!session) {
    return redirectWithPath(request, buildRecruiterSignInUrl("auth-required"));
  }

  const { jobId } = await params;
  await deleteJobPosting(jobId, session.id);

  return redirectWithPath(request, appRoutes.recruiterDashboard);
}
