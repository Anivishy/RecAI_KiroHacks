# RecAI

RecAI is a trust layer for hiring. Instead of relying only on self-reported resumes and AI-polished project descriptions, the platform lets candidates present verified recommendations from people who actually worked with them.

This repo currently contains the shared project scaffold and the first web experience:

- A landing page with distinct recruiter and candidate entry points
- Route shells for recruiter, candidate, public profile, and recommender flows
- Shared domain types and mock data to keep early UI work aligned
- A docs/spec process so teammates and AI agents can collaborate against the same source of truth

## Repo Shape

- `apps/web`: Next.js app for the marketing site and product flows
- `packages/shared`: shared UI, routes, domain types, and mock data
- `packages/candidate`: candidate-owned pages and flow logic
- `packages/recruiter`: recruiter-owned pages and flow logic
- `docs/product`: product context and flow definitions
- `docs/architecture`: technical direction and repo conventions
- `docs/specs`: change-by-change implementation specs
- `docs/templates`: templates used for new specs

## Quick Start

1. Install the web app dependencies:

```bash
npm.cmd install
```

2. Start the app:

```bash
npm.cmd run dev
```

3. Open `http://localhost:3000`

If your PowerShell execution policy allows `npm run ...`, that works too. The `npm.cmd` form is the safest default on Windows.

## Working Agreement

Every meaningful product or engineering change should add a new spec in `docs/specs/` and update the relevant product or architecture docs when behavior changes. That keeps human collaborators and AI agents aligned as the project moves quickly.
