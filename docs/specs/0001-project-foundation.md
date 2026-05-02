# 0001 Project Foundation

## Summary

This change creates the initial RecAI project scaffold, a first-pass landing page, and separate recruiter and candidate route shells so development can proceed in parallel without ambiguity.

## Why

The repo started empty. We needed a real project baseline that:

- establishes a consistent app structure,
- gives both collaborators distinct surfaces to work on,
- and creates a documentation workflow that future AI-assisted changes can follow.

## Scope

- In scope:
  - root repo scripts and docs structure
  - Next.js web app scaffold
  - landing page
  - recruiter, candidate, public profile, and recommender shell routes
  - shared domain types and mock data
- Out of scope:
  - production auth
  - real persistence
  - OpenSearch integration
  - recruiter ranking logic
  - candidate recommendation submission flow implementation

## Surfaces Touched

- Routes:
  - `/`
  - `/candidate/sign-in`
  - `/candidate/dashboard`
  - `/recruiter/sign-in`
  - `/recruiter/dashboard`
  - `/recruiter/jobs/[jobId]`
  - `/c/[candidateSlug]`
  - `/recommend/[requestId]`
- Components:
  - shared cards, shell, and pentagon chart
- Data contracts:
  - candidate profile
  - recommendation
  - job posting
  - recruiter account
  - pentagon traits

## UX Notes

- The landing page clearly separates recruiter and candidate entry points.
- Auth pages are intentionally scaffolded rather than pretending to be production-ready.
- The public profile uses the same visual language as the recruiter shell to keep future consistency high.
- Shared Markdown docs now act as the cross-lane source of truth, while contributors are expected to edit primarily within their own lane to reduce merge conflicts.

## Validation

- Manual checks:
  - confirm each route renders
  - confirm recruiter and candidate navigation are distinct
  - confirm public candidate profile loads mock data
- Automated checks:
  - lint
  - typecheck
  - build

## Open Questions

- Should recruiter views include extra profile-only insights beyond the public candidate page?
- Which AWS-backed transactional store do we want to lock in before wiring persistence?
- What final labels and scoring definitions should the five pentagon traits use?
