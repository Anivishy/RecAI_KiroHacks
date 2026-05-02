# 0011 Candidate Auth And Banner

## Summary

This change adds the first real backend-authenticated candidate flow. Candidates can now create accounts, sign in, sign out, and reach a protected candidate dashboard styled as a LinkedIn-shaped profile workspace. The dashboard hosts the only fully-wired candidate operation in this slice: editing the profile banner (display-only contact links). Other candidate operations (request a recommendation, manage groups, public profile rebuild) appear as visible "Coming next" tiles on the dashboard so the navigation hub is in place before the slices that fill them in.

This slice is the foundation that later candidate work depends on: the public profile rebuild, the recommendation request flow, and group management all need a persistent candidate identity before they can be built. It mirrors the recruiter Aurora-backed auth pattern from spec `0008-recruiter-aurora-auth.md` so the two lanes share infrastructure conventions without sharing code.

## Why

The candidate lane today is a mock-data shell. There is no candidate sign-in, no candidate row in the database, and no per-candidate state of any kind. Every later candidate slice (public profile, recommendation request, group join, group management) depends on a real candidate identity to attach data to, so adding auth first unlocks every downstream slice.

The PRD describes three classes of candidate-controlled behavior: account, banner, and operations (request recommendations, join/manage groups, view recommendations about themselves). The PRD also enforces the trust constraint that **only recommender-authored content is indexed**, which means most of what is rendered on the candidate's profile (headline, projects, recommendations, pentagon) is downstream of recommender data that does not exist yet. The only purely candidate-controlled, persistent state we can usefully ship in slice A is auth + the banner. Everything else either depends on recommender data or on slice work scheduled for later.

The dashboard is reshaped from the existing `SectionCard` grid into a LinkedIn-style profile-shaped workspace because the candidate's mental model of their own ReqAI presence is "this is what my public profile looks like and these are the things I can do to it" — closer to a profile editor than to a tile-based admin console.

## Scope

**In scope**

- Aurora-backed candidate accounts and sessions with email + password.
- New API routes for sign-up, sign-in, sign-out, and banner update.
- Replacement of the existing static `CandidateSignInPage` with real signup/signin forms.
- Replacement of the existing mock-data `CandidateDashboardPage` with a real, session-gated, LinkedIn-shaped dashboard.
- Inline right-rail banner editor wired up to persist 4 contact link fields (email, GitHub, LinkedIn, personal website).
- Auto-derived candidate slug at signup with collision suffixing.
- Candidate sign-out form component.
- Two minimal "Coming next" route stubs for the dashboard CTAs that link to slices C and D (`/candidate/recommendations/new`, `/candidate/groups`).
- Documentation updates: this spec, `current-state.md`, `candidate-workspace.md`, and `agent-onboarding.md` "what exists" / priority shift.

**Out of scope**

- Public profile route move from `/c/[slug]` to `/candidate/profile/[slug]` (deferred to slice B).
- Recommendation request flow (deferred to slice C).
- Group join, auto-join via external link, and group management UI (deferred to slice D).
- Recommender flow (separate package work, separate spec).
- Email verification at signup, OAuth providers (Google / LinkedIn) — PRD open question #8 deferred.
- Avatar upload — slice A renders initials only.
- Pentagon, experience cards, recommendations rendering — all dependent on recommender data that does not exist yet.
- ReqAI rename — codebase keeps the RecAI name.
- Recruiter-lane changes of any kind.

## Surfaces Touched

**Routes**

- `/candidate/sign-in` — replaced (was a static stub; becomes a real signup + signin form pair).
- `/candidate/dashboard` — replaced (was mock data; becomes a session-gated LinkedIn-shaped workspace).
- `/candidate/recommendations/new` — new stub page rendered from `apps/web/**` returning a "Coming next" `AppShell` with a back link.
- `/candidate/groups` — new stub page rendered from `apps/web/**` returning a "Coming next" `AppShell` with a back link.
- `/api/candidate/auth/sign-up` — new POST handler.
- `/api/candidate/auth/sign-in` — new POST handler.
- `/api/candidate/auth/sign-out` — new POST handler.
- `/api/candidate/profile/banner` — new POST handler (auth-gated).

