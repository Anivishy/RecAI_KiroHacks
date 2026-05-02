# Candidate Workspace

## Purpose

The candidate workspace helps candidates build a credible public presence that is supported by verified external recommendations instead of self-authored claims alone.

## Core Behaviors

### Accounts

- Candidates sign in with their own accounts via email and password.
- The candidate workspace dashboard is a LinkedIn-style profile view that hosts profile banner editing, recommendation request initiation, group membership, and view-own-recommendations.
- The candidate account owns profile editing, job-posting opt-ins, and recommendation request management.

### Profile

- Candidates maintain a public-facing profile.
- The profile includes roles, projects, visible recommendations, and other candidate-selected artifacts.
- Candidates control presentation and ordering, but do not control the contents of submitted recommendations.
- The persistent profile banner (email, GitHub, LinkedIn, personal website) is candidate-entered and display-only. It is never indexed for search.

### Recommendation Requests

- Candidates request recommendations from coworkers, managers, or peers.
- Each request is sent to a recommender who verifies through work email and an access code.
- Candidates can track request status and decide whether to display completed recommendations publicly.

### Job Interest

- Candidates can join a recruiter’s job posting by opting into that posting’s candidate pool.
- Job opt-in is what makes the candidate searchable within that recruiter’s posting scope.

## Public Profile Contract

- The public profile is the candidate-owned base surface.
- It should present a strong, recruiter-readable view of the candidate’s verified work history.
- Recruiters may consume this page directly, but the candidate lane owns its base structure and public content contract.

## Open Questions

- Whether recruiters will also see extra recruiter-only profile insights alongside or beyond the public profile.
- How much of the pentagon explanation is public versus recruiter-specific.
- Which candidate profile sections should be required before a candidate can opt into a job posting.
- Whether candidate auth will eventually add OAuth (Google / LinkedIn) and email verification at signup, mirroring the PRD's three-option auth list.
- The full final set of supported banner contact-link types (email, GitHub, LinkedIn, personal website are confirmed; portfolio, X, Google Scholar, etc. TBD).
