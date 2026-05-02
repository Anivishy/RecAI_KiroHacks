---
inclusion: always
---

# RecAI — Coding Conventions & Project Structure

## Monorepo Layout

```
apps/web/                    — Next.js App Router (thin route wrappers ONLY)
packages/shared/             — shared UI, domain types, routes, landing page
packages/candidate/          — candidate auth, dashboard, profile, recommender flow
packages/recruiter/          — recruiter auth, dashboard, job postings, search, review
docs/product/                — what the app does
docs/architecture/           — how the system is structured
docs/specs/                  — change-by-change implementation records
docs/templates/              — spec template
```

**Critical rule**: `apps/web/src/app/**` files should stay as thin route wrappers. All real implementation lives in the packages.

## Route Groups (apps/web/src/app/)

- `(auth)/` — sign-in pages for candidates and recruiters
- `(platform)/` — authenticated dashboard pages (candidate and recruiter)
- `(profiles)/` — public candidate profiles at `/c/[candidateSlug]`
- `(recommendations)/` — recommender flow at `/recommend/[requestId]`
- `api/` — API route handlers

## URL Routing

- `/` — landing page and role selection
- `/candidate/sign-in` — candidate auth
- `/candidate/dashboard` — candidate workspace
- `/candidate/recommendations/new` — recommendation request creation
- `/candidate/groups` — recruiter group membership management
- `/recruiter/sign-in` — recruiter auth
- `/recruiter/dashboard` — recruiter workspace
- `/recruiter/jobs/[jobId]` — job posting detail + search
- `/recruiter/jobs/[jobId]/candidates/[candidateSlug]` — recruiter candidate review
- `/c/[candidateSlug]` — public candidate profile
- `/recommend/[requestId]` — recommender form flow

## Ownership Model

### Candidate-Owned
- `packages/candidate/**`
- `/candidate/*`, `/c/[candidateSlug]`, `/recommend/[requestId]`

### Recruiter-Owned
- `packages/recruiter/**`
- `/recruiter/*`

### Shared
- `packages/shared/**`
- Landing page, shared UI, shared domain contracts, docs

### Rules
- Candidate and recruiter flows are separate tracks built in parallel
- The public profile `/c/[candidateSlug]` is candidate-owned. Recruiter augmentations should be overlays in recruiter-owned routes, not edits to the base
- Shared files should only change when the change truly affects both tracks
- Do not treat `apps/web/src/app/**` as the main implementation area

## Build & Dev Commands

Run from repo root:

```bash
npm run dev          # start dev server
npm run lint         # ESLint
npm run typecheck    # TypeScript type checking
npm run build        # production build
```

All three validation commands (lint, typecheck, build) must pass before any change is considered complete.

## Code Style

- TypeScript strict mode
- Tailwind CSS 4 for styling
- React Server Components by default; use `"use client"` only when needed
- Prefer named exports
- API routes use Next.js Route Handlers (GET, POST, etc.)
- All forms use plain HTML POST with server-side redirects (no client-side fetch for auth flows)
- Error/notice messaging via `?error=` and `?notice=` query params on redirects

## Auth Pattern

Both candidate and recruiter auth follow the same Aurora-backed pattern:
- Independent `pg.Pool` instances per lane
- Separate cookie names (`recai_candidate_session`, recruiter equivalent)
- Separate session tables
- Lazy schema bootstrap via `CREATE TABLE IF NOT EXISTS` on first cold-start touch
- `scrypt` password hashing with `timingSafeEqual` verification
- 14-day sliding session TTL
- A user can be signed in as both candidate and recruiter simultaneously

## Database

- Aurora PostgreSQL via AWS for Vercel integration
- IAM auth: Vercel OIDC → AWS RDS Signer → short-lived auth tokens
- Env vars: `AWS_REGION`, `AWS_ROLE_ARN`, `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, `VERCEL_OIDC_TOKEN`
- Schema bootstrap is lazy per cold start (no migration runner)
- `current_role` column must always be quoted in SQL (it's a Postgres keyword)

## Search

- Pinecone serverless with `multilingual-e5-large` native inference
- Index: `candidates-vector-db`
- Namespaces: one per recruiter job posting
- Lazy indexing on first search (eager refresh is a gap)
- Env vars: `PINECONE_API_KEY`, optional `PINECONE_INDEX_HOST`