**Components and modules**

- `packages/candidate/src/server/candidate-database.ts` — new. Aurora pool, mirrors `recruiter-database.ts`. Independent `pg.Pool` instance, separate `attachDatabasePool` registration.
- `packages/candidate/src/server/candidate-auth.ts` — new. Functions: `ensureCandidateAuthSchema`, `signUpCandidate`, `signInCandidate`, `getCandidateSession`, `requireCandidateSession`, `destroyCandidateSession`, `updateCandidateBanner`, `buildCandidateSignInUrl`, `getSessionCookieOptions`. Constants: `CANDIDATE_SESSION_COOKIE_NAME` (the candidate-lane equivalent of the recruiter cookie constant). Errors: `CandidateAuthError`.
- `packages/candidate/src/server/candidate-slug.ts` — new. Pure helper that produces a slug base from a full name plus a `claimSlug(client, baseFullName)` function that walks `<base>`, `<base>-2`, ..., `<base>-99`, then `<base>-<6charrandom>`.
- `packages/candidate/src/pages/candidate-sign-in-page.tsx` — replaced. Two-up `SectionCard` layout with create-account and sign-in forms; reads `?error=` and `?notice=`.
- `packages/candidate/src/pages/candidate-dashboard-page.tsx` — replaced. Calls `requireCandidateSession()`, renders the new hero + left-column empty-state cards + right-rail editor.
- `packages/candidate/src/components/candidate-profile-hero.tsx` — new. Server component for the cover-gradient + avatar + name + contact-pill row.
- `packages/candidate/src/components/candidate-banner-editor.tsx` — new. Right-rail form posting to `/api/candidate/profile/banner`.
- `packages/candidate/src/components/candidate-sign-out-form.tsx` — new. Mirrors `recruiter-sign-out-form.tsx`.
- `packages/candidate/src/index.ts` — re-export the new pages and components needed by route wrappers.
- `packages/shared/src/lib/domain/types.ts` — add `CandidateAccount` and `CandidateBanner` types.
- `packages/shared/src/index.ts` — re-export the new types.
- `apps/web/src/app/globals.css` — small additions: `.cover-gradient` utility for the hero cover, `.avatar-initials` utility for the avatar circle.
- `apps/web/src/app/(auth)/candidate/sign-in/page.tsx` — unchanged (still re-exports `CandidateSignInPage`).
- `apps/web/src/app/(platform)/candidate/dashboard/page.tsx` — unchanged (still re-exports `CandidateDashboardPage`).
- `apps/web/src/app/(platform)/candidate/recommendations/new/page.tsx` — new wrapper for the stub page.
- `apps/web/src/app/(platform)/candidate/groups/page.tsx` — new wrapper for the stub page.

**Data contracts**

Two new Aurora tables:

```sql
CREATE TABLE IF NOT EXISTS candidate_accounts (
  id                  TEXT PRIMARY KEY,
  email               TEXT NOT NULL,
  normalized_email    TEXT NOT NULL UNIQUE,
  full_name           TEXT NOT NULL,
  slug                TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  banner_email        TEXT,
  banner_github_url   TEXT,
  banner_linkedin_url TEXT,
  banner_website_url  TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_sessions (
  id                  TEXT PRIMARY KEY,
  candidate_id        TEXT NOT NULL REFERENCES candidate_accounts(id) ON DELETE CASCADE,
  session_token_hash  TEXT NOT NULL UNIQUE,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS candidate_sessions_candidate_id_idx ON candidate_sessions (candidate_id);
CREATE INDEX IF NOT EXISTS candidate_sessions_expires_at_idx   ON candidate_sessions (expires_at);
```

Schema bootstrap is lazy: `ensureCandidateAuthSchema` runs `CREATE TABLE IF NOT EXISTS` inside a single-flight promise the first time auth is touched per cold start, identical to the recruiter pattern.

New TypeScript types in `packages/shared/src/lib/domain/types.ts`:

```ts
export interface CandidateAccount {
  id: string;
  email: string;
  fullName: string;
  slug: string;
}

export interface CandidateBanner {
  email: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}
```

