# RecAI — Product Requirements Document

## 1. Project Overview

**RecAI** is a platform for candidate profiles backed by trusted, verified recommendations. The premise is that a candidate is more credibly evaluated when their profile surfaces validated recommendation letters and concrete projects, rather than self-reported claims alone.

RecAI is intentionally designed to be **non-invasive to existing hiring pipelines**. It does not host job listings and does not compete with platforms like Workday or Greenhouse. Instead, candidates apply through whatever ATS the company already uses, and an optional RecAI link in that application invites the candidate to join a recruiter-created **group** on RecAI. The recruiter then searches the trusted, recommendation-backed data of candidates in that group.

### 1.1 Users

The system has three user types:

- **Candidates** — create a profile, request recommendations from peers/colleagues, and join recruiter groups via external application links.
- **Recommenders** — receive a request to recommend a candidate. They verify their work email, then fill out a recommendation form (with AI assistance). They do **not** need an account.
- **Recruiters** — create groups, accumulate opt-in candidates per group, and search through that group's pool. (Detailed in the separate Recruiter Portal Spec; this PRD references it but does not redefine it.)

### 1.2 Core Concepts

- **Candidate Profile** — the public-facing profile for a candidate. The base view is identical for every viewer (recruiter, recommender, candidate, anonymous). Signed-in recruiters viewing the profile from their dashboard see additional gated content (statistics page + AI-generated summary).
- **Recommendation** — a structured form filled out by a verified recommender about a candidate. Contains company+role context, technical feedback, behavioral feedback, and up to 2 projects with descriptions.
- **Experience Card** — a card on the candidate profile representing one role at one company (e.g., "SDE 1 @ Amazon"). Cards are derived from the role-context fields of submitted recommendations — **not** from candidate-entered data.
- **Group** — a recruiter-owned container that candidates opt into via an external application link. Recruiter search is always scoped to a single group.
- **Pentagon** — a multi-trait scoring visualization on the candidate profile. The number and names of traits are not finalized; defaults are used as placeholders. Each trait can be hovered to display supporting stats; on hover, an OpenSearch query surfaces the candidate's projects that match that trait.
- **Knowledge Base (KB)** — indexed candidate content. **Only recommender-authored content is indexed.** Any data the candidate enters themselves is display-only and never enters the KB.

### 1.3 Verification & Trust Model

- **Recommenders** verify via work email. A verification code is emailed; entering the code unlocks the form. No account is created. The recommender's email domain must additionally match a known company in a verified-domain directory (Layer 2 verification — see §6.2).
- **Recruiters** sign up with their own accounts via email+password (with email verification), Google OAuth, or LinkedIn OAuth — recruiter's choice.
- **Candidates** sign up for their own accounts (same as recruiter options).

### 1.4 Indexing Rule (Critical Trust Constraint)

Only content authored by a verified recommender is indexed into the KB and used for search, pentagon scoring, AI summaries, or any other derived content. Candidate-entered fields (banner contact links, etc.) are display-only. This is the foundational trust property of the product.

---

## 2. Candidate Flows

### 2.1 Candidate Account

- Candidates sign up and own a single RecAI profile.
- The profile has a persistent **banner** at the top where the candidate enters and displays:
  - Email
  - GitHub
  - LinkedIn
  - (Other contact links — exact set TBD)
- All banner content is **display-only and not indexed**.

### 2.2 Requesting a Recommendation

- The candidate initiates a recommendation request by entering the recommender's email address.
- As part of the request, the candidate **specifies the role** the recommendation should be about (e.g., "SDE 1 @ Amazon, Jan 2023 – Aug 2024"). This serves as a **pre-fill / hint** to the recommender.
- RecAI sends the recommender an email with a unique link to the recommendation form. The candidate's specified role appears pre-filled on the form, but the recommender can override it. The role on the submitted form is what becomes authoritative and creates the experience card.

### 2.3 Joining a Recruiter Group

- The recruiter publishes a RecAI group link inside their external job posting (Workday / Greenhouse / etc.) as an optional step in the application.
- Candidate clicks the link:
  - **If signed in to RecAI**: their profile auto-joins the group.
  - **If not signed in**: they are prompted to sign up or log in, after which they auto-join the group.
- A candidate can be in **multiple recruiter groups simultaneously**.
- The candidate has a **groups management page** showing all groups they have joined, with the ability to leave any group at any time.

### 2.4 Viewing Their Own Recommendations

- The candidate can see all recommendations written about them with full visibility — same view as the public profile. (Note: the recruiter-only AI summary and statistics page are still gated and not shown to the candidate.)

---

## 3. Recommender Flows

