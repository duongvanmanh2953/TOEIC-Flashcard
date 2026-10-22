import { PrismaClient, CefrLevel, Role, UserStatus, SubscriptionTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating / Updating LetStuN Accounts (1 Full Pro & 1 Admin)...');

  // 1. Ensure PRO and PLUS plans exist
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

  // 2. ACCOUNT 1: Full Rights / Full Pro Learner Account
  // Email: pro@letstun.com | Password: password123
  console.log('📦 Setting up Full PRO Account (pro@letstun.com)...');
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

  // Attach active lifetime PRO subscription
  await prisma.subscription.deleteMany({
    where: { userId: proUser.id },
  });
  await prisma.subscription.create({
    data: {
      userId: proUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodEnd: lifetimeEnd,
    },
  });
  console.log('✅ Account 1 created: pro@letstun.com / password123 (Role: PREMIUM_USER, Pro: ACTIVE Lifetime)');

  // 3. ACCOUNT 2: System Administrator Account
  // Email: admin@letstun.com | Password: admin123
  console.log('📦 Setting up Admin Account (admin@letstun.com)...');
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

  // Attach active lifetime PRO subscription to Admin as well
  await prisma.subscription.deleteMany({
    where: { userId: adminUser.id },
  });
  await prisma.subscription.create({
    data: {
      userId: adminUser.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodEnd: lifetimeEnd,
    },
  });
  console.log('✅ Account 2 created: admin@letstun.com / admin123 (Role: SUPER_ADMIN, Pro: ACTIVE Lifetime)');

  // Also sync admin@letstun.com for backward compatibility
  const legacyAdmin = await prisma.user.upsert({
    where: { email: 'admin@letstun.com' },
    update: {
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminHash,
    },
    create: {
      email: 'admin@letstun.com',
      username: 'admin_legacy',
      displayName: 'System Admin (Legacy)',
      passwordHash: adminHash,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  await prisma.subscription.deleteMany({
    where: { userId: legacyAdmin.id },
  });
  await prisma.subscription.create({
    data: {
      userId: legacyAdmin.id,
      planId: proPlan.id,
      status: 'ACTIVE',
      currentPeriodEnd: lifetimeEnd,
    },
  });

  // Also upgrade learner@letstun.com to Pro so it also has all rights
  const demoLearner = await prisma.user.findUnique({
    where: { email: 'learner@letstun.com' },
  });
  if (demoLearner) {
    await prisma.user.update({
      where: { id: demoLearner.id },
      data: { role: Role.PREMIUM_USER },
    });
    await prisma.subscription.deleteMany({
      where: { userId: demoLearner.id },
    });
    await prisma.subscription.create({
      data: {
        userId: demoLearner.id,
        planId: proPlan.id,
        status: 'ACTIVE',
        currentPeriodEnd: lifetimeEnd,
      },
    });
    console.log('✅ Also upgraded learner@letstun.com to PRO.');
  }

  console.log('\n🎉 ALL ACCOUNTS INITIALIZED SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