**External services**

- Aurora PostgreSQL via the AWS for Vercel integration (already required by the recruiter lane). No new env variables — the candidate pool reuses `AWS_REGION`, `AWS_ROLE_ARN`, `PGHOST`, `PGPORT`, `PGUSER`, `PGDATABASE`, and Vercel's OIDC token.
- No SES, no S3, no OpenSearch in this slice.

## Auth Contract

**Cookie and session constants**

- Cookie name: `recai_candidate_session`. Independent from the recruiter cookie; both can coexist on the same domain.
- Session TTL: 14 days. Sliding window via `last_seen_at` on every authenticated read.
- Cookie options: `httpOnly`, `sameSite: lax`, `secure` in production, `path: /`, `expires` set to the session row's `expires_at`.

**`POST /api/candidate/auth/sign-up`**

- Inputs (form-encoded): `fullName`, `email`, `password`.
- Validation order: required-fields → email contains `@` → password length ≥ 8.
- Success path: hash password (`scrypt:salt:hash`, same format as recruiter), claim slug, insert candidate row, create session row, set cookie, 302 → `/candidate/dashboard`.
- Failure: 302 → `/candidate/sign-in?error=<code>`. Codes: `missing-fields`, `invalid-email`, `weak-password`, `email-in-use`, `setup-required`, `server-error`.

**`POST /api/candidate/auth/sign-in`**

- Inputs (form-encoded): `email`, `password`.
- Lookup by `normalized_email`; verify with `timingSafeEqual` over derived scrypt key.
- Success: create session, set cookie, 302 → `/candidate/dashboard`.
- Failure: 302 → `/candidate/sign-in?error=invalid-credentials` (collapses "no such account" and "wrong password").

**`POST /api/candidate/auth/sign-out`**

- Inputs (form-encoded): optional `redirectTo` (defaults to `/candidate/sign-in`).
- Reads cookie, deletes the matching `candidate_sessions` row, clears the cookie (epoch expiry).
- If `redirectTo` resolves to `/candidate/sign-in` and lacks a `notice` query param, append `?notice=signed-out`.

**`POST /api/candidate/profile/banner`**

- Auth-gated: `requireCandidateSession()` runs first.
- Inputs (form-encoded): `bannerEmail`, `bannerGithub`, `bannerLinkedin`, `bannerWebsite` — all optional.
- Per-field normalization: `trim()`, empty → `NULL`. For `bannerGithub`, `bannerLinkedin`, `bannerWebsite`: if no scheme is present, prepend `https://`. `bannerEmail` is stored raw.
- `UPDATE candidate_accounts SET banner_email = $1, banner_github_url = $2, banner_linkedin_url = $3, banner_website_url = $4, updated_at = NOW() WHERE id = $5`.
- Success: 302 → `/candidate/dashboard?notice=banner-saved`.
- Failure: 302 → `/candidate/dashboard?error=banner-save-failed`.

**Session-required pages**

- `/candidate/dashboard` calls `requireCandidateSession()` at the top of the server component. Redirects to `/candidate/sign-in?error=auth-required` if there is no session.
- `/candidate/sign-in` checks for an existing session; if present, redirects to `/candidate/dashboard`.

**Error and notice copy** (rendered by `candidate-sign-in-page.tsx`)

- `auth-required`: "Sign in to access the candidate workspace."
- `email-in-use`: "That email already has a candidate account."
- `invalid-credentials`: "That email and password combination did not match a candidate account."
- `invalid-email`: "Enter a valid email to create the candidate account."
- `missing-fields`: "Fill out all required candidate account fields to continue."
- `server-error`: "Something went wrong while contacting candidate auth. Please try again."
- `setup-required`: "Candidate account access is temporarily unavailable. Please try again shortly."
- `weak-password`: "Choose a password with at least 8 characters."
- Notice `signed-out`: "You have been signed out of the candidate workspace."

The dashboard renders its own status pills for `notice=banner-saved` and `error=banner-save-failed`.

## Slug Generation

