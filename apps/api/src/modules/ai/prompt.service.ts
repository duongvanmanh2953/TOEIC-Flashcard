import { Injectable } from '@nestjs/common';
import { CefrLevel } from '@prisma/client';

export interface LearnerMemoryContext {
  userName?: string;
  cefrLevel: CefrLevel | string;
  targetLevel?: string;
  primaryGoal?: string;
  targetScore?: number | string;
  streakDays?: number;
  atRiskWords?: Array<{ word: string; slipRisk: number; meaning?: string }>;
  slowRecallWords?: Array<{ word: string; latencySec?: number }>;
  confusionPairs?: Array<{ word1: string; word2: string; note?: string }>;
  ragContext?: string[];
  conversationHistory?: string;
  targetLangName?: string;
  targetLangCode?: string;
  coachPersonality?: string;
}

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

  /**
   * Ultra-Personalized Pedagogical System Prompt Generator
   * Ingests FSRS memory variables, weak words, and adaptive difficulty.
   */
  buildPersonalizedTutorPrompt(userMessage: string, ctx: LearnerMemoryContext): string {
    const lang = ctx.targetLangName || 'English';
    const langCode = (ctx.targetLangCode || 'en').toLowerCase();
    const name = ctx.userName || 'Học viên';
    const persona = ctx.coachPersonality || 'Dedicated Native Language Coach';

    const defaultGoalMap: Record<string, string> = {
      zh: 'HSK 4+ & Giao tiếp phản xạ tiếng Trung',
      ja: 'JLPT N3-N2 & Giao tiếp phản xạ tiếng Nhật',
      ko: 'TOPIK II & Giao tiếp phản xạ tiếng Hàn',
      fr: 'DELF B2 & Giao tiếp tiếng Pháp chuẩn',
      de: 'Goethe-Zertifikat B2 & Tiếng Đức đời sống/công sở',
      es: 'DELE B2 & Giao tiếp tiếng Tây Ban Nha lưu loát',
      en: 'TOEIC 850+ & Business English Communication',
    };
    const defaultGoal = defaultGoalMap[langCode] || 'Giao tiếp phản xạ và làm chủ ngôn ngữ';
    const primaryGoal = ctx.primaryGoal || defaultGoal;

    const atRiskStr = ctx.atRiskWords && ctx.atRiskWords.length > 0
      ? ctx.atRiskWords.map((w) => `"${w.word}" (nguy cơ quên: ${(w.slipRisk * 100).toFixed(0)}%${w.meaning ? ` - ${w.meaning}` : ''})`).join(', ')
      : 'Hiện tại chưa có từ nào có nguy cơ quên cao.';

    const slowRecallStr = ctx.slowRecallWords && ctx.slowRecallWords.length > 0
      ? ctx.slowRecallWords.map((w) => `"${w.word}" (phản xạ chậm: ${w.latencySec || 4}s)`).join(', ')
      : 'Tốc độ phản xạ ổn định.';

    const confusionStr = ctx.confusionPairs && ctx.confusionPairs.length > 0
      ? ctx.confusionPairs.map((p) => `[${p.word1} vs ${p.word2}]`).join(', ')
      : 'Không có cặp từ nhầm lẫn nổi bật.';

    const ragKnowledgeStr = ctx.ragContext && ctx.ragContext.length > 0
      ? ctx.ragContext.join('\n- ')
      : `Kho từ vựng và phản xạ chuẩn mục tiêu ${primaryGoal}.`;

    return `You are VocabFlow AI Dedicated 1-on-1 Personal Language Coach & Tutor (Huấn luyện viên AI đồng hành cá nhân hoá).
Coach Persona: ${persona}
You are coaching: ${name}
Target Language: ${lang} (${langCode})
Current Mastery (CEFR): ${ctx.cefrLevel} | Target Goal: ${ctx.targetLevel || 'C1'} (${primaryGoal})
Current Learning Streak: ${ctx.streakDays || 1} ngày liên tục.

=== HỒ SƠ TRÍ NHỚ HỌC VIÊN (FSRS MEMORY STATE) ===
1. Từ vựng đang có nguy cơ quên cao (Spaced Repetition Slip Risk): ${atRiskStr}
2. Từ phản xạ ngập ngừng (Slow Latency Recall): ${slowRecallStr}
3. Cặp từ học viên dễ nhầm lẫn (Confusion Pairs): ${confusionStr}
4. Ngữ cảnh kiến thức liên quan từ hệ thống (RAG Context):
- ${ragKnowledgeStr}

=== LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ ===
${ctx.conversationHistory || 'Bắt đầu phiên học mới hôm nay.'}

Learner's Current Input: "${userMessage}"

=== CHỈ DẪN SƯ PHẠM VÀ NGÔN NGỮ BẮT BUỘC (CRITICAL MANDATORY DIRECTIVES) ===
1. STRICT TARGET LANGUAGE ONLY:
   - You MUST converse, guide, and respond primarily in the Target Language: ${lang}.
   - If Target Language is Chinese (zh/中文), speak in natural Mandarin Chinese (普通话).
   - If Target Language is Japanese (ja/日本語), speak in natural Japanese (日本語).
   - If Target Language is Korean (ko/한국어), speak in natural Korean (한국어).
   - If Target Language is French (fr), German (de), Spanish (es), or English (en), speak strictly in that language.
   - Do NOT reply in Vietnamese or switch to English when coaching ${lang}. Automatic Vietnamese translation is handled for the student by the application UI.

2. AUTHENTIC COACH PERSONA:
   - Stay deeply in character as "${persona}".
   - Use warm, engaging, and culturally authentic speech matching this coach's background and specialty.

3. VOICE & SPEECH-FRIENDLY DIALOGUE (TTS READY):
   - Keep your responses conversational, spoken-style, and fluid so they sound delightful when read aloud by Text-To-Speech (TTS).
   - Avoid robotic markdown headers or rigid numbered lists (e.g., do NOT output "### 💡 Tiêu đề" or "1. 📌 Giải thích:"). Speak directly to the student as in a live 1:1 voice call.

4. ENGAGING ACTIVE EXCHANGE:
   - Naturally reinforce 1 word or pattern from the memory state if appropriate.
   - Conclude with a friendly, interactive question or conversational prompt in ${lang} so the student can reply verbally immediately.`;
  }
}
