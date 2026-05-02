# Summary

This change replays the newer UI redesign work onto `kiro-test` so the Kiro Hacks line matches the updated product presentation while keeping its newer Aurora, Pinecone, and Vercel wiring intact.

# Why This Change Exists

- `main` and `kiro-test` no longer share a simple rebase path.
- Adarsh's newer UI work needs to exist on the branch and repo that now own active development and deployment.
- Future work should continue from the Kiro Hacks line without losing the improved candidate, recruiter, landing, and recommender surfaces.

# Scope

- Replay the redesigned shared UI primitives onto `kiro-test`
- Replay the redesigned landing page onto `kiro-test`
- Replay the redesigned candidate, recruiter, and recommender surfaces onto `kiro-test`
- Preserve the Kiro Hacks runtime contract:
  - Aurora through the `PROD_*` environment names
  - Pinecone through `PINECONE_API_KEY` and `PINECONE_HOSTNAME`
- Keep the branch valid after replay by restoring missing shared files required by the redesign:
  - `packages/shared/src/components/icons.tsx`
  - `packages/shared/src/components/mono.tsx`

# Routes Or Surfaces Touched

- `/`
- `/candidate/sign-in`
- `/candidate/dashboard`
- `/candidate/groups`
- `/candidate/recommendations/new`
- `/c/[candidateSlug]`
- `/recruiter/sign-in`
- `/recruiter/dashboard`
- `/recruiter/jobs/[jobId]`
- `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`
- `/recommend/[requestId]`

# Data Contract Updates

- No Aurora or Pinecone contract changes were introduced by this sync.
- Recruiter candidate review continues to use the existing AI summary cache table and Bedrock-backed summary path when available.
- Shared UI packages now expect the `icons` and `mono` primitives to exist in `packages/shared/src/components`.

# Validation Steps

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

# Open Questions Or Follow-Ups

- Once this squashed UI commit is pushed to the new repo, verify the new Vercel project renders all redesigned surfaces as expected.
- If the team decides Bedrock should not remain part of the recruiter review page, that should be handled as a separate recruiter-owned follow-up rather than mixed into this replay sync.
