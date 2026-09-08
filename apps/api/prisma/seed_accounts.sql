-- ==============================================================================
-- VocabFlow AI - SQL Script Khởi Tạo Tài Khoản Admin & Pro Full Quyền
-- Khớp hoàn toàn với gợi ý trên màn hình đăng nhập (LoginPage):
--   1. 👑 Full Pro: pro@vocabflow.ai  |  Mật khẩu: password123
--   2. 🛡️ Admin:    admin@vocabflow.ai |  Mật khẩu: admin123
--   3. 🎓 Learner:  learner@vocabflow.ai | Mật khẩu: password123 (Được cấp Pro vĩnh viễn)
-- ==============================================================================

-- 1. Đảm bảo gói dịch vụ PRO (Plan) tồn tại với quyền hạn cao nhất
INSERT INTO "Plan" ("id", "tier", "name", "priceMonthly", "aiDailyQuota", "maxCustomDecks", "unlimitedReviews", "features")
VALUES (
  'plan-pro-unlimited',
  'PRO',
  'VocabFlow Pro (Unlimited)',
  199000,
  -1,
  999,
  true,
  '["Không giới hạn lượt trò chuyện & giải thích cùng AI Tutor", "Thuật toán Spaced Repetition (SRS) không giới hạn", "Tạo không giới hạn kho từ cá nhân & bộ thẻ riêng", "Phân tích ngữ cảnh chuyên sâu CEFR A1-C2", "Xuất/Nhập dữ liệu từ vựng Anki, CSV, Quizlet", "Toàn quyền truy cập mọi tính năng Pro vĩnh viễn"]'::jsonb
)
ON CONFLICT ("tier") DO UPDATE SET
  "name" = EXCLUDED."name",
  "priceMonthly" = EXCLUDED."priceMonthly",
  "aiDailyQuota" = -1,
  "maxCustomDecks" = 999,
  "unlimitedReviews" = true,
  "features" = EXCLUDED."features";

