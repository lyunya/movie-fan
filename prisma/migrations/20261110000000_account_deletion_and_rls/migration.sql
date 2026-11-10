-- Deleting a Member removes their Library with them. The original constraint
-- was ON DELETE RESTRICT, which made an account impossible to delete.
ALTER TABLE "WatchListItem" DROP CONSTRAINT "WatchListItem_userId_fkey";
ALTER TABLE "WatchListItem" ADD CONSTRAINT "WatchListItem_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Every table is reached through the application server only. Row level
-- security with no policies keeps Supabase's public Data API (anon and
-- authenticated keys) out; the server's own database role is the table owner
-- and is unaffected. Later tables already had this; these are the earlier ones.
-- Enabling it where it is already on is a no-op.
ALTER TABLE "Account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovieList" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovieListItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovieNightRoom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovieNightCandidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MovieNightVote" ENABLE ROW LEVEL SECURITY;
