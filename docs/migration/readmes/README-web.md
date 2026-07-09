# Shelterflex Web

Front-end web application for **Shelterflex**, a Rent Now, Pay Later (RNPL) rental
platform. Provides the UI for tenants, landlords, whistleblowers, freelance inspectors,
and admins.

Part of the Shelterflex ecosystem — see the [ecosystem overview](https://github.com/Shelterflex/shelterflex-platform/blob/main/ECOSYSTEM.md).

## Stack

- Next.js (React) + TypeScript
- pnpm
- Playwright (component/page e2e in `e2e/`)
- Stellar wallet auth (e.g. Freighter) alongside email/OTP

## Getting started

```bash
pnpm install
cp .env.example .env.local        # set NEXT_PUBLIC_API_URL to your shelterflex-api instance
pnpm dev                          # http://localhost:3000
```

## Common scripts

```bash
pnpm dev            # local dev server
pnpm build          # production build
pnpm lint           # eslint
pnpm test:e2e       # Playwright specs in e2e/
```

## Relationship to other repos

- Talks to **[shelterflex-api](https://github.com/Shelterflex/shelterflex-api)** over HTTP
  (`NEXT_PUBLIC_API_URL`). This is its only runtime dependency.
- Wallet/on-chain features ultimately settle via
  **[shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts)**, but the
  web app never talks to chain directly — it goes through the API.
- To run the **full stack** (web + api + postgres + minio + stellar) together, use
  **[shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform)**.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the issue templates under `.github/`.
Good first issues are labeled `good first issue`.
