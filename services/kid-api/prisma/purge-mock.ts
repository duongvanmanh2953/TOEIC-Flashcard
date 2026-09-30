import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Bắt đầu dọn sạch toàn bộ dữ liệu mẫu (mock data)...');

  const [msgs, convs, fbs, orders, ann, sessions, reviews] = await Promise.all([
    prisma.supportMessage.deleteMany({}),
    prisma.supportConversation.deleteMany({}),
    prisma.feedback.deleteMany({}),
    prisma.paymentOrder.deleteMany({}),
    prisma.adminAnnouncement.deleteMany({}),
    prisma.studySession.deleteMany({}),
    prisma.reviewEvent.deleteMany({}),
  ]);

  console.log('✅ Đã xóa sạch dữ liệu mẫu thành công:');
  console.log(` - Tin nhắn hỗ trợ (Support Messages): ${msgs.count}`);
  console.log(` - Hội thoại hỗ trợ (Support Conversations): ${convs.count}`);
  console.log(` - Đóng góp ý kiến (Feedbacks): ${fbs.count}`);
  console.log(` - Đơn hàng giả lập (Payment Orders): ${orders.count}`);
  console.log(` - Thông báo mẫu (Announcements): ${ann.count}`);
  console.log(` - Phiên học mẫu (Study Sessions): ${sessions.count}`);
  console.log(` - Sự kiện ôn tập mẫu (Review Events): ${reviews.count}`);

  const userCount = await prisma.user.count();
  const vocabCount = await prisma.vocabulary.count();
  console.log(`\n🛡️ ĐÃ BẢO LƯU AN TOÀN:`);
  console.log(` - Tài khoản người dùng (Users): ${userCount}`);
  console.log(` - Kho từ vựng (Vocabularies): ${vocabCount}`);
}

main()
  .catch((err) => {
    console.error('Lỗi khi dọn dữ liệu:', err.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
