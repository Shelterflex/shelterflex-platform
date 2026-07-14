# Issue Catalog (working notes)

Terse reference list of **open** faults, to be turned into scoped GitHub
issues per split repo. Not full descriptions — just enough to recreate the
issue from memory. Already-fixed items are removed once resolved, not kept
here as a changelog.

Confirmed via live testing (curl against running backend/frontend,
`cargo build`/`cargo test`, `docker compose config`) on 2026-07-14 unless
noted "unverified."

## shelterflex-web

- **Double `/api` prefix bug — confirmed across most `lib/*Api.ts`
  modules**, not just the one already fixed in `propertiesApi.ts`.
  `apiFetch` in `lib/api.ts` prepends `apiVersion = "/api/v1"` to every
  path; these files pass a path that *also* starts with `/api/...`,
  producing `/api/v1/api/...` (404). Curl-confirmed broken in:
  `notificationsApi.ts`, `savedPropertiesApi.ts`, `documentVaultApi.ts`,
  `authApi.ts`, `landlordApi.ts`, `risk.ts`, `walletApi.ts`, `config.ts`
  (all staking calls), `landlordPropertiesApi.ts` (most functions, though
  `uploadPropertyPhotos`/`deletePropertyPhoto`/`reorderPropertyPhotos`/
  `setPropertyPhotoPrimary` in that same file are already correct).
  `inspectorApi.ts` and `auditLogsApi.ts` have a variant of the same bug —
  they hardcode `/api/v1/...` themselves, producing `/api/v1/api/v1/...`.
  Same pattern strongly suspected but not curl-verified in: `timelockApi.ts`,
  `reconciliationApi.ts`, `outboxAdminApi.ts`, `landlordPayoutApi.ts`,
  `paymentApi.ts`, `ngnStakingApi.ts`, `adminAnalyticsApi.ts`, `leaseApi.ts`,
  `ratingCardApi.ts`.
- **Two of the above are structurally broken, not just prefix bugs.**
  `tenantApi.ts` (disputes/wallet/quick-pay/topup/payments-schedule calls)
  and `creditScoreApi.ts` both target backend routers
  (`tenant/payments`, `tenant/credit-score`) that are **only mounted
  unversioned** in `shelterflex-api` (`/api/tenant/...`, no `/api/v1/...`
  equivalent). Stripping the frontend's redundant `/api` prefix alone
  won't fix these — needs a corresponding backend mount fix (see
  shelterflex-api section) or the frontend calling the unversioned path.
- **`lib/api-client.ts` defaults to the wrong port.** Falls back to
  `http://localhost:3001` when `NEXT_PUBLIC_BACKEND_URL` is unset (backend
  actually runs on 4000); nothing listens on 3001. Its only consumer,
  `lib/gas-estimation.ts`, will always get connection-refused in that
  config state.

## shelterflex-api

- **Two routers imported in `app.ts` but never mounted** (import survives,
  no matching `app.use(...)`, so dead at runtime — same bug class as the
  `properties.ts` fix): `createTenantDocumentsRouter`
  (`src/routes/tenantDocuments.js`), `createReferralsRouter`
  (`src/routes/referrals.js`).
- **Eight route modules never even imported into `app.ts`** (fully
  orphaned, same bug class): `src/routes/agreements.ts`,
  `backgroundCheck.ts`, `contractEvents.ts`, `creditBureau.ts`,
  `leaseAgreements.ts`, `paymentDispute.ts`, `quote.ts`, `adminQuota.ts`.
- **`GET /api/listings` (bare collection root) dead-ends in a 404.**
  `createListingsRouter()` only defines `/search`, `/search/suggest`,
  `/:id` — no root handler — so a request to the exact mount path falls
  through to the backward-compat redirect, which sends it to
  `/api/v1/listings`, which isn't mounted anywhere. Reproduced live.
- **Public/anonymous rate limiter silently uses a 15-minute window, not
  the documented 1-minute one.** `src/config/rateLimits.ts` documents
  `public: { windowMs: 60_000, limit: 120 }`, but
  `src/middleware/comprehensiveRateLimit.ts` unconditionally overrides
  `keyPrefix === 'public'` to a 15-minute window / 60-request cap.
  Reproduced live (anon requests got 429'd and stayed blocked well past
  60-70s of waiting). Affects every unauthenticated endpoint on the
  default public tier (support intake, notifications, employers, listings
  root, gas-metrics, feature-flags, etc).
