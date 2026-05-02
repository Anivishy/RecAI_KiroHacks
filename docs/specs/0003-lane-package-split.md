# 0003 Lane Package Split

## Summary

This change restructures the scaffold so recruiter, candidate, and shared code live in separate packages while a single Next.js app keeps routing and deployment simple.

## Why

The route split alone reduced some collision risk, but the actual page implementation still lived inside the same app tree. To support parallel work by multiple humans and AI agents, the codebase needed harder boundaries.

## Scope

- In scope:
  - `packages/shared`
  - `packages/candidate`
  - `packages/recruiter`
  - thin route wrappers in `apps/web/src/app`
  - workspace metadata and path aliases
- Out of scope:
  - separate deployments
  - backend service extraction
  - auth and persistence wiring

## Surfaces Touched

- Code:
  - `apps/web/src/app/**`
  - `packages/shared/**`
  - `packages/candidate/**`
  - `packages/recruiter/**`
- Config:
  - root `package.json`
  - `apps/web/tsconfig.json`
  - `apps/web/next.config.ts`
- Docs:
  - repo shape and ownership notes

## UX Notes

- No end-user routes changed.
- This is an internal architecture improvement aimed at safer parallel development.

## Validation

- Manual checks:
  - confirm route wrappers point into the correct package
  - confirm candidate-owned and recruiter-owned surfaces now live in separate directories
- Automated checks:
  - lint
  - typecheck
  - build

## Open Questions

- Whether `shared` should eventually become even smaller by moving some public-profile concerns fully into the candidate package plus a documented extension API.
- Whether the future recruiter overlay, if approved, should live as a separate recruiter-owned surface rather than inside the candidate-owned profile route.
