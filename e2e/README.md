# End-to-End Test Suite

This directory contains the Playwright end-to-end test suite for the Shelterflex integration stack.

## Prerequisites

- Docker and Docker Compose installed
- Ports `3000`, `4000`, `5432`, `9000`, and `9001` available
- Access to the Shelterflex GHCR images used by the compose stack

## Start the integration stack

From the repository root:

```bash
docker compose --env-file .env.docker up -d --wait --wait-timeout 300
```

If you need to pin image tags:

```bash
API_TAG=sha-84fe55b WEB_TAG=sha-486b4f7 docker compose --env-file .env.docker up -d --wait --wait-timeout 300
```

## Install dependencies

From the `e2e/` directory:

```bash
npm ci
npx playwright install --with-deps
```

## Run the suite

From the `e2e/` directory:

```bash
npm test
```

or directly:

```bash
npx playwright test
```

## Failure artifacts

When a test fails, Playwright generates:

- `e2e/playwright-report/` — HTML report
- `e2e/test-results/e2e/` — traces, videos, and screenshots

Open the HTML report locally with:

```bash
npx playwright show-report e2e/playwright-report
```

## Cleanup

When finished:

```bash
cd ..
docker compose down -v
```

## Notes

- `globalSetup` seeds the database and creates authenticated storage states for tenant, landlord, admin, and whistleblower roles.
- `playwright.config.ts` resolves all paths relative to `e2e/`, so tests work regardless of the current working directory.
