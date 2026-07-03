-- One-shot hotfix: add the columns the app already expects to a database that
-- was created via `prisma db push` (no migration history, so `migrate deploy`
-- can't run). Idempotent + additive, so it's safe to run repeatedly and causes
-- no data loss. Applied at build time via `prisma db execute`, then removed.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "publicWatchlist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "streamAlerts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WatchListItem" ADD COLUMN IF NOT EXISTS "hasStreaming" BOOLEAN NOT NULL DEFAULT false;
