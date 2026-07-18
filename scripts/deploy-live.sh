#!/usr/bin/env bash
# Deploy applianceerrors.com by pushing to alexlatif/appliance-errors (GitHub).
# The repo's Actions workflow holds the Cloudflare Pages token and runs the
# audit + uniqueness gates before wrangler deploy — this is the ONLY deploy
# path; no Pages-capable Cloudflare credential exists on this machine.
#
# The sitez monorepo has no remote; this script scratch-clones the deploy
# repo, rsyncs appliance-site/ over it (secrets excluded), commits, pushes.
#
# Usage: ./scripts/deploy-live.sh "commit message"
set -euo pipefail

MSG="${1:?usage: deploy-live.sh \"commit message\"}"
SITE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GH_TOKEN="${GITHUB_TOKEN:-$(grep '^GITHUB_TOKEN' "$HOME/code/.env" | cut -d= -f2)}"
WORK="$(mktemp -d /tmp/appliance-deploy.XXXXXX)"
trap 'rm -rf "$WORK"' EXIT

git clone -q "https://x-access-token:${GH_TOKEN}@github.com/alexlatif/appliance-errors.git" "$WORK/repo"
rsync -a --exclude .git --exclude node_modules --exclude dist --exclude .wrangler \
  --exclude '.env' --exclude .DS_Store "$SITE_DIR/" "$WORK/repo/"
cd "$WORK/repo"
if git status --porcelain | grep -q .; then
  git add -A
  git -c user.name=alexlatif -c user.email=alelat19@gmail.com commit -q -m "$MSG"
  git push -q origin main
  echo "✓ pushed — CI deploys: https://github.com/alexlatif/appliance-errors/actions"
else
  echo "no changes to deploy"
fi
