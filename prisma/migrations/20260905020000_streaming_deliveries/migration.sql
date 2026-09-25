-- CreateTable
CREATE TABLE "StreamingDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "lockedUntil" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamingDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StreamingDelivery_userId_createdAt_idx" ON "StreamingDelivery"("userId", "createdAt");

-- Application-server access only.
ALTER TABLE "StreamingDelivery" ENABLE ROW LEVEL SECURITY;
