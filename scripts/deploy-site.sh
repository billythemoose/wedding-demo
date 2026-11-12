#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=infra/cdk-outputs.json
SITE=apps/web/dist/web/browser
BUCKET=$(jq -r '.WeddingDemoStack.BucketName' "$OUT")
DIST=$(jq -r '.WeddingDemoStack.DistributionId' "$OUT")

# Guard: only ever touch the bucket tagged as the demo's.
TAG=$(aws s3api get-bucket-tagging --bucket "$BUCKET" \
      --query "TagSet[?Key=='project'].Value | [0]" --output text)
[[ "$TAG" == "wedding-demo" ]] || { echo "Refusing: $BUCKET is not tagged project=wedding-demo"; exit 1; }

# 1. Hashed bundles: cache for a year.
aws s3 sync "$SITE" "s3://$BUCKET" --delete \
  --exclude "*" --include "*.js" --include "*.css" --include "media/*" \
  --cache-control "public, max-age=31536000, immutable"
# 2. Images, favicon, robots: not hashed, so cache for a day.
aws s3 sync "$SITE" "s3://$BUCKET" --delete \
  --exclude "*.js" --exclude "*.css" --exclude "media/*" --exclude "index.html" \
  --cache-control "public, max-age=86400"
# 3. index.html last, never cached, so a deploy shows up at once.
aws s3 cp "$SITE/index.html" "s3://$BUCKET/index.html" --cache-control "no-cache"

aws cloudfront create-invalidation --distribution-id "$DIST" --paths "/index.html"
