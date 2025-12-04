#!/bin/bash
set -euo pipefail

MAIN_REPO="$(pwd)"
PAGES_REPO="../ormezo-parking-gh"
PAGES_URL="https://dkg11hu.github.io/ormezo-parking-snap/"

echo "==> Copying public/ to gh-pages worktree..."
rsync -av --delete --exclude='.git' "$MAIN_REPO/public/" "$PAGES_REPO/"
cp -v "$MAIN_REPO/public/urls.json" "$PAGES_REPO/urls.json"
cd "$PAGES_REPO"

echo "==> Checking worktree status..."
if [[ -n "$(git status --porcelain)" ]]; then
  echo "==> Committing changes to gh-pages..."
  git add .
  git commit -m "chore: update GitHub Pages build ($(date +'%Y-%m-%d %H:%M:%S'))"
else
  echo "==> No changes to commit, skipping commit step."
fi

echo "==> Pushing to origin/gh-pages..."
git push origin gh-pages

echo "==> Validating GitHub Pages deployment..."
curl -I "$PAGES_URL/index.html" | grep -iE "Last-Modified|ETag"

echo "==> Done. GitHub Pages will rebuild shortly."
