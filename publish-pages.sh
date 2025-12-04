#!/bin/bash
set -euo pipefail

MAIN_REPO="$(pwd)"
PAGES_REPO="../ormezo-parking-gh"
PAGES_URL="https://dkg11hu.github.io/ormezo-parking-snap/"

echo "==> Copying public/ to gh-pages worktree..."
rsync -av --delete --exclude='.git' "$MAIN_REPO/public/" "$PAGES_REPO/"

# Explicit sanity check: ensure urls.json is transferred
echo "==> Ensuring urls.json is present..."
cp -v "$MAIN_REPO/public/urls.json" "$PAGES_REPO/urls.json"

# Verify integrity
SRC_HASH=$(sha1sum "$MAIN_REPO/public/urls.json" | awk '{print $1}')
DST_HASH=$(sha1sum "$PAGES_REPO/urls.json" | awk '{print $1}')
if [[ "$SRC_HASH" != "$DST_HASH" ]]; then
  echo "ERROR: urls.json mismatch after transfer!"
  echo "src: $SRC_HASH"
  echo "dst: $DST_HASH"
  exit 1
else
  echo "urls.json integrity verified."
fi

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
