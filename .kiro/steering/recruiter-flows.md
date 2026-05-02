---
inclusion: always
---

# RecAI — Recruiter Flows

## Recruiter Account

- Open signup with email + password (Aurora-backed, same pattern as candidate)
- No company or organization-level account model in current version
- Session-protected dashboard, job posting, and candidate review pages
- Independent `pg.Pool`, separate cookie, separate session table from candidate auth

## Job Postings

- Recruiters create and manage job postings inside the portal
- Every job posting owns a separate candidate pool
- Posting fields: name, description, optional internal label (e.g., external req ID)
- Each posting generates a unique invite code for candidate join links
- CRUD backed by Aurora PostgreSQL

## Recruiter Search

Search is always scoped to a single recruiter-owned job posting.

### Structured Filters
- Standard filters narrow the pool by attributes like role or experience
- Search pentagon sets minimum required scores across 5 traits
- Candidate must meet or exceed threshold for every trait to remain in results

### Natural-Language Search
- Free-form description of desired candidate
- Retrieval spans projects, technical feedback, behavioral feedback
- Pinecone powers retrieval with `multilingual-e5-large` embeddings
- Results displayed as a list of candidate profiles, sorted by relevance only

### Current Search Implementation
- Pinecone serverless with job-posting-scoped namespaces
- Lazy indexing on first search for a posting
- Indexed records come from real joined candidates and submitted recommendation evidence
- No OpenAI dependency

## Candidate Review

- Route: `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`
- Validates recruiter ownership of the posting
- Validates candidate is in that posting's pool
- Loads real candidate profile from Aurora
- Derives recruiter-facing summary content from live profile
- Recruiter overlay reads from candidate data — does not create a second data model

## Contact & Outreach

- Outreach happens outside the product via external email
- No in-app messaging or shortlisting workflow
- Recruiter pulls candidate contact info from the public banner

## Recruiter-Only Profile Sections (Future)

- Statistics page: quantitative breakdown of recommendation data (counts per trait, score distributions, project tags, recommender role distribution)
- AI-generated summary: narrative summary based only on recommender content
- These are gated by recruiter auth and only visible from the recruiter review route
