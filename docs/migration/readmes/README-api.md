# Shelterflex API

Back-end REST API for **Shelterflex**, a Rent Now, Pay Later (RNPL) rental platform.
Owns business logic: deal/installment management, earnings, tenant risk & credit
assessment, and integration with on-chain contracts over Soroban RPC.

Part of the Shelterflex ecosystem — see the [ecosystem overview](https://github.com/Shelterflex/shelterflex-platform/blob/main/ECOSYSTEM.md).

## Stack

- Node.js + Express + TypeScript
- npm
- PostgreSQL (migrations in `migrations/`), S3-compatible object storage (MinIO in dev)
- OpenAPI spec (`openapi.yml`), validated in CI
- Soroban RPC client (`src/soroban/`) with circuit breaker + metrics adapters

## Getting started

```bash
npm ci
cp .env.example .env
npm run dev                       # http://localhost:4000
```

Postgres + MinIO are easiest via the full-stack compose in
[shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform).

## Common scripts

```bash
npm run dev              # local dev server
npm run lint            # eslint
npm run test:ci         # unit tests (vitest)
npm run openapi:validate # validate the OpenAPI spec
```

## Included tooling

- `load-tests/` — k6 load profiles (target `BASE_URL`, default `http://localhost:4000`)
- `scripts/db-backup/` — Postgres backup / restore / PITR helpers

## Relationship to other repos

- Serves **[shelterflex-web](https://github.com/Shelterflex/shelterflex-web)** over HTTP.
- Invokes/simulates **[shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts)**
  over Soroban RPC using contract IDs from the contracts repo's `deployment/deployed`.
- Ships a vendored copy of `test-vectors.json`; a CI drift check keeps it in sync with the
  canonical copy in **[shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform)**.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the issue templates under `.github/`.
