# Documentation Map

This repo uses lightweight, always-updated docs so humans and AI agents can build in parallel without losing context.

## Start Here

New AI agents should read `docs/agent-onboarding.md` first.

## Folders

- `product/`: what the app is supposed to do
- `architecture/`: how the repo and system are structured
- `specs/`: change-by-change implementation records
- `templates/`: templates for creating new specs

## Required Workflow

1. Add or update code.
2. Create a Markdown spec in `docs/specs/` for that change.
3. Update `product/` or `architecture/` docs if the behavior or system direction changed.

## Collaboration Rule

- All contributors should read the shared Markdown docs for context.
- Contributors should avoid editing another lane's implementation files unless the change is explicitly shared work.
- Use specs to communicate decisions across lanes instead of relying on chat history alone.
- Read `docs/architecture/ownership-model.md` before editing route or package ownership boundaries.
- Treat `apps/web/src/app/**` as wrapper-only unless there is a documented routing-level reason to change it.

## Spec Naming

Use zero-padded numbering so the history stays easy to scan:

- `0001-project-foundation.md`
- `0002-recruiter-portal-shell.md`
- `0003-candidate-recommendation-request-flow.md`

Use the template in `docs/templates/change-spec-template.md`.
