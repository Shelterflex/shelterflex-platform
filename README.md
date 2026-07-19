# Shelterflex 

Shelterflex is a **Rent Now, Pay Later (RNPL)** platform that enables tenants to secure rental properties with an initial deposit and pay the remaining balance in monthly installments — while allowing landlords to list properties directly, reducing reliance on traditional agents.

The platform combines three layers:  

- **Property Marketplace** — Verified listings tenants can browse, filter, and secure
- **Financing Engine** — Installment-based rent with tiered interest plans (3, 6, or 12 months)
- **Risk & Credit Assessment** — Tenant screening via income verification, bank statements, and alternative data

### Platform Stakeholders


| Role | Description |
|---|---|
| **Tenant** | Browses listings, pays a 20–40% deposit upfront, repays the balance over time |
| **Landlord** | Lists properties directly, receives guaranteed/partial payments, avoids agent fees |
| **Whistleblower** | Reports fraudulent or inaccurate listings and earns on-chain rewards — functioning as a decentralized trust layer and organic quality-signal for the platform |
| **Freelance Inspector** | Physically verifies property conditions and submits structured inspection reports |

Whistleblowers are a first-class participant in the Shelterflex ecosystem. By surfacing fake listings and bad actors, they improve the overall listing quality, protect tenants from fraud, and make Shelterflex more attractive to both sides of the market. In this sense they serve an **advertising function**: every verified listing they help maintain increases platform credibility and drives organic adoption.

**Wallet Authentication** - Users can connect their Stellar wallet (e.g., Freighter) for secure, self-custody authentication alongside traditional email/OTP login.

