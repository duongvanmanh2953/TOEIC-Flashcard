-- Migration: Device Management, Risk Engine, Admin Security, Personal Vocabulary Brain & Capture
-- Date: 2026-09-28

-- 1. Enums
DO $$ BEGIN
  CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'PENDING_REVIEW', 'BLOCKED', 'REVOKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RiskEventType" AS ENUM ('NEW_DEVICE', 'DEVICE_LIMIT_EXCEEDED', 'SUSPICIOUS_LOGIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RiskEventStatus" AS ENUM ('PENDING', 'APPROVED', 'BLOCKED', 'EXEMPTED', 'RESOLVED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountRiskStatus" AS ENUM ('NORMAL', 'UNDER_REVIEW', 'RESTRICTED', 'BLOCKED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Alter User and UserProfile
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountRiskStatus" "AccountRiskStatus" NOT NULL DEFAULT 'NORMAL';

ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "primaryGoal" TEXT DEFAULT 'TOEIC';
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "secondaryGoal" TEXT DEFAULT 'Workplace Communication';

-- 3. Alter UserVocabulary
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "recognitionScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "recallScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "contextScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "speakingScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "lastReviewMode" TEXT DEFAULT 'RECOGNITION';
ALTER TABLE "UserVocabulary" ADD COLUMN IF NOT EXISTS "recommendedReviewMode" TEXT DEFAULT 'RECOGNITION';

-- 4. UserDevice Table
CREATE TABLE IF NOT EXISTS "UserDevice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "deviceName" TEXT NOT NULL,
  "deviceType" TEXT NOT NULL DEFAULT 'DESKTOP',
  "os" TEXT,
  "browser" TEXT,
  "userAgent" TEXT,
  "ipLastSeen" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE',
  "isAllowed" BOOLEAN NOT NULL DEFAULT true,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserDevice_userId_deviceId_key" ON "UserDevice"("userId", "deviceId");
CREATE INDEX IF NOT EXISTS "UserDevice_userId_status_idx" ON "UserDevice"("userId", "status");
CREATE INDEX IF NOT EXISTS "UserDevice_deviceId_idx" ON "UserDevice"("deviceId");

-- 5. UserSession Table
CREATE TABLE IF NOT EXISTS "UserSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "sessionTokenHash" TEXT,
  "refreshTokenHash" TEXT,
  "ip" TEXT,
  "userAgent" TEXT,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "UserSession_userId_deviceId_fkey" FOREIGN KEY ("userId", "deviceId") REFERENCES "UserDevice"("userId", "deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "UserSession_userId_status_idx" ON "UserSession"("userId", "status");
CREATE INDEX IF NOT EXISTS "UserSession_deviceId_idx" ON "UserSession"("deviceId");

-- 6. DeviceRiskEvent Table
CREATE TABLE IF NOT EXISTS "DeviceRiskEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "eventType" "RiskEventType" NOT NULL DEFAULT 'NEW_DEVICE',
  "status" "RiskEventStatus" NOT NULL DEFAULT 'PENDING',
  "ip" TEXT,
  "userAgent" TEXT,
  "reviewNote" TEXT,
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeviceRiskEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DeviceRiskEvent_userId_deviceId_fkey" FOREIGN KEY ("userId", "deviceId") REFERENCES "UserDevice"("userId", "deviceId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DeviceRiskEvent_userId_status_idx" ON "DeviceRiskEvent"("userId", "status");
CREATE INDEX IF NOT EXISTS "DeviceRiskEvent_status_idx" ON "DeviceRiskEvent"("status");
CREATE INDEX IF NOT EXISTS "DeviceRiskEvent_createdAt_idx" ON "DeviceRiskEvent"("createdAt");

-- 7. DeviceLogoutOtp Table
CREATE TABLE IF NOT EXISTS "DeviceLogoutOtp" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "targetDeviceId" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeviceLogoutOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DeviceLogoutOtp_userId_targetDeviceId_idx" ON "DeviceLogoutOtp"("userId", "targetDeviceId");
CREATE INDEX IF NOT EXISTS "DeviceLogoutOtp_expiresAt_idx" ON "DeviceLogoutOtp"("expiresAt");

-- 8. AdminSecurity Table
CREATE TABLE IF NOT EXISTS "AdminSecurity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminUserId" TEXT NOT NULL UNIQUE,
  "keypassHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSecurity_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 9. VocabularyCapture & VocabularyCaptureItem Tables
CREATE TABLE IF NOT EXISTS "VocabularyCapture" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "sourceTitle" TEXT,
  "rawText" TEXT NOT NULL,
  "extractedCount" INTEGER NOT NULL DEFAULT 0,
  "selectedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VocabularyCapture_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VocabularyCapture_userId_createdAt_idx" ON "VocabularyCapture"("userId", "createdAt");

CREATE TABLE IF NOT EXISTS "VocabularyCaptureItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "captureId" TEXT NOT NULL,
  "word" TEXT NOT NULL,
  "contextSentence" TEXT,
  "contextMeaning" TEXT,
  "cefrLevel" "CefrLevel" NOT NULL DEFAULT 'B1',
  "collocations" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "importanceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  "isSelected" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VocabularyCaptureItem_captureId_fkey" FOREIGN KEY ("captureId") REFERENCES "VocabularyCapture"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VocabularyCaptureItem_captureId_idx" ON "VocabularyCaptureItem"("captureId");
CREATE INDEX IF NOT EXISTS "VocabularyCaptureItem_word_idx" ON "VocabularyCaptureItem"("word");

-- 10. WordJourneyEvent Table
CREATE TABLE IF NOT EXISTS "WordJourneyEvent" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "vocabularyId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "details" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WordJourneyEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WordJourneyEvent_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "WordJourneyEvent_userId_vocabularyId_createdAt_idx" ON "WordJourneyEvent"("userId", "vocabularyId", "createdAt");

-- 11. VocabularyConfusionPair Table
CREATE TABLE IF NOT EXISTS "VocabularyConfusionPair" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "word1Id" TEXT NOT NULL,
  "word2Id" TEXT NOT NULL,
  "confusionCount" INTEGER NOT NULL DEFAULT 1,
  "lastConfusedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VocabularyConfusionPair_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VocabularyConfusionPair_word1Id_fkey" FOREIGN KEY ("word1Id") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VocabularyConfusionPair_word2Id_fkey" FOREIGN KEY ("word2Id") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "VocabularyConfusionPair_userId_word1Id_word2Id_key" ON "VocabularyConfusionPair"("userId", "word1Id", "word2Id");
CREATE INDEX IF NOT EXISTS "VocabularyConfusionPair_userId_idx" ON "VocabularyConfusionPair"("userId");
