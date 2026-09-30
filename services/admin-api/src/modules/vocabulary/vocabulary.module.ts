import { Module } from '@nestjs/common';
import { VocabularyService } from './vocabulary.service';
import { VocabularyController } from './vocabulary.controller';
import { MemoryEngineService } from './memory-engine.service';
import { MemoryEngineController } from './memory-engine.controller';

@Module({
  controllers: [VocabularyController, MemoryEngineController],
  providers: [VocabularyService, MemoryEngineService],
  exports: [VocabularyService, MemoryEngineService],
})
export class VocabularyModule {}