**Security Scanning** - Automated security scanning runs on all pull requests to detect vulnerabilities in dependencies, code, and commits. See [Security Scanning](#security-scanning) for details.

## Repositories

Shelterflex is built as **four independent repositories**. This one is the
platform repository: it holds no application source, and instead provides the
integration stack, the cross-repo end-to-end suite, shared CI policy, and the
architecture documentation.

| Repository | Contents |
|---|---|
| [shelterflex-web](https://github.com/Shelterflex/shelterflex-web) | Next.js (React) web app |
| [shelterflex-api](https://github.com/Shelterflex/shelterflex-api) | Node.js (TypeScript + Express) API |
| [shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts) | Smart contracts (Soroban/Rust; target chain TBD) |
| **shelterflex-platform** (here) | Integration stack, e2e suite, shared CI, docs |

The repositories integrate at the artifact level rather than through submodules
or a shared tree. `shelterflex-web` and `shelterflex-api` publish container
images to GHCR on every merge to `main`; the compose stack in this repository
pulls those images. Both app repos also consume this repository's reusable
security-scan workflow, and notify it after publishing so integration runs can
be triggered against a new image.

## Business Model

Revenue is generated through:

- **Interest on installments** — tiered rates based on repayment term and tenant risk profile
- **Service fees** — optional listing fees and per-transaction fees
- **Premium features** — featured listings, tenant verification badges

### Payment Plan Reference

| Plan | Deposit | Interest | Monthly Payment (on ₦840k balance) |
|---|---|---|---|
| 3 months | 30% | 8% | ≈ ₦302,400 |
| 6 months | 30% | 12% | ≈ ₦156,800 |
| 12 months | 30% | 15% | ≈ ₦80,500 |

## Risk Management

The platform's viability depends on its risk controls:

- **Tenant screening** — income verification, employment checks, bank statement analysis, alternative data (mobile money, utility payments)
- **Tenant Rating Card** — portable reputation profile accumulated across tenancies; accessible to landlords during applicant vetting
- **Landlord protection** — partial upfront payout, optional rent guarantee insurance, escrow smart contracts
- **Late payment controls** — grace periods, penalties, automated reminders, escalation workflows
- **Whistleblower rewards** — on-chain incentive program that crowdsources detection of fraudulent listings and bad-faith actors
- **Staking / liquidity programme** — planned for a future phase to back the financing float

## Quickstart

**To work on a component**, clone its repository and follow its README. Each one
runs standalone; you do not need this repository to contribute to any of them.

```bash
git clone https://github.com/Shelterflex/shelterflex-web.git       # frontend
git clone https://github.com/Shelterflex/shelterflex-api.git       # API
git clone https://github.com/Shelterflex/shelterflex-contracts.git # contracts
```

**To run the whole system together**, use the integration stack below.

## Full Stack (Docker Compose)

Runs the published frontend and backend images with PostgreSQL and MinIO. No
local Node.js, Postgres or application source required — the images are pulled
from GHCR.

**Prerequisites:** [Docker Desktop 4+](https://www.docker.com/products/docker-desktop/) with ports **3000**, **4000**, **5432** and **9000** available.

```bash
# From the repository root
docker compose --env-file .env.docker up
```

By default this runs the `main` tag of each image. To pin a reproducible pair —
for example to reproduce a failing integration run:

```bash
API_TAG=sha-84fe55b WEB_TAG=sha-486b4f7 docker compose --env-file .env.docker up
```

To pull newly published images rather than reusing local ones:

```bash
docker compose --env-file .env.docker pull
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Health check | http://localhost:4000/health |
| PostgreSQL | `localhost:5432` (user/password/db: `postgres` / `postgres` / `shelterflex_dev`) |

**Database migrations** run automatically when the backend starts, from the
migrations baked into the API image. To pick up migrations added in
`shelterflex-api`, pull a newer image tag and restart:

```bash
docker compose pull backend && docker compose up -d backend
```

**Optional services** (included via `docker-compose.override.yml`):

- **Redis** — enables real Redis instead of the in-memory mock (`REDIS_DISABLED=false`)
- **pgAdmin** — http://localhost:5050 (login: `admin@shelterflex.local` / `admin`)

To include a local Soroban sandbox (Stellar Quickstart):

```bash
docker compose --env-file .env.docker --profile contracts up
```

Stellar Quickstart runs at http://localhost:8000.

Stellar Quickstart only provides a local Soroban sandbox. It does not build or
deploy contracts — see [shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts)
for the toolchain and test instructions.

**Tear down** (removes containers and volumes):

```bash
docker compose down -v
```

**No hot-reload.** This stack runs prebuilt images and is for integration, not
for developing the frontend or backend. To iterate on either, run it directly
from its own repository against this stack's Postgres and MinIO.

## Contributing to Contracts

For details on proposing and approving contract upgrades, see **[Contract Upgrade Process](https://github.com/Shelterflex/shelterflex-contracts/blob/main/docs/contracts/UPGRADE_PROCESS.md)** in the contracts repository.

## Troubleshooting

Issues with a single component belong in that component's repository. The
entries below cover the integration stack only.

### Image pull fails or a tag is not found

The images are published by `shelterflex-web` and `shelterflex-api` on merge to
`main`. If a tag is missing, check that the **Publish image** workflow succeeded
in that repository. For private packages, authenticate first:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u <your-username> --password-stdin
```

### The stack is running stale code

`docker compose up` reuses whatever image is already cached locally. Pull first:

```bash
docker compose --env-file .env.docker pull
```

### Port already in use

The stack publishes 3000, 4000, 5432, 9000 and 9001. Free the conflicting port,
or override the host side of the mapping in a local compose override file.

### Backend fails to start with env var errors

`.env.docker` is the single source of environment for this stack. If the API
adds a newly required variable, it must be added there — see the
`shelterflex-api` README for the full list.

### A service never becomes healthy

```bash
docker compose logs backend    # or frontend, postgres, minio
docker compose ps              # shows health status per service
```

## Contributing

Open issues live in the repository they affect — check
[shelterflex-web](https://github.com/Shelterflex/shelterflex-web/issues),
[shelterflex-api](https://github.com/Shelterflex/shelterflex-api/issues),
[shelterflex-contracts](https://github.com/Shelterflex/shelterflex-contracts/issues),
or [this repository](https://github.com/Shelterflex/shelterflex-platform/issues).

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for:

- How to create issues and pick up tasks
- Issue types and **Definition of Done**
- PR process and review checklist

Contributions are made via **Fork -> Branch -> Pull Request**.

For how the repositories fit together and where new code belongs, see
[`docs/REPO_STRUCTURE.md`](docs/REPO_STRUCTURE.md).

## Security Scanning

All pull requests are automatically scanned for security vulnerabilities:

- **Dependency Scanning**: Checks npm and cargo dependencies for known CVEs
- **Static Code Analysis**: Detects security issues like SQL injection, XSS, insecure crypto
- **Secret Detection**: Scans commits for exposed API keys, passwords, and credentials

### How It Works

1. When you open a PR, the security scanner runs automatically
2. Results appear as a PR check and comment
3. Critical or high severity vulnerabilities block the merge
4. Medium and low severity issues are warnings only

### Local Testing

You can run the security scanner locally before pushing:

```bash
cd security-scan
npm install
npm run build
npm run scan
```

See [`security-scan/README.md`](security-scan/README.md) for detailed documentation.