1. Normalize `fullName`: lowercase, strip non-alphanumeric runs to `-`, collapse repeated `-`, trim leading and trailing `-`. Empty result → fall back to the literal string `candidate`.
2. Try inserting with `slug = <base>`. If the unique constraint fires, try `<base>-2`, `<base>-3`, ..., `<base>-99` in sequence.
3. After 99 collisions, append a 6-character random suffix and try once more (`<base>-a8f3d2`).
4. The slug claim is the `INSERT` itself — there is no read-then-write window to race on.

Slugs are not editable in slice A. A future spec can add an "edit my profile URL" affordance on the dashboard.

## UX Notes

**Sign-in page** stays in `AppShell` + `SectionCard` style for visual parity with the recruiter sign-in page. Two side-by-side `SectionCard`s: "Create account" (left) and "Return to candidate workspace" (right). Reads `?error=` and `?notice=` and renders banner messages above the form grid. "Back to landing" action lives in the `AppShell` header.

**Dashboard** does not use `AppShell`. AppShell's eyebrow + giant title + description block fights the LinkedIn hero card visually. The dashboard renders a minimal top bar with just the RecAI wordmark linked to `/`, then the hero card, then a two-column body. The whole page sits inside the existing `grid-pattern` background with the same `max-w-7xl` mobile-padded container the other lanes use, so the surrounding chrome still matches the rest of the product.

**Hero card** (`candidate-profile-hero.tsx`):

- Cover gradient: `linear-gradient(120deg, rgba(21,94,239,0.85), rgba(15,118,110,0.85))`.
- Avatar: 84px circle, candidate's initials (first letter of first space-separated word + first letter of last word from `fullName`), gradient fill matching the cover, white border.
- Eyebrow: `Candidate Workspace`. Name: `fullName`. Empty headline copy: "Your headline appears once verified recommendations are submitted." (static, never candidate-edited per PRD §1.4).
- Contact pills row: 4 pills, one per banner field. Filled pills show an icon + the value. Empty pills show italic "＋ Add email" / "＋ Add GitHub" / etc., visual-only.
- Right side of the hero (below the cover): a single secondary "View public profile" link pointing at `/c/[slug]`. In slice A this can 404 if the slug doesn't match a mock candidate — see the corresponding risk below. Sign-out lives in the right rail, not on the hero.

**Left column** (three empty-state cards, in order):

- **Experience** — "Roles built from verified recommendations." Empty box: "No recommendations submitted yet — your experience timeline will appear here." CTA: "Request a recommendation" (warm-orange) → `/candidate/recommendations/new`.
- **Recommendations** — "Verified voices about your work." Empty box: "No recommendations submitted about you yet." No CTA.
- **Recruiter Groups** — "Job pools you have joined." Empty box: "You haven't joined any recruiter groups yet." CTA: "Open groups manager" (secondary) → `/candidate/groups`.

**Right rail** (four cards, in order):

- **Edit profile banner** (teal-tinted) — 4 labeled inputs (Email / GitHub / LinkedIn / Personal website). Pre-filled with current values. "Save banner" button submits `POST /api/candidate/profile/banner`. After redirect, a "Saved ✓" pill renders at the top of the card while `?notice=banner-saved` is in the URL.
- **Request a recommendation** (warm-tinted) — "Start a request" link to `/candidate/recommendations/new`. "Coming next" pill.
- **Recruiter groups** (neutral) — "Manage groups" link to `/candidate/groups`. "Coming next" pill.
- **Account** (neutral) — `<CandidateSignOutForm />` only.

**Loading and error states**

No client-side loading spinners; every form is a plain HTML POST that hits an API route and 302s back. The `?error=` / `?notice=` query params drive all status messaging. No optimistic UI; no client components for forms.

**Independence from recruiter auth**

Separate `pg.Pool`, separate cookie name, separate session table, separate `requireCandidateSession()`. A user can be signed in as both a recruiter and a candidate at the same time on the same domain.

## Validation

**Automated checks** (must pass from repo root)

- `npm run lint`
- `npm run typecheck`
- `npm run build`

**Manual checks — Aurora not attached** (current production state)

