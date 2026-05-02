# Trait Scoring

## Purpose

RecAI scoring is meant to evaluate externally verified evidence, not candidate self-presentation.

The scoring system should answer two questions:

1. What does the verified evidence say about this candidate's technical strengths?
2. What does the verified evidence say about this candidate's behavioral strengths?

## Product Direction

The scoring system is moving toward two separate recruiter-facing pentagons:

- technical pentagon
- behavioral pentagon

This is a better fit than forcing all evidence into one mixed pentagon because recommenders often describe technical and behavioral performance differently.

## Trait Sets

### Technical Traits

- Technical Depth
- System Design
- Implementation Quality
- Problem Solving
- Technical Adaptability

### Behavioral Traits

- Ownership
- Execution
- Leadership
- Communication
- Collaboration

## Evidence Model

The scoring system should operate on evidence segments, not whole profiles.

Evidence segments are the atomic units that get retrieved and scored. Current segment types include:

- recommendation summary
- technical-response-derived segment
- behavioral-response-derived segment
- project segment
- retrieved chunk from the vector index

This lets RecAI explain exactly why a candidate scored strongly or weakly on a trait.

## Scoring Pipeline

The intended scoring path is:

1. Normalize verified recommendation and project data into evidence segments.
2. Query the vector database using trait-specific retrieval prompts.
3. Pull the strongest candidate-specific evidence for each trait.
4. Pass that evidence into a lightweight Bedrock-hosted model.
5. Ask the model to produce:
   - technical trait scores
   - behavioral trait scores
   - confidence values
   - evidence references
   - short rationales

The same Bedrock model family can also power recruiter-only AI summaries.

## Bedrock Role

Bedrock should not invent trait scores from raw intuition. It should act as a rubric-guided evidence synthesizer.

That means:

- the vector database handles retrieval
- the rubric defines what each trait means
- Bedrock turns retrieved evidence into structured scores and rationales

## Scoring Principles

- Score demonstrated evidence, not candidate potential.
- Be conservative when evidence is sparse or generic.
- Reward corroboration across multiple recommenders.
- Reward specificity over praise language.
- Track confidence separately from score.
- Keep evidence references attached to every trait result.

## Current Live State

The currently deployed candidate pentagon still uses a heuristic keyword-and-count model derived from recommendation summaries and project tags.

The Bedrock-backed trait-scoring foundation is now being added as the next scoring engine, but it should be treated as a V2 path until wired into the recruiter experience end to end.
