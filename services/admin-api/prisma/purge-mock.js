const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Bắt đầu dọn sạch toàn bộ dữ liệu mẫu (mock data)...');

  try {
    const [msgs, convs, fbs, orders, ann, sessions, reviews] = await Promise.all([
      prisma.supportMessage.deleteMany({}),
      prisma.supportConversation.deleteMany({}),
      prisma.feedback.deleteMany({}),
      prisma.paymentOrder.deleteMany({}),
      prisma.adminAnnouncement.deleteMany({}),
      prisma.studySession.deleteMany({}),
      prisma.reviewEvent.deleteMany({}),
    ]);

    console.log('✅ ĐÃ XÓA SẠCH DỮ LIỆU MẪU:');
    console.log(` - Tin nhắn hỗ trợ (Support Messages): ${msgs.count}`);
    console.log(` - Hội thoại hỗ trợ (Support Conversations): ${convs.count}`);
    console.log(` - Đóng góp ý kiến (Feedbacks): ${fbs.count}`);
    console.log(` - Đơn hàng mẫu (Payment Orders): ${orders.count}`);
    console.log(` - Thông báo mẫu (Announcements): ${ann.count}`);
    console.log(` - Phiên học mẫu (Study Sessions): ${sessions.count}`);
    console.log(` - Sự kiện ôn tập mẫu (Review Events): ${reviews.count}`);

    const userCount = await prisma.user.count();
    const vocabCount = await prisma.vocabulary.count();
    console.log('\n🛡️ BẢO LƯU NGUYÊN VẸN HỆ THỐNG:');
    console.log(` - Người dùng (Users): ${userCount}`);
    console.log(` - Từ vựng (Vocabulary): ${vocabCount}`);
  } catch (err) {
    console.error('Lỗi khi dọn dữ liệu:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
