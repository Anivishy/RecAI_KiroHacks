# 0014 Kiro Hacks Runtime Env Contract

## Summary

The `kiro-test` line is now pinned to the new Kiro Hacks infrastructure only.

This means the runtime no longer supports the old Aurora or Pinecone configuration from the previous Vercel project. It now expects the env contract used by the new Vercel project `rec-ai-kiro-hacks-web`.

## Why

The new Vercel project was provisioned with a different Aurora env naming scheme:

- `PROD_AWS_REGION`
- `PROD_AWS_ROLE_ARN`
- `PROD_PGHOST`
- `PROD_PGPORT`
- `PROD_PGUSER`
- `PROD_PGDATABASE`

The app code was still looking for the older unprefixed variables:

- `AWS_REGION`
- `AWS_ROLE_ARN`
- `PGHOST`
- `PGPORT`
- `PGUSER`
- `PGDATABASE`

As a result, recruiter auth and candidate auth treated the database as unconfigured, which surfaced the recruiter message:

`Recruiter account access is temporarily unavailable. Please try again shortly.`

## Change

The runtime contract was simplified so it now accepts only the new Kiro Hacks backend configuration:

### Aurora

Recruiter and candidate database clients now require:

- `PROD_AWS_REGION`
- `PROD_AWS_ROLE_ARN`
- `PROD_PGHOST`
- `PROD_PGPORT`
- `PROD_PGUSER`
- `PROD_PGDATABASE`

### Pinecone

Recruiter search now reads the index host from:

- `PINECONE_HOSTNAME`

and still requires:

- `PINECONE_API_KEY`

## Outcome

- The `kiro-test` line is clearly tied to the new backend only.
- There is no silent fallback to the old repo or old Vercel project configuration.
- Recruiter auth, candidate auth, and recruiter search all use the same new infrastructure contract.
