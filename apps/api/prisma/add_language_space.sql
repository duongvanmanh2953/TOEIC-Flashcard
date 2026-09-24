ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "languageSpaceId" TEXT;
CREATE INDEX IF NOT EXISTS "Conversation_languageSpaceId_idx" ON "Conversation"("languageSpaceId");
