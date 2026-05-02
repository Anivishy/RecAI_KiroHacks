import { NextResponse } from "next/server";
import { appRoutes } from "@recai/shared";
import { requireCandidateSession } from "@recai/candidate/server/candidate-auth";
import { createRecommendationRequest } from "@recai/candidate/server/recommendation-db";

function redirectWithPath(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

export async function POST(request: Request) {
  const session = await requireCandidateSession();
  const formData = await request.formData();

  const recommenderName = String(formData.get("recommenderName") ?? "").trim();
  const recommenderEmail = String(formData.get("recommenderEmail") ?? "").trim();
  const relationship = String(formData.get("relationship") ?? "").trim();

  if (!recommenderName || !recommenderEmail || !relationship) {
    return redirectWithPath(
      request,
      `${appRoutes.candidateRecommendationNew}?error=missing-fields`,
    );
  }

  if (!recommenderEmail.includes("@")) {
    return redirectWithPath(
      request,
      `${appRoutes.candidateRecommendationNew}?error=invalid-email`,
    );
  }

  const recommendation = await createRecommendationRequest({
    candidateId: session.id,
    candidateSlug: session.slug,
    candidateName: session.fullName,
    candidateContext: String(formData.get("candidateContext") ?? "").trim(),
    recommenderName,
    recommenderEmail,
    recommenderTitle: String(formData.get("recommenderTitle") ?? "").trim(),
    recommenderCompany: String(formData.get("recommenderCompany") ?? "").trim(),
    relationship,
  });

  return redirectWithPath(
    request,
    `${appRoutes.candidateRecommendationNew}?notice=request-created&token=${encodeURIComponent(recommendation.token)}`,
  );
}
