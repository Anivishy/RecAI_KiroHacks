---
inclusion: always
---

# RecAI — Project Overview

RecAI is a hiring trust layer. AI has made candidate materials easier to polish and harder to trust. RecAI helps candidates stand out through verified external recommendations and helps recruiters search for real, recommendation-backed signals instead of self-reported claims.

This is a hackathon build. The goal is a working demo, not long-term platform perfection.

Live production deployment: `https://recai-sigma.vercel.app`

## Tech Stack

- **Frontend**: Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS 4
- **Deployment**: Vercel (monorepo, root directory `apps/web`, source files outside root enabled)
- **Database**: Aurora PostgreSQL via AWS for Vercel integration (IAM auth via Vercel OIDC + RDS Signer)
- **Search**: Pinecone serverless vector DB (`candidates-vector-db` index, `multilingual-e5-large` embeddings)
- **Email direction**: AWS SES (not yet wired)
- **No OpenAI dependency** — search uses Pinecone native inference

## User Types

1. **Candidates** — own a profile, request recommendations, join recruiter groups
2. **Recommenders** — no account; verify via work email, fill out a structured recommendation form with AI assistance
3. **Recruiters** — create job postings, search candidates within posting-scoped pools

## Core Trust Constraint

Only recommender-authored content is indexed into the Knowledge Base. Candidate-entered data (banner links, etc.) is display-only and never indexed, scored, or used for AI summaries. This is the foundational trust property of the product.

## Key Concepts

- **Experience Card** — derived from recommender-submitted role context, not candidate self-entry
- **Pentagon** — 5-trait scoring visualization using semantic similarity over indexed content. Current traits: Technical Depth, Execution, Ownership, Leadership, Communication
- **Group / Job Posting** — recruiter-owned container; candidates opt in via invite links. Search is always scoped to a single posting
- **Knowledge Base** — Pinecone vector index of recommender-authored content only

## What Exists Right Now

- Landing page (sample showcase data, not live records)
- Candidate sign-in with real Aurora-backed account creation/login
- Candidate dashboard (LinkedIn-style profile workspace, session-protected)
- Candidate banner editor wired to Aurora
- Candidate recruiter-group join flow through recruiter invite links
- Candidate recommendation-request creation flow
- Recommender form with save draft, submit, and delete-after-submit
- Public candidate profile backed by Aurora data + submitted recommendations
- Recruiter sign-in with real Aurora-backed account creation/login
- Recruiter dashboard (session-protected)
- Recruiter job posting CRUD backed by Aurora
- Recruiter job posting search backed by Pinecone
- Recruiter candidate review view backed by real candidate data
- Lane package split (shared, candidate, recruiter)
- Full product, architecture, and spec documentation

## Current Gaps

- Landing page still uses sample showcase data rather than live records
- Candidate profile editing is light beyond banner fields and recommendation-derived sections
- Pinecone indexing is lazy on first search, not eagerly refreshed after every write
- SES delivery for recommender requests is not wired yet
- No OAuth (Google/LinkedIn) — email+password only for now

## Immediate Next Priorities

1. Eager Pinecone refresh when candidate evidence changes
2. Candidate-owned profile editing beyond banner fields
3. Recruiter structured filters and search pentagon controls
4. SES-backed recommender email delivery
