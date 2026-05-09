DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

ALTER TABLE "titik_rawan"
  ADD COLUMN IF NOT EXISTS "radiusMeter" INTEGER NOT NULL DEFAULT 75,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedById" TEXT;

ALTER TABLE "laporan_warga"
  ADD COLUMN IF NOT EXISTS "coordinateSource" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedById" TEXT,
  ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "titik_rawan_verifiedById_idx" ON "titik_rawan"("verifiedById");
CREATE INDEX IF NOT EXISTS "laporan_warga_userId_idx" ON "laporan_warga"("userId");
CREATE INDEX IF NOT EXISTS "laporan_warga_verifiedById_idx" ON "laporan_warga"("verifiedById");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'titik_rawan_verifiedById_fkey'
      AND table_name = 'titik_rawan'
  ) THEN
    ALTER TABLE "titik_rawan"
      ADD CONSTRAINT "titik_rawan_verifiedById_fkey"
      FOREIGN KEY ("verifiedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'laporan_warga_userId_fkey'
      AND table_name = 'laporan_warga'
  ) THEN
    ALTER TABLE "laporan_warga"
      ADD CONSTRAINT "laporan_warga_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'laporan_warga_verifiedById_fkey'
      AND table_name = 'laporan_warga'
  ) THEN
    ALTER TABLE "laporan_warga"
      ADD CONSTRAINT "laporan_warga_verifiedById_fkey"
      FOREIGN KEY ("verifiedById") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