- `/candidate/sign-in` renders the two `SectionCard`s, no console errors.
- Submitting either form posts and redirects back with `?error=setup-required`. The banner message renders.
- `/candidate/dashboard` redirects to `/candidate/sign-in?error=setup-required`.
- `/recruiter/dashboard` and `/c/maya-chen` are unaffected.

**Manual checks — Aurora attached locally** (after `vercel env pull`)

- Sign-up with valid fields → redirected to `/candidate/dashboard`. Hero shows initials + name. All 4 contact pills empty.
- Banner editor: enter all 4 fields, save → redirect to `/candidate/dashboard?notice=banner-saved`. Pills now populated. "Saved ✓" pill renders.
- Sign out → cookie cleared, lands on `/candidate/sign-in?notice=signed-out`.
- Sign in with the same credentials → dashboard with banner still populated.
- Duplicate email signup → `?error=email-in-use`.
- Sign-in with wrong password → `?error=invalid-credentials`.
- Slug collision: sign up two accounts named "Maya Chen"; second one gets `slug = maya-chen-2` (verify with `SELECT slug FROM candidate_accounts`).
- Empty banner submission (all 4 fields blank) → all DB columns set to `NULL`, no error, all pills show empty state.
- Banner field with no scheme (e.g., `github.com/x` typed into the GitHub input) → DB stores `https://github.com/x`. Email field stays raw.

**Cross-lane regression**

- `/recruiter/dashboard` works as before; recruiter cookie unaffected.
- `/c/maya-chen` (mock candidate) still renders the existing public profile.
- `/recruiter/jobs/senior-platform-engineer/candidates/maya-chen` still works.

## Risks

- **Two pools, one bootstrap.** `candidate-database.ts` and `recruiter-database.ts` each create their own `pg.Pool` and call `attachDatabasePool`. Vercel handles this correctly; locally it doubles the connection count. Acceptable at hackathon scale.
- **Slug PII concern.** Auto-deriving slugs from full name leaks the candidate's real name into the URL. Acceptable per LinkedIn precedent and PRD silence on the matter; an "edit slug" affordance is a follow-up spec.
- **Permissive banner validation.** No URL regex, no per-platform format check. A user could put `lol` in the GitHub input and the dashboard would render a pill linking to `https://lol`. Acceptable hackathon trade.
- **Mock-candidate / new-candidate URL collision.** A new account named "Maya Chen" gets `slug = maya-chen-2` because the slug uniqueness check runs against the DB only and the mock data uses `maya-chen`. So `/c/maya-chen` continues to render the mock profile while `/c/maya-chen-2` 404s in slice A. Slice B reconciles when the public profile is rebuilt against the DB.

## Open Questions

- **Slice B (public profile rebuild)** — does the move to `/candidate/profile/[slug]` cut over to DB-only or keep a fallback that serves mock candidates? PRD-aligned answer is DB-only with mock removed; recruiter-lane links to mock candidates would need updating in the same slice.
- **Slice C (recommendation request flow)** — kills the `/candidate/recommendations/new` stub.
- **Slice D (groups management)** — kills the `/candidate/groups` stub. PRD §2.3 also describes auto-join via an external recruiter link, which needs a separate handler.
- **PRD open question #7** — slice A ships email + GitHub + LinkedIn + personal website. Future banner expansions require a schema change.
- **PRD open question #8** — slice A defers OAuth and email verification. A later spec adds AWS SES verification, then Google / LinkedIn OAuth.
- **Avatar source** — slice A renders initials forever. A future spec decides between S3 upload, OAuth-provider photo, or staying initials-only.
- **Slug rename UI** — not in slice A; future spec.

## Documentation Updates

- `docs/architecture/current-state.md` — add candidate auth bullets to "What Is Implemented" and the "Ownership Snapshot."
- `docs/product/candidate-workspace.md` — note that the workspace is now signed-in-real with a persistent banner; mark recommendation request, groups, and public profile rebuild as upcoming.
- `docs/agent-onboarding.md` — bump "What Exists Right Now" to include candidate auth and the LinkedIn-style dashboard; shift the "Immediate Priority" list (candidate auth comes off the list, recommender flow / public profile rebuild move up).
- `.env.example` — no changes (all required env vars already present from the recruiter lane).
