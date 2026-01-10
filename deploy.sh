#!/bin/bash

set -e


# Load secrets
if [ -f "./secret.sh" ]; then
  source "./secret.sh"
else
  echo "Error: secret.sh not found. Please create it with DEPLOYMENT_ID."
  exit 1
fi


# Default description if not provided
DESCRIPTION="${1:-Updated deployment}"

echo "Pushing code to Apps Script..."
clasp push

echo "Deploying to Deployment ID: $DEPLOYMENT_ID"
echo "Description: $DESCRIPTION"

clasp deploy -i "$DEPLOYMENT_ID" -d "$DESCRIPTION"

echo "Done! Web App URL remains unchanged."
