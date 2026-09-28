import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Automatically locate and load unified root .env
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

import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('================================================================');
  console.log('🚨 VOCABFLOW / TOEICFLASHCARD COMPLETE SYSTEM WIPE 🚨');
  console.log('================================================================');
  console.log('Target: Delete ALL data, vocabulary, revenues, chats, quizzes, users');
  console.log('Exception: ADMIN & SUPER_ADMIN accounts and Admin Keypass ONLY.\n');

  // 1. Identify Admin Accounts to preserve
  const adminUsers = await prisma.user.findMany({
    where: {
      OR: [{ role: Role.ADMIN }, { role: Role.SUPER_ADMIN }],
    },
    select: { id: true, email: true, role: true, displayName: true },
  });

  if (!adminUsers || adminUsers.length === 0) {
    console.error('❌ ABORTED: No ADMIN or SUPER_ADMIN user found in database. Cannot proceed safely without an admin account.');
    process.exit(1);
  }

  const adminIds = adminUsers.map((a) => a.id);
  console.log(`🔒 Preserved Admin Accounts (${adminUsers.length}):`);
  adminUsers.forEach((a) => console.log(`   - ${a.email} [${a.role}] (ID: ${a.id})`));
  console.log('');

  console.log('🗑️  1. Purging Operational, Support, Chats, Feedback, Revenue...');
  await prisma.supportMessage.deleteMany({});
  await prisma.supportConversation.deleteMany({});
  await prisma.feedbackVote.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.paymentOrder.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.entitlementUsage.deleteMany({});
  await prisma.adminAnnouncement.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.aIInteraction.deleteMany({});
  await prisma.aIEvaluation.deleteMany({});
  await prisma.gameResult.deleteMany({});
  await prisma.bankAccessGrant.deleteMany({});

  console.log('🗑️  2. Purging Realtime Chats...');
  await prisma.chatMessage.deleteMany({});
  await prisma.conversationParticipant.deleteMany({});
  await prisma.conversation.deleteMany({});

  console.log('🗑️  3. Purging Exams, Attempts, Questions...');
  await prisma.examAnswer.deleteMany({});
  await prisma.examAttempt.deleteMany({});
  await prisma.examSaved.deleteMany({});
  await prisma.examLike.deleteMany({});
  await prisma.examDislike.deleteMany({});
  await prisma.examComment.deleteMany({});
  await prisma.examOption.deleteMany({});
  await prisma.examQuestion.deleteMany({});
  await prisma.exam.deleteMany({});

  console.log('🗑️  4. Purging Community Decks & Custom Quizzes...');
  await prisma.deckComment.deleteMany({});
  await prisma.deckLike.deleteMany({});
  await prisma.deckDislike.deleteMany({});
  await prisma.deckClone.deleteMany({});
  await prisma.communityWord.deleteMany({});
  await prisma.communityDeck.deleteMany({});
  await prisma.customQuizAttempt.deleteMany({});
  await prisma.customQuiz.deleteMany({});

  console.log('🗑️  5. Purging User Learning Brain, Goals & Achievements...');
  await prisma.reviewEvent.deleteMany({});
  await prisma.studySession.deleteMany({});
  await prisma.userVocabulary.deleteMany({});
  await prisma.learningGoal.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.vocabularyCaptureItem.deleteMany({});
  await prisma.vocabularyCapture.deleteMany({});
  await prisma.wordJourneyEvent.deleteMany({});
  await prisma.vocabularyConfusionPair.deleteMany({});
  await prisma.exercise.deleteMany({});
  await prisma.learningResource.deleteMany({});
  await prisma.gameQuestion.deleteMany({});

  console.log('🗑️  6. Purging 100% of Vocabulary, Meanings, Examples, Topics...');
  await prisma.vocabularyTopicItem.deleteMany({});
  await prisma.vocabularyTopic.deleteMany({});
  await prisma.wordRelation.deleteMany({});
  await prisma.exampleSentence.deleteMany({});
  await prisma.vocabularyMeaning.deleteMany({});
  const deletedVocab = await prisma.vocabulary.deleteMany({});
  console.log(`   -> Deleted ${deletedVocab.count} Vocabulary entries.`);

  console.log('🗑️  7. Purging Devices, Sessions, Risk Events, Logout OTPs...');
  await prisma.deviceLogoutOtp.deleteMany({});
  await prisma.deviceRiskEvent.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.userDevice.deleteMany({});

  console.log('🗑️  8. Purging Non-Admin Users...');
  await prisma.userStreak.deleteMany({});
  await prisma.userXP.deleteMany({});
  await prisma.userEncryptionKey.deleteMany({
    where: { userId: { notIn: adminIds } },
  });
  await prisma.userProfile.deleteMany({
    where: { userId: { notIn: adminIds } },
  });
  const deletedUsers = await prisma.user.deleteMany({
    where: { id: { notIn: adminIds } },
  });
  console.log(`   -> Deleted ${deletedUsers.count} regular users.`);

  console.log('✨ 9. Resetting Preserved Admin State (Clean Streak & XP, Intact Keypass)...');
  for (const adm of adminUsers) {
    await prisma.userStreak.upsert({
      where: { userId: adm.id },
      create: { userId: adm.id, currentStreak: 0, longestStreak: 0 },
      update: { currentStreak: 0, longestStreak: 0 },
    }).catch(() => {});

    await prisma.userXP.upsert({
      where: { userId: adm.id },
      create: { userId: adm.id, totalXP: 0, currentLevel: 1 },
      update: { totalXP: 0, currentLevel: 1 },
    }).catch(() => {});

    await prisma.userProfile.upsert({
      where: { userId: adm.id },
      create: {
        userId: adm.id,
        nativeLanguage: 'vi',
        englishLevel: 'B1',
        targetLevel: 'C1',
        learningGoal: 'System Administrator',
      },
      update: {},
    }).catch(() => {});
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      actorId: adminIds[0],
      action: 'CLI_COMPLETE_SYSTEM_WIPE',
      targetType: 'DATABASE',
      targetId: 'FULL_WIPE_KEEP_ADMIN',
      metadata: {
        timestamp: new Date().toISOString(),
        preservedAdminEmails: adminUsers.map((a) => a.email),
      },
    },
  }).catch(() => {});

  console.log('\n================================================================');
  console.log('✅ WIPE COMPLETE! 100% of Vocabulary, Revenue & Data Cleared!');
  console.log('   Preserved: Admin Account(s) and Security Keypass ONLY.');
  console.log('================================================================\n');
}

main()
  .catch((err) => {
    console.error('❌ Wipe failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
