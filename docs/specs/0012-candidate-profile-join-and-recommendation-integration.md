# 0012 Candidate Profile, Join, And Recommendation Integration

## Summary

This slice replaces the remaining mock-backed candidate runtime paths with Aurora-backed data and finishes the core candidate-to-recruiter integration loop for the hackathon demo.

It covers:

- real candidate profile storage and assembly
- candidate join flow for recruiter invite links
- recruiter search sourcing from real joined candidates
- candidate recommendation-request management inside the candidate lane
- recruiter candidate review sourcing from real candidate records

## Why

Before this slice:

- public candidate profiles were still runtime-mock-backed
- recruiter candidate review pages were still tied to sample candidate data
- recruiter search was wired to Pinecone but still depended on the remaining mock candidate layer
- candidate groups and recommendation management still had placeholder or wrapper-heavy surfaces

For the demo, we need the full loop to be real:

1. recruiter creates a posting
2. candidate joins the posting through an invite link
3. candidate requests recommendations
4. recommenders submit evidence
5. recruiter searches and opens a real candidate review page

## Data Model Changes

### Candidate Accounts

`candidate_accounts` now carries lightweight profile metadata used to build live candidate profiles:

- `headline`
- `current_role`
- `location`
- `years_experience`
- `target_roles`
- `bio`

These fields are seeded with defaults at sign-up so a candidate profile can exist before recommendations are submitted.

### Recommendation Requests

`recommendation_requests` now stores:

- `candidate_id`
- `candidate_slug`

This lets submitted recommendation evidence resolve directly back into candidate profile assembly.

### Posting Memberships

`posting_candidates` is the live join table between recruiter job postings and candidate accounts.

It powers:

- recruiter posting candidate counts
- candidate group membership views
- recruiter search candidate pool selection
- membership gating for recruiter candidate review pages

## New Runtime Behavior

### Candidate Join Flow

- Recruiter posting pages expose invite links of the form `/candidate/sign-in?join={inviteCode}`.
- Candidate sign-up and sign-in both accept `joinCode`.
- After a successful auth action, the candidate is inserted into `posting_candidates`.
- Existing signed-in candidates who hit the join link are added immediately and redirected back to their workspace with a status notice.

### Candidate Profile Assembly

Candidate profiles are now assembled from Aurora-backed data in `candidate-profile-db.ts`.

The profile builder combines:

- `candidate_accounts` core metadata
- submitted recommendation records
- aggregated recommendation project evidence
- heuristic pentagon score inference from submitted text and skill tags

This is now the source of truth for:

- `/c/[candidateSlug]`
- recruiter candidate review pages
- recruiter search indexing

### Recommendation Request Management

The candidate lane now owns:

- a real recommendation request management page
- request creation through `/api/candidate/recommendations`
- shareable recommender links
- request status visibility inside the candidate workspace

The app-router files for candidate groups and candidate recommendation management were reduced back to thin wrappers so ownership stays in `packages/candidate`.

### Recruiter Search Integration

`recruiter-search.ts` now sources candidates from Aurora-backed posting membership and candidate profile assembly rather than the shared mock layer.

The Pinecone namespace per job posting is still the search boundary, but the indexed candidate records now come from:

- real joined candidates
- real submitted recommendation evidence

### Recruiter Candidate Review Integration

The recruiter candidate review page now:

- validates recruiter ownership of the posting
- validates that the candidate is actually in that posting's pool
- loads the real candidate profile
- derives recruiter-facing summary content from that live profile

This keeps the recruiter overlay real without creating a second candidate data model.

## UX Changes

### Candidate Dashboard

The candidate dashboard now shows live:

- recommendation-derived project evidence
- submitted recommendations
- joined recruiter groups
- recommendation-request counts and entry points

### Candidate Groups

The candidate groups page is now real and lists joined recruiter posting pools.

### Public Candidate Profile

The public profile now resolves from Aurora-backed data and shows empty states when no recommendation evidence exists yet.

### Recruiter Search Results

Recruiter search results now include a direct link into the recruiter review page for that candidate and posting.

## Notes

- Landing-page showcase content still uses shared sample data intentionally.
- Pinecone indexing remains lazy on first search. This slice does not yet add eager reindexing on every candidate write.
- SES email delivery for recommender requests is still out of scope for this slice.