- **Migration ordering bug — 3 instances found and fixed
  (`025_tenant_documents.sql`, `026_landlord_payouts.sql`,
  `040_tenant_referral_programme.sql`), not exhaustively swept.** Worth a
  full grep of `migrations/*.sql` for `nextval(` vs `CREATE SEQUENCE`
  ordering to confirm no others remain.
- **FK type-mismatch — 1 instance found and fixed**
  (`040_tenant_referral_programme.sql`: tenant id columns were
  `VARCHAR(128)` vs `users.id` `UUID`). Other migrations with inline
  `REFERENCES users(id)` on a VARCHAR/TEXT column risk the same
  mismatch — not checked beyond this one instance.
- **Redis-backed rate limiter hangs instead of failing open.**
  `src/utils/redis.ts` sets `maxRetriesPerRequest: null` with default
  offline queueing, so any Redis-backed request blocks indefinitely when
  Redis is unreachable — contradicts the "fails open" comment in
  `middleware/rateLimiter.ts`. Worked around locally via
  `REDIS_DISABLED=true`; needs a connect timeout / bounded offline queue
  so production doesn't silently hang under a Redis outage.
- **`.env.example` gaps**: `ENCRYPTION_KEY` sample value is under the
  32-char schema minimum; `WEBHOOK_KEY` is required at startup but missing
  from the file entirely; `STORAGE_PROVIDER` defaults to `s3` (needs
  AWS/MinIO creds) when `local` would be a friendlier zero-config default.
- **No real seed pipeline for properties.** One-off
  `src/scripts/seedSampleProperties.ts` exists but isn't wired to an `npm
  run db:seed` script or documented in the README.

## shelterflex-contracts

- **"Monthly spending cap" feature is fully implemented and tested but
  never compiled into the contract — zero enforcement.**
  `rent_wallet/src/monthly_cap.rs` + `monthly_cap_tests.rs` are never
  declared via `mod monthly_cap;` in `rent_wallet/src/lib.rs`. `debit()`
  (`rent_wallet/src/lib.rs:208-236`) has no spending-cap check at all.
- **Governance voting uses live stake instead of a proposal-creation
  snapshot — flash-stake voting manipulation possible.**
  `governance/src/lib.rs` `vote()` (~line 224-283) calls
  `get_stake_for()` (live stake), while `get_snapshot_stake_for()` (the
  actual snapshot reader, ~line 120) is dead code, never called. Scenario:
  create a proposal while holding ~0 stake, acquire stake afterward, vote
  with full weight. The repo's own test `flash_stake_voting_prevented`
  (lines 619-665) is misleadingly named — its own assertion proves the
  flash-acquired stake counts in full.
- **Lower severity, not urgent**: `mvp_staking_pool/src/migration.rs` is
  dead code (never `mod`-declared); root-level `src/governance.rs` and
  `src/multisig.rs` are stub contracts not in the Cargo workspace (not
  currently exploitable, but `multisig.rs::approve()` has no auth check at
  all and `governance.rs::execute_proposal()` takes the whole `Proposal`
  as a caller-supplied arg instead of reading persisted state — fix or
  delete before ever wiring these up); `deal_escrow/src/lib.rs:1267` has
  an unused duplicate `is_paused`; the standalone `reentrancy_guard` crate
  is built/tested but unused by any other crate (not currently a real gap
  — the contracts that need it implement their own inline guard with
  correct checks-effects-interactions ordering).

## shelterflex-platform

- **e2e suite cannot run at all.** No `package.json` exists anywhere for
  `e2e/` (root or `e2e/`), so Playwright/`pg` can't even be installed.
  Already partially documented in `.github/workflows/e2e.yml`'s header
  comment (that workflow is `workflow_dispatch`-only, never wired into
  CI). Also: `e2e/playwright.config.ts` assumes it lives at repo root
  (`testDir: "./e2e"`, `globalSetup`/`globalTeardown` paths
  `"./e2e/helpers/..."`), but the file physically sits inside `e2e/`
  itself — paths break depending on working directory.
- **README/docs describe a `contracts/` directory that doesn't exist in
  this repo.** `README.md` ("Option C: Contracts Only") and
  `docs/REPO_STRUCTURE.md` both describe `contracts/` as one of "three
  projects," and `.gitignore` has `contracts/target`/`contracts/.soroban`
  entries, but `.gitmodules` only declares `frontend` and `backend` — no
  `contracts` submodule, no such directory. Docs are unreproducible as
  written; either add the submodule or fix the docs.
- `docker-compose.yml` + `.env.docker` validate cleanly
  (`docker compose config` succeeds, no placeholder/inconsistent values)
  but were not tested live end-to-end (Docker daemon wasn't running
  during this audit).
