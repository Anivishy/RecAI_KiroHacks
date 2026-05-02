# Summary

This change restores the missing UI foundation files on `kiro-test` by directly syncing the global design tokens, font wiring, and self-hosted font assets from old `main`.

# Why This Change Exists

- The redesigned recruiter, candidate, landing, and recommender surfaces were replayed onto `kiro-test`.
- Those surfaces depend on the newer global token contract from old `main`:
  - `--paper`
  - `--ink`
  - `--surface-2`
  - `--hairline`
  - `--verified`
  - `--recruiter`
- `kiro-test` was still using the older global styling file and a different font setup, which caused unreadable contrast, broken colors, and mismatched typography.

# Scope

- Restore `apps/web/src/app/globals.css` from old `main`
- Restore `apps/web/src/app/layout.tsx` from old `main`
- Restore the self-hosted General Sans font files:
  - `apps/web/public/fonts/general-sans/GeneralSans-Variable.woff2`
  - `apps/web/public/fonts/general-sans/GeneralSans-VariableItalic.woff2`

# Routes Or Surfaces Touched

- `/`
- `/candidate/*`
- `/c/[candidateSlug]`
- `/recommend/[requestId]`
- `/recruiter/*`

# Data Contract Updates

- No Aurora, Pinecone, or auth contract changes
- No route contract changes
- This is a presentation-layer foundation sync only

# Validation Steps

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

# Open Questions Or Follow-Ups

- After deployment, verify that the Kiro Hacks Vercel project now matches the intended old-main UI presentation across landing, candidate, recruiter, and recommender flows.
