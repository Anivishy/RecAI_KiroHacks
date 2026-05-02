# 0009 Product-Facing UI Copy Cleanup

## Summary

This change removes development-oriented language from the visible product UI and replaces it with product-facing messaging. The app no longer explains package splits, scaffolding, parallel workstreams, or implementation state directly on the pages that users see.

## Why

Internal build context is useful for engineers and AI agents, but it should not leak into the product experience. The visible UI should describe the hiring value, trust model, and user actions rather than how the repo is organized.

## Scope

- In scope:
  - landing page copy cleanup
  - candidate-facing copy cleanup
  - recruiter-facing copy cleanup
  - pentagon explanatory copy cleanup
- Out of scope:
  - markdown docs and onboarding docs for contributors
  - visual redesign beyond copy-level adjustments
  - feature behavior changes

## Surfaces Touched

- Shared UI:
  - landing page
  - pentagon chart copy
- Candidate pages:
  - candidate sign-in
  - candidate dashboard
  - recommendation request page
- Recruiter pages:
  - recruiter sign-in
  - recruiter dashboard
  - recruiter job posting page

## UX Notes

- The app now speaks in product terms such as trust, verified recommendations, candidate evidence, and recruiter review.
- Terms like `scaffold`, `lane`, `parallel build`, `mock preview`, and similar development framing were removed from visible surfaces.
- Engineering coordination details remain documented in Markdown instead of appearing in the user-facing experience.

## Validation

- Manual checks:
  - landing page reads like a real product homepage
  - candidate pages no longer mention implementation state
  - recruiter pages no longer mention scaffolding or build organization
- Automated checks:
  - `npm.cmd run typecheck`
  - `npm.cmd run lint`
  - `npm.cmd run build`

## Open Questions

- Do we want a future copy pass that sharpens the brand voice further once both recruiter and candidate flows are fully live?
