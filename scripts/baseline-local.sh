#!/usr/bin/env bash
# Read-only snapshot of the existing projects and docs.
# Usage: bash baseline-local.sh <output-file>
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"   # the wed/ folder
PORTFOLIO="$HOME/workspace/billythemoose.github.io"
OUT="$1"
{
  for repo in "$ROOT"/wedding "$ROOT"/wedding-login "$ROOT"/wedding-secret "$ROOT"/wedding-cdk "$PORTFOLIO"; do
    echo "== $repo"
    git -C "$repo" rev-parse HEAD
    git -C "$repo" --no-optional-locks status --porcelain
    git -C "$repo" remote -v
    git -C "$repo" for-each-ref --format='%(refname) %(objectname)'
  done
  echo "== docs"
  (cd "$ROOT/docs" && shasum -a 256 $(ls *.md | grep -v '^plan-demo-monorepo\.md$'))
} > "$OUT"
