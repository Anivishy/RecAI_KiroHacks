# 0019 — Bedrock Trait Scoring V2 Pentagon

## Summary

This change wires the Bedrock-backed V2 trait-scoring service into the recruiter candidate review page, replacing the heuristic single pentagon with two separate pentagons: one for technical traits and one for behavioral traits.

## Why This Change Exists

The V2 scoring foundation (spec 0018) added a rubric and Bedrock scoring service but left the live pentagon on the old heuristic path. This spec completes the circuit by connecting the scoring service to the recruiter UI.

The two-pentagon split (technical + behavioral) matches the product direction described in `docs/product/trait-scoring.md` and gives recruiters more signal resolution than the mixed V1 pentagon.

## Scope

- Wire `scoreCandidateTraitEvidence` into the recruiter candidate review page with DB-backed caching
- Render two pentagons (technical, behavioral) when Bedrock scoring succeeds
- Fall back gracefully to the V1 heuristic single pentagon when Bedrock or DB is unavailable
- Show Bedrock-generated rationale and confidence on pentagon vertex hover

## Routes Or Surfaces Touched

- Recruiter candidate review page: `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`

## Files Changed

| File | Change |
|------|--------|
| `packages/shared/src/lib/profile-derivations.ts` | Widened `PentagonTrait.id` from `PentagonTraitId` to `string`; added optional `confidence` and `rationale` fields |
| `packages/recruiter/src/server/recruiter-trait-scoring.ts` | New — `getOrGenerateTraitScorecard()` with Aurora-backed caching keyed on `candidate_id` + `rec_count` |
| `packages/recruiter/src/server/v2-pentagon.ts` | New — `buildV2PentagonsForRecruiter()` maps a `ScorecardResult` to `{ technical, behavioral }` pentagon trait arrays |
| `packages/recruiter/src/components/rail/pentagon.tsx` | Added `label` prop for custom eyebrow; hover panel now shows Bedrock rationale + confidence when present, falling back to project similarity |
| `packages/recruiter/src/pages/recruiter-candidate-profile-page.tsx` | Calls `getOrGenerateTraitScorecard` in parallel with AI summary; renders two V2 pentagons or one V1 pentagon based on scorecard availability |

## Data Contract Updates

New Aurora table (auto-created on first request):

```sql
CREATE TABLE IF NOT EXISTS candidate_trait_scorecard (
  candidate_id  TEXT PRIMARY KEY,
  generated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  scorecard     JSONB NOT NULL,
  model         TEXT NOT NULL,
  rec_count     INTEGER NOT NULL
);
```

Cache is invalidated whenever `rec_count` changes (same strategy as `candidate_ai_summary`).

## Fallback Behavior

- DB unavailable → returns `null` → V1 heuristic pentagon shown
- Bedrock unreachable → returns `null` → V1 heuristic pentagon shown
- Scorecard present → two V2 pentagons shown with rationale on hover

## Validation Steps

```
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## Open Questions Or Follow-Ups

- The V1 heuristic pentagon path and `PentagonScoreMap` on `CandidateProfile` can be removed once V2 is confirmed stable in production.
- `getStatsFromCandidate` in the profile page still reads V1 scores for the AI summary rail stats; this can be updated to use V2 behavioral averages in a follow-up.
- Pinecone-retrieved evidence chunks are not yet passed as segments — the scorer currently sees only recommendation summaries and project data.
