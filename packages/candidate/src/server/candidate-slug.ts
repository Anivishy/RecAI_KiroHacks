import { randomBytes } from "node:crypto";
import type { ClientBase } from "pg";

const SLUG_FALLBACK = "candidate";
const NUMERIC_SUFFIX_LIMIT = 99;

export function slugFromFullName(fullName: string): string {
  const normalized = fullName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : SLUG_FALLBACK;
}

export function* candidateSlugCandidates(base: string): Generator<string> {
  yield base;
  for (let i = 2; i <= NUMERIC_SUFFIX_LIMIT; i++) {
    yield `${base}-${i}`;
  }
  yield `${base}-${randomBytes(3).toString("hex")}`;
}

type SlugAttemptResult = "ok" | "slug-collision";

export type SlugAttempt = (
  client: ClientBase,
  slug: string,
) => Promise<SlugAttemptResult>;

export async function claimSlugWith(
  client: ClientBase,
  baseFullName: string,
  attempt: SlugAttempt,
): Promise<string> {
  const base = slugFromFullName(baseFullName);

  for (const candidate of candidateSlugCandidates(base)) {
    const result = await attempt(client, candidate);
    if (result === "ok") {
      return candidate;
    }
  }

  throw new Error("candidate-slug-exhausted");
}
