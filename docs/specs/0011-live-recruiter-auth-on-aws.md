# 0011 Live Recruiter Auth On AWS

## Summary

This change completes the first live recruiter auth slice on top of Vercel plus AWS Aurora PostgreSQL.

The recruiter flow is now live on `https://recai-sigma.vercel.app` with verified:

- recruiter account creation
- recruiter sign-in
- protected recruiter dashboard access
- recruiter sign-out
- redirect back to sign-in after sign-out

It also includes a small recruiter sign-in UI polish so the sign-in button text stays readable against the dark background.

## Why

Before this slice, the recruiter auth code existed but the live deployment was blocked by three issues:

1. Aurora had not yet been attached to the Vercel project.
2. Auth-related recruiter routes could attempt database work during production prerender/build.
3. Sign-out needed a safer fallback so temporary session-deletion failures would not surface as a `500`.

## Scope

- In scope:
  - AWS Aurora PostgreSQL resource attachment through Vercel
  - live recruiter auth verification
  - deployment-safe recruiter route behavior
  - sign-out hardening
  - recruiter sign-in button contrast fix
- Out of scope:
  - recruiter job posting CRUD
  - candidate persistence
  - OpenSearch integration

## Implementation Notes

### AWS + Vercel

- Aurora PostgreSQL was provisioned through the AWS for Vercel integration and connected to the `recai` Vercel project.
- Environment variables for the Aurora connection are now present in Vercel for production, preview, and development.

### Deployment Safety

- Recruiter route wrappers were forced to dynamic rendering so protected flows do not attempt to prerender session-aware pages during build:
  - `/recruiter/sign-in`
  - `/recruiter/dashboard`
  - `/recruiter/jobs/[jobId]`
  - `/recruiter/jobs/[jobId]/candidates/[candidateSlug]`
- Recruiter database configuration now treats an Aurora host of `provisioning` as not-ready, preventing early connection attempts.

### Sign-Out Resilience

- Recruiter sign-out now falls back to cookie-clearing plus redirect behavior even if server-side session destruction fails.
- This protects the demo flow from surfacing `500` errors during sign-out.

### UI Polish

- The recruiter sign-in button now explicitly forces white text so the call-to-action remains readable.

## Validation

### Local

- `npm.cmd run build`
- `npm.cmd run lint`
- `npm.cmd run typecheck`

### Production

The following live behaviors were verified against `https://recai-sigma.vercel.app`:

- `POST /api/recruiter/auth/sign-up` returns a redirect to `/recruiter/dashboard` and sets the recruiter session cookie
- `POST /api/recruiter/auth/sign-in` returns a redirect to `/recruiter/dashboard`
- `GET /recruiter/dashboard` returns `200` with a valid recruiter session
- `POST /api/recruiter/auth/sign-out` returns a redirect to `/recruiter/sign-in?notice=signed-out` and clears the recruiter session cookie
- `GET /recruiter/dashboard` after sign-out redirects back to `/recruiter/sign-in?error=auth-required`

## Follow-On Work

- Build recruiter job posting creation and management
- Add recruiter structured filters and search-pentagon controls
- Start the natural-language recruiter search layer on top of OpenSearch
