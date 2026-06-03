#!/usr/bin/env bash
# run-migration.sh
# Usage: Ensure DATABASE_URL is set in environment or .env, then run this script.
set -euo pipefail

echo "Applying Prisma migrations (deploy)..."
npx prisma migrate deploy

echo "Generating Prisma client..."
npx prisma generate

echo "Migrations applied and Prisma client generated."
