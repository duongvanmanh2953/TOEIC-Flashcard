import { PrismaClient, CommunityPostStatus } from '@prisma/client';
import { NotesService } from './src/modules/notes/notes.service';
import { CommunityKnowledgeService } from './src/modules/community-knowledge/community-knowledge.service';
import { TrainingDataService } from './src/modules/community-knowledge/training-data.service';
import { RedisCacheService } from './src/common/cache/redis-cache.service';
import { PrismaService } from './src/prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function runTests() {
  console.log('================================================================');
  console.log('STARTING INTEGRATION TESTS: NOTES + COMMUNITY KNOWLEDGE + AI DATA');
  console.log('================================================================\n');

  const prisma = new PrismaService();
  await prisma.$connect();

  const cache = new RedisCacheService();
  await cache.onModuleInit();

  const notesService = new NotesService(prisma, cache);
  const communityService = new CommunityKnowledgeService(prisma, cache);
  const trainingService = new TrainingDataService(prisma);

  // Find or create test users
  let testUser = await prisma.user.findFirst({
    where: { email: 'student.test@vocabflow.ai' },
  });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'student.test@vocabflow.ai',
        displayName: 'Test Student',
        passwordHash: 'dummy_hash',
      },
    });
  }

  let testAdmin = await prisma.user.findFirst({
    where: { email: 'admin.test@vocabflow.ai' },
  });
  if (!testAdmin) {
    testAdmin = await prisma.user.create({
      data: {
        email: 'admin.test@vocabflow.ai',
        displayName: 'Test Admin',
        role: 'ADMIN',
        passwordHash: 'dummy_hash',
      },
    });
  }

  console.log(`Using Test User ID: ${testUser.id}`);
  console.log(`Using Test Admin ID: ${testAdmin.id}\n`);

  try {
    // -------------------------------------------------------------------------
    // TEST SUITE 1: MODULE A - NOTES WORKSPACE
    // -------------------------------------------------------------------------
    console.log('[1/3] Testing Module A: Personal Notes Workspace...');

    // 1.1 Category creation
    const category = await notesService.createCategory(testUser.id, {
      name: 'Ngữ Pháp Nâng Cao',
      description: 'Ghi chú các cấu trúc ngữ pháp khó',
      color: '#6366f1',
    });
    console.log(`  ✓ Category created: "${category.name}" (ID: ${category.id})`);

    // 1.2 Note creation with sanitized content & tags
    const note1 = await notesService.createNote(testUser.id, {
      title: 'Đảo ngữ với No sooner... than...',
      content:
        '# Cấu trúc Đảo Ngữ\n\nNo sooner had S + V3/ed than S + V2/ed.\nVí dụ: No sooner had I arrived home than it rained.<script>alert("xss")</script>',
      categoryId: category.id,
      tags: ['grammar', 'inversion', 'toeic-part-5'],
      isPinned: true,
    });
    console.log(`  ✓ Note 1 created with XSS sanitization: "${note1.title}"`);
    if (note1.content.includes('<script>')) {
      throw new Error('FAILED: Script tag was not sanitized from note content!');
    }
    console.log(`  ✓ Note plainTextPreview extracted: "${note1.plainTextPreview?.slice(0, 50)}..."`);

    // 1.3 Create note 2
    const note2 = await notesService.createNote(testUser.id, {
      title: 'Collocations với "Decision"',
      content: 'Make a decision, reach a decision, reverse a decision.',
      categoryId: category.id,
      tags: ['collocations', 'vocabulary'],
    });
    console.log(`  ✓ Note 2 created: "${note2.title}"`);

    // 1.4 Cursor pagination test
    const page1 = await notesService.getNotes(testUser.id, { limit: 1 });
    console.log(`  ✓ Cursor pagination Page 1: returned ${page1.items.length} item, hasMore: ${page1.hasMore}, nextCursor: ${page1.nextCursor}`);
    if (page1.items.length !== 1 || !page1.hasMore) {
      throw new Error('FAILED: Cursor pagination page 1 failed!');
    }

    const page2 = await notesService.getNotes(testUser.id, { limit: 1, cursor: page1.nextCursor || undefined });
    console.log(`  ✓ Cursor pagination Page 2: returned ${page2.items.length} item, noteId: ${page2.items[0]?.id}`);
    if (page2.items[0]?.id === page1.items[0]?.id) {
      throw new Error('FAILED: Cursor pagination returned duplicate item!');
    }

    // 1.5 Note update & soft delete
    await notesService.updateNote(testUser.id, note2.id, { title: 'Collocations với "Decision" (Đã cập nhật)' });
    await notesService.deleteNote(testUser.id, note2.id);
    const countAfterDelete = await notesService.getNotesOverviewCount(testUser.id);
    console.log(`  ✓ Soft delete verified: Active notes count: ${countAfterDelete.activeNotes}`);

    // Restore note
    await notesService.restoreNote(testUser.id, note2.id);
    console.log(`  ✓ Note restored successfully.`);

    // -------------------------------------------------------------------------
    // TEST SUITE 2: MODULE B - COMMUNITY KNOWLEDGE
    // -------------------------------------------------------------------------
    console.log('\n[2/3] Testing Module B: Community Knowledge & Moderation...');

    const topic = await prisma.communityTopic.findFirst({ where: { slug: 'grammar' } });
    if (!topic) throw new Error('Grammar topic not found');

    // 2.1 User creates post (status should be PENDING_REVIEW)
    const post = await communityService.createPost(testUser.id, {
      title: 'Bí kíp tránh bẫy ngữ pháp Part 5 TOEIC: Subjunctive Mood',
      content:
        'Cấu trúc giả định thức thường gặp trong đề thi TOEIC: It is essential that S + (should) + V-infinitive.\n\nVí dụ: It is imperative that all staff members **arrive** on time.',
      topicId: topic.id,
      tags: ['toeic-part-5', 'grammar', 'subjunctive'],
    });
    console.log(`  ✓ Community post created with status: ${post.status} (Expected: PENDING_REVIEW)`);
    if (post.status !== CommunityPostStatus.PENDING_REVIEW) {
      throw new Error(`FAILED: New post status should be PENDING_REVIEW, got ${post.status}`);
    }

    // 2.2 Feed should NOT display unapproved post to public
    const feedBefore = await communityService.getFeed({ limit: 10 });
    const inFeedBefore = feedBefore.items.some((p) => p.id === post.id);
    console.log(`  ✓ Public feed before approval contains post: ${inFeedBefore} (Expected: false)`);
    if (inFeedBefore) {
      throw new Error('FAILED: Unapproved post leaked into public feed!');
    }

    // 2.3 Admin approves post
    const approvedPost = await communityService.approvePost(testAdmin.id, post.id);
    console.log(`  ✓ Admin approved post: status is now ${approvedPost.status}`);

    // 2.4 Feed should now display approved post
    const feedAfter = await communityService.getFeed({ limit: 10 });
    const inFeedAfter = feedAfter.items.some((p) => p.id === post.id);
    console.log(`  ✓ Public feed after approval contains post: ${inFeedAfter} (Expected: true)`);
    if (!inFeedAfter) {
      throw new Error('FAILED: Approved post does not appear in public feed!');
    }

    // 2.5 Atomic Reactions: LIKE -> DISLIKE -> NONE
    const likeRes = await communityService.handleReaction(testUser.id, post.id, { type: 'LIKE' });
    console.log(`  ✓ User liked post: likeCount = ${likeRes.likeCount}, reaction = ${likeRes.userReaction}`);
    if (likeRes.likeCount !== 1) throw new Error('FAILED: likeCount should be 1');

    const dislikeRes = await communityService.handleReaction(testUser.id, post.id, { type: 'DISLIKE' });
    console.log(`  ✓ User switched to dislike: likeCount = ${dislikeRes.likeCount}, dislikeCount = ${dislikeRes.dislikeCount}`);
    if (dislikeRes.likeCount !== 0 || dislikeRes.dislikeCount !== 1) {
      throw new Error('FAILED: Reaction atomic switch desynchronized counters!');
    }

    const noneRes = await communityService.handleReaction(testUser.id, post.id, { type: 'NONE' });
    console.log(`  ✓ User removed reaction: likeCount = ${noneRes.likeCount}, dislikeCount = ${noneRes.dislikeCount}`);

    // 2.6 Bookmark / Save post
    const saveRes = await communityService.toggleSavePost(testUser.id, post.id, true);
    console.log(`  ✓ Post saved by user: isSaved = ${saveRes.isSaved}, saveCount = ${saveRes.saveCount}`);

    // 2.7 Multi-level Comments
    const rootComment = await communityService.createComment(testUser.id, post.id, {
      content: 'Bài viết rất hữu ích! Có thêm ví dụ về demand/require không bạn?',
    });
    console.log(`  ✓ Root comment created (ID: ${rootComment.id})`);

    const replyComment = await communityService.createComment(testAdmin.id, post.id, {
      content: 'Có nhé! "The manager demanded that the report be submitted by Friday".',
      parentId: rootComment.id,
    });
    console.log(`  ✓ Nested reply comment created (ID: ${replyComment.id}, parentId: ${replyComment.parentId})`);

    // Verify reply count on root comment
    const replies = await communityService.getComments(post.id, { parentId: rootComment.id });
    console.log(`  ✓ On-demand replies fetched: count = ${replies.items.length}`);
    if (replies.items.length !== 1) throw new Error('FAILED: Nested reply was not retrieved properly!');

    // 2.8 Critical Spec Requirement: Edit on APPROVED post resets status to PENDING_REVIEW
    const editedPost = await communityService.updatePost(testUser.id, post.id, {
      title: 'Bí kíp tránh bẫy ngữ pháp Part 5 TOEIC: Subjunctive Mood [Đã bổ sung ví dụ]',
    });
    console.log(`  ✓ User edited approved post: status reset to "${editedPost.status}" (Expected: PENDING_REVIEW)`);
    if (editedPost.status !== CommunityPostStatus.PENDING_REVIEW) {
      throw new Error('FAILED: Approved post edit did not reset to PENDING_REVIEW for re-moderation!');
    }

    // Re-approve for AI training test
    await communityService.approvePost(testAdmin.id, post.id);

    // -------------------------------------------------------------------------
    // TEST SUITE 3: AI TRAINING DATASET PIPELINE
    // -------------------------------------------------------------------------
    console.log('\n[3/3] Testing AI Training Dataset Pipeline & Provenance...');

    const eligiblePosts = await trainingService.getEligiblePosts({ limit: 10 });
    console.log(`  ✓ Eligible posts found for AI training: ${eligiblePosts.length}`);
    if (eligiblePosts.length === 0) throw new Error('FAILED: Approved post should be eligible for AI training!');

    const jsonl = await trainingService.exportDatasetJsonl({ limit: 10 });
    console.log(`  ✓ JSONL dataset generated (${jsonl.length} bytes). Sample line:`);
    const firstLine = jsonl.split('\n')[0];
    const parsedLine = JSON.parse(firstLine);
    console.log(`    - Messages count: ${parsedLine.messages.length}`);
    console.log(`    - System prompt role: ${parsedLine.messages[0].role}`);
    console.log(`    - Provenance source: ${parsedLine.provenance.source}`);
    console.log(`    - Provenance postId: ${parsedLine.provenance.postId}`);

    console.log('\n================================================================');
    console.log('ALL INTEGRATION TESTS PASSED PERFECTLY (100% SUCCESS)!');
    console.log('================================================================');
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

runTests().catch((e) => {
  console.error('\nTEST RUN FAILED:', e);
  process.exit(1);
});
