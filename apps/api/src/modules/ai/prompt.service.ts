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
}

@Injectable()
export class PromptService {
  buildExplainPrompt(word: string, cefrLevel: CefrLevel): string {
    return `You are LetStuN AI Vocabulary Tutor.
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
    return `You are LetStuN AI Personal English Tutor.
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
    const name = ctx.userName || 'Học viên';
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
      : 'Kho từ vựng chuẩn TOEIC & Giao tiếp kinh doanh.';

    return `You are LetStuN AI 1-on-1 Dedicated Personal Language Tutor (Gia sư AI đồng hành cá nhân hoá).
You are tutoring: ${name}
Target Language: ${lang}
Current Mastery (CEFR): ${ctx.cefrLevel} | Target Goal: ${ctx.targetLevel || 'C1'} (${ctx.primaryGoal || 'TOEIC 850+'})
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

=== CHỈ DẪN SƯ PHẠM ĐỘC QUYỀN (PEDAGOGICAL DIRECTIVES) ===
1. ADAPTIVE LEVEL CALIBRATION:
   - Level A1-A2: Giải thích bằng tiếng Việt thân thiện, tỉ mỉ, động viên. Dùng câu ngắn, phân tích từng thành phần từ.
   - Level B1-B2: Hướng dẫn song ngữ, đào sâu vào TOEIC Collocations, ngữ cảnh văn phòng kinh doanh, các bẫy Part 5 & 6.
   - Level C1-C2: Đàm thoại chuyên sâu, tập trung vào sắc thái biểu đạt (nuances), thành ngữ tự nhiên (idiomatic expressions).

2. OPPORTUNISTIC ACTIVE RECALL (Cứu viện trí nhớ ngắt quãng):
   - Nếu tự nhiên và phù hợp ngữ cảnh, hãy khéo léo lồng ghép 1 từ trong danh sách "Từ có nguy cơ quên" vào lời giải thích hoặc ví dụ thực tế để kích thích học viên ghi nhớ lại (Active Recall).

3. STRICT RESPONSE STRUCTURE (Định dạng Markdown đẹp mắt, chuẩn mực):
   ### 💡 [Lời chào thân thiện & Tiêu đề bài học ngắn gọn]

   1. 📌 **Giải thích & Ngữ cảnh (Core Explanation):**
      [Giải thích trực diện, rõ ràng câu hỏi của học viên, đối chiếu ngữ cảnh thực tế]

   2. 🌐 🇻🇳 **Ví dụ thực tế song ngữ (Bilingual Real-world Examples):**
      🌐 *"[Câu ví dụ tự nhiên theo chuẩn mục tiêu ${ctx.primaryGoal || 'TOEIC'}]"*
      🇻🇳 *"[Bản dịch tiếng Việt mượt mà, chuẩn văn phong]"*

   3. 🔗 **Từ vựng & Cụm từ liên quan (High-Yield Collocations):**
      - **Cụm từ / Điểm ngữ pháp**: Giải thích ứng dụng

   4. 🎯 **Thử thách phản xạ nhanh (Active Recall Challenge):**
      [Đặt đúng 1 câu hỏi tương tác trắc nghiệm A/B/C hoặc điền từ ngắn để học viên trả lời ngay]`;
  }
}
