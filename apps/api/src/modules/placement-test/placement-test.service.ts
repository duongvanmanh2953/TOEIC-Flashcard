import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CefrLevel } from '@prisma/client';

export interface TestAnswerItem {
  questionId: string;
  cefrLevel: CefrLevel;
  selectedOption: string;
  correctAnswer: string;
  category: string;
}

export interface PlacementQuestion {
  id: string;
  cefrLevel: CefrLevel;
  category: string;
  question: string;
  options: string[];
  correctAnswer: string;
  languageCode: string;
}

const MULTILINGUAL_PLACEMENT_QUESTIONS: Record<string, PlacementQuestion[]> = {
  // ==========================================
  // 1. CHINESE (ZH) - HSK 1 -> HSK 5
  // ==========================================
  zh: [
    {
      id: 'pt-zh-1',
      cefrLevel: CefrLevel.A2,
      languageCode: 'zh',
      category: 'Từ Vựng Giao Tiếp Cơ Bản',
      question: 'Chọn nghĩa đúng của từ "你好" (nǐ hǎo):',
      options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Không có chi'],
      correctAnswer: 'Xin chào',
    },
    {
      id: 'pt-zh-2',
      cefrLevel: CefrLevel.A2,
      languageCode: 'zh',
      category: 'Cấu Trúc Câu HSK 1',
      question: 'Điền từ thích hợp vào chỗ trống: "我____中国人。" (wǒ ____ zhōng guó rén)',
      options: ['是', '有', '在', '去'],
      correctAnswer: '是',
    },
    {
      id: 'pt-zh-3',
      cefrLevel: CefrLevel.B1,
      languageCode: 'zh',
      category: 'Từ Vựng HSK 2',
      question: 'Từ "高兴" (gāoxìng) có nghĩa là gì?',
      options: ['Vui vẻ, hạnh phúc', 'Buồn bã, mệt mỏi', 'Tức giận', 'Lo lắng'],
      correctAnswer: 'Vui vẻ, hạnh phúc',
    },
    {
      id: 'pt-zh-4',
      cefrLevel: CefrLevel.B1,
      languageCode: 'zh',
      category: 'Mẫu Câu Hỏi HSK 2',
      question: 'Câu hỏi "现在几点？" (xiàn zài jǐ diǎn?) dùng để hỏi điều gì?',
      options: ['Bây giờ là mấy giờ?', 'Hôm nay là thứ mấy?', 'Bao nhiêu tiền?', 'Bạn đi đâu đấy?'],
      correctAnswer: 'Bây giờ là mấy giờ?',
    },
    {
      id: 'pt-zh-5',
      cefrLevel: CefrLevel.B1,
      languageCode: 'zh',
      category: 'Động Từ HSK 3',
      question: 'Từ "打算" (dǎ suàn) mang ý nghĩa gì?',
      options: ['Dự định, kế hoạch', 'Hủy bỏ, từ chối', 'Đồng ý, chấp nhận', 'Hoàn thành'],
      correctAnswer: 'Dự định, kế hoạch',
    },
    {
      id: 'pt-zh-6',
      cefrLevel: CefrLevel.B2,
      languageCode: 'zh',
      category: 'Ngữ Cảnh HSK 3-4',
      question: 'Điền từ: "这个问题很复杂，我们需要仔细____。" (zhè ge wèn tí hěn fù zá, wǒ men xū yào zǐ xì ____)',
      options: ['考虑', '跑步', '睡觉', '唱歌'],
      correctAnswer: '考虑',
    },
    {
      id: 'pt-zh-7',
      cefrLevel: CefrLevel.B2,
      languageCode: 'zh',
      category: 'Phẩm Chất & Tính Cách HSK 4',
      question: 'Chọn nghĩa đúng của từ "坚持" (jiān chí):',
      options: ['Kiên trì, bền chí', 'Bỏ cuộc giữa chừng', 'Do dự không quyết', 'Thay đổi liên tục'],
      correctAnswer: 'Kiên trì, bền chí',
    },
    {
      id: 'pt-zh-8',
      cefrLevel: CefrLevel.B2,
      languageCode: 'zh',
      category: 'Từ Đồng Nghĩa HSK 4',
      question: 'Chọn từ đồng nghĩa với "突然" (tū rán - đột nhiên):',
      options: ['忽然', '必然', '自然', '当然'],
      correctAnswer: '忽然',
    },
    {
      id: 'pt-zh-9',
      cefrLevel: CefrLevel.C1,
      languageCode: 'zh',
      category: 'Thành Ngữ HSK 5',
      question: 'Nghĩa của thành ngữ "津津有味" (jīn jīn yǒu wèi) là gì?',
      options: ['Say sưa, thích thú / ăn ngon miệng', 'Nhạt nhẽo, vô vị', 'Cay đắng, vất vả', 'Nguy hiểm rình rập'],
      correctAnswer: 'Say sưa, thích thú / ăn ngon miệng',
    },
    {
      id: 'pt-zh-10',
      cefrLevel: CefrLevel.C1,
      languageCode: 'zh',
      category: 'Văn Phòng HSK 5',
      question: 'Điền từ: "政府正在采取有效____来促进经济发展。"',
      options: ['措施', '借口', '游戏', '脾气'],
      correctAnswer: '措施',
    },
  ],

  // ==========================================
  // 2. JAPANESE (JA) - JLPT N5 -> JLPT N1
  // ==========================================
  ja: [
    {
      id: 'pt-ja-1',
      cefrLevel: CefrLevel.A2,
      languageCode: 'ja',
      category: 'Chào Hỏi JLPT N5',
      question: 'Chọn nghĩa chính xác của câu chào "こんにちは" (Konnichiwa):',
      options: ['Xin chào (ban ngày)', 'Chúc ngủ ngon', 'Cảm ơn nhiều', 'Tạm biệt nhé'],
      correctAnswer: 'Xin chào (ban ngày)',
    },
    {
      id: 'pt-ja-2',
      cefrLevel: CefrLevel.A2,
      languageCode: 'ja',
      category: 'Trợ Từ N5',
      question: 'Điền trợ từ thích hợp: "わたし____ ベトナム人です。"',
      options: ['は', 'が', 'を', 'に'],
      correctAnswer: 'は',
    },
    {
      id: 'pt-ja-3',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ja',
      category: 'Hán Tự & Từ Vựng N4',
      question: 'Từ "準備" (じゅんび - junbi) có nghĩa là gì?',
      options: ['Chuẩn bị', 'Xuất phát', 'Nghỉ ngơi', 'Hủy bỏ'],
      correctAnswer: 'Chuẩn bị',
    },
    {
      id: 'pt-ja-4',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ja',
      category: 'Động Từ N4',
      question: 'Hoàn thành câu: "電車に____ 会社へ行きます。"',
      options: ['乗って', '降りて', '走って', '寝て'],
      correctAnswer: '乗って',
    },
    {
      id: 'pt-ja-5',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ja',
      category: 'Từ Vựng N3',
      question: 'Từ "約束" (やくそく - yakusoku) mang ý nghĩa gì?',
      options: ['Lời hứa / Cuộc hẹn', 'Lời xin lỗi', 'Sự khen ngợi', 'Kế hoạch học tập'],
      correctAnswer: 'Lời hứa / Cuộc hẹn',
    },
    {
      id: 'pt-ja-6',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ja',
      category: 'Ngữ Pháp N3',
      question: 'Chọn cấu trúc thích hợp: "雨が降る____、傘を持っていきます。"',
      options: ['かもしれないので', 'はずがないので', 'わけではないので', 'ことになっているので'],
      correctAnswer: 'かもしれないので',
    },
    {
      id: 'pt-ja-7',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ja',
      category: 'Công Sở N2',
      question: 'Nghĩa chính xác của từ "改善" (かいぜん - kaizen) là:',
      options: ['Cải tiến, cải thiện cho tốt hơn', 'Lùi lại phía sau', 'Đình trệ sản xuất', 'Phá hủy cấu trúc cũ'],
      correctAnswer: 'Cải tiến, cải thiện cho tốt hơn',
    },
    {
      id: 'pt-ja-8',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ja',
      category: 'Ngữ Cảnh Kinh Doanh N2',
      question: 'Điền từ thích hợp: "原材料の高騰により、業績が急速に____ している。"',
      options: ['悪化', '安定', '回復', '満足'],
      correctAnswer: '悪化',
    },
    {
      id: 'pt-ja-9',
      cefrLevel: CefrLevel.C1,
      languageCode: 'ja',
      category: 'Hán Tự Cao Cấp N1',
      question: 'Nghĩa của từ "把握" (はあく - haaku) là gì?',
      options: ['Nắm bắt rõ ràng, thấu suốt thực trạng', 'Buông bỏ hoàn toàn', 'Bắt chước người khác', 'Thỏa hiệp tạm thời'],
      correctAnswer: 'Nắm bắt rõ ràng, thấu suốt thực trạng',
    },
    {
      id: 'pt-ja-10',
      cefrLevel: CefrLevel.C1,
      languageCode: 'ja',
      category: 'Chính Luận N1',
      question: 'Hoàn thành câu: "この改革案は広く国民の____ を得ている。"',
      options: ['支持', '迷惑', '拒絶', '遠慮'],
      correctAnswer: '支持',
    },
  ],

  // ==========================================
  // 3. KOREAN (KO) - TOPIK I -> TOPIK II
  // ==========================================
  ko: [
    {
      id: 'pt-ko-1',
      cefrLevel: CefrLevel.A2,
      languageCode: 'ko',
      category: 'Chào Hỏi Cơ Bản',
      question: 'Nghĩa của câu "안녕하세요" (annyeonghaseyo) là gì?',
      options: ['Xin chào', 'Cảm ơn', 'Tạm biệt', 'Xin lỗi'],
      correctAnswer: 'Xin chào',
    },
    {
      id: 'pt-ko-2',
      cefrLevel: CefrLevel.A2,
      languageCode: 'ko',
      category: 'Đuôi Câu Trang Trọng',
      question: 'Điền đuôi câu: "저는 학생____."',
      options: ['입니다', '합니다', '봅니다', '갑니다'],
      correctAnswer: '입니다',
    },
    {
      id: 'pt-ko-3',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ko',
      category: 'Từ Vựng Hằng Ngày',
      question: 'Từ "약속" (yaksok) trong tiếng Hàn nghĩa là gì?',
      options: ['Lời hứa / Cuộc hẹn', 'Học tập', 'Du lịch', 'Thời tiết'],
      correctAnswer: 'Lời hứa / Cuộc hẹn',
    },
    {
      id: 'pt-ko-4',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ko',
      category: 'Động Từ TOPIK I',
      question: 'Động từ "결정하다" (gyeoljeonghada) mang ý nghĩa gì?',
      options: ['Quyết định', 'Bắt đầu', 'Khen ngợi', 'Từ chối'],
      correctAnswer: 'Quyết định',
    },
    {
      id: 'pt-ko-5',
      cefrLevel: CefrLevel.B1,
      languageCode: 'ko',
      category: 'Từ Vựng TOPIK II',
      question: 'Từ "성공하다" (seonggonghada) có nghĩa là gì?',
      options: ['Thành công', 'Thất bại', 'Vắng mặt', 'Trì hoãn'],
      correctAnswer: 'Thành công',
    },
    {
      id: 'pt-ko-6',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ko',
      category: 'Danh Từ Trừu Tượng',
      question: 'Từ "경험" (gyeongheom) nghĩa là gì?',
      options: ['Kinh nghiệm, trải nghiệm', 'Mục tiêu tương lai', 'Kỳ nghỉ', 'Khó khăn'],
      correctAnswer: 'Kinh nghiệm, trải nghiệm',
    },
    {
      id: 'pt-ko-7',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ko',
      category: 'Ngữ Pháp Liên Kết',
      question: 'Chọn biểu hiện phù hợp: "비가 오지만 날씨가____."',
      options: ['따뜻합니다', '추웠습니다', '어둡습니다', '멉니다'],
      correctAnswer: '따뜻합니다',
    },
    {
      id: 'pt-ko-8',
      cefrLevel: CefrLevel.B2,
      languageCode: 'ko',
      category: 'Thái Độ & Ý Chí',
      question: 'Nghĩa của cụm từ "노력하다" (noryeokhada) là gì?',
      options: ['Nỗ lực, cố gắng', 'Bỏ cuộc', 'Thư giãn', 'Quên lãng'],
      correctAnswer: 'Nỗ lực, cố gắng',
    },
    {
      id: 'pt-ko-9',
      cefrLevel: CefrLevel.C1,
      languageCode: 'ko',
      category: 'Phó Từ Nâng Cao TOPIK II',
      question: 'Từ "신중하게" (sinjunghage) có nghĩa là gì?',
      options: ['Một cách thận trọng, kỹ lưỡng', 'Một cách vội vã', 'Vô ý thức', 'Hời hợt'],
      correctAnswer: 'Một cách thận trọng, kỹ lưỡng',
    },
    {
      id: 'pt-ko-10',
      cefrLevel: CefrLevel.C1,
      languageCode: 'ko',
      category: 'Công Sở & Xã Hội',
      question: 'Chọn từ điền chỗ trống: "문제를 해결하기 위해 적절한 ____을 마련해야 한다."',
      options: ['해결책', '변명', '방해', '실수'],
      correctAnswer: '해결책',
    },
  ],

  // ==========================================
  // 4. ENGLISH (EN) - Standard CEFR
  // ==========================================
  en: [
    {
      id: 'pt-en-1',
      cefrLevel: CefrLevel.A2,
      languageCode: 'en',
      category: 'Basic Vocabulary',
      question: 'Choose the correct meaning of "salary":',
      options: ['Tiền lương nhận định kỳ', 'Tiền thưởng dự án', 'Giảm giá mua sắm', 'Hóa đơn tiền điện'],
      correctAnswer: 'Tiền lương nhận định kỳ',
    },
    {
      id: 'pt-en-2',
      cefrLevel: CefrLevel.A2,
      languageCode: 'en',
      category: 'Everyday Words',
      question: 'Complete: "The company plans to ______ new staff next month."',
      options: ['hire', 'borrow', 'lend', 'spend'],
      correctAnswer: 'hire',
    },
    {
      id: 'pt-en-3',
      cefrLevel: CefrLevel.B1,
      languageCode: 'en',
      category: 'Workplace Collocations',
      question: 'Which word best collocates with "decision"?',
      options: ['make', 'do', 'create', 'build'],
      correctAnswer: 'make',
    },
    {
      id: 'pt-en-4',
      cefrLevel: CefrLevel.B1,
      languageCode: 'en',
      category: 'Contextual Usage',
      question: 'What does "benefit" mean in a job package?',
      options: ['Lợi ích/chế độ đãi ngộ', 'Hình phạt', 'Thời gian làm thêm', 'Hợp đồng lao động'],
      correctAnswer: 'Lợi ích/chế độ đãi ngộ',
    },
    {
      id: 'pt-en-5',
      cefrLevel: CefrLevel.B1,
      languageCode: 'en',
      category: 'Phrasal Verbs',
      question: 'What is the meaning of "call off"?',
      options: ['Hủy bỏ', 'Gọi điện', 'Tiếp tục', 'Trì hoãn'],
      correctAnswer: 'Hủy bỏ',
    },
    {
      id: 'pt-en-6',
      cefrLevel: CefrLevel.B2,
      languageCode: 'en',
      category: 'Business English',
      question: 'Select the synonym for "negotiate":',
      options: ['bargain / discuss terms', 'demand fiercely', 'give up easily', 'sign quickly'],
      correctAnswer: 'bargain / discuss terms',
    },
    {
      id: 'pt-en-7',
      cefrLevel: CefrLevel.B2,
      languageCode: 'en',
      category: 'Academic & Professional',
      question: 'Complete: "Prices are likely to ______ due to seasonal market demand."',
      options: ['fluctuate', 'stagnate', 'demolish', 'hesitate'],
      correctAnswer: 'fluctuate',
    },
    {
      id: 'pt-en-8',
      cefrLevel: CefrLevel.B2,
      languageCode: 'en',
      category: 'Confusing Words',
      question: 'Choose the correct word: "The tax changes will severely ______ small enterprises."',
      options: ['affect', 'effect', 'affection', 'effective'],
      correctAnswer: 'affect',
    },
    {
      id: 'pt-en-9',
      cefrLevel: CefrLevel.C1,
      languageCode: 'en',
      category: 'Advanced Collocations',
      question: 'What is the meaning of "apprehensive"?',
      options: ['Anxious or fearful about the future', 'Comprehensive and thorough', 'Extremely confident', 'Quick to misunderstand'],
      correctAnswer: 'Anxious or fearful about the future',
    },
    {
      id: 'pt-en-10',
      cefrLevel: CefrLevel.C1,
      languageCode: 'en',
      category: 'High-Level Professional',
      question: 'Complete: "The contract is ______ strict confidentiality requirements."',
      options: ['subject to', 'relying of', 'object at', 'attached on'],
      correctAnswer: 'subject to',
    },
  ],
};

