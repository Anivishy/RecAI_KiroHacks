# 0010 Vercel Production Deployment Stabilization

## Summary

This change makes the RecAI app deploy cleanly to Vercel production from the current monorepo layout.

The final result is a live production deployment at `https://recai-sigma.vercel.app`.

## Why

Two separate deployment blockers had to be resolved before the app could be viewed live:

1. Tailwind v4's Linux native binary was missing during Vercel builds because the workspace lockfile did not contain an installable entry for `@tailwindcss/oxide-linux-x64-gnu`.
2. The Vercel project was configured as `Other` with a static-style output expectation, while this repo is actually a monorepo Next.js app rooted at `apps/web`.

Without fixing both, production deployments either failed during CSS compilation or failed after build completion with an incorrect output-directory check.

## Scope

- In scope:
  - Vercel production build stability
  - workspace dependency fix for Tailwind's Linux native package
  - Vercel project settings correction for monorepo Next.js deployment
  - deployment verification
- Out of scope:
  - AWS marketplace resource attachment
  - recruiter data persistence activation
  - auth behavior changes beyond deployment readiness

## Implementation Notes

### Dependency Fix

- `apps/web/package.json` now declares:
  - `@tailwindcss/oxide-linux-x64-gnu` as an optional dependency pinned to `4.2.4`
- `package-lock.json` now contains the real Linux package entry Vercel needs during `npm install`

### Vercel Project Fix

The Vercel project `recai` was updated to:

- use the `Next.js` framework preset
- use `apps/web` as the root directory
- enable source files outside the root directory for shared workspace packages
- use framework output auto-detection instead of a static `public` output directory

## Validation

### Local

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run typecheck`

### Production

- `vercel project inspect recai` confirms:
  - root directory: `apps/web`
  - framework preset: `Next.js`
- `vercel deploy --prod --yes` succeeded
- `Invoke-WebRequest https://recai-sigma.vercel.app` returned `200`

## Follow-On Work

- Attach Aurora PostgreSQL through the AWS for Vercel integration
- Pull environment variables locally with `vercel env pull`
- Validate recruiter sign-up and sign-in against the live database-backed auth flow
