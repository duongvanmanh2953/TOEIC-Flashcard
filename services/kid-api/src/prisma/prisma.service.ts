import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    try {
      await this.$executeRawUnsafe(`
        ALTER TABLE "CommunityDeck" ADD COLUMN IF NOT EXISTS "languageId" TEXT DEFAULT 'en';
        ALTER TABLE "CommunityDeck" ADD COLUMN IF NOT EXISTS "isOfficial" BOOLEAN DEFAULT false;
        CREATE INDEX IF NOT EXISTS "CommunityDeck_languageId_idx" ON "CommunityDeck"("languageId");
        CREATE INDEX IF NOT EXISTS "CommunityDeck_isOfficial_idx" ON "CommunityDeck"("isOfficial");
        ALTER TABLE "Vocabulary" ADD COLUMN IF NOT EXISTS "languageId" TEXT DEFAULT 'en';
        CREATE INDEX IF NOT EXISTS "Vocabulary_languageId_idx" ON "Vocabulary"("languageId");
      `);
    } catch {
      // Ignored if already applied
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
