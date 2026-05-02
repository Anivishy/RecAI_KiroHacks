---
inclusion: always
---

# RecAI — Candidate Flows

## Candidate Account

- Candidates sign up with email + password (Aurora-backed)
- Auto-derived slug from full name with collision suffixing (e.g., `maya-chen`, `maya-chen-2`)
- Slugs are not editable yet
- Session cookie: `recai_candidate_session`, 14-day sliding TTL
- Dashboard is a LinkedIn-style profile workspace (not AppShell + SectionCard grid)

## Candidate Dashboard Layout

- **Hero card**: cover gradient, avatar (initials-only, no upload), name, contact pills row
- **Left column**: Experience (recommendation-derived), Recommendations, Recruiter Groups
- **Right rail**: Banner editor, Request a recommendation, Recruiter groups manager, Account (sign-out)
- No client-side loading spinners — all forms are plain HTML POST with server-side redirects

## Profile Banner

- 4 contact link fields: Email, GitHub, LinkedIn, Personal website
- Display-only, never indexed
- Stored in `candidate_accounts` table
- URL fields auto-prepend `https://` if no scheme present; email stored raw
- Empty fields → NULL in DB

## Recommendation Requests

- Candidate creates a request by entering recommender's email
- Candidate specifies the role the recommendation should be about (pre-fill hint for recommender)
- RecAI generates a unique tokenized link for the recommender
- Tokens expire after 7 days
- SES email delivery not yet wired — links shared manually for now

## Joining Recruiter Groups

- Recruiter publishes invite link inside external job posting
- Link format: `/candidate/sign-in?join={inviteCode}`
- If signed in: auto-join the posting's candidate pool
- If not signed in: sign up/in first, then auto-join
- Candidate can be in multiple groups simultaneously
- Groups management page shows all joined groups with ability to leave

## Public Candidate Profile (`/c/[candidateSlug]`)

- Candidate-owned surface
- Assembled from Aurora data: `candidate_accounts` + submitted recommendation evidence
- Display order: Banner → Pentagon → Experience List → Recommendations (drill-down)
- Experience cards derived from recommender-submitted role context
- Projects and pentagon scores derived from submitted recommendation text
- Empty states shown when no recommendation evidence exists yet

## Candidate Data Model

### candidate_accounts table
- id, email, normalized_email, full_name, slug, password_hash
- banner_email, banner_github_url, banner_linkedin_url, banner_website_url
- headline, "current_role" (quoted — Postgres keyword), location, years_experience, target_roles, bio
- created_at, updated_at

### candidate_sessions table
- id, candidate_id (FK), session_token_hash (unique), expires_at, created_at, last_seen_at

### recommendation_requests table
- candidate_id, candidate_slug
- Submitted recommendation evidence resolves back to candidate profile assembly

### posting_candidates table
- Join table between recruiter job postings and candidate accounts
- Powers: posting candidate counts, group membership views, search pool selection, review page gating
