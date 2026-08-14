-- Streaming-service preferences used by personalized discovery.
ALTER TABLE "User"
  ADD COLUMN "watchRegion" TEXT NOT NULL DEFAULT 'US',
  ADD COLUMN "preferredProviders" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];

-- A viewing diary preserves every watch/rewatch independently.
CREATE TABLE "WatchEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "posterImage" TEXT,
  "releaseDate" TEXT,
  "durationMinutes" INTEGER NOT NULL DEFAULT 0,
  "genres" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rating" INTEGER,
  "review" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "watchedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WatchEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieList" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MovieList_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieListItem" (
  "id" TEXT NOT NULL,
  "listId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "posterImage" TEXT,
  "releaseDate" TEXT,
  "tomatoMeter" INTEGER,
  "position" INTEGER NOT NULL DEFAULT 0,
  "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovieListItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieNightRoom" (
  "id" TEXT NOT NULL,
  "hostId" TEXT NOT NULL,
  "shareCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "filters" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MovieNightRoom_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieNightCandidate" (
  "id" TEXT NOT NULL,
  "roomId" TEXT NOT NULL,
  "movieId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "posterImage" TEXT,
  "releaseDate" TEXT,
  "tomatoMeter" INTEGER,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MovieNightCandidate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovieNightVote" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "voterToken" TEXT NOT NULL,
  "voterName" TEXT NOT NULL,
  "liked" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MovieNightVote_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WatchEvent_userId_watchedAt_idx" ON "WatchEvent"("userId", "watchedAt");
CREATE INDEX "WatchEvent_userId_movieId_idx" ON "WatchEvent"("userId", "movieId");
CREATE UNIQUE INDEX "MovieList_userId_name_key" ON "MovieList"("userId", "name");
CREATE INDEX "MovieList_userId_updatedAt_idx" ON "MovieList"("userId", "updatedAt");
CREATE UNIQUE INDEX "MovieListItem_listId_movieId_key" ON "MovieListItem"("listId", "movieId");
CREATE INDEX "MovieListItem_listId_position_idx" ON "MovieListItem"("listId", "position");
CREATE UNIQUE INDEX "MovieNightRoom_shareCode_key" ON "MovieNightRoom"("shareCode");
CREATE INDEX "MovieNightRoom_hostId_createdAt_idx" ON "MovieNightRoom"("hostId", "createdAt");
CREATE UNIQUE INDEX "MovieNightCandidate_roomId_movieId_key" ON "MovieNightCandidate"("roomId", "movieId");
CREATE INDEX "MovieNightCandidate_roomId_position_idx" ON "MovieNightCandidate"("roomId", "position");
CREATE UNIQUE INDEX "MovieNightVote_candidateId_voterToken_key" ON "MovieNightVote"("candidateId", "voterToken");
CREATE INDEX "MovieNightVote_candidateId_liked_idx" ON "MovieNightVote"("candidateId", "liked");

ALTER TABLE "WatchEvent" ADD CONSTRAINT "WatchEvent_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieList" ADD CONSTRAINT "MovieList_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieListItem" ADD CONSTRAINT "MovieListItem_listId_fkey"
  FOREIGN KEY ("listId") REFERENCES "MovieList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieNightRoom" ADD CONSTRAINT "MovieNightRoom_hostId_fkey"
  FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieNightCandidate" ADD CONSTRAINT "MovieNightCandidate_roomId_fkey"
  FOREIGN KEY ("roomId") REFERENCES "MovieNightRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MovieNightVote" ADD CONSTRAINT "MovieNightVote_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "MovieNightCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
