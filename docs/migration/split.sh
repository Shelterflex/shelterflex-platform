#!/usr/bin/env bash
#
# Split the Shelterflex monorepo into 4 history-preserving repos.
#
#   shelterflex-web        <- frontend/
#   shelterflex-api        <- backend/ (+ load-tests/, scripts/db-backup/)
#   shelterflex-contracts  <- contracts/ (+ docs/contracts/, docs/specs/contracts/)
#   shelterflex-platform   <- orchestration, root e2e, security tooling, docs, test-vectors
#
# Each target is produced from a FRESH clone of the monorepo, so the original
# repo is never touched. git-filter-repo rewrites history to keep only the
# relevant paths, preserving authorship and dates.
#
# Prereqs:
#   brew install git-filter-repo        # or: pipx install git-filter-repo
#
# Usage:
#   export ORG="git@github.com:Shelterflex"          # GitHub org / user (SSH or HTTPS base)
#   export SRC="git@github.com:Shelterflex/monorepo.git"
#   export WORKDIR="$HOME/shelterflex-split"      # scratch dir for the clones
#   ./split.sh contracts        # run one repo at a time (recommended)
#   ./split.sh api
#   ./split.sh web
#   ./split.sh platform
#   ./split.sh all              # or all four in order
#
# Nothing is pushed automatically. Each run leaves a ready-to-push clone in
# $WORKDIR/<repo>; review it, then `git push -u origin main` yourself.

set -euo pipefail

: "${ORG:?set ORG, e.g. export ORG=git@github.com:Shelterflex}"
: "${SRC:?set SRC, e.g. export SRC=git@github.com:Shelterflex/monorepo.git}"
: "${WORKDIR:=$HOME/shelterflex-split}"

mkdir -p "$WORKDIR"

fresh_clone () {
  local name="$1"
  rm -rf "$WORKDIR/$name"
  git clone "$SRC" "$WORKDIR/$name"
}

finish () {
  local name="$1"
  git -C "$WORKDIR/$name" remote add origin "$ORG/$name.git" 2>/dev/null || \
    git -C "$WORKDIR/$name" remote set-url origin "$ORG/$name.git"
  echo
  echo ">> $name ready at $WORKDIR/$name"
  echo "   review with:  git -C $WORKDIR/$name log --oneline | head"
  echo "   push with:    git -C $WORKDIR/$name push -u origin main"
  echo
}

split_web () {
  fresh_clone shelterflex-web
  git -C "$WORKDIR/shelterflex-web" filter-repo \
    --path frontend/ \
    --path-rename frontend/:
  finish shelterflex-web
}

split_api () {
  fresh_clone shelterflex-api
  git -C "$WORKDIR/shelterflex-api" filter-repo \
    --path backend/ \
    --path load-tests/ \
    --path scripts/db-backup/ \
    --path-rename backend/:
  finish shelterflex-api
}

split_contracts () {
  fresh_clone shelterflex-contracts
  # contracts/ hoists to root; contracts/docs/events.md -> docs/events.md.
  # Root docs/contracts + docs/specs/contracts carry over without colliding.
  git -C "$WORKDIR/shelterflex-contracts" filter-repo \
    --path contracts/ \
    --path docs/contracts/ \
    --path docs/specs/contracts/ \
    --path-rename contracts/:
  finish shelterflex-contracts
}

split_platform () {
  fresh_clone shelterflex-platform
  # Everything that is shared or spans multiple repos. Root package.json,
  # lockfiles and pr.md are intentionally NOT included (monorepo scaffolding).
  git -C "$WORKDIR/shelterflex-platform" filter-repo \
    --path e2e/ \
    --path security-scan/ \
    --path docs/ \
    --path .github/ \
    --path README.md \
    --path CONTRIBUTING.md \
    --path docker-compose.yml \
    --path docker-compose.override.yml \
    --path .env.docker \
    --path test-vectors.json \
    --path semgrep.yml \
    --path .gitleaks.toml \
    --path .eslintrc.security.js \
    --path .gitignore \
    --path .pnpmrc \
    --path .vscode/
  finish shelterflex-platform
}

case "${1:-all}" in
  web)       split_web ;;
  api)       split_api ;;
  contracts) split_contracts ;;
  platform)  split_platform ;;
  all)       split_contracts; split_api; split_web; split_platform ;;
  *) echo "usage: $0 {web|api|contracts|platform|all}" >&2; exit 1 ;;
esac