@Injectable()
export class PlacementTestService {
  constructor(private prisma: PrismaService) {}

  getPlacementQuestions(languageId?: string): PlacementQuestion[] {
    const lang = (languageId || 'en').toLowerCase().trim();
    if (MULTILINGUAL_PLACEMENT_QUESTIONS[lang]) {
      return MULTILINGUAL_PLACEMENT_QUESTIONS[lang];
    }
    return MULTILINGUAL_PLACEMENT_QUESTIONS.en;
  }

  async evaluatePlacementTest(
    userId: string,
    answers: TestAnswerItem[],
    languageId?: string,
  ) {
    const lang = (languageId || 'en').toLowerCase().trim();
    let scoreA2 = 0, totalA2 = 0;
    let scoreB1 = 0, totalB1 = 0;
    let scoreB2 = 0, totalB2 = 0;
    let scoreC1 = 0, totalC1 = 0;

    const categoryStats: Record<string, { correct: number; total: number }> = {};

    for (const a of answers) {
      const isCorrect = a.selectedOption === a.correctAnswer;
      if (!categoryStats[a.category]) {
        categoryStats[a.category] = { correct: 0, total: 0 };
      }
      categoryStats[a.category].total += 1;
      if (isCorrect) categoryStats[a.category].correct += 1;

      if (a.cefrLevel === CefrLevel.A2) {
        totalA2++;
        if (isCorrect) scoreA2++;
      } else if (a.cefrLevel === CefrLevel.B1) {
        totalB1++;
        if (isCorrect) scoreB1++;
      } else if (a.cefrLevel === CefrLevel.B2) {
        totalB2++;
        if (isCorrect) scoreB2++;
      } else if (a.cefrLevel === CefrLevel.C1) {
        totalC1++;
        if (isCorrect) scoreC1++;
      }
    }

    // Determine estimated CEFR
    let estimatedLevel: CefrLevel = CefrLevel.A2;
    let estimatedVocabSize = 1800;

    if (scoreC1 >= 1 && scoreB2 >= 2 && scoreB1 >= 2) {
      estimatedLevel = CefrLevel.C1;
      estimatedVocabSize = 6500;
    } else if (scoreB2 >= 2 && scoreB1 >= 2) {
      estimatedLevel = CefrLevel.B2;
      estimatedVocabSize = 4800;
    } else if (scoreB1 >= 2) {
      estimatedLevel = CefrLevel.B1;
      estimatedVocabSize = 3200;
    }

    // Identify strong & weak areas
    const strongAreas: string[] = [];
    const weakAreas: string[] = [];

    for (const [cat, data] of Object.entries(categoryStats)) {
      const rate = data.total > 0 ? data.correct / data.total : 0;
      if (rate >= 0.7) strongAreas.push(cat);
      else weakAreas.push(cat);
    }

    // Update UserProfile
    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        englishLevel: estimatedLevel,
        targetLevel: estimatedLevel === CefrLevel.C1 ? CefrLevel.C2 : CefrLevel.C1,
        dailyGoal: estimatedLevel === CefrLevel.B2 ? 25 : 20,
      },
      create: {
        userId,
        englishLevel: estimatedLevel,
        targetLevel: CefrLevel.C1,
        dailyGoal: 20,
      },
    });

    const langNameMap: Record<string, string> = {
      zh: 'Tiếng Trung (HSK)',
      ja: 'Tiếng Nhật (JLPT)',
      ko: 'Tiếng Hàn (TOPIK)',
      en: 'Tiếng Anh (CEFR/TOEIC)',
      de: 'Tiếng Đức (Goethe)',
      fr: 'Tiếng Pháp (DELF)',
      es: 'Tiếng Tây Ban Nha (DELE)',
      vi: 'Tiếng Việt',
    };

    const targetLangDisplay = langNameMap[lang] || lang.toUpperCase();

    return {
      languageId: lang,
      targetLanguage: targetLangDisplay,
      estimatedLevel,
      estimatedVocabSize,
      strongAreas: strongAreas.length ? strongAreas : ['Từ vựng cơ bản'],
      weakAreas: weakAreas.length ? weakAreas : ['Cấu trúc nâng cao', 'Văn cảnh thực tế'],
      recommendedDailyGoal: estimatedLevel === CefrLevel.B2 ? 25 : 20,
      learningPathSummary: `Dựa trên bài thi phân lớp ${targetLangDisplay}, lộ trình được tinh chỉnh cho trình độ ${estimatedLevel}. Hệ thống ôn tập sẽ ưu tiên các điểm cần củng cố: ${weakAreas.join(', ') || 'từ vựng thực chiến'}.`,
    };
  }
}
