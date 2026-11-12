#!/usr/bin/env bash
# Read-only snapshot of the CloudFormation stacks and DNS records.
# Usage: DOMAIN=example.com bash baseline-aws.sh <output-file>
set -euo pipefail
: "${DOMAIN:?Set DOMAIN to the real domain}"
OUT="$1"
{
  echo "== stacks (WeddingCdk* should be absent)"
  aws cloudformation describe-stacks --region us-east-1 \
    --query "Stacks[?starts_with(StackName,'WeddingCdk') || StackName=='CDKToolkit' || StackName=='PortfolioSiteStack'].[StackName,StackStatus,LastUpdatedTime]" \
    --output text | sort
  echo "== DNS records in the hosted zone"
  ZONE_ID=$(aws route53 list-hosted-zones-by-name --dns-name "$DOMAIN" \
            --query "HostedZones[?Name=='$DOMAIN.'].Id | [0]" --output text)
  aws route53 list-resource-record-sets --hosted-zone-id "$ZONE_ID" \
    --query "ResourceRecordSets[].[Name,Type]" --output text | sort
} > "$OUT"
