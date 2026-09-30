import { PrismaClient, GameModeType, CefrLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function seedGames() {
  console.log('🎮 Seeding Realtime English Game Configs & Question Bank...');

  // 1. Seed Game Configs (Schedules & Modes)
  const gameConfigs = [
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      title: 'Translation Rush',
      description: 'Dịch nhanh song ngữ Anh - Việt & Việt - Anh với AI chấm điểm độ chính xác, ngữ nghĩa và phản xạ thần tốc.',
      scheduleTime: '20:00',
      durationMinutes: 15,
      questionCount: 15,
      difficulty: 'INTERMEDIATE',
      scoreMultiplier: 1.0,
      isActive: true,
    },
    {
      gameMode: GameModeType.WORD_BLITZ,
      title: 'Word Blitz',
      description: 'Phản xạ cấp tốc tìm từ đồng nghĩa (synonym), trái nghĩa (antonym) hoặc định nghĩa chuẩn trong 15 giây.',
      scheduleTime: '20:20',
      durationMinutes: 15,
      questionCount: 15,
      difficulty: 'INTERMEDIATE',
      scoreMultiplier: 1.0,
      isActive: true,
    },
    {
      gameMode: GameModeType.SENTENCE_SPRINT,
      title: 'Sentence Sprint',
      description: 'Sáng tạo câu hoàn chỉnh từ từ khóa TOEIC cho trước. AI đánh giá ngữ pháp, độ tự nhiên và sáng tạo.',
      scheduleTime: '20:40',
      durationMinutes: 15,
      questionCount: 12,
      difficulty: 'ADVANCED',
      scoreMultiplier: 1.0,
      isActive: true,
    },
    {
      gameMode: GameModeType.MISSING_WORD,
      title: 'Missing Word Cloze',
      description: 'Điền từ khuyết chính xác vào chỗ trống trong câu ngữ cảnh doanh nghiệp & TOEIC.',
      scheduleTime: '21:00',
      durationMinutes: 15,
      questionCount: 15,
      difficulty: 'INTERMEDIATE',
      scoreMultiplier: 1.0,
      isActive: true,
    },
    {
      gameMode: GameModeType.LISTENING_RUSH,
      title: 'Listening Rush',
      description: 'Luyện tai bắt âm: Nghe đoạn audio chuẩn và gõ lại chuẩn xác từng từ vựng.',
      scheduleTime: '21:20',
      durationMinutes: 15,
      questionCount: 10,
      difficulty: 'ADVANCED',
      scoreMultiplier: 1.2,
      isActive: true,
    },
    {
      gameMode: GameModeType.SYNONYM_BATTLE,
      title: 'Synonym Battle',
      description: 'Đấu trí từ đồng nghĩa: Nhập càng nhiều từ tương đương nghĩa càng nhận điểm cao.',
      scheduleTime: '21:40',
      durationMinutes: 15,
      questionCount: 15,
      difficulty: 'ALL',
      scoreMultiplier: 1.0,
      isActive: true,
    },
    {
      gameMode: GameModeType.FIX_SENTENCE,
      title: 'Fix The Sentence',
      description: 'Phát hiện và sửa lỗi sai ngữ pháp, chính tả trong câu văn công sở & giao tiếp.',
      scheduleTime: '21:45',
      durationMinutes: 15,
      questionCount: 12,
      difficulty: 'INTERMEDIATE',
      scoreMultiplier: 1.0,
      isActive: true,
    },
  ];

  for (const cfg of gameConfigs) {
    await prisma.gameConfig.upsert({
      where: { gameMode: cfg.gameMode },
      update: cfg,
      create: cfg,
    });
  }
  console.log(`✅ Upserted ${gameConfigs.length} Game Configs`);

  // 2. Seed Rich Question Bank
  const questions: Array<{
    gameMode: GameModeType;
    prompt: string;
    direction: string;
    correctAnswer: string;
    acceptedAnswers: string[];
    explanation: string;
    difficulty: number;
    cefrLevel: CefrLevel;
    category: string;
  }> = [
    // Translation Rush
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'meet the deadline',
      direction: 'EN_VI',
      correctAnswer: 'hoàn thành đúng hạn',
      acceptedAnswers: ['kịp hạn', 'đúng hạn', 'hoàn thành kịp tiến độ', 'kịp thời hạn', 'đúng thời hạn'],
      explanation: 'Meet the deadline là cụm từ TOEIC phổ biến chỉ việc hoàn thành công việc trước thời hạn quy định.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Business',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'triển khai dự án',
      direction: 'VI_EN',
      correctAnswer: 'implement the project',
      acceptedAnswers: ['deploy the project', 'execute the project', 'carry out the project', 'roll out the project'],
      explanation: 'Implement hoặc deploy đều mang nghĩa triển khai / thực thi kế hoạch dự án.',
      difficulty: 3.5,
      cefrLevel: CefrLevel.B2,
      category: 'Business & IT',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'Tôi sẽ gửi báo cáo trước 5 giờ.',
      direction: 'SENTENCE',
      correctAnswer: 'I will send the report before 5 PM.',
      acceptedAnswers: ["I'll send the report before 5 PM.", 'I will submit the report before 5 PM.', "I'll submit the report before 5 PM.", 'I will send the report prior to 5 PM.', 'I will submit the report prior to 5 PM.'],
      explanation: 'Các biến thể viết tắt "I\'ll" và động từ "submit/send" đều được công nhận chính xác.',
      difficulty: 3.2,
      cefrLevel: CefrLevel.B1,
      category: 'Workplace',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'negotiate a contract',
      direction: 'EN_VI',
      correctAnswer: 'đàm phán hợp đồng',
      acceptedAnswers: ['thương lượng hợp đồng', 'thương thảo hợp đồng'],
      explanation: 'Negotiate mang nghĩa đàm phán hoặc thương lượng các điều khoản hợp đồng.',
      difficulty: 3.8,
      cefrLevel: CefrLevel.B2,
      category: 'Business Law',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'tăng doanh thu',
      direction: 'VI_EN',
      correctAnswer: 'increase revenue',
      acceptedAnswers: ['boost revenue', 'raise revenue', 'increase sales', 'boost sales'],
      explanation: 'Increase/boost revenue là mục tiêu tài chính cốt lõi trong các bài thi TOEIC Part 7.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Finance',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'Cuộc họp đã bị hoãn lại.',
      direction: 'SENTENCE',
      correctAnswer: 'The meeting has been postponed.',
      acceptedAnswers: ['The meeting was postponed.', 'The meeting has been delayed.', 'The meeting was delayed.', 'The meeting is postponed.'],
      explanation: 'Postpone và delay đều là từ vựng trọng tâm TOEIC biểu thị sự hoãn lại.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Office',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'in charge of',
      direction: 'EN_VI',
      correctAnswer: 'chịu trách nhiệm',
      acceptedAnswers: ['phụ trách', 'đảm nhận', 'chịu trách nhiệm về'],
      explanation: 'To be in charge of something đồng nghĩa với to be responsible for.',
      difficulty: 2.5,
      cefrLevel: CefrLevel.A2,
      category: 'General Business',
    },
    {
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: 'giảm chi phí hoạt động',
      direction: 'VI_EN',
      correctAnswer: 'reduce operating costs',
      acceptedAnswers: ['cut operating costs', 'reduce operational costs', 'cut operational costs', 'lower operating costs'],
      explanation: 'Reduce/cut/lower operating costs: cắt giảm chi phí vận hành.',
      difficulty: 4.0,
      cefrLevel: CefrLevel.B2,
      category: 'Finance',
    },

    // Word Blitz
    {
      gameMode: GameModeType.WORD_BLITZ,
      prompt: 'IMPORTANT',
      direction: 'SYNONYM',
      correctAnswer: 'crucial',
      acceptedAnswers: ['essential', 'vital', 'significant', 'critical', 'imperative'],
      explanation: 'Từ đồng nghĩa mang tính nhấn mạnh mức độ quan trọng.',
      difficulty: 2.8,
      cefrLevel: CefrLevel.B1,
      category: 'Vocabulary',
    },
    {
      gameMode: GameModeType.WORD_BLITZ,
      prompt: 'RAPID',
      direction: 'SYNONYM',
      correctAnswer: 'fast',
      acceptedAnswers: ['quick', 'speedy', 'swift', 'brisk'],
      explanation: 'Các tính từ miêu tả tốc độ nhanh.',
      difficulty: 2.2,
      cefrLevel: CefrLevel.A2,
      category: 'Vocabulary',
    },
    {
      gameMode: GameModeType.WORD_BLITZ,
      prompt: 'ABUNDANT',
      direction: 'ANTONYM',
      correctAnswer: 'scarce',
      acceptedAnswers: ['rare', 'insufficient', 'sparse', 'lacking'],
      explanation: 'Abundant (dồi dào) trái nghĩa với scarce (khan hiếm).',
      difficulty: 4.2,
      cefrLevel: CefrLevel.C1,
      category: 'Vocabulary',
    },
    {
      gameMode: GameModeType.WORD_BLITZ,
      prompt: 'HESITATE',
      direction: 'MEANING',
      correctAnswer: 'do dự',
      acceptedAnswers: ['ngập ngừng', 'chần chừ', 'lưỡng lự'],
      explanation: 'Hesitate nghĩa là do dự, chần chừ đưa ra quyết định.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Vocabulary',
    },
    {
      gameMode: GameModeType.WORD_BLITZ,
      prompt: 'SUBSTANTIAL',
      direction: 'SYNONYM',
      correctAnswer: 'significant',
      acceptedAnswers: ['considerable', 'large', 'sizeable', 'major'],
      explanation: 'Substantial có nghĩa là đáng kể, to lớn.',
      difficulty: 4.0,
      cefrLevel: CefrLevel.B2,
      category: 'Business Analysis',
    },

    // Sentence Sprint
    {
      gameMode: GameModeType.SENTENCE_SPRINT,
      prompt: 'deadline',
      direction: 'SENTENCE',
      correctAnswer: 'We must finish this before the deadline.',
      acceptedAnswers: ['I need to meet the deadline.', 'The deadline is tomorrow.', 'We have a strict deadline.', 'Please submit the report by the deadline.'],
      explanation: 'Yêu cầu tạo câu có chứa từ "deadline" chuẩn ngữ pháp.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Production',
    },
    {
      gameMode: GameModeType.SENTENCE_SPRINT,
      prompt: 'collaborate',
      direction: 'SENTENCE',
      correctAnswer: 'Our team will collaborate on this project.',
      acceptedAnswers: ['We need to collaborate with each other.', 'They collaborate effectively.', 'We should collaborate to achieve better results.'],
      explanation: 'Sử dụng động từ collaborate (hợp tác, cộng tác).',
      difficulty: 3.5,
      cefrLevel: CefrLevel.B2,
      category: 'Production',
    },
    {
      gameMode: GameModeType.SENTENCE_SPRINT,
      prompt: 'schedule',
      direction: 'SENTENCE',
      correctAnswer: 'Please schedule the meeting for tomorrow.',
      acceptedAnswers: ['The schedule is very tight.', 'I will check my schedule.', 'We need to reschedule the appointment.'],
      explanation: 'Từ vựng lịch trình / lên lịch cuộc hẹn.',
      difficulty: 2.8,
      cefrLevel: CefrLevel.B1,
      category: 'Production',
    },

    // Missing Word
    {
      gameMode: GameModeType.MISSING_WORD,
      prompt: 'I have been working here _____ 2024.',
      direction: 'FILL_BLANK',
      correctAnswer: 'since',
      acceptedAnswers: ['ever since'],
      explanation: 'Thì hiện tại hoàn thành tiếp diễn đi với mốc thời gian dùng "since".',
      difficulty: 2.0,
      cefrLevel: CefrLevel.A2,
      category: 'Grammar',
    },
    {
      gameMode: GameModeType.MISSING_WORD,
      prompt: 'He is responsible _____ managing the marketing department.',
      direction: 'FILL_BLANK',
      correctAnswer: 'for',
      acceptedAnswers: [],
      explanation: 'Cấu trúc cố định: to be responsible for + V-ing/Noun.',
      difficulty: 2.5,
      cefrLevel: CefrLevel.B1,
      category: 'Prepositions',
    },
    {
      gameMode: GameModeType.MISSING_WORD,
      prompt: 'In spite _____ the heavy rain, all candidates arrived on time.',
      direction: 'FILL_BLANK',
      correctAnswer: 'of',
      acceptedAnswers: [],
      explanation: 'In spite of = Despite (Mặc dù).',
      difficulty: 2.8,
      cefrLevel: CefrLevel.B1,
      category: 'Grammar',
    },
    {
      gameMode: GameModeType.MISSING_WORD,
      prompt: 'We look forward _____ hearing from your company soon.',
      direction: 'FILL_BLANK',
      correctAnswer: 'to',
      acceptedAnswers: [],
      explanation: 'Cấu trúc: look forward to + V-ing.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Email Business',
    },

    // Fix The Sentence
    {
      gameMode: GameModeType.FIX_SENTENCE,
      prompt: 'She go to work yesterday.',
      direction: 'FIX',
      correctAnswer: 'She went to work yesterday.',
      acceptedAnswers: ['She had gone to work yesterday.'],
      explanation: 'Yesterday chỉ thời gian quá khứ đơn, "go" chuyển thành "went".',
      difficulty: 2.0,
      cefrLevel: CefrLevel.A2,
      category: 'Grammar',
    },
    {
      gameMode: GameModeType.FIX_SENTENCE,
      prompt: "He don't know the answer.",
      direction: 'FIX',
      correctAnswer: "He doesn't know the answer.",
      acceptedAnswers: ['He does not know the answer.'],
      explanation: 'Chủ ngữ "He" ngôi thứ 3 số ít dùng trợ động từ "doesn\'t".',
      difficulty: 2.2,
      cefrLevel: CefrLevel.A2,
      category: 'Grammar',
    },
    {
      gameMode: GameModeType.FIX_SENTENCE,
      prompt: 'I am agree with your proposal.',
      direction: 'FIX',
      correctAnswer: 'I agree with your proposal.',
      acceptedAnswers: ['I am in agreement with your proposal.'],
      explanation: '"Agree" là động từ thường, không dùng "am agree".',
      difficulty: 2.5,
      cefrLevel: CefrLevel.B1,
      category: 'Common Mistakes',
    },

    // Synonym Battle
    {
      gameMode: GameModeType.SYNONYM_BATTLE,
      prompt: 'DIFFICULT',
      direction: 'SYNONYM',
      correctAnswer: 'challenging',
      acceptedAnswers: ['hard', 'tough', 'demanding', 'arduous', 'strenuous'],
      explanation: 'Từ đồng nghĩa với difficult.',
      difficulty: 3.0,
      cefrLevel: CefrLevel.B1,
      category: 'Vocabulary',
    },
    {
      gameMode: GameModeType.SYNONYM_BATTLE,
      prompt: 'INNOVATIVE',
      direction: 'SYNONYM',
      correctAnswer: 'creative',
      acceptedAnswers: ['inventive', 'groundbreaking', 'novel', 'pioneering', 'revolutionary'],
      explanation: 'Innovative mang nghĩa sáng tạo, tiên phong, đột phá.',
      difficulty: 3.8,
      cefrLevel: CefrLevel.B2,
      category: 'Business & Tech',
    },
    {
      gameMode: GameModeType.SYNONYM_BATTLE,
      prompt: 'RELIABLE',
      direction: 'SYNONYM',
      correctAnswer: 'dependable',
      acceptedAnswers: ['trustworthy', 'consistent', 'steadfast'],
      explanation: 'Reliable mang nghĩa đáng tin cậy, nhất quán.',
      difficulty: 3.2,
      cefrLevel: CefrLevel.B1,
      category: 'Workplace',
    },
  ];

  let added = 0;
  for (const q of questions) {
    const existing = await prisma.gameQuestion.findFirst({
      where: { gameMode: q.gameMode, prompt: q.prompt },
    });
    if (!existing) {
      await prisma.gameQuestion.create({ data: q });
      added++;
    }
  }
  console.log(`✅ Seeded ${added} new Game Questions (Total pool: ${questions.length})`);
}

seedGames()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
