# 0007 Tailwind Package Source Fix

## Summary

This change fixes the styling pipeline so Tailwind scans the lane packages in `packages/*` and generates utility classes for components rendered from those packages.

## Why

The app was restructured into `shared`, `candidate`, and `recruiter` packages, but Tailwind was still only imported at the app level without explicitly sourcing those package files. That caused the UI to render mostly unstyled even though class names were present in the markup.

## Scope

- In scope:
  - Tailwind source registration for package-based UI files
- Out of scope:
  - visual redesign
  - layout changes
  - recruiter feature behavior changes

## Surfaces Touched

- Styling:
  - `apps/web/src/app/globals.css`
- Docs:
  - `docs/specs/0007-tailwind-package-source-fix.md`

## UX Notes

- No intended UX behavior changed.
- The visible result is that the existing landing page and package-based surfaces now render with their intended styling.

## Validation

- Manual checks:
  - refresh the landing page and confirm Tailwind styling is visible
  - confirm recruiter and candidate pages also render styled
- Automated checks:
  - lint
  - typecheck
  - build

## Open Questions

- None for this fix.
