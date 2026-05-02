# Lane Ownership Model

## Purpose

RecAI is being built in parallel across recruiter and candidate tracks. This document exists to reduce merge conflicts and unclear ownership, especially when both lanes touch the same user journey.

## Current Lane Ownership

### Recruiter-Owned

- `/recruiter/sign-in`
- `/recruiter/dashboard`
- `/recruiter/jobs/[jobId]`
- recruiter-specific search, job posting, and candidate evaluation UX
- `packages/recruiter/**`

### Candidate-Owned

- `/candidate/sign-in`
- `/candidate/dashboard`
- `/c/[candidateSlug]`
- `/recommend/[requestId]`
- candidate-specific onboarding, profile management, recommendation requests, and public profile composition
- `packages/candidate/**`

### Shared

- `/`
- shared domain types
- shared visual system and reusable UI primitives
- product, architecture, and spec docs
- `packages/shared/**`
- `apps/web/src/app/**` as routing wrappers only

## Rule For Shared Surfaces

- Everyone should read the shared Markdown docs before editing.
- The lane that owns a shared surface controls its base contract.
- Other lanes can consume that surface but should avoid editing it unless the change is explicitly a shared decision.
- When a shared surface must change, document the contract update in a spec before or alongside the code change.

## Public Profile Rule

The public candidate profile is the most likely merge-conflict hotspot.

- For now, treat `/c/[candidateSlug]` as candidate-owned.
- Recruiter pages may link into it and rely on it.
- If recruiter-only insights are introduced later, they should be implemented through a clearly documented extension pattern rather than by making recruiter code the hidden owner of the public profile.
