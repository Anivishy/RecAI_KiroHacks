import {
  BedrockRuntimeClient,
  ConverseCommand,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import type { CandidateProfile, RecommendationSnippet } from "../lib/domain/types";

const DEFAULT_MODEL = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const DEFAULT_REGION = "us-east-1";

function getClient() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new Error("AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY must be set.");
  }

  return new BedrockRuntimeClient({
    region: process.env.BEDROCK_REGION ?? DEFAULT_REGION,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function resolveModelId(modelId?: string) {
  return modelId ?? process.env.BEDROCK_MODEL_ID ?? DEFAULT_MODEL;
}

function extractTextFromResponse(response: ConverseCommandOutput) {
  const parts = (response.output?.message?.content ?? []) as Array<{ text?: string }>;

  return parts
    .map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function extractJsonObject(rawText: string) {
  const fencedMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }

  throw new Error("Bedrock response did not contain a JSON object.");
}

export type CandidateAISummary = {
  paragraphs: string[];
  model: string;
  generatedAt: Date;
};

export type BedrockTextRequest = {
  systemPrompt?: string;
  userPrompt: string;
  modelId?: string;
  maxTokens?: number;
  temperature?: number;
};

export type BedrockTextResult = {
  model: string;
  text: string;
};

export async function generateBedrockText({
  systemPrompt,
  userPrompt,
  modelId,
  maxTokens = 800,
  temperature = 0,
}: BedrockTextRequest): Promise<BedrockTextResult> {
  const resolvedModelId = resolveModelId(modelId);
  const client = getClient();

  const command = new ConverseCommand({
    modelId: resolvedModelId,
    system: systemPrompt ? [{ text: systemPrompt }] : undefined,
    messages: [
      {
        role: "user",
        content: [{ text: userPrompt }],
      },
    ],
    inferenceConfig: {
      maxTokens,
      temperature,
    },
  });

  const response = await client.send(command);
  const text = extractTextFromResponse(response);

  if (!text) {
    throw new Error("Bedrock returned an empty response.");
  }

  return {
    model: resolvedModelId,
    text,
  };
}

export async function generateBedrockJson<T>({
  systemPrompt,
  userPrompt,
  modelId,
  maxTokens = 1200,
  temperature = 0,
}: BedrockTextRequest): Promise<{ data: T; model: string; rawText: string }> {
  const result = await generateBedrockText({
    systemPrompt,
    userPrompt,
    modelId,
    maxTokens,
    temperature,
  });

  return {
    data: JSON.parse(extractJsonObject(result.text)) as T,
    model: result.model,
    rawText: result.text,
  };
}

function buildSummaryPrompt(
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
    .map((project) => `${project.title} - ${project.summary}`)
    .join("\n");

  return [
    `Candidate name: ${candidate.fullName}`,
    `Current role context: ${candidate.currentRole}`,
    "",
    "Use only the verified recommendation evidence below.",
    "Do not invent skills, projects, or roles.",
    "Do not include candidate self-description.",
    "Write 2 to 3 short recruiter-ready paragraphs, each under 90 words.",
    "No bullet lists. No headings.",
    "",
    "Recommendations:",
    recBlobs || "None.",
    "",
    "Project signals:",
    projectBlobs || "None.",
  ].join("\n");
}

export async function generateCandidateAISummary(
  candidate: CandidateProfile,
  recommendations: RecommendationSnippet[],
): Promise<CandidateAISummary> {
  const result = await generateBedrockText({
    systemPrompt:
      "You summarize verified candidate evidence for recruiters. Use only external recommendation evidence and keep the summary concise, factual, and evidence-based.",
    userPrompt: buildSummaryPrompt(candidate, recommendations),
    maxTokens: 600,
    temperature: 0.4,
  });

  const paragraphs = result.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .slice(0, 3);

  return {
    paragraphs,
    model: result.model,
    generatedAt: new Date(),
  };
}
