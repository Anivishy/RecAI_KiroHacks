import { NextResponse } from "next/server";
import {
  CandidateAuthError,
  requireCandidateSession,
  updateCandidateBanner,
} from "@recai/candidate/server/candidate-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const session = await requireCandidateSession();
  const formData = await request.formData();

  try {
    await updateCandidateBanner(session.id, {
      email: String(formData.get("bannerEmail") ?? ""),
      githubUrl: String(formData.get("bannerGithub") ?? ""),
      linkedinUrl: String(formData.get("bannerLinkedin") ?? ""),
      websiteUrl: String(formData.get("bannerWebsite") ?? ""),
    });

    return redirectWithPath(request, "/candidate/dashboard?notice=banner-saved");
  } catch (error) {
    const errorCode =
      error instanceof CandidateAuthError ? error.code : "banner-save-failed";

    return redirectWithPath(
      request,
      `/candidate/dashboard?error=${encodeURIComponent(errorCode)}`,
    );
  }
}
