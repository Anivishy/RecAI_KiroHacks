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
- can opt into recruiter job postings

### Recommenders

- do not need accounts
- verify through work email plus access code
- submit structured recommendations

### Recruiters

- have accounts
- create job postings
- search only within a job posting's opted-in candidate pool
- use structured filters plus natural-language search
- evaluate candidates through RecAI profiles and recommendation-backed signals

## Current Architecture

This repo currently uses one Next.js app plus separate lane packages.

### App Structure

- `apps/web`
  - Next.js app router
  - thin route wrappers only

- `packages/shared`
  - shared UI components
  - shared domain types
  - routes
  - mock data
  - landing page

- `packages/candidate`
  - candidate sign-in
  - candidate dashboard
  - public candidate profile
  - recommender request flow shell

- `packages/recruiter`
  - recruiter sign-in
  - recruiter dashboard
  - recruiter job posting shell
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

Those files are wrapper routes and should stay thin unless there is a routing-level reason to change them.

## Public Profile Rule

The public candidate profile is currently candidate-owned.

Recruiter flows can link to it and rely on it, but recruiter code should not silently take ownership of that surface.

If recruiter-only profile overlays are added later, they should be documented explicitly instead of quietly modifying the ownership contract.

## Current Technical Direction

- Frontend: Next.js App Router
- Deployment: Vercel
- Backend direction: AWS-managed services
- Recruiter auth path: Aurora PostgreSQL via AWS for Vercel
- Search direction: OpenSearch
- Recommender verification email direction: AWS SES

Recruiter auth is now wired and live through an app-managed Aurora-backed flow on Vercel production.

The live recruiter auth loop has been verified for:

- account creation
- account sign-in
- protected dashboard access
- sign-out
- redirect back to sign-in after sign-out

The app also has a live production deployment on Vercel at `https://recai-sigma.vercel.app`.

## Verified Commands

Run these from the repo root in PowerShell:

```bash
npm.cmd install
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

These commands currently pass.

## Collaboration Rules

- Read shared Markdown docs before making changes.
- Stay inside your owned lane when possible.
- Avoid editing another lane's code unless the change is intentionally shared.
- Keep changes hackathon-practical.
- Prefer working software over architectural perfection.

## Documentation Rules

Every meaningful change must create a Markdown spec in `docs/specs/`.

If behavior or structure changes, also update the relevant product or architecture docs.

### Current Important Docs

- `docs/architecture/current-state.md`
- `docs/architecture/ownership-model.md`
- `docs/product/platform-overview.md`
- `docs/product/recruiter-portal.md`
- `docs/product/candidate-workspace.md`

## What Exists Right Now

The repo already has:

- landing page
- candidate sign-in experience
- recruiter sign-in with real account creation/login routes
- candidate dashboard experience
- recruiter dashboard protected by recruiter session
- recruiter job posting route protected by recruiter session
- recruiter-owned candidate review route
- public candidate profile
- recommender request experience
- lane package split
- product, architecture, and spec documentation

## Immediate Priority

The next most valuable implementation lane is recruiter.

Recommended order:

1. Recruiter job posting creation flow
2. Structured recruiter filters
3. Search pentagon UI
4. Natural-language search shell
5. Candidate auth and candidate data persistence

## Current Product Decisions To Respect

- Search is scoped to one recruiter-owned job posting
- Recruiters do not search globally across all candidates
- Candidate recommendations are externally authored and verified
- Candidates can control visibility/order, not recommendation content
- Pentagon traits currently locked for scaffold work:
  - Technical Depth
  - Execution
  - Ownership
  - Leadership
  - Communication

## Open Questions

These are not fully locked yet:

- whether recruiters will see extra recruiter-only insights on top of the public profile
- final pentagon scoring rubric
- whether candidate auth will share the same Aurora-backed app-auth pattern or use a separate AWS auth service later

## If You Are A New Agent

Start by:

1. Reading this file
2. Reading the latest relevant spec in `docs/specs/`
3. Staying inside your owned package
4. Adding a new Markdown spec for your change

If you need deeper detail after this file, use:

- `docs/architecture/current-state.md` for current implementation status
- `docs/architecture/ownership-model.md` for edit boundaries
- the latest numbered spec files for recent decisions
