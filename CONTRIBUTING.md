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
- Do not modify anything under `.github/` — CI, workflows and issue templates are
  maintainer-owned. This includes `security-scan-reusable.yml`, which the other three
  repos call at a pinned tag. If an issue seems to need a pipeline change, deliver the
  script or test it calls for and say so in the PR; a maintainer wires it up.

## Development setup

The web and api services run from images published to GHCR by their own
repositories. This repo contains no application source and builds nothing.

```bash
git clone https://github.com/Shelterflex/shelterflex-platform.git
cd shelterflex-platform
cp .env.docker .env
docker compose up               # web:3000 api:4000 postgres:5432 minio:9000/9001
```

Pull the latest published app images with:

```bash
docker compose pull
```

To pin a specific pair, set `API_TAG` / `WEB_TAG` (see `.env.docker`).

To change the frontend or backend itself, work in
[shelterflex-web](https://github.com/Shelterflex/shelterflex-web) or
[shelterflex-api](https://github.com/Shelterflex/shelterflex-api) — this stack
runs prebuilt images and does not hot-reload.

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
