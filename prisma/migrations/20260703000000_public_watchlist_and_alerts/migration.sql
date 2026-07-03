-- Add opt-in flags for a public watchlist and streaming alerts, plus a
-- last-known streaming-availability flag on each watchlist item.
ALTER TABLE "User" ADD COLUMN "publicWatchlist" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "streamAlerts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WatchListItem" ADD COLUMN "hasStreaming" BOOLEAN NOT NULL DEFAULT false;
