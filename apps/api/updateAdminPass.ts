import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const possibleEnvPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../../.env'),
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
];
for (const envFile of possibleEnvPaths) {
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
    break;
  }
}
dotenv.config();

// Override postgres host if running from host machine (outside docker)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@postgres:5432')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('@postgres:5432', '@localhost:5432');
}

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@vocabflow.ai';
  // Generate a highly secure 24-character password with symbols
  const rawBytes = crypto.randomBytes(18).toString('base64');
  const securePassword = `VocalFlow!${rawBytes.replace(/[^a-zA-Z0-9]/g, '')}#2026`;

  console.log('🔄 Đang mã hóa mật khẩu bảo mật cao...');
  const passwordHash = await bcrypt.hash(securePassword, 10);

  console.log(`🔍 Tìm tài khoản admin: ${adminEmail}...`);
  const adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!adminUser) {
    console.error(`❌ Không tìm thấy tài khoản admin với email: ${adminEmail}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email: adminEmail },
    data: { passwordHash }
  });

  console.log('✅ Đã cập nhật mật khẩu Admin thành công!');
  console.log('----------------------------------------------------');
  console.log('🔒 EMAIL ADMIN     : ', adminEmail);
  console.log('🔑 MẬT KHẨU MỚI    : ', securePassword);
  console.log('⚠️ Hãy lưu mật khẩu này vào trình quản lý mật khẩu của bạn (ví dụ: Bitwarden, 1Password) và KHÔNG chia sẻ cho ai!');
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
