# Current State

## What Is Implemented

- The project has a working Next.js scaffold with a landing page and route shells.
- The recruiter flow now includes a recruiter-owned candidate review route scoped to a job posting.
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
- Search and recruiter KB retrieval: OpenSearch
- Recommender verification email direction: AWS SES

## Immediate Next Build Priority

The next most valuable implementation slice is the recruiter lane:

1. recruiter profile polishing and interaction refinement
2. job posting creation flow
3. structured filters and search-pentagon UI
4. natural-language search shell backed later by OpenSearch

## Notes For Future Context

- The public candidate profile is currently candidate-owned.
- If recruiter-only overlays are added later, they should be explicitly documented instead of silently changing ownership of the public profile.
- The package split was chosen for hackathon speed and parallel work safety, not long-term platform complexity.
