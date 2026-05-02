# 0006 Recruiter Profile View V1

## Summary

This change introduces the first recruiter-owned candidate profile view as a job-contextual route. It keeps the public candidate profile intact while giving recruiters a faster evaluation surface with recruiter-only panels and fit signals.

## Why

Recruiters in RecAI do not search globally. They search inside a single job posting's candidate pool, so the recruiter profile view should preserve that context instead of sending them into a generic public page with no hiring-specific framing.

## Scope

- In scope:
  - recruiter-owned profile route under a job posting
  - recruiter-only summary and fit panels
  - contextual links from recruiter search/result shells
  - shared mock data and route updates needed to support the new surface
- Out of scope:
  - real LLM summaries
  - real ranking logic
  - backend persistence
  - actual OpenSearch integration

## Surfaces Touched

- Routes:
  - `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`
- Recruiter pages:
  - recruiter dashboard links
  - recruiter job posting results links
- Shared data:
  - recruiter review mock contracts
  - route helpers

## UX Notes

- The recruiter profile is contextual to a specific job posting.
- It should feel like a recruiter evaluation workspace, not a duplicate of the public profile.
- The public profile remains accessible as a separate link for parity and trust.

## Validation

- Manual checks:
  - recruiter results link into the recruiter-owned profile route
  - recruiter profile shows job context plus recruiter-only evaluation sections
  - public profile remains separately reachable
- Automated checks:
  - lint
  - typecheck
  - build

## Open Questions

- How much of the recruiter summary will eventually be AI-generated versus rule-based or retrieval-backed.
- Whether recruiter-only overlays should later mirror more of the public profile or stay more compact and evaluative.
