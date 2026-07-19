# Shelterflex Repository Structure

Shelterflex is a **Rent Now, Pay Later (RNPL)** platform. Tenants secure properties with a partial deposit and repay the balance in installments. Landlords list directly and receive guaranteed or partially guaranteed payments. Whistleblowers report fraudulent listings and earn on-chain rewards, acting as a decentralized trust and quality-assurance layer that also drives organic platform adoption.

Shelterflex is split across **four independent repositories**. There is no
monorepo and no submodules — each repository is cloned, built, tested and
released on its own.

## The repositories

| Repository | Contents |
|---|---|
| [shelterflex-web](https://github.com/Shelterflex/shelterflex-web) | Next.js web app (UI for tenants, landlords, inspectors and whistleblowers) |
| [shelterflex-api](https://github.com/Shelterflex/shelterflex-api) | Express API (business logic, deal management, earnings API, Soroban RPC integration) |
| [shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts) | Soroban smart contracts (Rust): payments, escrow, staking, whistleblower rewards |
| [shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform) | Integration stack, cross-repo e2e suite, shared CI policy, architecture docs |

## How they fit together

The repositories integrate at the artifact level, not through a shared tree.

- **Container images.** `shelterflex-web` and `shelterflex-api` each publish a
  production image to GHCR on merge to `main`, tagged `main` and `sha-<short>`.
  The platform compose stack pulls those images; it never builds application
  source.
- **Shared CI policy.** Both app repositories consume the platform's reusable
  security-scan workflow by reference
  (`Shelterflex/shelterflex-platform/.github/workflows/security-scan-reusable.yml@main`).
- **Integration triggers.** After publishing, each app repository sends a
  `repository_dispatch` to the platform carrying the tag it just pushed, so the
  integration stack can run against that exact image.

```
shelterflex-web ──┐  publish image ──▶ GHCR ──┐
                  │  dispatch ───────────────▶│
                  │                           ├──▶ shelterflex-platform
shelterflex-api ──┤  publish image ──▶ GHCR ──┤     (compose stack + e2e)
                  │  dispatch ───────────────▶│
                  └── consume reusable security-scan workflow ◀── platform

shelterflex-contracts — independent; deployed contract addresses are consumed
                        by the API at runtime via configuration.
```

## Platform repository layout

- `docker-compose.yml` - integration stack (web, api, postgres, minio)
- `.env.docker` - environment for the stack, including image tags
- `e2e/` - cross-repo Playwright suite
- `security-scan/` - shared scanner consumed by the app repositories
- `docs/` - architecture, runbooks, specs

## Where to put new code

Work in the repository that owns the area:

| Change | Repository | Location |
|---|---|---|
| UI components | shelterflex-web | `components/` |
| Route pages | shelterflex-web | `app/` |
| API routes | shelterflex-api | `src/routes/` (Soroban code under `src/soroban/`) |
| Contracts | shelterflex-contracts | `<contract_name>/src/lib.rs` |
| Cross-repo e2e tests | shelterflex-platform | `e2e/` |
| Shared CI policy | shelterflex-platform | `.github/workflows/` |

Only changes that span repositories, or that concern how they integrate, belong
in the platform repository.

## Documentation

- Root overview: `README.md`
- Contribution guide: `CONTRIBUTING.md`
- Open work: the issue tracker of the repository concerned
