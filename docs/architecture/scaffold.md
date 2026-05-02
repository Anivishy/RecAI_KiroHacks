# Project Scaffold Architecture

## Goal Of This First Scaffold

Set up a repo structure that supports fast hackathon iteration while keeping recruiter and candidate workstreams separate enough for parallel development.

## Current Stack Direction

- UI framework: Next.js App Router with TypeScript and Tailwind
- Deployment: Vercel
- Backend services: AWS-managed services
- Search: AWS OpenSearch
- Email verification for recommenders: AWS SES

## Data Direction

For hackathon speed, the current recommendation is:

- Use the Next.js app for the web surface and server-side orchestration
- Use AWS services for persistence, email, and search
- Keep structured filtering outside OpenSearch
- Use OpenSearch only for recruiter natural-language search and pentagon-hover project lookups

The exact transactional data store is still open, but the scaffold keeps domain types centralized so we can wire DynamoDB or another AWS-backed store without rewriting the UI layer.

## Repo Shape

- `apps/web`
  - Next.js app router wrappers
- `packages/shared`
  - Landing page
  - Shared UI primitives
  - Routes, types, and mock data
- `packages/recruiter`
  - Recruiter flow shells
- `packages/candidate`
  - Candidate flow shells
  - Public profile shell
  - Recommender flow shell
- `docs/product`
  - Product definitions and user flow intent
- `docs/architecture`
  - System-level decisions
- `docs/specs`
  - Change history and implementation contracts

## Parallel Build Boundaries

### Recruiter Lane

- `/recruiter/sign-in`
- `/recruiter/dashboard`
- `/recruiter/jobs/[jobId]`

### Candidate Lane

- `/candidate/sign-in`
- `/candidate/dashboard`
- `/c/[candidateSlug]`

The public candidate profile is the current candidate-owned shared surface. Recruiter pages can consume it, but should treat it as a shared contract rather than a recruiter-owned implementation area.

### Shared Lane

- Landing page
- Shared domain types
- Shared UI primitives
- Docs and architecture
