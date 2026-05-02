# Summary

This change adds the V2 trait-scoring foundation for RecAI by defining the technical and behavioral rubrics in shared code and wiring a shared Bedrock runtime path that can be used for both recruiter summaries and structured trait scoring.

# Why This Change Exists

- The current live pentagon is heuristic and not strong enough for the long-term recruiter experience.
- The product direction is moving toward separate technical and behavioral pentagons.
- The scoring path should retrieve evidence from the vector database and then use a lightweight Bedrock model to synthesize structured trait scores and rationales.
- The recruiter AI summary and the trait scorer should share the same Bedrock integration path instead of duplicating model-calling logic.

# Scope

- Define the V2 technical rubric in shared code
- Define the V2 behavioral rubric in shared code
- Add trait-specific retrieval query seeds
- Refactor the shared Bedrock client to a reusable Converse-based text and JSON generation layer
- Keep recruiter AI summary generation on top of that shared Bedrock layer
- Add a structured trait-scoring service that accepts retrieved evidence segments and returns:
  - technical scores
  - behavioral scores
  - confidence
  - rationales
  - evidence references
- Add documentation for the scoring model and Bedrock direction

# Routes Or Surfaces Touched

- recruiter-only AI summary generation path
- shared scoring architecture and product documentation

# Data Contract Updates

- New shared rubric contract:
  - `technicalTraitMeta`
  - `behavioralTraitMeta`
  - `buildTraitSearchQueries()`
- New shared scoring server contract:
  - `TraitEvidenceSegment`
  - `TraitScoreDetail`
  - `CandidateTraitScorecard`
  - `buildTraitEvidenceSegments()`
  - `scoreCandidateTraitEvidence()`
- Shared Bedrock runtime now exposes reusable text and JSON generation helpers.

# Validation Steps

- `npm.cmd run lint`
- `npm.cmd run typecheck`
- `npm.cmd run build`

# Open Questions Or Follow-Ups

- The V2 scorer is not yet wired into the live recruiter pentagon UI.
- Candidate evidence should eventually be retrieved per trait from Pinecone before being passed into Bedrock scoring.
- We still need to decide how recruiter UI should present:
  - technical pentagon
  - behavioral pentagon
  - confidence
  - supporting evidence drilldowns
