# 0015 Candidate Workspace Dynamic Route Fix

## Summary

The Kiro Hacks deployment was still failing after the Aurora env fix because several session-gated candidate pages were being prerendered during the Vercel build.

Those pages hit Aurora while page data was being collected, which caused production builds to fail with connection timeouts.

## Affected Routes

- `/candidate/dashboard`
- `/candidate/groups`
- `/candidate/recommendations/new`

## Fix

The app-router wrappers for those three candidate workspace routes now export:

`export const dynamic = "force-dynamic";`

This matches the recruiter workspace wrappers and makes the build/runtime behavior consistent across authenticated portal pages.

## Outcome

- Vercel no longer tries to prerender candidate workspace pages at build time
- Aurora-backed candidate pages render on demand at request time instead
- the new Kiro Hacks deployment can build successfully against the new backend setup
