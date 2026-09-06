import { PrismaClient, Role, SubscriptionTier, SupportPriority, SupportStatus, FeedbackType, FeedbackStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master V7 realistic operational data...');

  const admin = await prisma.user.findFirst({ where: { role: Role.SUPER_ADMIN } });
  const proUser = (await prisma.user.findFirst({ where: { role: Role.PREMIUM_USER } })) || admin;
  const standardUser = (await prisma.user.findFirst({ where: { role: Role.USER } })) || proUser;

  if (!admin || !standardUser) {
    console.log('Users not found, aborting seed.');
    return;
  }

  // 1. Ensure active Plan & Subscription
  const proPlan = await prisma.plan.findFirst({ where: { tier: SubscriptionTier.PRO } });
  if (proPlan && proUser) {
    const existingSub = await prisma.subscription.findFirst({ where: { userId: proUser.id } });
    if (existingSub) {
      await prisma.subscription.update({
        where: { id: existingSub.id },
        data: { status: 'ACTIVE', currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: proUser.id,
          planId: proPlan.id,
          status: 'ACTIVE',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
        },
      });
    }

    // Create a real PAID PaymentOrder
    await prisma.paymentOrder.create({
      data: {
        orderCode: Math.floor(100000 + Math.random() * 900000),
        user: { connect: { id: proUser.id } },
        plan: { connect: { id: proPlan.id } },
        tier: SubscriptionTier.PRO,
        amount: proPlan.priceMonthly,
        status: PaymentStatus.PAID,
        description: `Kích hoạt gói ${proPlan.name} qua VietQR`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        paidAt: new Date(),
      },
    });
  }

  // 2. Create realistic Support Conversations
  await prisma.supportConversation.create({
    data: {
      ticketId: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: standardUser.id,
      subject: 'Hỏi về tính năng AI Tutor và FSRS Spaced Repetition',
      status: SupportStatus.WAITING,
      priority: SupportPriority.HIGH,
      tags: ['AI_TUTOR', 'FSRS'],
      messages: {
        create: [
          {
            senderId: standardUser.id,
            senderRole: 'USER',
            senderName: standardUser.displayName || 'Học viên TOEIC',
            content: 'Chào admin, thuật toán FSRS 4.5 trong mục Smart Review có tự động tăng khoảng thời gian ôn tập khi mình nhớ tốt không?',
          },
          {
            senderId: admin.id,
            senderRole: 'ADMIN',
            senderName: 'VocabFlow Specialist',
            content: 'Chào bạn! FSRS 4.5 đo lường độ ổn định (Memory Stability) và độ khó (Difficulty) của từng flashcard. Khi bạn bấm "Easy", khoảng cách ôn tập sẽ tự động mở rộng theo cấp số nhân tối ưu khoa học nhé!',
          },
        ],
      },
    },
  });

  await prisma.supportConversation.create({
    data: {
      ticketId: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: standardUser.id,
      subject: 'Kích hoạt gói VocabFlow PRO qua VietQR tự động',
      status: SupportStatus.RESOLVED,
      priority: SupportPriority.NORMAL,
      tags: ['BILLING', 'VIETQR'],
      messages: {
        create: [
          {
            senderId: standardUser.id,
            senderRole: 'USER',
            senderName: standardUser.displayName || 'Học viên TOEIC',
            content: 'Mình vừa chuyển khoản VietQR xong, hệ thống đã kích hoạt VIP chưa ạ?',
          },
          {
            senderId: admin.id,
            senderRole: 'ADMIN',
            senderName: 'Admin VocabFlow',
            content: 'Đã xác nhận giao dịch thành công qua PayOS webhook! Tài khoản của bạn đã được nâng cấp lên PRO.',
          },
        ],
      },
    },
  });

  // 3. Create realistic Feedback Items
  await prisma.feedback.create({
    data: {
      userId: standardUser.id,
      title: 'Chế độ Shadowing luyện nói đuổi theo giọng AI chuẩn Mỹ',
      description: 'Mong đội ngũ phát triển bổ sung thêm chế độ luyện Shadowing cho phần TOEIC Speaking Part 2-3 để luyện ngữ điệu.',
      type: FeedbackType.FEATURE_REQUEST,
      status: FeedbackStatus.PLANNED,
      votesCount: 24,
      adminReply: 'Ý tưởng rất tuyệt vời! Nhóm kỹ thuật đang tích hợp Web Audio API và mô hình nhận diện giọng nói cho bản cập nhật tới.',
    },
  });

  await prisma.feedback.create({
    data: {
      userId: standardUser.id,
      title: 'Bổ sung danh sách Collocation và Idioms cho TOEIC 900+',
      description: 'Cần thêm các cụm từ cố định thường bẫy trong Part 5 & 6 các đề ETS mới nhất.',
      type: FeedbackType.FEATURE_REQUEST,
      status: FeedbackStatus.UNDER_REVIEW,
      votesCount: 18,
    },
  });

  // 4. Create realistic Study Session & Review Events
  const session = await prisma.studySession.create({
    data: {
      userId: standardUser.id,
      duration: 420,
      xpEarned: 120,
      score: 86.5,
    },
  });

  const vocabs = await prisma.vocabulary.findMany({ take: 8 });
  for (let i = 0; i < vocabs.length; i++) {
    await prisma.reviewEvent.create({
      data: {
        userId: standardUser.id,
        vocabularyId: vocabs[i].id,
        sessionId: session.id,
        answer: vocabs[i].word,
        correct: i % 3 !== 0,
        responseTimeMs: 2500,
        confidence: 4,
      },
    });
  }

  // 5. In-App Notification with explicit route
  await prisma.notification.create({
    data: {
      userId: standardUser.id,
      type: 'ANNOUNCEMENT',
      title: 'Chào mừng bạn đến với VocabFlow AI V7!',
      body: 'Hệ thống đã nâng cấp toàn diện với FSRS 4.5, Trung tâm CSKH trực tuyến và Cổng Roadmap cộng đồng.',
      data: { route: '/support', link: '/support' },
    },
  });

  // 6. Admin Historical Announcements
  await prisma.adminAnnouncement.create({
    data: {
      title: 'Khởi chạy Thuật toán FSRS 4.5 & Trung tâm CSKH Trực tuyến',
      content: 'Hệ thống đã nâng cấp toàn diện thuật toán trí nhớ FSRS 4.5 và kênh hỗ trợ trực tuyến thời gian thực 24/7.',
      audience: 'ALL',
      status: 'SENT',
      targetCount: 120,
      sentAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.adminAnnouncement.create({
    data: {
      title: 'Ưu đãi Kích hoạt Gói VocabFlow PRO qua VietQR PayOS',
      content: 'Nhân dịp nâng cấp hệ thống, kích hoạt gói Pro mở khóa toàn bộ tính năng AI Tutor và Spaced Repetition không giới hạn.',
      audience: 'FREE',
      status: 'SENT',
      targetCount: 85,
      sentAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: standardUser.id,
      type: 'SYSTEM',
      title: 'Mục tiêu học tập hàng ngày đã sẵn sàng',
      body: 'Bạn có 20 từ vựng cần kích hoạt trí nhớ trong khung giờ vàng hôm nay.',
      data: { route: '/review', link: '/review' },
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
