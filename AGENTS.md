# RecAI Agent Notes

Use this file as the project-specific collaboration contract for any human or AI contributor.

## Non-Negotiables

- Every meaningful change needs a new spec file in `docs/specs/`.
- Every spec must be a Markdown `.md` file.
- If a change affects behavior, also update the relevant document in `docs/product/` or `docs/architecture/`.
- Preserve the split between recruiter and candidate flows so those tracks can be built in parallel.
- Capture open product questions in spec docs instead of burying them in code comments or chat history.
- Read shared Markdown docs before making changes.
- Prefer editing only your owned package or lane files plus your own spec doc to reduce merge conflicts.

## Current Technical Direction

- Frontend: Next.js App Router deployed to Vercel
- Backend services: AWS-managed infrastructure
- Search and recruiter KB retrieval: OpenSearch
- Current state: scaffold plus mock data, no production auth or persistence wired yet

## Package Ownership

- `packages/shared`: shared UI, routes, and domain contracts
- `packages/candidate`: candidate-owned surfaces
- `packages/recruiter`: recruiter-owned surfaces
- `apps/web/src/app/**`: thin route wrappers only

## Routing Conventions

- `/`: landing page and role selection
- `/candidate/*`: candidate auth and dashboard flows
- `/recruiter/*`: recruiter auth, dashboard, and job-posting flows
- `/c/[candidateSlug]`: public candidate profile
- `/recommend/[requestId]`: recommender flow shell

## Shared Surface Ownership

- The base public profile route `/c/[candidateSlug]` is currently candidate-owned.
- Recruiter flows can link to and consume that route, but should not silently redefine its base contract.
- If recruiter-only profile augmentations are later approved, implement them as clearly documented recruiter overlays or adjacent surfaces instead of ad hoc edits to the candidate-owned base.

## Spec Convention

Create files named like `docs/specs/0002-recruiter-dashboard-v1.md`.

Each spec should include:

- Summary
- Why this change exists
- Scope
- Routes or surfaces touched
- Data contract updates
- Validation steps
- Open questions or follow-ups

## Ownership Model

- Shared docs are readable by everyone.
- Recruiter contributors should prefer editing recruiter-owned code and recruiter spec docs.
- Candidate contributors should prefer editing candidate-owned code and candidate spec docs.
- Shared files should be changed deliberately and only when the change truly affects both lanes.
