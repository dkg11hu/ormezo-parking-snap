#!/usr/bin/env bash
set -euo pipefail

# Script: validate-release.sh
# Purpose: Compare local gh-pages commit vs. GitHub Pages served index.html

REPO_URL="https://dkg11hu.github.io/ormezo-parking-snap/index.html"

echo "==> Checking latest commit on gh-pages for index.html..."
LATEST_COMMIT=$(git log gh-pages -- index.html -1 --pretty=format:"%h %cd")
echo "Latest commit: $LATEST_COMMIT"

echo
echo "==> Fetching headers from GitHub Pages..."
HEADERS=$(curl -s -I "$REPO_URL")
LAST_MODIFIED=$(echo "$HEADERS" | grep -i "last-modified" | cut -d' ' -f2-)
ETAG=$(echo "$HEADERS" | grep -i "etag" | cut -d' ' -f2-)

echo "GitHub Pages Last-Modified: $LAST_MODIFIED"
echo "GitHub Pages ETag: $ETAG"

echo
echo "==> Validation result:"
echo "If Last-Modified < commit date, Pages has not yet rebuilt."
echo "If Last-Modified ≈ commit date, Pages is serving the latest version."

