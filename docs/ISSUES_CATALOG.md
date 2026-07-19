# Issue Catalog (working notes)

Staging area for **open** faults found during audits, before they are turned
into scoped GitHub issues per split repo. Terse notes only — just enough to
recreate the issue from memory. Items are removed from this file once they
have been filed, not kept here as a changelog.

## Open

_Empty._ Every item from the 2026-07-14 audit has been filed as a GitHub
issue in its respective repository:

**shelterflex-web** — redundant `/api` prefix across `lib/*Api.ts` (#1),
tenant payments / credit-score targeting unmounted routes (#2), backend base
URL consolidation (#3).

**shelterflex-api** — Redis hanging instead of failing open (#1), ten
unreachable route modules (#2), public rate-limit window override (#3),
tenant routers unmounted under `/api/v1` (#4), `GET /api/listings` 404 (#5),
migration sequence-ordering and FK type sweep (#6), `.env.example` gaps (#7),
database seed pipeline (#8).

**shelterflex-contracts** — monthly spending cap never compiled (#1),
governance live-stake voting / flash-stake manipulation (#2), unwired code
and insecure root-level stubs (#3).

**shelterflex-platform** — e2e suite cannot run (#1), docker compose stack
unverified (#2), docs describe a non-existent `contracts/` project (#3).
