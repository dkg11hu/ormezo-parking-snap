#!/bin/bash
set -euo pipefail

# 1. Ellenőrizd, hogy van-e változás (pl. parking-status.json frissült)
git add -A

# 2. Készíts commitot
git commit -m "chore: trigger CI/CD cycle" || echo "No changes to commit"

# 3. Pushold a main branchre
git push origin main

# 4. Info üzenet
echo "✅ Push completed. GitHub Actions workflow will now run CI/CD and deploy to gh-pages."
echo "👉 Check progress under the Actions tab in your GitHub repository."
