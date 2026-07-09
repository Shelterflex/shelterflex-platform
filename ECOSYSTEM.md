# Shelterflex — Ecosystem Overview

> Relationship map for the Shelterflex repositories. This is the entry point for the
> Drips review team and for new contributors deciding where to work.

**Shelterflex** is a **Rent Now, Pay Later (RNPL)** platform. Tenants secure rental
properties with a partial deposit (20–40%) and repay the balance in monthly installments;
landlords list directly and receive guaranteed or partially guaranteed payouts;
whistleblowers report fraudulent listings and earn on-chain rewards, forming a
decentralized trust and quality layer.

Formerly a single monorepo, Shelterflex is now split into four repositories.

## The repositories

| Repo | Responsibility | Stack |
|---|---|---|
| [shelterflex-web](https://github.com/Shelterflex/shelterflex-web) | Web app — UI for tenants, landlords, whistleblowers, inspectors, admins | Next.js (React), TypeScript, pnpm |
| [shelterflex-api](https://github.com/Shelterflex/shelterflex-api) | REST API — deals, installments, earnings, risk/credit, Soroban RPC integration | Node.js, Express, TypeScript, npm |
| [shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts) | On-chain logic — escrow, staking, rent payments, whistleblower rewards, oracles | Soroban (Rust) |
| [shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform) | Orchestration, full-stack e2e, security scanning, shared docs, golden test vectors | Docker Compose, Playwright, TypeScript |

## How they fit together

```
        ┌─────────────────┐         HTTP/REST          ┌─────────────────┐
        │  shelterflex-web │ ───────────────────────▶  │  shelterflex-api │
        │   (Next.js UI)   │   NEXT_PUBLIC_API_URL      │   (Express API)  │
        └─────────────────┘                            └────────┬────────┘
                                                                │ Soroban RPC
                                                                │ (contractId per contract)
                                                                ▼
                                                       ┌─────────────────────┐
                                                       │ shelterflex-contracts│
                                                       │   (Soroban / Rust)   │
                                                       └─────────────────────┘

   ┌───────────────────────── shelterflex-platform ─────────────────────────┐
   │ docker compose (web + api + postgres + minio + stellar) via submodules  │
   │ full-stack e2e (Playwright) · security-scan · shared docs · test-vectors│
   └─────────────────────────────────────────────────────────────────────────┘
```

- **web → api:** the only runtime dependency of the web app. Configured via `NEXT_PUBLIC_API_URL`. No shared build artifacts.
- **api → contracts:** the API invokes/simulates contracts over Soroban RPC using contract IDs from the contracts repo's `deployment/deployed`. No shared code — the boundary is the deployed contract address + ABI.
- **platform** depends on **web** and **api** as git submodules purely to orchestrate them for local full-stack development and end-to-end testing. It is the only repo that pulls the others together.

## Shared contract: `test-vectors.json`

Golden test vectors (webhook signatures, receipt canonicalization) must stay identical
between **api** and **contracts**. The canonical copy lives in **platform**; api and
contracts vendor a pinned copy and run a CI drift check against platform on every build.

## Where to contribute

| I want to… | Work in |
|---|---|
| Change UI, pages, wallet flows | `shelterflex-web` |
| Change API routes, business logic, risk engine | `shelterflex-api` |
| Change on-chain logic | `shelterflex-contracts` |
| Run the whole stack, add full-stack e2e, tweak security scanning | `shelterflex-platform` |

Each repo is independently runnable and testable — you do **not** need the others to
contribute to one. See each repo's README for setup.
