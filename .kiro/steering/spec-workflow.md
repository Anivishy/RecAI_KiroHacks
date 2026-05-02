---
inclusion: always
---

# RecAI — Spec & Documentation Workflow

## Required Workflow

Every meaningful change must:

1. Create a Markdown spec in `docs/specs/` for that change
2. Update `docs/product/` or `docs/architecture/` docs if behavior or structure changed
3. Pass `npm run lint`, `npm run typecheck`, `npm run build`

## Spec Naming

Zero-padded numbering: `docs/specs/0001-project-foundation.md`, `0002-...`, etc.

Use the template at `docs/templates/change-spec-template.md`.

## Spec Template Structure

Each spec should include:

- **Summary** — one-paragraph description
- **Why** — the user or system problem this solves
- **Scope** — in scope / out of scope
- **Surfaces Touched** — routes, components, data contracts, external services
- **UX Notes** — intended user experience
- **Validation** — manual checks + automated checks
- **Open Questions** — unresolved items

## Documentation Map

- `docs/agent-onboarding.md` — single start-here file for new contributors
- `docs/README.md` — documentation index
- `docs/product/platform-overview.md` — product thesis and experience principles
- `docs/product/candidate-workspace.md` — candidate-specific product definition
- `docs/product/recruiter-portal.md` — recruiter-specific product definition
- `docs/architecture/current-state.md` — what's implemented, verified commands, gaps
- `docs/architecture/ownership-model.md` — lane ownership boundaries
- `docs/architecture/scaffold.md` — repo shape and parallel build boundaries

## Collaboration Rules

- Read shared Markdown docs before making changes
- Stay inside your owned package (candidate or recruiter)
- Use specs to communicate decisions across lanes
- Shared files should only change when the change truly affects both tracks
- Treat `apps/web/src/app/**` as wrapper-only unless there is a documented routing-level reason

## Current Spec History

1. `0001` — Project foundation scaffold
2. `0002` — Collaboration ownership model
3. `0003` — Lane package split (shared/candidate/recruiter)
4. `0004` — Doc convergence and current-state handoff
5. `0005` — Agent onboarding doc
6. `0006` — Recruiter profile view V1 (job-contextual route)
7. `0007` — Tailwind package source fix
8. `0008` — Recruiter Aurora auth (live sign-up/in/out)
9. `0009` — Product-facing UI copy cleanup
10. `0010` — Vercel production deployment stabilization
11. `0011` — Candidate auth and banner + Live recruiter auth on AWS
12. `0012` — Candidate profile, join, and recommendation integration
13. `0013` — Postgres `current_role` quoting fix
