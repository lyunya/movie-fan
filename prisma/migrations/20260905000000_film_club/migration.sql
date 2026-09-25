-- AlterTable
ALTER TABLE "User" ADD COLUMN     "bio" TEXT,
ADD COLUMN     "handle" TEXT,
ADD COLUMN     "mutedNewsTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "newsTopics" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "WatchListItem" ADD COLUMN     "dismissed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inWatchlist" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastWatchedAt" TIMESTAMP(3),
ADD COLUMN     "savedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "watched" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WatchEvent" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "spoiler" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "MovieList" ADD COLUMN     "coverMovieId" TEXT,
ADD COLUMN     "ranked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "MovieListItem" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "MovieNightRoom" ADD COLUMN     "chosenMovieId" TEXT,
ADD COLUMN     "scheduledAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsBookmark" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_tokenHash_key" ON "RoomParticipant"("tokenHash");

-- CreateIndex
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");

-- CreateIndex
CREATE INDEX "UserConnection_targetId_kind_idx" ON "UserConnection"("targetId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "UserConnection_userId_targetId_kind_key" ON "UserConnection"("userId", "targetId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "NewsBookmark_userId_url_key" ON "NewsBookmark"("userId", "url");

-- CreateIndex
CREATE UNIQUE INDEX "User_handle_key" ON "User"("handle");

-- CreateIndex
CREATE INDEX "WatchListItem_userId_inWatchlist_idx" ON "WatchListItem"("userId", "inWatchlist");

-- CreateIndex
CREATE INDEX "WatchListItem_userId_watched_idx" ON "WatchListItem"("userId", "watched");

-- AddForeignKey
ALTER TABLE "RoomParticipant" ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MovieNightRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve existing saved membership and opinions. Unknown viewing dates stay NULL.
UPDATE "WatchListItem" SET "watched" = true
WHERE "userRating" IS NOT NULL OR EXISTS (
 SELECT 1 FROM "WatchEvent" e WHERE e."userId" = "WatchListItem"."userId" AND e."movieId" = "WatchListItem"."movieId"
);
UPDATE "WatchListItem" w SET "lastWatchedAt" = e.latest
FROM (SELECT "userId", "movieId", MAX("watchedAt") latest FROM "WatchEvent" GROUP BY "userId", "movieId") e
WHERE w."userId" = e."userId" AND w."movieId" = e."movieId";
-- These new application tables are accessed through authorized server procedures only.
ALTER TABLE "RoomParticipant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "NewsBookmark" ENABLE ROW LEVEL SECURITY;
-- Recover watched films whose legacy watchlist row was removed while diary history remained.
INSERT INTO "WatchListItem" (
 "id","userId","movieId","emsVersionId","name","directedBy","durationMinutes","genres",
 "posterImage","releaseDate","inWatchlist","watched","lastWatchedAt"
)
SELECT 'diary-library-' || e."id", e."userId", e."movieId", e."movieId", e."name", '', e."durationMinutes", e."genres",
 e."posterImage", e."releaseDate", false, true, e."watchedAt"
FROM (SELECT DISTINCT ON ("userId","movieId") * FROM "WatchEvent" ORDER BY "userId","movieId","watchedAt" DESC) e
ON CONFLICT ("userId","movieId") DO NOTHING;
