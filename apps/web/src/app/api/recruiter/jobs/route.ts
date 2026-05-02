import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  buildRecruiterSignInUrl,
  getRecruiterSession,
} from "@recai/recruiter/server/recruiter-auth";
import { createJobPosting } from "@recai/recruiter/server/recruiter-jobs";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const session = await getRecruiterSession();

  if (!session) {
    return redirectWithPath(request, buildRecruiterSignInUrl("auth-required"));
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return redirectWithPath(request, appRoutes.recruiterDashboard);
  }

  await createJobPosting(session.id, {
    title,
    location: String(formData.get("location") ?? "").trim() || "Remote",
    employmentType: String(formData.get("employmentType") ?? "").trim() || "Full-time",
    experienceLevel: String(formData.get("experienceLevel") ?? "").trim() || "Mid-level",
  });

  return redirectWithPath(request, appRoutes.recruiterDashboard);
}
