import { PrismaClient, CefrLevel, Role, UserStatus, SubscriptionTier, SupportPriority, SupportStatus, FeedbackType, FeedbackStatus, PaymentStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function estimateCefr(word: string, partOfSpeech: string): CefrLevel {
  const len = word.length;
  if (['n,v.', 'perp.', 'conj.'].includes(partOfSpeech) || len > 10) return CefrLevel.B2;
  if (len <= 4) return CefrLevel.A2;
  if (len <= 7) return CefrLevel.B1;
  if (len <= 11) return CefrLevel.B2;
  return CefrLevel.C1;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}

async function main() {
  console.log('🌱 Starting LexiMind AI database seeding...');

  // 1. Create Achievements
  const achievements = [
    { code: 'FIRST_WORD', name: 'First Step', description: 'Learned your first vocabulary word', icon: 'ri-flag-line' },
    { code: 'STREAK_3', name: 'Consistency Kickoff', description: 'Maintained a 3-day study streak', icon: 'ri-fire-line' },
    { code: 'STREAK_7', name: 'Memory Master', description: 'Maintained a 7-day study streak', icon: 'ri-flashlight-line' },
    { code: 'VOCAB_50', name: 'Vocabulary Builder', description: 'Added and practiced 50 vocabulary words', icon: 'ri-book-read-line' },
    { code: 'VOCAB_100', name: 'Word Explorer', description: 'Practiced 100 vocabulary words', icon: 'ri-compass-3-line' },
    { code: 'MASTER_10', name: 'Permanent Recall', description: 'Reached 100% Mastery on 10 words', icon: 'ri-award-line' },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {},
      create: ach,
    });
  }
  console.log('✅ Achievements seeded.');

  // 2. Create Default Users (Demo & Admin)
  const learnerPassword = process.env.INITIAL_LEARNER_PASSWORD || 'password123';
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@leximind.ai';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'admin123';

  const passwordHash = await bcrypt.hash(learnerPassword, 10);
  const adminHash = await bcrypt.hash(adminPassword, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'learner@vocabflow.ai' },
    update: {},
    create: {
      email: 'learner@vocabflow.ai',
      username: 'learner',
      displayName: 'Alex Learner',
      passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.B1,
          targetLevel: CefrLevel.B2,
          dailyGoal: 20,
          weeklyGoal: 100,
          learningGoal: 'Master TOEIC 800+ vocabulary with high retention',
        },
      },
      streak: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
          lastStudyDate: new Date(),
        },
      },
      xp: {
        create: {
          totalXP: 1450,
          currentLevel: 4,
        },
      },
    },
  });

  // Also preserve learner@leximind.ai for backward compatibility
  await prisma.user.upsert({
    where: { email: 'learner@leximind.ai' },
    update: {},
    create: {
      email: 'learner@leximind.ai',
      username: 'learner_legacy',
      displayName: 'Alex Learner (Legacy)',
      passwordHash,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.B1,
          targetLevel: CefrLevel.B2,
          dailyGoal: 20,
          weeklyGoal: 100,
        },
      },
      streak: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
          lastStudyDate: new Date(),
        },
      },
      xp: {
        create: {
          totalXP: 1450,
          currentLevel: 4,
        },
      },
    },
  });

  // 2.1 Full PRO Account (pro@vocabflow.ai)
  await prisma.user.upsert({
    where: { email: 'pro@vocabflow.ai' },
    update: {
      role: Role.PREMIUM_USER,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'pro@vocabflow.ai',
      username: 'vocabflow_pro',
      displayName: 'VocabFlow VIP Pro',
      passwordHash,
      role: Role.PREMIUM_USER,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.B2,
          targetLevel: CefrLevel.C2,
          dailyGoal: 50,
          weeklyGoal: 300,
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

  // 2.2 System Admin Account (admin@vocabflow.ai)
  await prisma.user.upsert({
    where: { email: 'admin@vocabflow.ai' },
    update: {
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
    create: {
      email: 'admin@vocabflow.ai',
      username: 'vocabflow_admin',
      displayName: 'VocabFlow Administrator',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.C2,
          targetLevel: CefrLevel.C2,
          dailyGoal: 50,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      username: 'admin',
      displayName: 'System Admin',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      profile: {
        create: {
          englishLevel: CefrLevel.C1,
          targetLevel: CefrLevel.C2,
          dailyGoal: 30,
        },
      },
    },
  });
  // 2.3 Attach Full PRO Lifetime Subscriptions
  const proPlan = await prisma.plan.upsert({
    where: { tier: SubscriptionTier.PRO },
    update: {
      name: 'VocabFlow Pro (Unlimited)',
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
      name: 'VocabFlow Pro (Unlimited)',
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
  const proEmails = ['pro@vocabflow.ai', 'admin@vocabflow.ai', 'learner@vocabflow.ai', 'admin@leximind.ai'];
  for (const email of proEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) {
      await prisma.subscription.deleteMany({ where: { userId: u.id } });
      await prisma.subscription.create({
        data: {
          userId: u.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: lifetimeEnd,
        },
      });
    }
  }

  console.log('✅ Demo, Pro & Admin users initialized with Active PRO subscriptions.');

  // 3. Parse and Seed toeic_600_words.csv (chỉ nhập nếu DB chưa có dữ liệu)
  const existingWordCount = await prisma.vocabulary.count();
  if (existingWordCount > 0) {
    console.log(`✅ Cơ sở dữ liệu đã có sẵn ${existingWordCount} từ vựng Vocabulary. Bỏ qua nhập từ tệp CSV.`);
    return;
  }

  const candidatePaths = [
    '/toeic_600_words.csv',
    path.resolve(__dirname, '../../../toeic_600_words.csv'),
    path.resolve(process.cwd(), 'toeic_600_words.csv'),
    path.resolve(process.cwd(), '../../toeic_600_words.csv'),
    path.resolve(__dirname, '../../toeic_600_words.csv'),
    path.resolve(__dirname, '../toeic_600_words.csv'),
  ];
  const csvPath = candidatePaths.find((p) => fs.existsSync(p));
  if (!csvPath) {
    console.log('ℹ️ Không có tệp CSV cục bộ (dữ liệu hiện được lưu trữ và quản lý trực tiếp trong PostgreSQL).');
    return;
  }
  console.log(`📄 Using CSV file from: ${csvPath}`);

  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  console.log(`📖 Found ${lines.length - 1} rows in CSV.`);

  // Header: english,type,vietnamese,pronounce,explain,example,example_vietnamese,image_url,audio_url,topic,topic_url
  const topicCache = new Map<string, string>();
  let importedCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 5) continue;

    const [
      english,
      type,
      vietnamese,
      pronounce,
      explain,
      example,
      example_vietnamese,
      image_url,
      audio_url,
      topicName,
    ] = cols;

    if (!english || !vietnamese) continue;
    const cleanWord = english.trim().toLowerCase();

    // Ensure topic exists
    const cleanTopic = topicName ? topicName.trim() : 'General Business';
    let topicId = topicCache.get(cleanTopic);
    if (!topicId) {
      const slug = slugify(cleanTopic);
      const topic = await prisma.vocabularyTopic.upsert({
        where: { slug },
        update: { name: cleanTopic },
        create: {
          name: cleanTopic,
          slug,
          description: `Key TOEIC vocabulary for ${cleanTopic}`,
          icon: 'ri-briefcase-4-line',
        },
      });
      topicId = topic.id;
      topicCache.set(cleanTopic, topicId);
    }

    const cefr = estimateCefr(cleanWord, type);

    const vocab = await prisma.vocabulary.upsert({
      where: { word: cleanWord },
      update: {
        pronunciation: pronounce || null,
        phonetic: pronounce || null,
        partOfSpeech: type || null,
        definition: explain || vietnamese,
        shortDefinition: vietnamese,
        imageUrl: image_url || null,
        audioUrl: audio_url || null,
        cefrLevel: cefr,
      },
      create: {
        word: cleanWord,
        normalizedWord: cleanWord.replace(/[^a-z]/g, ''),
        pronunciation: pronounce || null,
        phonetic: pronounce || null,
        partOfSpeech: type || null,
        definition: explain || vietnamese,
        shortDefinition: vietnamese,
        imageUrl: image_url || null,
        audioUrl: audio_url || null,
        cefrLevel: cefr,
        difficulty: cefr === CefrLevel.A2 ? 2.0 : cefr === CefrLevel.B1 ? 3.0 : cefr === CefrLevel.B2 ? 4.0 : 4.5,
      },
    });

    // Link topic
    await prisma.vocabularyTopicItem.upsert({
      where: {
        topicId_vocabularyId: {
          topicId,
          vocabularyId: vocab.id,
        },
      },
      update: {},
      create: {
        topicId,
        vocabularyId: vocab.id,
      },
    });

    // Add Vietnamese meaning
    const existingMeaning = await prisma.vocabularyMeaning.findFirst({
      where: { vocabularyId: vocab.id, meaning: vietnamese },
    });
    if (!existingMeaning) {
      await prisma.vocabularyMeaning.create({
        data: {
          vocabularyId: vocab.id,
          meaning: vietnamese,
          definition: explain || null,
          domain: cleanTopic,
        },
      });
    }

    // Add example sentence
    if (example) {
      const existingExample = await prisma.exampleSentence.findFirst({
        where: { vocabularyId: vocab.id, sentence: example },
      });
      if (!existingExample) {
        await prisma.exampleSentence.create({
          data: {
            vocabularyId: vocab.id,
            sentence: example,
            translation: example_vietnamese || null,
            sourceType: 'TOEIC',
          },
        });
      }
    }

    // Assign some initial words to demo user for smart review testing
    if (importedCount < 30) {
      const isDue = importedCount % 3 === 0;
      await prisma.userVocabulary.upsert({
        where: {
          userId_vocabularyId: {
            userId: demoUser.id,
            vocabularyId: vocab.id,
          },
        },
        update: {},
        create: {
          userId: demoUser.id,
          vocabularyId: vocab.id,
          status: isDue ? 'REVIEW' : 'LEARNING',
          masteryScore: isDue ? 45.0 : 60.0,
          stability: isDue ? 1.0 : 4.0,
          retrievability: isDue ? 0.4 : 0.85,
          repetitionCount: isDue ? 2 : 4,
          correctCount: isDue ? 2 : 4,
          lastReviewedAt: isDue ? new Date(Date.now() - 3 * 86400000) : new Date(),
          nextReviewAt: isDue ? new Date(Date.now() - 86400000) : new Date(Date.now() + 3 * 86400000), // Some overdue
          confidence: 3,
        },
      });
    }

    importedCount++;
  }

  // 4. Seed Subscription Plans (FREE, PLUS, PRO)
  const plans = [
    {
      tier: 'FREE' as const,
      name: 'Free Starter',
      priceMonthly: 0.0,
      aiDailyQuota: 10,
      maxCustomDecks: 3,
      unlimitedReviews: false,
      features: [
        'Học tối đa 20 từ vựng/ngày',
        '10 lượt tương tác Trợ lý AI/ngày',
        'Spaced Repetition cơ bản',
        'Tối đa 3 bộ từ cá nhân',
      ],
    },
    {
      tier: 'PLUS' as const,
      name: 'Plus Learner',
      priceMonthly: 4.99,
      aiDailyQuota: 60,
      maxCustomDecks: 15,
      unlimitedReviews: true,
      features: [
        'Không giới hạn số từ ôn tập hàng ngày',
        '60 lượt AI Tutor chuyên sâu/ngày',
        'Clone không giới hạn bộ từ cộng đồng',
        'Tạo đề thi tự động từ từ vựng yếu',
        'Bảo vệ chuỗi học tập (Streak Freeze)',
      ],
    },
    {
      tier: 'PRO' as const,
      name: 'Pro Mastermind',
      priceMonthly: 9.99,
      aiDailyQuota: -1, // Unlimited
      maxCustomDecks: 100,
      unlimitedReviews: true,
      features: [
        'Toàn quyền truy cập không giới hạn mọi tính năng',
        'AI Tutor không giới hạn 24/7',
        'Sinh câu ví dụ đa tầng A2-C1 theo ngành nghề riêng',
        'Semantic Search tìm từ theo ý niệm',
        'Phân tích biểu đồ trí nhớ nâng cao & dự đoán quên từ',
      ],
    },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { tier: plan.tier },
      update: {
        name: plan.name,
        priceMonthly: plan.priceMonthly,
        aiDailyQuota: plan.aiDailyQuota,
        maxCustomDecks: plan.maxCustomDecks,
        unlimitedReviews: plan.unlimitedReviews,
        features: plan.features,
      },
      create: plan,
    });
  }
  console.log('✅ Subscription Plans seeded (Free, Plus, Pro).');

  // 5. Seed Sample Approved Community Decks
  const existingDeck = await prisma.communityDeck.findFirst({
    where: { title: 'Business Phrasal Verbs in Action' },
  });

  if (!existingDeck) {
    const deck = await prisma.communityDeck.create({
      data: {
        userId: demoUser.id,
        title: 'Business Phrasal Verbs in Action',
        description: 'Tổng hợp các cụm động từ thường gặp nhất trong email công việc, đàm phán và thuyết trình.',
        category: 'Business English',
        cefrLevel: 'B2',
        isPublic: true,
        status: 'APPROVED',
        cloneCount: 42,
        words: {
          create: [
            {
              word: 'call off',
              phonetic: '/kɔːl ɒf/',
              partOfSpeech: 'phrasal verb',
              meaning: 'hủy bỏ (một cuộc họp, kế hoạch)',
              definition: 'to cancel an event or agreement',
              example: 'They decided to call off the meeting due to heavy snow.',
              exampleTranslation: 'Họ quyết định hủy cuộc họp vì tuyết rơi dày đặc.',
            },
            {
              word: 'carry out',
              phonetic: '/ˈkæri aʊt/',
              partOfSpeech: 'phrasal verb',
              meaning: 'tiến hành, thực hiện',
              definition: 'to conduct or execute a plan or task',
              example: 'Our team will carry out the customer survey next week.',
              exampleTranslation: 'Đội ngũ của chúng tôi sẽ tiến hành khảo sát khách hàng vào tuần tới.',
            },
            {
              word: 'figure out',
              phonetic: '/ˈfɪɡjər aʊt/',
              partOfSpeech: 'phrasal verb',
              meaning: 'tìm ra giải pháp, hiểu ra',
              definition: 'to solve or understand a complex problem',
              example: 'We need to figure out how to cut operational costs.',
              exampleTranslation: 'Chúng ta cần tìm ra cách cắt giảm chi phí vận hành.',
            },
            {
              word: 'put off',
              phonetic: '/pʊt ɒf/',
              partOfSpeech: 'phrasal verb',
              meaning: 'hoãn lại, dời lịch',
              definition: 'to postpone to a later date',
              example: 'Never put off until tomorrow what you can do today.',
              exampleTranslation: 'Đừng bao giờ trì hoãn việc hôm nay đến ngày mai.',
            },
          ],
        },
      },
    });

    await prisma.communityDeck.create({
      data: {
        userId: demoUser.id,
        title: 'Essential Tech & AI Terms',
        description: 'Từ vựng cốt lõi cho kỹ sư phần mềm, làm việc với AI và các sản phẩm công nghệ.',
        category: 'Technology',
        cefrLevel: 'B2',
        isPublic: true,
        status: 'APPROVED',
        cloneCount: 88,
        words: {
          create: [
            {
              word: 'scalability',
              phonetic: '/ˌskeɪləˈbɪləti/',
              partOfSpeech: 'noun',
              meaning: 'khả năng mở rộng (hệ thống)',
              definition: 'the capacity to be changed in size or scale',
              example: 'The cloud architecture provides great scalability for our app.',
              exampleTranslation: 'Kiến trúc đám mây mang lại khả năng mở rộng tuyệt vời cho ứng dụng của chúng tôi.',
            },
            {
              word: 'resilient',
              phonetic: '/rɪˈzɪliənt/',
              partOfSpeech: 'adjective',
              meaning: 'kiên cường, có khả năng phục hồi nhanh',
              definition: 'able to withstand or recover quickly from difficult conditions',
              example: 'A resilient microservice architecture prevents cascading failures.',
              exampleTranslation: 'Kiến trúc microservice kiên cường giúp ngăn ngừa sự cố dây chuyền.',
            },
            {
              word: 'latency',
              phonetic: '/ˈleɪtənsi/',
              partOfSpeech: 'noun',
              meaning: 'độ trễ (mạng, phản hồi)',
              definition: 'the delay before a transfer of data begins',
              example: 'Low latency is critical for real-time video conferencing.',
              exampleTranslation: 'Độ trễ thấp là yếu tố sống còn đối với hội nghị truyền hình thời gian thực.',
            },
          ],
        },
      },
    });
    console.log('✅ Sample Community Decks created.');
  }

  // Clean out any legacy fake/mock operational data so user can operate cleanly
  console.log('🧹 Purging any mock operational data (tickets, feedback, fake orders, fake sessions)...');
  try {
    await prisma.supportMessage.deleteMany({});
    await prisma.supportConversation.deleteMany({});
    await prisma.feedback.deleteMany({});
    await prisma.paymentOrder.deleteMany({});
    await prisma.adminAnnouncement.deleteMany({});
    await prisma.reviewEvent.deleteMany({});
    await prisma.studySession.deleteMany({});
    console.log('✅ Database cleaned: Only real users, plans, achievements and vocabulary preserved.');
  } catch (err) {
    console.warn('Notice during mock data cleanup:', err);
  }

  console.log(`🎉 Seeding finished! Imported ${importedCount} vocabulary words and configured adaptive topics.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
