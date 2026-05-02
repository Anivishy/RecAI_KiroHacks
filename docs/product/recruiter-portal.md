# Recruiter Portal

## Purpose

The recruiter portal lets recruiters create job postings and search only within the pool of candidates who explicitly opted into that posting.

## Core Behaviors

### Accounts

- Recruiters sign up through open signup.
- Each recruiter owns their own account.
- There is no company or organization-level account model in the current version.

### Job Postings

- Recruiters create and manage job postings inside the portal.
- Every job posting owns a separate candidate pool.
- Search is always scoped to a single recruiter-owned job posting.

### Search

Recruiters search the posting-specific candidate pool in two ways:

1. Structured filters
2. Natural-language search over the candidate knowledge base

#### Structured Filters

- Standard filters narrow the pool by attributes like role or experience.
- The search pentagon sets minimum required scores across five traits.
- A candidate must meet or exceed the threshold for every trait to remain in the result set.

#### Natural-Language Search

- Recruiters can describe the type of candidate they want in free-form language.
- Retrieval spans projects, technical feedback, and behavioral feedback.
- OpenSearch powers retrieval.
- An LLM interprets the query and ranks candidate matches.

### Results

- Results are displayed as a list of candidate profiles.
- Sorting is relevance only.

### Candidate Profile Access

- Recruiters open candidates through their RecAI profile links.
- The current product intent is that profile content remains highly consistent across viewers.
- For recruiter implementation V1, recruiters will use a recruiter-owned, job-contextual profile route that can include recruiter-only evaluation panels while still preserving access to the underlying public candidate profile.

### Contact

- Outreach happens outside the product using external email.
- There is no in-app messaging or shortlisting workflow in the current version.

## Open Questions

- The source material suggests both profile parity for all viewers and recruiter-only enhancements such as extra stats or AI summaries. That needs to be finalized before recruiter profile implementation begins.
- The exact scoring rubric behind the pentagon traits still needs to be defined.
