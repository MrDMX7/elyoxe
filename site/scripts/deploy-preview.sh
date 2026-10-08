#!/usr/bin/env bash
# deploy-preview.sh [out-dir]
# Publish a preview build (BASE_PATH=/next PREVIEW=1) to https://elyoxe.com/next/
# The production deploy (infra/deploy-site.sh elyoxe) excludes nothing under
# next/, so this preview disappears at the next production publish — intended.
set -euo pipefail
# 2026-10-08 (owner: the fast upload for every project): uploads go through ~/workspace/tools/s3fast.py (boto3, many at a
# time, same arguments as `aws s3 sync|cp`); the CLI runs only if it fails
fast(){ shift 2; "$(command -v python3 || command -v python)" "$HOME/workspace/tools/s3fast.py" "$@" || aws s3 "$@"; }
OUT="${1:-out}"
grep -q '/next/_next' "$OUT/index.html" || { echo "not a preview build (BASE_PATH=/next)"; exit 1; }
grep -q 'noindex' "$OUT/index.html" || { echo "preview must be noindex"; exit 1; }
fast aws s3 sync "$OUT/" s3://elyoxe-574771023173/next/ --delete --only-show-errors --region ap-south-1
aws cloudfront create-invalidation --distribution-id E2QY4WECG1P5WO --paths "/next/*" --query 'Invalidation.Id' --output text
echo "preview: https://elyoxe.com/next/"
