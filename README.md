# Shelterflex

Shelterflex is an open-source project exploring **rent now, pay later** workflows with a modern web frontend, a Node.js backend, and Soroban smart contracts.

This repository is organized as **three independent projects**:

- `frontend/` - Next.js (React) web app
- `backend/` - Node.js (TypeScript + Express) API
- `contracts/` - Soroban (Rust) smart contracts

## Prerequisites

- Node.js 20+ (recommended)
- pnpm (optional) or npm
- Rust toolchain (stable)
- Soroban CLI (`stellar` CLI with Soroban support)

## Quickstart

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000`.

### 2) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend runs on `http://localhost:4000`.

- `GET /health`
- `GET /soroban/config`

### 3) Contracts (Soroban)

```bash
cd contracts
cargo test
stellar contract build
```

For local/testnet deployment instructions see `contracts/README.md`.

## Contributing

See `CONTRIBUTING.md` for:

- Local setup for FE/BE/contracts
- How to create issues and pick up tasks
- Issue types (frontend/backend/contract) and **Definition of Done**
- PR process and review checklist

Contributions are made via **Fork -> Branch -> Pull Request**.

If you want a curated list of issues (including good first issues), see `docs/ISSUES_CATALOG.md`.

For monorepo navigation and where to put new code, see `docs/REPO_STRUCTURE.md`.
