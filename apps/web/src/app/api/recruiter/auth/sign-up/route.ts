import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import {
  RECRUITER_SESSION_COOKIE_NAME,
  RecruiterAuthError,
  buildRecruiterSignInUrl,
  getSessionCookieOptions,
  signUpRecruiter,
} from "@recai/recruiter/server/recruiter-auth";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const formData = await request.formData();

  try {
    const { expiresAt, sessionToken } = await signUpRecruiter({
      fullName: String(formData.get("fullName") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      title: String(formData.get("title") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    const response = redirectWithPath(request, appRoutes.recruiterDashboard);
    response.cookies.set(
      RECRUITER_SESSION_COOKIE_NAME,
      sessionToken,
      getSessionCookieOptions(expiresAt),
    );

    return response;
  } catch (error) {
    const errorCode =
      error instanceof RecruiterAuthError ? error.code : "server-error";

    return redirectWithPath(request, buildRecruiterSignInUrl(errorCode));
  }
}
