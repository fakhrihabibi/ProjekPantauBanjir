# run-migration.ps1
# Usage: Run in PowerShell with environment variable DATABASE_URL set or .env loaded.
Set-StrictMode -Version Latest

Write-Host "Applying Prisma migrations (deploy)..."
npx prisma migrate deploy

Write-Host "Generating Prisma client..."
npx prisma generate

Write-Host "Migrations applied and Prisma client generated."
