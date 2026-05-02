# 0008 Recruiter Aurora Auth

## Summary

This change adds the first real backend-authenticated recruiter flow. Recruiters can now create accounts, sign in, sign out, and access protected recruiter routes through an app-managed auth layer built for Aurora PostgreSQL via the AWS for Vercel integration path.

## Why

The recruiter portal needed to stop behaving like a static shell and start acting like a real application. For the hackathon, recruiter account creation and login are foundational because every recruiter flow depends on a persistent identity and protected workspace.

## Scope

- In scope:
  - recruiter sign-up and sign-in forms
  - server-side recruiter sessions
  - Aurora-backed recruiter account and session schema bootstrap
  - protected recruiter dashboard, job posting, and candidate review routes
  - environment contract updates for AWS Aurora via Vercel
- Out of scope:
  - candidate auth
  - recruiter job posting persistence
  - recruiter search persistence
  - Cognito or third-party auth providers

## Surfaces Touched

- Routes:
  - `/recruiter/sign-in`
  - `/recruiter/dashboard`
  - `/recruiter/jobs/[jobId]`
  - `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`
  - `/api/recruiter/auth/sign-up`
  - `/api/recruiter/auth/sign-in`
  - `/api/recruiter/auth/sign-out`
- Components:
  - recruiter sign-out form
  - recruiter sign-in page
- Data contracts:
  - `RecruiterAccount` now includes `email`
- External services:
  - Aurora PostgreSQL through AWS for Vercel
  - Vercel OIDC + RDS IAM auth runtime pattern

## UX Notes

- Recruiters now see real account-creation and sign-in forms instead of a navigation placeholder.
- Protected recruiter pages redirect back to recruiter sign-in when no valid recruiter session exists.
- The visible copy is product-facing; backend setup details stay in docs and error handling instead of becoming part of the user-facing narrative.

## Validation

- Manual checks:
  - recruiter sign-in page renders account creation and login forms
  - recruiter routes compile as protected dynamic routes
  - sign-out route clears the recruiter session cookie and redirects
- Automated checks:
  - `npm.cmd run lint`
  - `npm.cmd run typecheck`
  - `npm.cmd run build`

## Open Questions

- When live AWS provisioning is completed, should candidate auth reuse the same Aurora-backed app-auth pattern for consistency?
- Do we want recruiter onboarding to immediately create a first empty job posting after account creation, or keep dashboard entry first?
