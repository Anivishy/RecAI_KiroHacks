# Agent Onboarding

This is the single best file for a new AI agent to read before working in the RecAI repo.

## Mission

RecAI is a hiring trust layer.

The product exists because AI has made candidate materials easier to polish and harder to trust. RecAI helps candidates stand out through verified external recommendations and helps recruiters search for real, recommendation-backed signals instead of relying only on self-reported claims.

This is a hackathon build. The goal is a working demo, not long-term platform perfection.

## Product Summary

There are three user types:

- Candidates
- Recommenders
- Recruiters

### Candidates

- have accounts
- build a profile
- request recommendations
- choose which completed recommendations appear publicly
- cannot control the content of submitted recommendations
- can opt into recruiter job postings through invite links

### Recommenders

- do not need accounts
- receive a tokenized RecAI link
- can save draft, submit, and delete a submitted recommendation

### Recruiters

- have accounts
- create job postings
- search only within a job posting's opted-in candidate pool
- review candidates through public-profile data plus recruiter-only summary overlays

## Current Architecture

This repo uses one Next.js app plus separate lane packages.

### App Structure

- `apps/web`
  - Next.js app router
  - thin route wrappers only

- `packages/shared`
  - shared UI components
  - shared domain types
  - routes
  - landing page
  - top nav, card, icon, mono, and rail primitives
  - sample landing-page showcase data

- `packages/candidate`
  - candidate auth
  - candidate dashboard
  - candidate groups page
  - candidate recommendation request management
  - public candidate profile
  - recommender form flow

- `packages/recruiter`
  - recruiter auth
  - recruiter dashboard
  - recruiter job posting page
  - recruiter candidate search
  - recruiter candidate review view

## Ownership Rules

### Candidate-Owned

- `packages/candidate/**`
- `/candidate/*`
- `/c/[candidateSlug]`
- `/recommend/[requestId]`

### Recruiter-Owned

- `packages/recruiter/**`
- `/recruiter/*`

### Shared

- `packages/shared/**`
- landing page
- shared UI
- shared domain contracts
- docs

### Important Rule

Do not treat `apps/web/src/app/**` as the main implementation area.

Those files should stay thin unless there is a routing-level reason to change them.

## Public Profile Rule

The public candidate profile is candidate-owned.

Recruiter flows can link to it and read from it, but they should not silently take ownership of that surface.

Recruiter-only overlays should remain in recruiter-owned routes such as `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`.

## Current Technical Direction

- Frontend: Next.js App Router
- Deployment: Vercel
- Backend: AWS-managed services
- Database: Aurora PostgreSQL via AWS for Vercel
- Auth: app-managed recruiter and candidate sessions stored in Aurora
- Search: Pinecone serverless vector search
- Embeddings: Pinecone native `multilingual-e5-large`
- Recruiter AI summary: AWS Bedrock with local fallback
- Recommender email direction: AWS SES
- Shared UI foundation: warm paper token system plus self-hosted General Sans and JetBrains Mono
- Trait scoring direction: vector retrieval plus Bedrock rubric scoring

The Kiro Hacks line deploys through the Vercel project `rec-ai-kiro-hacks-web`.

## Verified Commands

Run these from the repo root in PowerShell:

```bash
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

These commands currently pass.

## What Exists Right Now

The repo already has:

- landing page
- redesigned shared navigation and card system
- candidate sign-in with real account creation/login routes
- candidate dashboard protected by candidate session
- candidate banner editor wired to Aurora
- candidate recruiter-group join flow through recruiter invite links
- candidate recommendation-request creation flow
- recommender form with save draft, submit, and delete-after-submit
- public candidate profile backed by Aurora candidate data plus submitted recommendations
- recruiter sign-in with real account creation/login routes
- recruiter dashboard protected by recruiter session
- recruiter job posting CRUD backed by Aurora
- recruiter job posting search backed by Pinecone
- recruiter candidate review view backed by real candidate data plus recruiter-only AI summary
- shared technical and behavioral trait-scoring rubric
- Bedrock-backed structured trait-scoring service foundation
- lane package split
- product, architecture, and spec documentation

## Documentation Rules

Every meaningful change must create a Markdown spec in `docs/specs/`.

If behavior or structure changes, also update the relevant product or architecture docs.

### Current Important Docs

- `docs/architecture/current-state.md`
- `docs/architecture/ownership-model.md`
- `docs/product/platform-overview.md`
- `docs/product/recruiter-portal.md`
- `docs/product/candidate-workspace.md`
- `docs/product/trait-scoring.md`

## Current Product Decisions To Respect

- Search is scoped to one recruiter-owned job posting
- Recruiters do not search globally across all candidates
- Candidate recommendations are externally authored and verified
- Candidates can control visibility/order, not recommendation content
- The current live pentagon is heuristic and legacy
- The V2 rubric direction is:
  - technical: Technical Depth, System Design, Implementation Quality, Problem Solving, Technical Adaptability
  - behavioral: Ownership, Execution, Leadership, Communication, Collaboration

## Current Gaps

- Landing page still uses sample showcase data rather than live records
- Candidate profile editing is light beyond banner fields and recommendation-derived profile sections
- Pinecone indexing is lazy on first search rather than eagerly refreshed after every write
- SES delivery for recommender requests is not wired yet

## Environment Contract

On this line, Aurora is expected through the new Vercel project env names:

- `PROD_AWS_REGION`
- `PROD_AWS_ROLE_ARN`
- `PROD_PGHOST`
- `PROD_PGPORT`
- `PROD_PGUSER`
- `PROD_PGDATABASE`

Recruiter search expects:

- `PINECONE_API_KEY`
- `PINECONE_HOSTNAME`

## If You Are A New Agent

Start by:

1. Reading this file
2. Reading `docs/architecture/current-state.md`
3. Reading the latest relevant spec in `docs/specs/`
4. Staying inside your owned package
5. Adding a new Markdown spec for your change
