import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import type { CandidateProfile, RecommendationSnippet } from "../lib/domain/types";

const DEFAULT_MODEL = "anthropic.claude-haiku-4-5-20251001-v1:0";
const DEFAULT_REGION = "us-east-1";

let cachedClient: BedrockRuntimeClient | null = null;

function getClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION ?? DEFAULT_REGION,
  });
  return cachedClient;
}

export type CandidateAISummary = {
  paragraphs: string[];
  model: string;
  generatedAt: Date;
};

function buildPrompt(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): string {
  const recBlobs = recommendations
    .map(
      (rec) =>
        `Recommender: ${rec.recommenderName} (${rec.recommenderTitle} at ${rec.company}, relation: ${rec.relationship}).\nQuote: ${rec.summary}`,
    )
    .join("\n\n");
  const projectBlobs = candidate.projects
    .map((project) => `${project.title} — ${project.summary}`)
    .join("\n");
  return [
    "You are summarizing a candidate profile for a recruiter who has the candidate in one of their job pools.",
    "Use ONLY the verified-recommendation evidence below. Do not invent skills, projects, or roles. Do not include candidate self-description.",
    "Write 2 to 3 short paragraphs (max 90 words each) of synthesized prose. No bullet lists. No headings.",
    "",
    `Candidate name: ${candidate.fullName}`,
    `Current role context: ${candidate.currentRole}`,
    "",
    "Recommendations:",
    recBlobs,
    "",
    "Project signals:",
    projectBlobs,
  ].join("\n");
}

export async function generateCandidateAISummary(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): Promise<CandidateAISummary> {
  const modelId = process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL;
  const client = getClient();

  const command = new InvokeModelCommand({
    modelId,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 600,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: buildPrompt(candidate, recommendations) }],
        },
      ],
    }),
  });

  const response = await client.send(command);
  const decoded = new TextDecoder().decode(response.body as Uint8Array);
  const json = JSON.parse(decoded) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = (json.content ?? [])
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
  const paragraphs = text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .slice(0, 3);
  return {
    paragraphs,
    model: modelId,
    generatedAt: new Date(),
  };
}
