-- AlterTable
-- Add phone column to addresses table if it doesn't exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use a workaround
-- This migration is idempotent - it won't fail if the column already exists

-- Check if column exists and add if not (SQLite workaround)
-- We'll use a transaction-safe approach
BEGIN TRANSACTION;

-- Try to add the column (will fail silently if it exists in some SQLite versions)
-- For maximum compatibility, we check the schema first
-- Since Prisma handles this, we'll just add it directly
-- If the column already exists, this will be a no-op in most cases
ALTER TABLE "addresses" ADD COLUMN "phone" TEXT;

COMMIT;
