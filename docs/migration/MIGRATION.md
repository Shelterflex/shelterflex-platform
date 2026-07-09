# Shelterflex monorepo → multi-repo migration

Splits the monorepo into four history-preserving repositories for the next Drips Wave.

| Repo | Source paths | Stack |
|---|---|---|
| **shelterflex-web** | `frontend/**` (incl. `frontend/e2e`) → repo root | Next.js / pnpm |
| **shelterflex-api** | `backend/**` → root; `load-tests/`, `scripts/db-backup/` | Express / npm |
| **shelterflex-contracts** | `contracts/**` → root; `docs/contracts/`, `docs/specs/contracts/` | Soroban / Rust / cargo |
| **shelterflex-platform** | root `e2e/`, `security-scan/`, `docker-compose*`, `.env.docker`, `docs/`, security config, `test-vectors.json`, `README.md` | orchestration / docs |

Why four repos: the three apps have **no build-time coupling** (only HTTP + Soroban RPC at runtime), so they split cleanly. The **platform** repo is the home for everything shared or cross-cutting, and its README is the ecosystem map the Drips review team asked for (see `ECOSYSTEM.md`).

## Prerequisites

```bash
brew install git-filter-repo     # or: pipx install git-filter-repo
```

The monorepo tree is clean (no committed `node_modules`/`dist`), so no history de-bloating is needed.

## Run the split

`split.sh` operates on **fresh clones** — the original monorepo is never modified, and nothing is pushed automatically.

```bash
export ORG="git@github.com:Shelterflex"
export SRC="git@github.com:Shelterflex/monorepo.git"
export WORKDIR="$HOME/shelterflex-split"

./split.sh contracts     # most isolated first
./split.sh api
./split.sh web
./split.sh platform
```

Recommended order: **contracts → api → web → platform**. Validate each before moving on:

| Repo | Validation |
|---|---|
| contracts | `cargo test --workspace` |
| api | `npm ci && npm run test:ci && npm run openapi:validate` |
| web | `pnpm install --frozen-lockfile && pnpm build` |
| platform | submodules wired, `docker compose up`, root `e2e` green |

Each clone lands in `$WORKDIR/<repo>` with `origin` pre-set; review the history, then `git push -u origin main`.

## Two shared artifacts — handle explicitly

### 1. `test-vectors.json` (golden vectors)

Consumed by **both** api (`src/outbox/canonicalization.test.ts`, `src/routes/staking.test.ts`) and contracts (`transaction-receipt-contract/src/test.rs`). Must stay byte-identical.

- **Canonical copy** lives in `shelterflex-platform`.
- api and contracts each **vendor a pinned copy** and add a CI drift check:

```yaml
# .github/workflows/vectors-drift.yml (in api and contracts)
- name: Check test-vectors drift
  run: |
    curl -sSL "https://raw.githubusercontent.com/Shelterflex/shelterflex-platform/main/test-vectors.json" -o /tmp/canonical.json
    diff -u /tmp/canonical.json test-vectors.json
```

Fails the build if a local copy drifts from platform. Simpler than publishing a package and keeps each repo self-contained.

### 2. `docker-compose.yml` build contexts

Compose builds from `./frontend` and `./backend`, which no longer exist after the split. In **shelterflex-platform**, add the app repos as submodules so full-stack local dev and the root e2e suite keep working:

```bash
git submodule add "$ORG/shelterflex-web.git" frontend
git submodule add "$ORG/shelterflex-api.git" backend
git commit -m "chore: add web/api as submodules for docker orchestration"
```

Contributors then clone with `git clone --recurse-submodules …` (documented in the platform README).

## Post-split wiring

- **CI:** the existing [`ci.yml`](../.github/workflows/ci.yml) already scopes each job by `working-directory`; lift each job into its own repo. Convert [`security-scan.yml`](../.github/workflows/security-scan.yml) into a **reusable workflow** in platform, called by web + api.
- **Security config** (`.gitleaks.toml`, `semgrep.yml`, `.eslintrc.security.js`): canonical in platform; each repo either copies them or calls the platform reusable workflow.
- **Cross-repo config (no code changes needed):**
  - web → api: `NEXT_PUBLIC_API_URL`
  - api → contracts: Soroban `contractId`s from `contracts/deployment/deployed`
- **Per-repo scaffolding required by Drips:**
  - README drafts in `readmes/` → each repo's `README.md`
  - CONTRIBUTING drafts in `contributing/` → each repo's `CONTRIBUTING.md`
  - Issue templates + PR template: the four `.github/ISSUE_TEMPLATE/*` files and
    `PULL_REQUEST_TEMPLATE.md` are repo-agnostic. `split.sh` routes `.github/` to
    **platform**; copy the same `ISSUE_TEMPLATE/` + `PULL_REQUEST_TEMPLATE.md` verbatim into
    web / api / contracts:
    ```bash
    for r in shelterflex-web shelterflex-api shelterflex-contracts; do
      mkdir -p "$WORKDIR/$r/.github"
      cp -r "$WORKDIR/shelterflex-platform/.github/ISSUE_TEMPLATE" "$WORKDIR/$r/.github/"
      cp "$WORKDIR/shelterflex-platform/.github/PULL_REQUEST_TEMPLATE.md" "$WORKDIR/$r/.github/"
    done
    ```

## CI workflows (in `workflows/`)

Ready-to-drop workflow files per repo. Copy each into that repo's `.github/workflows/`.
Repo/org references are already set to the `Shelterflex` org.

| Repo | Files |
|---|---|
| web | `ci.yml` (lint+build), `security-scan.yml` (caller) |
| api | `ci.yml` (lint, test, openapi), `security-scan.yml` (caller), `test-vectors-drift.yml` |
| contracts | `ci.yml` (fmt, clippy, test), `security-scan.yml` (caller, `setup-rust: true`), `test-vectors-drift.yml` |
| platform | `security-scan-reusable.yml` (`workflow_call`), `e2e.yml` (full-stack via submodules) |

Notes:
- The **reusable security scan** lives in platform and is fetched by the callers via
  `uses: Shelterflex/shelterflex-platform/.github/workflows/security-scan-reusable.yml@main`.
  It checks out the caller's code, pulls the scanner + `semgrep.yml`/`.gitleaks.toml` from
  platform (sparse checkout), and runs the existing orchestrator against the caller root.
- The scanner discovers npm/cargo projects from `process.cwd()`, so no monorepo paths remain.
- `test-vectors-drift.yml` fails a build if a vendored `test-vectors.json` diverges from the
  canonical copy in platform. In contracts, set `VECTORS_PATH` if the vendored copy lives
  inside a specific crate.
- The platform reusable workflow needs `security-scan/` + `semgrep.yml` + `.gitleaks.toml`
  present in platform (they are, per the split routing).

## Finalize

1. Create the four empty GitHub repos.
2. Run and validate each split (order above).
3. Wire platform submodules + test-vectors drift checks.
4. Drop in per-repo READMEs + issue templates.
5. Submit to the Wave via the [maintainer guide](https://docs.drips.network/wave/maintainers/participating-in-a-wave), using `ECOSYSTEM.md` as the relationship overview.
6. **Archive** the monorepo (GitHub → Settings → Archive) with a README pointer to the four repos. Do not delete — it remains the historical root.
