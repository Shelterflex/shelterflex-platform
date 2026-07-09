# Shelterflex Contracts

On-chain smart contracts for **Shelterflex**, a Rent Now, Pay Later (RNPL) rental
platform. Implements escrow, staking, rent payments, whistleblower rewards, oracle price
feeds, access control, and related primitives.

Currently prototyped on **Soroban (Rust)**; target chain configuration lives in
`deployment/`. Part of the Shelterflex ecosystem — see the
[ecosystem overview](https://github.com/Shelterflex/shelterflex-platform/blob/main/ECOSYSTEM.md).

## Stack

- Soroban SDK (Rust), Cargo workspace
- One crate per contract (e.g. `deal_escrow/`, `mvp_staking_pool/`, `rent_payments/`,
  `oracle_price_feeds/`, `slashing_module/`)

## Getting started

```bash
cargo test --workspace
stellar contract build
```

See `DEPLOYMENT.md` and `docs/contracts/` for deployment and upgrade procedures.

## Common commands

```bash
cargo fmt --all -- --check                       # formatting
cargo clippy --workspace --all-targets --all-features
cargo test --workspace                           # tests
```

## Layout

- `<contract_name>/src/lib.rs` — individual contracts
- `deployment/` — deploy scripts, config, and `deployed` addresses (consumed by the API)
- `docs/contracts/`, `docs/specs/contracts/` — deployment, upgrade, and spec docs

## Relationship to other repos

- **[shelterflex-api](https://github.com/Shelterflex/shelterflex-api)** invokes these
  contracts over Soroban RPC, using addresses published in `deployment/deployed`.
- Ships a vendored copy of `test-vectors.json`; a CI drift check keeps it in sync with the
  canonical copy in **[shelterflex-platform](https://github.com/Shelterflex/shelterflex-platform)**.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the issue templates under `.github/`.
Security-sensitive — review `docs/security/CONTRACT_SECURITY_CHECKLIST.md` before submitting.
