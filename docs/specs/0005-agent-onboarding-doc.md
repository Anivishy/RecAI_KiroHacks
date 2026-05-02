# 0005 Agent Onboarding Doc

## Summary

This change adds a single start-here Markdown file for new AI agents so a collaborator can point their agent at one document and give it enough repo context to work productively.

## Why

The repo already has multiple useful docs, but onboarding still required hopping across several files. For fast parallel hackathon work, we want one concise file that explains the product, codebase shape, ownership model, workflow rules, and immediate priorities.

## Scope

- In scope:
  - one consolidated onboarding doc for AI agents
  - a docs index pointer to that onboarding doc
- Out of scope:
  - product behavior changes
  - architecture changes
  - recruiter feature implementation

## Surfaces Touched

- Docs:
  - `docs/agent-onboarding.md`
  - `docs/README.md`

## UX Notes

- No end-user UI changed.
- This improves collaborator onboarding and context retention.

## Validation

- Manual checks:
  - confirm a new agent can read one file and understand the repo shape
  - confirm the doc includes ownership, commands, specs process, and next priorities
- Automated checks:
  - none required for doc-only change

## Open Questions

- Whether this onboarding doc should later include a strict checklist template for lane-specific agents.
