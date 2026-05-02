# Current State

## What Is Implemented

- The project has a working Next.js scaffold with a landing page and route shells.
- The app now has a live Vercel production deployment available at `https://recai-sigma.vercel.app`.
- The recruiter flow now includes a recruiter-owned candidate review route scoped to a job posting.
- The recruiter flow now also includes a real app-managed auth path backed by Aurora PostgreSQL conventions:
  - recruiter sign-up form
  - recruiter sign-in form
  - recruiter sign-out route
  - protected recruiter dashboard, job posting, and candidate review pages
  - Aurora-backed recruiter account and session table bootstrap logic
- The recruiter dashboard supports full job posting CRUD backed by Aurora PostgreSQL:
  - create job postings (title, location, employment type, experience level)
  - delete job postings
  - each posting generates a unique invite code that produces a shareable candidate join URL
- The recruiter job posting page includes AI-powered natural language candidate search:
  - candidates are chunked and embedded using OpenAI `text-embedding-3-small` (1536 dims)
  - chunks (overview, per-project, per-recommendation) are stored in Pinecone serverless vector DB
  - query embedding + Pinecone similarity search retrieves the most relevant candidate context
  - Claude (`claude-sonnet-4-6`) ranks and explains results with a streaming response
  - client-side `CandidateSearch` component uses `useCompletion` for real-time streaming display
  - first search auto-indexes the posting's candidate pool (lazy indexing)
- Recruiter, candidate, and shared code now live in separate packages:
  - `packages/recruiter`
  - `packages/candidate`
  - `packages/shared`
- `apps/web/src/app/**` now acts as thin route wrappers only.
- Shared product, architecture, ownership, and spec docs are in place.

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
  - recruiter job posting CRUD (Aurora-backed)
  - recruiter job posting candidate search (Pinecone + Claude)
  - recruiter-owned candidate review view
- Candidate lane:
  - candidate sign-in (real signup/signin forms)
  - candidate workspace dashboard (LinkedIn-style, session-gated)
  - candidate banner editor wired to Aurora
  - candidate auth backend and protected sessions
  - public candidate profile (still mock-backed pending slice B)
  - recommender request flow shell
- Shared lane:
  - landing page
  - shared UI primitives
  - shared domain contracts
  - docs

## Current Backend Direction

- Frontend deployment target: Vercel
- Backend direction: AWS-managed services
- Recruiter auth path: Aurora PostgreSQL through the AWS for Vercel integration
- Search and recruiter KB retrieval: Pinecone serverless vector DB (added via Vercel marketplace)
- AI layer: Vercel AI SDK (`ai` v6, `@ai-sdk/anthropic`, `@ai-sdk/react`)
- Recommender verification email direction: AWS SES

## Current Backend Status

- The repo is linked to the Vercel project `recai`.
- The Vercel project is now configured as a `Next.js` monorepo deployment with:
  1. `apps/web` as the root directory
  2. source files outside the root directory enabled
  3. framework auto-output detection instead of a static `public` output directory
- Aurora PostgreSQL is attached to the Vercel project through the AWS for Vercel integration.
- Pinecone serverless is attached via Vercel marketplace (`PINECONE_API_KEY` env var).
  - Index name: `candidates-vector-db`
  - To skip the control-plane lookup on cold start, set `PINECONE_INDEX_HOST` to the full index host URL.
- Required env vars for AI search: `ANTHROPIC_API_KEY`, `PINECONE_API_KEY`.
- `OPENAI_API_KEY` is NOT required — embeddings are handled by Pinecone's native inference (`multilingual-e5-large`).
- Recruiter auth is now live on production and has been verified for:
  1. recruiter sign-up
  2. recruiter sign-in
  3. protected dashboard access
  4. recruiter sign-out
  5. redirect back to sign-in after sign-out

## Immediate Next Build Priority

The next most valuable implementation slice is:

1. Candidate profile storage in Aurora (replacing mock data so real candidates appear in search)
2. Auto-indexing candidates to Pinecone when they join a posting
3. Candidate join flow (invite code → sign in → added to posting pool)
4. Recruiter candidate count reflecting real DB joins

## Notes For Future Context

- The public candidate profile is currently candidate-owned.
- If recruiter-only overlays are added later, they should be explicitly documented instead of silently changing ownership of the public profile.
- The package split was chosen for hackathon speed and parallel work safety, not long-term platform complexity.
- Candidate data is currently served from `packages/shared/src/lib/domain/mock-data.ts`. The search infrastructure is wired to this mock data until `getCandidatesForPosting()` in `recruiter-search.ts` is replaced with a real Aurora query.
- The Pinecone index uses jobId as the namespace, so each posting has an isolated search space.
- First search on a posting triggers lazy indexing (embed + upsert all candidates). Subsequent searches are fast.
