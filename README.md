# RecAI

> AI made every resume look the same. RecAI lets real candidates stand out — through verified recommendations from people who actually worked with them. Proof over polish.

## Human-Centered Design Track

RecAI tackles a social problem that's gotten worse with AI: the collapse of trust in hiring. When everyone can generate a polished resume in seconds, genuine candidates with real experience can't stand out, and recruiters can't tell who actually did the work. The people hurt most are candidates who earned their skills honestly — they're drowned out by AI-generated noise.

RecAI is human-centered because it shifts the source of truth from self-reported claims to verified human voices. Recommenders — real managers and coworkers — prove their identity through work email verification and describe what the candidate actually did. That evidence is what recruiters see, search, and score against. The candidate can't edit what their recommenders say, and the platform never indexes candidate-authored content. This design choice puts authenticity at the center: the humans who worked with you are the ones who speak for you.

By restoring trust in the hiring signal, RecAI strengthens the community of job seekers who play by the rules, improves accessibility to opportunity for candidates without brand-name credentials (a strong recommendation from a verified colleague matters more than a logo), and addresses a social problem — AI-driven credential inflation — that no existing hiring tool is solving.

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

1. Install the web app dependencies.

   **macOS / Linux:**

   ```bash
   npm install
   ```

   **Windows (PowerShell or CMD):**

   ```powershell
   npm.cmd install
   ```

   If your PowerShell execution policy allows `npm install`, the plain form works there too. The `npm.cmd` form is the safest default on Windows.

2. Start the app.

   **macOS / Linux:**

   ```bash
   npm run dev
   ```

   **Windows:**

   ```powershell
   npm.cmd run dev
   ```

3. Open `http://localhost:3000`.

### Cross-platform native binaries

`apps/web` declares optional dependencies for the platform-specific native binaries used by Tailwind v4 (`@tailwindcss/oxide-*`) and `lightningcss-*`, covering macOS (Apple Silicon and Intel), Windows x64, and Linux x64. npm picks the one that matches the machine running `npm install`, so collaborators on different operating systems should not need any manual setup.

If you hit `Cannot find module 'lightningcss.<platform>.node'` or a similar `@tailwindcss/oxide` error after a clone, your lockfile got into a bad state for your platform. Recover with:

```bash
rm -rf node_modules apps/web/node_modules package-lock.json
npm install
```

Do not commit the regenerated `package-lock.json` from that recovery unless you are intentionally bumping the lockfile for the team.

## Working Agreement

Every meaningful product or engineering change should add a new spec in `docs/specs/` and update the relevant product or architecture docs when behavior changes. That keeps human collaborators and AI agents aligned as the project moves quickly.