### 3.1 Receiving the Request

- The recommender receives an email containing a unique link to the recommendation form.
- The link is keyed to a single recommendation request and is single-use until the recommendation is submitted (after which it becomes the recommender's permanent edit/delete link — see §3.5).

### 3.2 Email Verification

- On opening the link, the recommender enters their work email.
- RecAI sends a verification code to that email.
- The recommender enters the code to unlock the form.
- Verification requirements:
  - **Layer 1**: the email domain must not be a personal email provider (gmail.com, yahoo.com, outlook.com, etc.).
  - **Layer 2**: the email domain must match a company in RecAI's verified-company directory (see §6.2). The recommender then **picks their company from the directory** during the form, which is bound to the verified domain.

### 3.3 Recommendation Form Fields

The recommender fills out:

- **Company + Role** — the recommender's own company (selected from verified directory) and role (freetext).
- **Relation to Candidate** — dropdown. Proposed values *(confirm)*: Manager, Direct Report, Peer / Coworker, Mentor, Mentee, Client, Collaborator (Other).
- **Candidate's Role Context** — what role the candidate held during the work being described (e.g., "SDE 1 @ Amazon"). Pre-filled with the candidate's specified role on request; recommender can override. **This field is the source of truth for the candidate's experience cards.**
- **Technical Feedback** — freetext.
- **Behavioral Feedback** — freetext.
- **Projects** — the recommender can add up to **2 projects**. Each project has:
  - Project name (freetext)
  - Project description (freetext)

### 3.4 AI Assistance During Form Completion

The recommender is assisted by AI throughout writing. Assistance modes:

- **Prompts to unstick** — when a field is empty or sparse, the AI offers prompting questions ("What did the candidate do that surprised you? What's a problem only they could have solved?").
- **Drafting from bullets** — the recommender can input bullet points and have the AI expand them into prose.
- **Polish pass** — the recommender can request a clarity/grammar polish on what they've written.

The recommender always sees and can edit the AI output before submitting. Final submission is the recommender's authored content, not the AI's.

### 3.5 Editing & Revocation

- After submission, the recommender's verified email receives a permanent link allowing them to **edit or delete** their recommendation at any time.
- Edits trigger re-indexing into the KB and regeneration of the cached AI summary on affected candidate profiles (see §5.3).

---

## 4. Recruiter Flows

The full recruiter experience is defined in the **RecAI Recruiter Portal Specification** (separate document). Key cross-cutting points relevant to this PRD:

- Recruiters create **groups** (not job postings); RecAI does not host job listings.
- Group fields *(confirm)*: group name, group description, and an optional internal label (e.g., the external req ID, visible only to the recruiter who owns the group).
- Recruiter search is scoped to a single group at a time, supports both structured filters (including a search-pentagon with per-trait minimum thresholds) and natural-language RAG search over OpenSearch.
- Recruiters viewing a candidate profile from their dashboard see all public profile content **plus** the recruiter-only statistics page and AI-generated summary (see §5.3).

---

## 5. Candidate Profile View

### 5.1 Public Profile (visible to everyone)

The public profile, in display order from top to bottom:

1. **Persistent Banner** — candidate's contact links (email, GitHub, LinkedIn, etc.). Display-only; not indexed.
2. **Pentagon** — multi-trait visualization. Each trait is hoverable; on hover, the supporting projects (matched by OpenSearch semantic similarity) are shown alongside the trait's score breakdown.
3. **Experience List (LinkedIn-style)** — a vertical list of the candidate's roles, one row per distinct (company, role) combination derived from submitted recommendations. Each row shows: company, role, and a short description (max 50 characters). Source of the short description is TBD — see Open Questions.
   - Clicking a row **expands it inline** to reveal the recommendation(s) attached to that role. (No separate intermediate "list of recommenders" step; recommendations appear directly under the expanded row.)
   - Each recommendation is rendered with a header showing the recommender's full name, company, and relation to the candidate, plus two tabs:
     - **Overview tab** — Technical Feedback and Behavioral Feedback.
     - **Projects tab** — all projects (name + description) the recommender included.

### 5.2 Recommendations List Behavior

- All submitted recommendations are visible in the public profile via the experience-card drill-down.
- The recommender's full name is **always** displayed on the candidate profile (no anonymization option).
- The candidate cannot hide, reorder, or selectively suppress individual recommendations on the public profile. (Trust property: viewers see what was actually submitted.)

### 5.3 Recruiter-Only Sections (gated by recruiter auth)

When a signed-in recruiter views a candidate from their dashboard, two additional sections appear:

- **Statistics page** — quantitative breakdown of the candidate's recommendation data (counts per trait, score distributions, project tags, etc. — exact metrics TBD).
- **AI-Generated Summary** — a generated narrative summary / synthesized resume of the candidate based **only** on what recommenders have written. No candidate self-reported content is used.

**Generation cadence**: cached per candidate, regenerated whenever a new recommendation is submitted, edited, or deleted on that candidate's profile.

---

## 6. Indexing, Scoring & Trust

### 6.1 What Gets Indexed

Only the following recommender-authored fields enter the OpenSearch KB:

- Recommender's company + role
- Recommender's relation to candidate
- Candidate's role context (used for experience card derivation and as metadata on indexed content)
- Technical feedback
- Behavioral feedback
- Project name and description (per project)

**Never indexed**: candidate banner contact info, candidate-specified role hint at request time, or any other candidate-entered field.

### 6.2 Verified-Company Directory

A maintained directory of `{company name → set of verified email domains}`. Used to:

- Layer 2 of recommender email verification (recommender's email domain must map to a directory entry).
- Populate the company picker on the recommendation form.
- Display verified company name on the recommendation in the candidate profile.

Directory population strategy (sourcing, update cadence, who maintains it) is TBD — see Open Questions.

### 6.3 Pentagon Scoring

- Each indexed unit (each project description, each technical feedback block, each behavioral feedback block) is scored against each pentagon trait via **semantic similarity** (embeddings).
- For each trait, the candidate's displayed pentagon score is the **maximum** score across all that candidate's indexed units for that trait.
- The number and names of pentagon traits are placeholders and to be finalized later. The default 5 (Technical Skill, Problem Solving, Collaboration, Communication, Initiative) is used until then.

### 6.4 Pentagon Hover Behavior

When a viewer hovers a trait, an OpenSearch query retrieves and displays the candidate's project entries with the highest semantic-similarity scores for that trait, alongside the score breakdown.

### 6.5 Embedding Model

No vendor preference specified. Implementation should select the embedding model that fits OpenSearch best — likely a model with native OpenSearch k-NN support (e.g., a sentence-transformers / BGE family model, or OpenAI embeddings via the OpenSearch ingest pipeline). Decision deferred to implementation.

---

## 7. Out of Scope

- **Recruiter portal internals** — defined in the separate Recruiter Portal Specification.
- **Job listings inside RecAI** — RecAI deliberately does not host or compete with ATS job listings.
- **In-platform messaging** — outreach happens externally via email (recruiter pulls candidate contact from the public banner).
- **Pricing model** — TBD whether recruiter accounts are paid; not specified.
- **Candidate authentication specifics** — auth options for candidates are presumed to mirror the recruiter options but are not detailed here.
- **Rate limits and abuse prevention** — none for now.

---

## 8. Open Questions

These should be resolved before or during implementation:

1. **Pentagon traits — final list and count.** Defaults used as placeholders; needs final naming and number. Affects recommender form (no change), profile display, and recruiter search-pentagon UI.
2. **Relation-to-candidate dropdown values.** Confirm proposed list (Manager, Direct Report, Peer / Coworker, Mentor, Mentee, Client, Collaborator (Other)).
3. **Group fields the recruiter sets at creation.** Confirm proposed: name, description, optional internal label. Anything else?
4. **Verified-company directory sourcing.** Who maintains it, how is it bootstrapped, and is there an admin flow for adding companies on demand when a recommender's domain isn't yet covered?
5. **Recruiter-only statistics page — exact metrics.** What graphs / numbers go on the statistics page? (Recommendation counts per trait, score histograms, projects tagged by trait, recommender role distribution, etc.)
6. **AI summary prompt and structure.** How long, what sections, what tone? And which LLM provider/model.
7. **Candidate banner — full set of supported contact link types.** Email, GitHub, LinkedIn confirmed; others (personal site, X, portfolio, Google Scholar, etc.) TBD.
8. **Candidate authentication options** — confirm whether candidates get the same email+password / Google / LinkedIn options as recruiters.
9. **Edit/delete link expiry for recommenders** — does the permanent edit/delete link rotate, expire, or stay valid forever? Security implications if a recommender's email is later compromised.
10. **Behavior when an indexed recommendation is deleted** — does the experience card disappear if no remaining recommendation references that role? Confirmed assumption: yes (since cards are derived from recommendations).
11. **What happens if no recommendation directory match exists for a recommender's domain** — does the form block, fall back to soft trust, or queue an admin review?
12. **Pricing / monetization model.**
13. **Source of the 50-char short description on each experience row** — candidate-entered (display-only, consistent with the banner), AI-generated from indexed recommender content for that role, or a new field on the recommendation form that the recommender fills in?