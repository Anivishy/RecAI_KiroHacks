import { NextResponse } from "next/server";
import {
  CANDIDATE_SESSION_COOKIE_NAME,
  buildCandidateSignInUrl,
  destroyCandidateSession,
  isCandidateDatabaseConfigured,
} from "@recai/candidate/server/candidate-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const redirectTo = String(formData.get("redirectTo") ?? buildCandidateSignInUrl());
  const redirectUrl = new URL(redirectTo, request.url);
  const sessionToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CANDIDATE_SESSION_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (sessionToken && isCandidateDatabaseConfigured()) {
    await destroyCandidateSession(sessionToken);
  }

  if (
    redirectUrl.pathname === "/candidate/sign-in" &&
    !redirectUrl.searchParams.has("notice")
  ) {
    redirectUrl.searchParams.set("notice", "signed-out");
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(CANDIDATE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
