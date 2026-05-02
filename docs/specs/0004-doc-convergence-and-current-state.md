# 0004 Doc Convergence And Current State

## Summary

This change aligns the docs with the implemented package split and adds a current-state handoff document so important build context does not live only in chat history.

## Why

After the package refactor, the code and docs were close but not fully converged. We also wanted a compact Markdown snapshot of the current build state so future contributors and AI agents can recover context quickly.

## Scope

- In scope:
  - doc cleanup for package-based ownership
  - current-state handoff document
  - wrapper-only reminder for `apps/web/src/app/**`
- Out of scope:
  - product behavior changes
  - backend integration
  - recruiter search implementation

## Surfaces Touched

- Docs:
  - `docs/README.md`
  - `docs/architecture/scaffold.md`
  - `docs/architecture/current-state.md`
  - `docs/specs/0002-collaboration-ownership-model.md`

## UX Notes

- No end-user UI changed.
- This is a documentation and collaboration reliability improvement.

## Validation

- Manual checks:
  - confirm the recommender flow is documented under the candidate lane
  - confirm wrapper-only guidance exists in docs
  - confirm current-state doc matches the verified commands and package layout
- Automated checks:
  - existing lint, typecheck, and build status should remain unchanged

## Open Questions

- Whether recruiter-only profile overlays will exist later and, if so, how that extension point should be documented.