-- 2. TÀI KHOẢN 1: Full Pro User (pro@vocabflow.ai / password123)
-- Role: PREMIUM_USER, Tier: PRO, Thời hạn: 2099-12-31 (Vĩnh viễn)
INSERT INTO "User" ("id", "email", "username", "passwordHash", "displayName", "role", "status", "createdAt", "updatedAt", "lastActiveAt")
VALUES (
  'usr-pro-vocabflow',
  'pro@vocabflow.ai',
  'vocabflow_pro',
  '$2b$10$/Dsa0VJykEDWDUVV43AJMe1XXgWy9vJh.gkf1eLjt/p6VgSilouRu', -- password123
  'VocabFlow VIP Pro',
  'PREMIUM_USER',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "role" = 'PREMIUM_USER',
  "status" = 'ACTIVE',
  "passwordHash" = EXCLUDED."passwordHash",
  "displayName" = EXCLUDED."displayName",
  "updatedAt" = NOW();

-- Hồ sơ học tập Full Pro
INSERT INTO "UserProfile" ("id", "userId", "englishLevel", "targetLevel", "dailyGoal", "weeklyGoal", "learningGoal")
VALUES (
  'prof-pro-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'pro@vocabflow.ai'),
  'B2',
  'C2',
  50,
  300,
  'Master TOEIC 990 & C2 Fluent English with Unlimited AI Tutor'
)
ON CONFLICT ("userId") DO UPDATE SET
  "targetLevel" = 'C2',
  "dailyGoal" = 50;

-- Streak học tập
INSERT INTO "UserStreak" ("id", "userId", "currentStreak", "longestStreak", "lastStudyDate")
VALUES (
  'streak-pro-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'pro@vocabflow.ai'),
  28,
  45,
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "currentStreak" = 28,
  "longestStreak" = 45,
  "lastStudyDate" = NOW();

-- Điểm kinh nghiệm XP
INSERT INTO "UserXP" ("id", "userId", "totalXP", "currentLevel")
VALUES (
  'xp-pro-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'pro@vocabflow.ai'),
  9990,
  15
)
ON CONFLICT ("userId") DO UPDATE SET
  "totalXP" = 9990,
  "currentLevel" = 15;

-- Cấp gói đăng ký PRO vĩnh viễn (Active đến năm 2099)
DELETE FROM "Subscription" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'pro@vocabflow.ai');
INSERT INTO "Subscription" ("id", "userId", "planId", "status", "currentPeriodEnd", "createdAt", "updatedAt")
VALUES (
  'sub-pro-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'pro@vocabflow.ai'),
  (SELECT "id" FROM "Plan" WHERE "tier" = 'PRO' LIMIT 1),
  'ACTIVE',
  '2099-12-31 23:59:59+00'::timestamptz,
  NOW(),
  NOW()
);

-- 3. TÀI KHOẢN 2: System Administrator (admin@vocabflow.ai / admin123)
-- Role: SUPER_ADMIN, Tier: PRO, Thời hạn: 2099-12-31 (Vĩnh viễn)
INSERT INTO "User" ("id", "email", "username", "passwordHash", "displayName", "role", "status", "createdAt", "updatedAt", "lastActiveAt")
VALUES (
  'usr-admin-vocabflow',
  'admin@vocabflow.ai',
  'vocabflow_admin',
  '$2b$10$rpdKKp4cW8rCf9TwOoyJkuXRSfWGNKVS6tFlwyCN9DoCBfSNSC.dG', -- admin123
  'VocabFlow Administrator',
  'SUPER_ADMIN',
  'ACTIVE',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO UPDATE SET
  "role" = 'SUPER_ADMIN',
  "status" = 'ACTIVE',
  "passwordHash" = EXCLUDED."passwordHash",
  "displayName" = EXCLUDED."displayName",
  "updatedAt" = NOW();

-- Hồ sơ Admin
INSERT INTO "UserProfile" ("id", "userId", "englishLevel", "targetLevel", "dailyGoal", "weeklyGoal", "learningGoal")
VALUES (
  'prof-admin-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'admin@vocabflow.ai'),
  'C2',
  'C2',
  50,
  350,
  'Platform Management & Curriculum Administration'
)
ON CONFLICT ("userId") DO UPDATE SET
  "englishLevel" = 'C2',
  "targetLevel" = 'C2';

-- Streak Admin
INSERT INTO "UserStreak" ("id", "userId", "currentStreak", "longestStreak", "lastStudyDate")
VALUES (
  'streak-admin-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'admin@vocabflow.ai'),
  99,
  99,
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "currentStreak" = 99,
  "longestStreak" = 99,
  "lastStudyDate" = NOW();

-- XP Admin
INSERT INTO "UserXP" ("id", "userId", "totalXP", "currentLevel")
VALUES (
  'xp-admin-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'admin@vocabflow.ai'),
  25000,
  25
)
ON CONFLICT ("userId") DO UPDATE SET
  "totalXP" = 25000,
  "currentLevel" = 25;

-- Cấp gói đăng ký PRO vĩnh viễn cho Admin
DELETE FROM "Subscription" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'admin@vocabflow.ai');
INSERT INTO "Subscription" ("id", "userId", "planId", "status", "currentPeriodEnd", "createdAt", "updatedAt")
VALUES (
  'sub-admin-vocabflow',
  (SELECT "id" FROM "User" WHERE "email" = 'admin@vocabflow.ai'),
  (SELECT "id" FROM "Plan" WHERE "tier" = 'PRO' LIMIT 1),
  'ACTIVE',
  '2099-12-31 23:59:59+00'::timestamptz,
  NOW(),
  NOW()
);

-- 4. Đồng bộ quyền Pro cho tài khoản demo 'learner@vocabflow.ai' & legacy admin 'admin@leximind.ai'
UPDATE "User"
SET "role" = 'PREMIUM_USER', "status" = 'ACTIVE'
WHERE "email" = 'learner@vocabflow.ai';

DELETE FROM "Subscription" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'learner@vocabflow.ai');
INSERT INTO "Subscription" ("id", "userId", "planId", "status", "currentPeriodEnd", "createdAt", "updatedAt")
SELECT 
  'sub-learner-vocabflow',
  "id",
  (SELECT "id" FROM "Plan" WHERE "tier" = 'PRO' LIMIT 1),
  'ACTIVE',
  '2099-12-31 23:59:59+00'::timestamptz,
  NOW(),
  NOW()
FROM "User" WHERE "email" = 'learner@vocabflow.ai';

UPDATE "User"
SET "role" = 'SUPER_ADMIN', "status" = 'ACTIVE'
WHERE "email" = 'admin@leximind.ai';

DELETE FROM "Subscription" WHERE "userId" = (SELECT "id" FROM "User" WHERE "email" = 'admin@leximind.ai');
INSERT INTO "Subscription" ("id", "userId", "planId", "status", "currentPeriodEnd", "createdAt", "updatedAt")
SELECT 
  'sub-admin-legacy',
  "id",
  (SELECT "id" FROM "Plan" WHERE "tier" = 'PRO' LIMIT 1),
  'ACTIVE',
  '2099-12-31 23:59:59+00'::timestamptz,
  NOW(),
  NOW()
FROM "User" WHERE "email" = 'admin@leximind.ai';
