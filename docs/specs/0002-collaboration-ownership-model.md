# 0002 Collaboration Ownership Model

## Summary

This change strengthens the scaffold documentation so parallel recruiter and candidate work can proceed with clearer ownership boundaries and less risk of merge conflicts.

## Why

The first scaffold created the route split, but the collaboration contract still needed more detail:

- the candidate lane needed a dedicated product doc,
- the shared public profile needed explicit ownership,
- and the quick-start docs needed to match the Windows PowerShell environment.

## Scope

- In scope:
  - candidate workspace product doc
  - lane ownership architecture doc
  - explicit public-profile ownership guidance
  - Windows-safe quick-start commands
- Out of scope:
  - package-level refactor
  - recruiter-only profile extension implementation
  - auth and backend wiring

## Surfaces Touched

- Docs:
  - `README.md`
  - `AGENTS.md`
  - `docs/architecture/scaffold.md`
  - `docs/architecture/ownership-model.md`
  - `docs/product/candidate-workspace.md`
- Shared contract:
  - ownership of `/c/[candidateSlug]`

## UX Notes

- No end-user UI changed in this spec.
- This is a contributor-facing alignment change so both human teammates and AI agents can move faster with less ambiguity.

## Validation

- Manual checks:
  - confirm candidate flow now has a dedicated product doc
  - confirm ownership of the shared public profile is explicit
  - confirm quick-start commands match the Windows shell reality
- Automated checks:
  - no code-path behavior changes required

## Open Questions

- Whether the public candidate profile remains fully identical for recruiters or later gains recruiter-only overlays.
- The workspace-package split question was resolved in `0003-lane-package-split.md` as a single Next app with separate recruiter, candidate, and shared packages.
