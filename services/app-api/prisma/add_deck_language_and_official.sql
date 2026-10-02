-- Migration: Add languageId and isOfficial to CommunityDeck and languageId to Vocabulary
ALTER TABLE "CommunityDeck" ADD COLUMN IF NOT EXISTS "languageId" TEXT DEFAULT 'en';
ALTER TABLE "CommunityDeck" ADD COLUMN IF NOT EXISTS "isOfficial" BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS "CommunityDeck_languageId_idx" ON "CommunityDeck"("languageId");
CREATE INDEX IF NOT EXISTS "CommunityDeck_isOfficial_idx" ON "CommunityDeck"("isOfficial");

ALTER TABLE "Vocabulary" ADD COLUMN IF NOT EXISTS "languageId" TEXT DEFAULT 'en';
CREATE INDEX IF NOT EXISTS "Vocabulary_languageId_idx" ON "Vocabulary"("languageId");
