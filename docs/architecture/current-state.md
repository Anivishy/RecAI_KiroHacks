# Current State

## What Is Implemented

- The project has a working Next.js scaffold with a landing page and route shells.
- The Kiro Hacks line deploys through the Vercel project `rec-ai-kiro-hacks-web`.
- Recruiter auth is live through an Aurora PostgreSQL-backed app-managed flow:
  - recruiter sign-up
  - recruiter sign-in
  - recruiter sign-out
  - protected recruiter dashboard, job posting, and recruiter candidate review pages
- Candidate auth is live through the same Aurora-backed pattern:
  - candidate sign-up
  - candidate sign-in
  - candidate sign-out
  - protected candidate dashboard
  - persistent candidate banner editing
- Recruiter job posting CRUD is backed by Aurora PostgreSQL:
  - create job postings
  - delete job postings
  - recruiter-owned posting routes
  - unique invite codes per posting
- Candidate join flow is live:
  - recruiter posting pages generate invite URLs
  - `/candidate/sign-in?join={inviteCode}` adds the signed-in candidate to that posting's pool
  - joined posting counts are reflected from real DB memberships
- Recommendation request flow is live:
  - candidate creates recommender request links
  - recommender opens `/recommend/[token]`
  - recommender can save draft, submit, and delete after submission
  - tokens expire after 7 days
- Shared, candidate, recruiter, and recommender surfaces have a redesigned UI system:
  - shared card, nav, icon, and rail primitives
  - redesigned landing page
  - redesigned candidate dashboard and public profile
  - redesigned recruiter dashboard, posting page, and recruiter candidate review
  - redesigned recommender form
- Candidate profile storage is Aurora-backed:
  - public candidate profiles now resolve from `candidate_accounts` plus submitted recommendation data
  - projects, recommendation snippets, and pentagon scores are derived from submitted recommendations
- Recruiter candidate search is live through Pinecone:
  - job-scoped namespaces in `candidates-vector-db`
  - Pinecone native inference with `multilingual-e5-large`
  - lazy indexing on first search for a posting
  - search results now come from real joined candidates rather than shared mocks
- Recruiter candidate review pages now open against real candidate profiles and real posting membership.
- Recruiter candidate review pages now include a recruiter-only AI summary rail:
  - uses Bedrock when available
  - falls back to a deterministic local summary if Bedrock is unavailable
- Recruiter, candidate, and shared code live in separate packages:
  - `packages/recruiter`
  - `packages/candidate`
  - `packages/shared`
- `apps/web/src/app/**` is back to thin route wrappers for platform pages.
- The current UI foundation on the Kiro Hacks line uses the old-main token and typography system:
  - warm paper / ink design tokens in `apps/web/src/app/globals.css`
  - self-hosted General Sans body font
  - JetBrains Mono for mono utility text

## Verified Commands

The following commands currently pass from the repo root:

```bash
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

## Ownership Snapshot

- Recruiter lane:
  - recruiter sign-in
  - recruiter dashboard
  - recruiter auth backend and protected sessions
  - recruiter job posting CRUD
  - recruiter posting invite flow
  - recruiter job posting candidate search (Pinecone)
  - recruiter candidate review view
- Candidate lane:
  - candidate sign-in
  - candidate dashboard
  - candidate banner editor
  - candidate recommendation request management
  - public candidate profile
  - recommender request form flow
  - recruiter group membership views
- Shared lane:
  - landing page
  - shared UI primitives
  - shared domain contracts
  - docs

## Current Backend Direction

- Frontend deployment target: Vercel
- Backend direction: AWS-managed services
- Primary relational store: Aurora PostgreSQL through AWS for Vercel
- Recruiter and candidate auth path: app-managed Aurora-backed sessions
- Search and recruiter KB retrieval: Pinecone serverless vector DB
- Embedding model: Pinecone native `multilingual-e5-large`
- Recruiter summary generation: AWS Bedrock with a local fallback path
- Recommender verification email direction: AWS SES

## Current Backend Status

- The `kiro-test` line is linked to the Vercel project `rec-ai-kiro-hacks-web`.
- The Vercel project is configured as a Next.js monorepo deployment with:
  1. `apps/web` as the root directory
  2. source files outside the root directory enabled
  3. framework auto-output detection instead of a static `public` output directory
- Aurora PostgreSQL is attached to the new Vercel project through the AWS for Vercel integration.
- Pinecone serverless is attached via Vercel marketplace.
  - Required env var: `PINECONE_API_KEY`
  - Required host env var on this line: `PINECONE_HOSTNAME`
  - Index name on this line: `candidate-profile-index`
- Search does not require OpenAI.
- Candidate and recruiter profile/search surfaces now read live data from Aurora-backed records instead of shared runtime mocks.
- Aurora envs on this line use the `PROD_*` naming contract from the new Vercel project:
  - `PROD_AWS_REGION`
  - `PROD_AWS_ROLE_ARN`
  - `PROD_PGHOST`
  - `PROD_PGPORT`
  - `PROD_PGUSER`
  - `PROD_PGDATABASE`

## Current Gaps

- Landing-page showcase content still uses shared sample candidate/job data for marketing presentation.
- Candidate profile editing is still minimal outside banner fields and recommendation-derived evidence.
- Pinecone indexing is lazy on first search and is not yet eagerly refreshed on every candidate write.
- SES-based recommender email delivery is not wired yet; recommendation links are shared manually.

## Immediate Next Build Priority

The next most valuable implementation slice is:

1. Eager Pinecone refresh when candidate evidence changes
2. Candidate-owned profile editing beyond banner fields
3. Recruiter structured filters and search pentagon controls
4. SES-backed recommender email delivery

## Notes For Future Context

- The public candidate profile is candidate-owned.
- Recruiter candidate review is a recruiter-only overlay that reads from the same candidate data, not a separate profile system.
- Search is scoped to one recruiter-owned job posting namespace at a time.
- Landing-page sample content is intentionally separate from live recruiter/candidate data.
