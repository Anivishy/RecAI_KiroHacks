# 0013 Postgres Current Role Quoting Fix

## Summary

The production deployment failed while prerendering candidate pages because the candidate schema used `current_role` as an unquoted Postgres column name.

`current_role` is a Postgres keyword, so schema bootstrap and profile queries could fail with a syntax error during production builds when Aurora-backed candidate pages executed.

## Fix

The fix quotes the column name in every SQL statement that defines or references it:

- candidate account table creation
- candidate account schema migration
- candidate account inserts
- candidate profile select queries
- recruiter posting candidate profile join queries

## Why This Matters

Without this fix:

- Vercel production builds could fail during page data collection
- candidate recommendation-management routes could break before runtime traffic even reached them
- the live Aurora-backed candidate profile flow would be blocked

With this fix:

- the candidate schema bootstraps cleanly on Aurora
- production builds complete
- the deployed app can exercise the real candidate profile and posting-join flow
