---
inclusion: always
---

# RecAI — Recommender Flows

## Overview

Recommenders are external people (managers, coworkers, peers) who write structured recommendations about candidates. They do NOT need a RecAI account.

## Flow

1. Candidate creates a recommendation request with the recommender's email
2. Recommender receives a unique tokenized link (`/recommend/[token]`)
3. Token is single-use until submission, then becomes the permanent edit/delete link
4. Tokens expire after 7 days

## Email Verification (2-layer)

1. Recommender enters their work email on the form page
2. RecAI sends a verification code to that email
3. Recommender enters the code to unlock the form
4. **Layer 1**: Email domain must not be a personal provider (gmail.com, yahoo.com, outlook.com, etc.)
5. **Layer 2**: Email domain must match a company in the verified-company directory. Recommender picks their company from the directory.

## Recommendation Form Fields

- **Company + Role** — recommender's own company (from verified directory) and role (freetext)
- **Relation to Candidate** — dropdown: Manager, Direct Report, Peer/Coworker, Mentor, Mentee, Client, Collaborator (Other)
- **Candidate's Role Context** — what role the candidate held (pre-filled from candidate's request, recommender can override). This is the source of truth for experience cards.
- **Technical Feedback** — freetext
- **Behavioral Feedback** — freetext
- **Projects** — up to 2 projects, each with name (freetext) and description (freetext)

## AI Assistance

- **Prompts to unstick** — when a field is empty/sparse, AI offers prompting questions
- **Drafting from bullets** — recommender inputs bullets, AI expands to prose
- **Polish pass** — clarity/grammar polish on what's written
- Recommender always sees and can edit AI output before submitting
- Final submission is the recommender's authored content, not the AI's

## Post-Submission

- After submission, recommender's verified email receives a permanent link to edit or delete
- Edits trigger re-indexing into KB and regeneration of cached AI summary
- Deletion removes the recommendation; if no remaining recommendation references a role, the experience card disappears

## Current Implementation Status

- Recommender form with save draft, submit, and delete-after-submit is live
- SES email delivery for the initial request link is NOT yet wired (links shared manually)
- Verified-company directory sourcing strategy is TBD
