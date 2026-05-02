---
inclusion: always
---

# RecAI — Data Trust & Indexing Rules

These rules are non-negotiable. Every code change must respect them.

## What Gets Indexed (Pinecone KB)

Only these recommender-authored fields enter the vector index:

- Recommender's company + role
- Recommender's relation to candidate
- Candidate's role context (as stated by the recommender — source of truth for experience cards)
- Technical feedback
- Behavioral feedback
- Project name and description (up to 2 per recommendation)

## What Is NEVER Indexed

- Candidate banner contact info (email, GitHub, LinkedIn, personal website, etc.)
- Candidate-specified role hint from the recommendation request
- Any other candidate-entered field
- Landing page sample/showcase data

## Verification Model

### Recommender Verification (2-layer)

1. **Layer 1**: Email domain must not be a personal provider (gmail.com, yahoo.com, outlook.com, etc.)
2. **Layer 2**: Email domain must match a company in the verified-company directory. Recommender picks their company from the directory during the form.

### Recruiter & Candidate Auth

- Email + password with Aurora-backed sessions (OAuth deferred — PRD open question #8)
- Recruiter and candidate sessions are independent (separate cookies, separate tables, separate pools)

## Profile Visibility Rules

- The base public profile at `/c/[candidateSlug]` is identical for all viewers
- Signed-in recruiters viewing from their job-contextual route (`/recruiter/jobs/[jobId]/candidates/[candidateSlug]`) additionally see:
  - Recruiter-only evaluation panels and fit signals
  - AI-generated summary (based only on recommender content) — not yet implemented
  - Statistics page (quantitative breakdown) — not yet implemented
- Candidates cannot hide, reorder, or suppress individual recommendations on the public profile
- Recommender's full name is always displayed (no anonymization)

## AI Summary Generation (Future)

- Cached per candidate
- Regenerated when a recommendation is submitted, edited, or deleted
- Uses ONLY recommender-authored indexed content — never candidate self-reported data

## Pentagon Scoring

- Each indexed unit (project description, technical feedback, behavioral feedback) is scored against each pentagon trait via semantic similarity
- Per-trait score = maximum score across all candidate's indexed units for that trait
- Current 5 traits (placeholders, to be finalized): Technical Depth, Execution, Ownership, Leadership, Communication
- Pentagon hover: OpenSearch/Pinecone query surfaces candidate's projects with highest similarity for that trait
