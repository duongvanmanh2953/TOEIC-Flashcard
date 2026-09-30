import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding default community topics...');

  const defaultTopics = [
    {
      name: 'Từ vựng & Collocations',
      slug: 'vocabulary',
      description: 'Chia sẻ từ vựng, cụm từ vựng, idioms và collocations học thuật / giao tiếp hữu ích.',
      icon: 'BookOpen',
      color: '#4f46e5',
      position: 1,
    },
    {
      name: 'Ngữ pháp & Cấu trúc câu',
      slug: 'grammar',
      description: 'Phân tích các thì, cấu trúc câu đặc biệt, đảo ngữ, mệnh đề quan hệ và ngữ pháp cốt lõi.',
      icon: 'Library',
      color: '#0891b2',
      position: 2,
    },
    {
      name: 'Phát âm & Ngữ điệu (IPA)',
      slug: 'pronunciation',
      description: 'Quy tắc trọng âm, nối âm, nuốt âm, ngữ điệu và phát âm chuẩn bản xứ.',
      icon: 'Mic',
      color: '#8b5cf6',
      position: 3,
    },
    {
      name: 'Chiến thuật TOEIC & Luyện đề',
      slug: 'toeic-tips',
      description: 'Mẹo làm bài thi TOEIC Listening & Reading Part 1-7, bẫy thường gặp và chiến thuật phân bổ thời gian.',
      icon: 'Award',
      color: '#f59e0b',
      position: 4,
    },
    {
      name: 'IELTS Academic & General',
      slug: 'ielts-knowledge',
      description: 'Chia sẻ kinh nghiệm luyện 4 kỹ năng IELTS, tiêu chí chấm điểm và bài mẫu band cao.',
      icon: 'GraduationCap',
      color: '#10b981',
      position: 5,
    },
    {
      name: 'Lỗi sai phổ biến (Common Mistakes)',
      slug: 'common-mistakes',
      description: 'Tổng hợp các lỗi sai người Việt hay mắc phải khi nói và viết tiếng Anh.',
      icon: 'AlertTriangle',
      color: '#ef4444',
      position: 6,
    },
    {
      name: 'Phương pháp học & Tài nguyên hay',
      slug: 'learning-strategies',
      description: 'Kinh nghiệm tự học tiếng Anh, kỹ thuật Spaced Repetition, Shadowing và tài nguyên chọn lọc.',
      icon: 'Sparkles',
      color: '#ec4899',
      position: 7,
    },
  ];

  for (const topic of defaultTopics) {
    await prisma.communityTopic.upsert({
      where: { slug: topic.slug },
      update: {
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        position: topic.position,
        isActive: true,
      },
      create: topic,
    });
  }

  console.log('Community topics seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
