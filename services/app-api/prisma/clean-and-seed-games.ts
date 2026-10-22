import { PrismaClient, CefrLevel, Role, UserStatus, SubscriptionTier, GameModeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 [BƯỚC 1] Bắt đầu dọn dẹp toàn bộ mock data...');

  // 1. Delete mock operational and transient data
  const [msgs, convs, fbv, fbs, orders, ann, sessions, reviews] = await Promise.all([
    prisma.supportMessage.deleteMany({}),
    prisma.supportConversation.deleteMany({}),
    prisma.feedbackVote.deleteMany({}),
    prisma.feedback.deleteMany({}),
    prisma.paymentOrder.deleteMany({}),
    prisma.adminAnnouncement.deleteMany({}),
    prisma.studySession.deleteMany({}),
    prisma.reviewEvent.deleteMany({}),
  ]);

  console.log(`✅ Đã xóa:
  - Tin nhắn hỗ trợ: ${msgs.count}
  - Hội thoại hỗ trợ: ${convs.count}
  - Vote phản hồi: ${fbv.count}
  - Đóng góp ý kiến: ${fbs.count}
  - Đơn hàng thanh toán giả lập: ${orders.count}
  - Thông báo mẫu: ${ann.count}
  - Phiên học mẫu: ${sessions.count}
  - Sự kiện ôn tập: ${reviews.count}`);

  console.log('\n👤 [BƯỚC 2] Thiết lập 2 tài khoản cố định duy nhất (Admin & VIP Pro)...');

  // Ensure Pro Plan exists
  const proPlan = await prisma.plan.upsert({
    where: { tier: SubscriptionTier.PRO },
    update: {
      name: 'LetStuN Pro (Unlimited)',
      priceMonthly: 199000,
      aiDailyQuota: -1,
      maxCustomDecks: 999,
      unlimitedReviews: true,
      features: [
        'Không giới hạn lượt trò chuyện & giải thích cùng AI Tutor',
        'Thuật toán Spaced Repetition (SRS) không giới hạn',
        'Tạo không giới hạn kho từ cá nhân & bộ thẻ riêng',
        'Phân tích ngữ cảnh chuyên sâu CEFR A1-C2',
        'Xuất/Nhập dữ liệu từ vựng Anki, CSV, Quizlet',
        'Toàn quyền truy cập mọi tính năng Pro vĩnh viễn',
      ],
    },
    create: {
      tier: SubscriptionTier.PRO,
      name: 'LetStuN Pro (Unlimited)',
      priceMonthly: 199000,
      aiDailyQuota: -1,
      maxCustomDecks: 999,
      unlimitedReviews: true,
      features: [
        'Không giới hạn lượt trò chuyện & giải thích cùng AI Tutor',
        'Thuật toán Spaced Repetition (SRS) không giới hạn',
        'Tạo không giới hạn kho từ cá nhân & bộ thẻ riêng',
        'Phân tích ngữ cảnh chuyên sâu CEFR A1-C2',
        'Xuất/Nhập dữ liệu từ vựng Anki, CSV, Quizlet',
        'Toàn quyền truy cập mọi tính năng Pro vĩnh viễn',
      ],
    },
  });

  const lifetimeEnd = new Date('2099-12-31T23:59:59.000Z');
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminHash = await bcrypt.hash('admin123', 10);

  // ACCOUNT 1: Full VIP Pro Account
  // Email: pro@letstun.com | Password: password123
  const proUser = await prisma.user.upsert({
    where: { email: 'pro@letstun.com' },
    update: {
      role: Role.PREMIUM_USER,
      status: UserStatus.ACTIVE,
      displayName: 'LetStuN VIP Pro',
      passwordHash,
    },
    create: {
      email: 'pro@letstun.com',
      username: 'letstun_pro',
      displayName: 'LetStuN VIP Pro',
      passwordHash,
      role: Role.PREMIUM_USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.B2,
          targetLevel: CefrLevel.C2,
          dailyGoal: 50,
          weeklyGoal: 300,
          learningGoal: 'Master TOEIC 990 & C2 Fluent English with Unlimited AI Tutor',
        },
      },
      streak: {
        create: {
          currentStreak: 28,
          longestStreak: 45,
          lastStudyDate: new Date(),
        },
      },
      xp: {
        create: {
          totalXP: 9990,
          currentLevel: 15,
        },
      },
    },
  });

  await prisma.subscription.deleteMany({ where: { userId: proUser.id } });
  await prisma.subscription.create({
    data: {
      userId: proUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodEnd: lifetimeEnd,
    },
  });
  console.log('✅ Tài khoản 1: pro@letstun.com | Mật khẩu: password123 (VIP Pro Unlimited)');

  // ACCOUNT 2: System Administrator
  // Email: admin@letstun.com | Password: admin123
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@letstun.com' },
    update: {
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      displayName: 'LetStuN Administrator',
      passwordHash: adminHash,
    },
    create: {
      email: 'admin@letstun.com',
      username: 'admin',
      displayName: 'LetStuN Administrator',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.C2,
          targetLevel: CefrLevel.C2,
          dailyGoal: 50,
          weeklyGoal: 350,
          learningGoal: 'Platform Management & Curriculum Administration',
        },
      },
      streak: {
        create: {
          currentStreak: 99,
          longestStreak: 99,
          lastStudyDate: new Date(),
        },
      },
      xp: {
        create: {
          totalXP: 25000,
          currentLevel: 25,
        },
      },
    },
  });

  await prisma.subscription.deleteMany({ where: { userId: adminUser.id } });
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodEnd: lifetimeEnd,
    },
  });
  console.log('✅ Tài khoản 2: admin@letstun.com | Mật khẩu: admin123 (Super Admin)');

  // Sync legacy admin@letstun.com for compatibility
  await prisma.user.upsert({
    where: { email: 'admin@letstun.com' },
    update: {
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminHash,
    },
    create: {
      email: 'admin@letstun.com',
      username: 'admin_legacy',
      displayName: 'System Admin',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });

  // Delete all other mock users
  const allowedEmails = ['admin@letstun.com', 'pro@letstun.com', 'admin@letstun.com'];
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      email: { notIn: allowedEmails },
    },
  });
  console.log(`🗑️ Đã xóa ${deletedUsers.count} tài khoản thử nghiệm / fake.`);

  // Verify vocabularies
  const vocabCount = await prisma.vocabulary.count();
  console.log(`\n📚 [BẢO LƯU DỮ LIỆU] Tổng số từ vựng TOEIC thực tế: ${vocabCount} từ.`);

  console.log('\n🎮 [BƯỚC 3] Khởi tạo Game Configs & Sinh câu hỏi Game từ kho từ vựng...');

  // 1. Seed Game Configs
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
  console.log(`✅ Đã cập nhật ${gameConfigs.length} Game Configs.`);

  // 2. Clear old questions to avoid duplicates
  await prisma.gameQuestion.deleteMany({});

  // 3. Generate Rich Game Questions dynamically from the 613 real vocabularies
  const vocabs: any[] = await prisma.vocabulary.findMany({
    include: {
      meanings: true,
      examples: true,
      sourceRelations: {
        include: { targetWord: true },
      },
    },
    take: 300,
  });

  const generatedQuestions: any[] = [];

  for (const v of vocabs) {
    const meaningVi = v.meanings?.[0]?.meaning || v.shortDefinition || '';
    if (!meaningVi) continue;

    // A. TRANSLATION_RUSH: EN -> VI
    generatedQuestions.push({
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: v.word,
      direction: 'EN_VI',
      correctAnswer: meaningVi.toLowerCase().trim(),
      acceptedAnswers: [
        meaningVi.toLowerCase().trim(),
        meaningVi.split(',')[0]?.trim().toLowerCase(),
        meaningVi.split(';')[0]?.trim().toLowerCase(),
      ].filter(Boolean),
      explanation: `${v.word} (${v.partOfSpeech || ''}): ${v.definition}`,
      difficulty: v.difficulty,
      cefrLevel: v.cefrLevel,
      category: 'TOEIC Vocabulary',
    });

    // B. TRANSLATION_RUSH: VI -> EN
    generatedQuestions.push({
      gameMode: GameModeType.TRANSLATION_RUSH,
      prompt: meaningVi.split(',')[0]?.trim() || meaningVi,
      direction: 'VI_EN',
      correctAnswer: v.word.toLowerCase().trim(),
      acceptedAnswers: [v.word.toLowerCase().trim()],
      explanation: `Từ tiếng Anh tương ứng là "${v.word}". Phiên âm: ${v.pronunciation || ''}`,
      difficulty: v.difficulty,
      cefrLevel: v.cefrLevel,
      category: 'TOEIC Vocabulary',
    });

    // C. MISSING_WORD (Cloze): If example exists
    if (v.examples && v.examples.length > 0) {
      const ex = v.examples[0];
      const regex = new RegExp(`\\b${v.word}\\b`, 'gi');
      if (regex.test(ex.sentence)) {
        const clozePrompt = ex.sentence.replace(regex, '_____');
        generatedQuestions.push({
          gameMode: GameModeType.MISSING_WORD,
          prompt: clozePrompt,
          direction: 'FILL_BLANK',
          correctAnswer: v.word.toLowerCase(),
          acceptedAnswers: [v.word.toLowerCase()],
          explanation: `Câu hoàn chỉnh: "${ex.sentence}" (${ex.translationVi || ''})`,
          difficulty: v.difficulty,
          cefrLevel: v.cefrLevel,
          category: 'Grammar & Context',
        });
      }
    }

    // D. SENTENCE_SPRINT: Create sentence with target word
    if (generatedQuestions.length % 4 === 0) {
      generatedQuestions.push({
        gameMode: GameModeType.SENTENCE_SPRINT,
        prompt: v.word,
        direction: 'SENTENCE',
        correctAnswer: v.examples?.[0]?.sentence || `We need to ${v.word} effectively.`,
        acceptedAnswers: [
          v.examples?.[0]?.sentence,
          `Please ${v.word} as soon as possible.`,
          `They will ${v.word} tomorrow.`,
        ].filter(Boolean),
        explanation: `Yêu cầu đặt câu có chứa từ khóa "${v.word}". Nghĩa: ${meaningVi}`,
        difficulty: v.difficulty,
        cefrLevel: v.cefrLevel,
        category: 'Sentence Production',
      });
    }

    // E. WORD_BLITZ: Meaning reflection
    generatedQuestions.push({
      gameMode: GameModeType.WORD_BLITZ,
      prompt: v.word.toUpperCase(),
      direction: 'MEANING',
      correctAnswer: meaningVi.toLowerCase().trim(),
      acceptedAnswers: [
        meaningVi.toLowerCase().trim(),
        meaningVi.split(',')[0]?.trim().toLowerCase(),
      ].filter(Boolean),
      explanation: `Phiên âm: ${v.pronunciation || ''}. Nghĩa: ${meaningVi}`,
      difficulty: v.difficulty,
      cefrLevel: v.cefrLevel,
      category: 'Speed Reflection',
    });
  }

  // Insert generated questions in batches
  const batchSize = 50;
  for (let i = 0; i < generatedQuestions.length; i += batchSize) {
    const chunk = generatedQuestions.slice(i, i + batchSize);
    await prisma.gameQuestion.createMany({ data: chunk });
  }

  const finalQuestionsCount = await prisma.gameQuestion.count();
  console.log(`🎯 Đã sinh thành công ${finalQuestionsCount} câu hỏi Game từ kho từ vựng thật!`);

  console.log('\n✨ HOÀN TẤT THÀNH CÔNG!');
  console.log('----------------------------------------------------');
  console.log('📌 2 TÀI KHOẢN CỐ ĐỊNH DUY NHẤT:');
  console.log('   1. Học viên VIP Pro: pro@letstun.com | pass: password123');
  console.log('   2. Quản trị hệ thống: admin@letstun.com | pass: admin123');
  console.log(`📌 KHO TỪ VỰNG: ${vocabCount} từ TOEIC được bảo toàn nguyên vẹn.`);
  console.log(`📌 NGÂN HÀNG GAME: ${finalQuestionsCount} câu hỏi sẵn sàng cho đấu trường.`);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
