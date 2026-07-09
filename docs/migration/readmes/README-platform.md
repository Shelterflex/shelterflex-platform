# Shelterflex Platform

Orchestration and shared infrastructure for the **Shelterflex** ecosystem — a Rent Now,
Pay Later (RNPL) rental platform. This repo ties the app repos together for local
development and end-to-end testing, and is the home for cross-cutting concerns.

**Start here** if you're new: [`ECOSYSTEM.md`](./ECOSYSTEM.md) maps how all the
Shelterflex repositories relate.

## What lives here

- `docker-compose.yml` / `docker-compose.override.yml` — full stack (web, api, postgres,
  minio, stellar quickstart)
- `e2e/` — full-stack Playwright suites (admin, auth, tenant, landlord, whistleblower)
- `security-scan/` — dependency/code/secret scanner run across web + api
- `docs/` — product, monitoring, a11y, disaster-recovery, and security documentation
- `test-vectors.json` — **canonical** golden test vectors (web/api/contracts vendor copies)
- Security config: `semgrep.yml`, `.gitleaks.toml`, `.eslintrc.security.js`

## Getting started

The app repos are included as git submodules so compose can build them.

```bash
git clone --recurse-submodules https://github.com/Shelterflex/shelterflex-platform.git
cd shelterflex-platform
cp .env.docker .env               # adjust if needed
docker compose up --build         # web:3000  api:4000  postgres:5432  minio:9000/9001
```

Enable the contracts profile for a local Stellar node:

```bash
docker compose --profile contracts up
```

## Full-stack e2e

```bash
cd e2e
npm install
BASE_URL=http://localhost:3000 npx playwright test
```

## Security scanning

```bash
cd security-scan
npm install
./validate.sh
```

Exposed as a reusable GitHub workflow that **shelterflex-web** and **shelterflex-api**
call from their own CI.

## Relationship to other repos

- Consumes **[shelterflex-web](https://github.com/Shelterflex/shelterflex-web)** and
  **[shelterflex-api](https://github.com/Shelterflex/shelterflex-api)** as submodules.
- Publishes the canonical `test-vectors.json`; api and contracts drift-check against it.
- Hosts shared security policy and CI reusable workflows.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the issue templates under `.github/`.
