# Contributing to Shelterflex Platform

Thanks for contributing! This repo holds **orchestration and shared infrastructure** for
Shelterflex, a Rent Now, Pay Later (RNPL) rental platform: docker compose, full-stack e2e,
security scanning, shared docs, and the canonical `test-vectors.json`.

Start with the [ecosystem overview](./ECOSYSTEM.md) to see how all repos relate.

## Ways to contribute

Docker/dev-environment improvements, full-stack Playwright e2e, security-scan tooling,
shared documentation, CI reusable workflows, and golden test vectors.

## Ground rules

- Keep PRs small and focused — 1 issue per PR.
- Link the issue you're addressing (e.g. `Fixes #123`).
- Changes to `test-vectors.json` are the **canonical** source — coordinate with the api and
  contracts repos, which vendor and drift-check against it.
- Never commit secrets (`.env*` files, keys, seed phrases).

## Development setup

The web and api repos are included as submodules so compose can build them.

```bash
git clone --recurse-submodules https://github.com/Shelterflex/shelterflex-platform.git
cd shelterflex-platform
cp .env.docker .env
docker compose up --build       # web:3000 api:4000 postgres:5432 minio:9000/9001
```

Update submodules to the latest app code with:

```bash
git submodule update --remote --merge
```

## Full-stack e2e

```bash
cd e2e && npm install && npx playwright install --with-deps
BASE_URL=http://localhost:3000 npx playwright test
```

## Security scanning

`security-scan/` is exposed as a reusable GitHub workflow
(`.github/workflows/security-scan-reusable.yml`) that web, api, and contracts call from
their own CI. Local run:

```bash
cd security-scan && npm install && ./validate.sh
```

## Creating an issue

Use the templates under `.github/ISSUE_TEMPLATE/`. Check existing issues first.
