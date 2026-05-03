import { generateBedrockText } from "@recai/shared/server/bedrock-client";

export async function GET() {
  const keyId = process.env.AWS_ACCESS_KEY_ID;
  const region = process.env.BEDROCK_REGION ?? "us-east-1";
  const model = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-haiku-4-5-20251001-v1:0";

  if (!keyId || !process.env.AWS_SECRET_ACCESS_KEY) {
    return Response.json({ ok: false, error: "AWS credentials not set in env", keyId: keyId ?? null, region, model }, { status: 500 });
  }

  try {
    const result = await generateBedrockText({
      userPrompt: "Reply with exactly: ok",
      maxTokens: 10,
      temperature: 0,
    });
    return Response.json({ ok: true, model: result.model, text: result.text, keyPrefix: keyId.slice(0, 8) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const name = err instanceof Error ? err.name : "UnknownError";
    return Response.json({ ok: false, error: message, errorName: name, keyPrefix: keyId.slice(0, 8), region, model }, { status: 500 });
  }
}
