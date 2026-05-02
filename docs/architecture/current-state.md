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
  - recruiter job posting search shell
  - recruiter-owned candidate review view
- Candidate lane:
  - candidate sign-in
  - candidate dashboard
  - public candidate profile
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
- Search and recruiter KB retrieval: OpenSearch
- Recommender verification email direction: AWS SES

## Current Backend Status

- The repo is linked to the Vercel project `recai`.
- The Vercel project is now configured as a `Next.js` monorepo deployment with:
  1. `apps/web` as the root directory
  2. source files outside the root directory enabled
  3. framework auto-output detection instead of a static `public` output directory
- Aurora PostgreSQL is attached to the Vercel project through the AWS for Vercel integration.
- Recruiter auth is now live on production and has been verified for:
  1. recruiter sign-up
  2. recruiter sign-in
  3. protected dashboard access
  4. recruiter sign-out
  5. redirect back to sign-in after sign-out

## Immediate Next Build Priority

The next most valuable implementation slice is the recruiter lane:

1. recruiter job posting creation flow
2. structured filters and search-pentagon UI
3. natural-language search shell backed later by OpenSearch
4. recruiter results and search-state persistence polish

## Notes For Future Context

- The public candidate profile is currently candidate-owned.
- If recruiter-only overlays are added later, they should be explicitly documented instead of silently changing ownership of the public profile.
- The package split was chosen for hackathon speed and parallel work safety, not long-term platform complexity.
