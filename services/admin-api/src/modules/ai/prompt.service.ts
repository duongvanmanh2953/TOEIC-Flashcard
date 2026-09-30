import { Injectable } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';

@Injectable()
export class PromptService {
  buildExplainPrompt(word: string, cefrLevel: CefrLevel): string {
    return `You are VocabFlow AI Vocabulary Tutor.
Explain the word "${word}" for an English learner at CEFR level ${cefrLevel}.
Format your response clearly:
1. Core definition and nuances.
2. 3 natural examples suitable for ${cefrLevel} level with Vietnamese translation.
3. Common collocations or word combinations.
4. One memory tip / mnemonic to remember this word easily.`;
  }

  buildSentenceGenPrompt(word: string): string {
    return `Generate 4 graduated example sentences for the English word "${word}" across 4 CEFR levels:
A2: Simple everyday sentence.
B1: Standard workplace / study sentence.
B2: Business / professional sentence.
C1: Advanced, sophisticated sentence.
Include Vietnamese translation and key grammar pattern for each.`;
  }

  buildTutorPrompt(userMessage: string, cefrLevel: CefrLevel, contextWord?: string): string {
    return `You are VocabFlow AI Personal English Tutor.
Learner CEFR Level: ${cefrLevel}.
Target word context: ${contextWord || 'General'}.
Learner query: "${userMessage}".
Follow the teaching method: Teach concisely -> Provide a clear contextual example -> Ask a quick follow-up check question to test the learner. Keep tone encouraging, professional and educational.`;
  }
}
