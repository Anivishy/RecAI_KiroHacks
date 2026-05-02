import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  CANDIDATE_SESSION_COOKIE_NAME,
  CandidateAuthError,
  buildCandidateSignInUrl,
  getSessionCookieOptions,
  signUpCandidate,
} from "@recai/candidate/server/candidate-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const { expiresAt, sessionToken } = await signUpCandidate({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    const response = redirectWithPath(request, appRoutes.candidateDashboard);
    response.cookies.set(
      CANDIDATE_SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    const errorCode =
      error instanceof CandidateAuthError ? error.code : "server-error";

    return redirectWithPath(request, buildCandidateSignInUrl(errorCode));
  }
}
