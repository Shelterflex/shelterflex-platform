# Contributing to Shelterflex Web

Thanks for contributing! This is the **web front-end** for Shelterflex, a Rent Now, Pay
Later (RNPL) rental platform. See the [ecosystem overview](https://github.com/Shelterflex/shelterflex-platform/blob/main/ECOSYSTEM.md)
for how this repo fits with the API and contracts.

## Ways to contribute

UI, UX, routing, components, state management, wallet flows, i18n, accessibility, and
integration with the API.

## Ground rules

- Keep PRs small and focused — 1 issue per PR.
- Link the issue you're addressing (e.g. `Fixes #123`).
- Add/adjust tests where it makes sense.
- Never commit secrets (`.env*` files, keys, seed phrases).

## Development setup

```bash
pnpm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL to a running shelterflex-api
pnpm dev                        # http://localhost:3000
```

To run against the full stack (web + api + services), use
[shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform).

## Before you open a PR

```bash
pnpm run lint
pnpm run build
pnpm test:e2e        # Playwright specs in e2e/
```

## Creating an issue

Use the templates under `.github/ISSUE_TEMPLATE/`. Check existing issues first to avoid
duplicates. Good first issues are labeled `good first issue`.
