#!/usr/bin/env bash
set -euo pipefail

# load .env if present
if [ -f .env ]; then
  # shellcheck disable=SC1091
  . .env
fi

if [ -z "${EXTRACTOR_SECRET:-}" ]; then
  echo "ERROR: EXTRACTOR_SECRET not set" >&2
  exit 2
fi

curl -sS -X POST -H "x-run-secret: $EXTRACTOR_SECRET" https://ormezo-parking-snap.onrender.com/admin/run-extractor | jq . -R
