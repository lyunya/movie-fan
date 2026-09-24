-- AlterTable
ALTER TABLE "MovieNightCandidate" ADD COLUMN     "durationMinutes" INTEGER,
ADD COLUMN     "providerNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "synopsis" TEXT;

-- AlterTable
ALTER TABLE "MovieNightVote" ADD COLUMN     "decision" TEXT;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConnection" ADD CONSTRAINT "UserConnection_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsBookmark" ADD CONSTRAINT "NewsBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

