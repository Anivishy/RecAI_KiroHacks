# Candidate Workspace

## Purpose

The candidate workspace helps candidates build a credible public presence that is supported by verified external recommendations instead of self-authored claims alone.

## Core Behaviors

### Accounts

- Candidates sign in with their own accounts via email and password.
- The candidate workspace dashboard is a LinkedIn-style profile view that hosts profile banner editing, recommendation request initiation, recruiter group membership, and recommendation visibility management.
- The candidate account owns profile editing, job-posting opt-ins, and recommendation request management.

### Profile

- Candidates maintain a public-facing profile.
- The profile includes roles, recommendation-derived projects, visible recommendations, and other candidate-selected artifacts.
- Candidates control presentation and ordering, but do not control the contents of submitted recommendations.
- The persistent profile banner (email, GitHub, LinkedIn, personal website) is candidate-entered and display-only. It is never indexed for search.

### Recommendation Requests

- Candidates request recommendations from coworkers, managers, or peers.
- Each request currently creates a direct RecAI link that the candidate shares manually.
- Recommenders can save draft, submit, and delete a submitted recommendation through the tokenized form route.
- Candidates can track request status from their workspace.

### Job Interest

- Candidates can join a recruiter-owned job posting by opening an invite link such as `/candidate/sign-in?join={inviteCode}`.
- Job opt-in is what makes the candidate searchable within that recruiter posting's scope.

## Current Implementation Notes

- Candidate auth is live through an Aurora-backed email/password flow.
- The candidate dashboard is real and session-protected.
- Public candidate profiles resolve from Aurora-backed candidate records plus submitted recommendation evidence.
- Projects and pentagon scores are currently derived from submitted recommendation text and project tags.
- The candidate workspace includes:
  - banner/contact editing
  - recruiter group membership view
  - recommendation request creation and tracking

## Public Profile Contract

- The public profile is the candidate-owned base surface.
- It should present a strong, recruiter-readable view of the candidate's verified work history.
- Recruiters may consume this page directly, but the candidate lane owns its base structure and public content contract.

## Open Questions

- Whether recruiters will also see extra recruiter-only profile insights alongside or beyond the public profile.
- How much of the pentagon explanation is public versus recruiter-specific.
- Which candidate profile sections should be required before a candidate can opt into a job posting.
- Whether candidate auth will eventually add OAuth (Google / LinkedIn) and email verification at signup.
- The full final set of supported banner contact-link types (email, GitHub, LinkedIn, personal website are confirmed; portfolio, X, Google Scholar, and similar surfaces are still open).
