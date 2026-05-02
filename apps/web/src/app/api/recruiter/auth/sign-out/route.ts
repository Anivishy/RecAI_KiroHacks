import { NextResponse } from "next/server";
import {
  RECRUITER_SESSION_COOKIE_NAME,
  buildRecruiterSignInUrl,
  destroyRecruiterSession,
  isRecruiterDatabaseConfigured,
} from "@recai/recruiter/server/recruiter-auth";

export async function POST(request: Request) {
  let redirectTo = buildRecruiterSignInUrl();

  try {
    const formData = await request.formData();
    redirectTo = String(formData.get("redirectTo") ?? redirectTo);

    const sessionToken = request.headers
      .get("cookie")
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${RECRUITER_SESSION_COOKIE_NAME}=`))
      ?.split("=")[1];

    if (sessionToken && isRecruiterDatabaseConfigured()) {
      try {
        await destroyRecruiterSession(sessionToken);
      } catch (error) {
        console.error("Failed to destroy recruiter session during sign-out.", error);
      }
    }
  } catch (error) {
    console.error("Recruiter sign-out fell back to cookie-only sign-out.", error);
  }

  const redirectUrl = new URL(redirectTo, request.url);

  if (redirectUrl.pathname === "/recruiter/sign-in" && !redirectUrl.searchParams.has("notice")) {
    redirectUrl.searchParams.set("notice", "signed-out");
  }

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(RECRUITER_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
