ALTER TABLE "GameResult" ADD COLUMN "isBattle" BOOLEAN;
CREATE INDEX "GameResult_isBattle_createdAt_idx" ON "GameResult"("isBattle", "createdAt");

CREATE TABLE "TikTokMatchResult" (
  "roomCode" TEXT NOT NULL,
  "finishedAt" TIMESTAMP(3) NOT NULL,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "avatar" TEXT,
  "score" INTEGER NOT NULL,
  "correctCount" INTEGER NOT NULL,
  "speedPlacements" INTEGER NOT NULL,
  CONSTRAINT "TikTokMatchResult_pkey" PRIMARY KEY ("roomCode", "finishedAt", "username")
);
CREATE INDEX "TikTokMatchResult_finishedAt_username_idx" ON "TikTokMatchResult"("finishedAt", "username");
CREATE INDEX "TikTokMatchResult_username_finishedAt_idx" ON "TikTokMatchResult"("username", "finishedAt");

CREATE TYPE "HallOfFameCategory" AS ENUM ('LIVE', 'BATTLE');
CREATE TABLE "HallOfFameReward" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "awardKey" TEXT NOT NULL,
  "category" "HallOfFameCategory" NOT NULL,
  "title" TEXT NOT NULL,
  "eventName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "details" TEXT NOT NULL,
  "conditions" TEXT NOT NULL,
  "availableAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "claimedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HallOfFameReward_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HallOfFameReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "HallOfFameReward_userId_awardKey_key" ON "HallOfFameReward"("userId", "awardKey");
CREATE INDEX "HallOfFameReward_userId_createdAt_idx" ON "HallOfFameReward"("userId", "createdAt");
