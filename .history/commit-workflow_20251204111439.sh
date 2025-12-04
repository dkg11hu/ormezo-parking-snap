#!/usr/bin/env bash
set -euo pipefail

# Script: commit-workflow.sh
# Purpose: Automate add → commit → push for ormezo-parking-snap
# Safe defaults: always show status and diff before committing

echo "==> Git status:"
git status

echo "==> Git diff (index.html):"
git diff --stat index.html || true

# Stage the updated file(s)
git add index.html

# Commit with clear message
COMMIT_MSG="fix: update index.html with dynamic bar colors (<10% red, 10–20% orange, >20% green)"
echo "==> Committing with message: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# Push to gh-pages branch
echo "==> Pushing to gh-pages..."
git push origin gh-pages

echo "==> Commit workflow finished successfully."
