#!/bin/bash
# deploy.sh — Build and deploy APPS frontend to S3 + invalidate CloudFront cache
# Usage: ./scripts/deploy.sh

set -e

BUCKET="apps-s3-frontend"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name apps-frontend-stack \
  --region us-east-2 \
  --query "Stacks[0].Outputs[?ExportName=='apps-cf-distribution-id'].OutputValue" \
  --output text)

echo "Syncing site/ to s3://$BUCKET ..."
aws s3 sync site/ "s3://$BUCKET" \
  --delete \
  --region us-east-2

echo "Creating CloudFront invalidation for distribution $DISTRIBUTION_ID ..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "Deploy complete."
