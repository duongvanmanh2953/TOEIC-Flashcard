const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'apps', 'api', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

// 1. Add relations to User model
const userTarget = 'commentReactions    CommunityCommentReaction[]';
const userAdditions = `  commentReactions    CommunityCommentReaction[]

  // Module C: Custom Game Rooms (PROMPT 1)
  hostedRooms         CustomGameRoom[]          @relation("HostedRooms")
  roomParticipants    CustomRoomParticipant[]
  sentRoomInvites     CustomRoomInvitation[]    @relation("SentRoomInvites")
  receivedRoomInvites CustomRoomInvitation[]    @relation("ReceivedRoomInvites")

  // Module D: Comprehensive Grammar (PROMPT 2)
  grammarProgress     UserGrammarProgress[]

  // Module E: Handwriting & Script System (PROMPT 4)
  characterProgress   UserCharacterProgress[]

  // Module F: Smart Unified Progress & Recommendations (PROMPT 6)
  domainMasterySnapshots UserDomainMasterySnapshot[]
  recommendations        LearningRecommendation[]`;

if (!content.includes('hostedRooms         CustomGameRoom[]')) {
  content = content.replace(userTarget, userAdditions);
}

// 2. Add New Models and Enums to the end
const newModels = `

// =============================================================================
// USER-CREATED REALTIME GAME ROOMS (PROMPT 1)
// =============================================================================

enum RoomVisibility {
  PUBLIC
  PRIVATE
}

enum CustomRoomStatus {
  WAITING
  STARTING
  IN_PROGRESS
  ROUND_SUMMARY
  COMPLETED
  CANCELLED
  EXPIRED
}

enum QuestionSourceType {
  QUESTION_BANK
  VOCABULARY_DECK
  GRAMMAR_EXERCISES
  KNOWLEDGE_BASE
  SYSTEM_PRESET
}

model CustomGameRoom {
  id                  String             @id @default(uuid())
  roomCode            String             @unique
  hostUserId          String
  title               String
  description         String?
  languageId          String             @default("en")
  gameMode            GameModeType       @default(TRANSLATION_RUSH)
  visibility          RoomVisibility     @default(PUBLIC)
  passwordHash        String?
  status              CustomRoomStatus   @default(WAITING)

  sourceType          QuestionSourceType @default(SYSTEM_PRESET)
  sourceId            String?
  difficulty          String             @default("INTERMEDIATE")
  questionCount       Int                @default(10)
  maxPlayers          Int                @default(8)
  roundDurationSec    Int                @default(15)
  allowLateJoin       Boolean            @default(false)
  penaltyForWrong     Boolean            @default(false)
  shuffleQuestions    Boolean            @default(true)
  shuffleOptions      Boolean            @default(true)
  showAnswerAfterEach Boolean            @default(true)

  currentRound        Int                @default(0)
  startedAt           DateTime?
  finishedAt          DateTime?
  createdAt           DateTime           @default(now())
  updatedAt           DateTime           @updatedAt

  host                User               @relation("HostedRooms", fields: [hostUserId], references: [id], onDelete: Cascade)
  participants        CustomRoomParticipant[]
  invitations         CustomRoomInvitation[]

  @@index([visibility, status])
  @@index([hostUserId])
  @@index([createdAt])
}

model CustomRoomParticipant {
  id             String         @id @default(uuid())
  roomId         String
  userId         String
  isReady        Boolean        @default(false)
  isHost         Boolean        @default(false)
  joinedAt       DateTime       @default(now())
  leftAt         DateTime?
  finalScore     Int            @default(0)
  finalRank      Int?
  correctCount   Int            @default(0)

  room           CustomGameRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([roomId, userId])
  @@index([userId])
}

model CustomRoomInvitation {
  id             String         @id @default(uuid())
  roomId         String
  inviterUserId  String
  inviteeUserId  String
  status         String         @default("PENDING")
  createdAt      DateTime       @default(now())

  room           CustomGameRoom @relation(fields: [roomId], references: [id], onDelete: Cascade)
  inviter        User           @relation("SentRoomInvites", fields: [inviterUserId], references: [id], onDelete: Cascade)
  invitee        User           @relation("ReceivedRoomInvites", fields: [inviteeUserId], references: [id], onDelete: Cascade)

  @@index([inviteeUserId, status])
}

// =============================================================================
// COMPREHENSIVE GRAMMAR LEARNING ENGINE (PROMPT 2)
// =============================================================================

model GrammarCategory {
  id          String         @id @default(uuid())
  code        String         @unique
  title       String
  titleVi     String
  description String?
  languageId  String         @default("en")
  orderIndex  Int            @default(0)
  topics      GrammarTopic[]

  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model GrammarTopic {
  id          String                @id @default(uuid())
  categoryId  String
  title       String
  titleVi     String
  summary     String
  cefrLevel   CefrLevel             @default(B1)
  orderIndex  Int                   @default(0)
  category    GrammarCategory       @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  rules       GrammarRule[]
  exercises   GrammarExercise[]
  progress    UserGrammarProgress[]

  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  @@index([categoryId])
  @@index([cefrLevel])
}

model GrammarRule {
  id             String           @id @default(uuid())
  topicId        String
  title          String
  explanationMd  String
  structuresJson Json
  commonMistakes Json?
  orderIndex     Int              @default(0)
  topic          GrammarTopic     @relation(fields: [topicId], references: [id], onDelete: Cascade)
  examples       GrammarExample[]

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([topicId])
}

model GrammarExample {
  id          String      @id @default(uuid())
  ruleId      String
  sentence    String
  translation String
  breakdownMd String?
  audioUrl    String?
  rule        GrammarRule @relation(fields: [ruleId], references: [id], onDelete: Cascade)

  @@index([ruleId])
}

model GrammarExercise {
  id              String       @id @default(uuid())
  topicId         String
  questionText    String
  questionType    ExerciseType @default(FILL_IN_BLANK)
  options         Json?
  correctAnswer   String
  acceptedAnswers String[]     @default([])
  explanation     String?
  difficulty      Float        @default(2.5)
  topic           GrammarTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@index([topicId])
}

model UserGrammarProgress {
  id            String       @id @default(uuid())
  userId        String
  topicId       String
  masteryScore  Float        @default(0.0)
  attemptCount  Int          @default(0)
  correctCount  Int          @default(0)
  lastStudiedAt DateTime     @default(now())
  nextReviewAt  DateTime?
  stability     Float        @default(1.0)
  difficulty    Float        @default(3.0)

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic         GrammarTopic @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@unique([userId, topicId])
  @@index([userId, nextReviewAt])
}

// =============================================================================
// HANDWRITING & SCRIPT LEARNING ENGINE (PROMPT 4)
// =============================================================================

enum ScriptType {
  KANJI
  HIRAGANA
  KATAKANA
  HANZI_SIMPLIFIED
  HANZI_TRADITIONAL
  HANGUL
  CYRILLIC
  ARABIC
  THAI
}

model ScriptSystem {
  id          String          @id @default(uuid())
  code        ScriptType      @unique
  name        String
  languageId  String
  description String?
  characters  CharacterData[]
}

model CharacterData {
  id             String                  @id @default(uuid())
  scriptId       String
  literal        String
  strokeCount    Int
  readingsJson   Json
  meaningsJson   Json
  svgPaths       String[]
  radicals       String?
  jlptOrHskLevel String?
  script         ScriptSystem            @relation(fields: [scriptId], references: [id], onDelete: Cascade)
  userProgress   UserCharacterProgress[]

  @@unique([scriptId, literal])
  @@index([scriptId])
}

model UserCharacterProgress {
  id              String        @id @default(uuid())
  userId          String
  characterId     String
  strokeAccuracy  Float         @default(0.0)
  practiceCount   Int           @default(0)
  masteryScore    Float         @default(0.0)
  lastPracticedAt DateTime      @default(now())
  nextReviewAt    DateTime?

  user            User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  character       CharacterData @relation(fields: [characterId], references: [id], onDelete: Cascade)

  @@unique([userId, characterId])
  @@index([userId, nextReviewAt])
}

// =============================================================================
// SMART UNIFIED PROGRESS & LEARNING RECOMMENDATIONS (PROMPT 6)
// =============================================================================

model UserDomainMasterySnapshot {
  id                String   @id @default(uuid())
  userId            String
  unifiedScore      Float    @default(0.0)
  vocabScore        Float    @default(0.0)
  grammarScore      Float    @default(0.0)
  writingScore      Float    @default(0.0)
  listeningScore    Float    @default(0.0)
  examScore         Float    @default(0.0)
  activeStreak      Int      @default(0)
  dailyWordsLearned Int      @default(0)
  retentionRate     Float    @default(0.0)
  weakAreasJson     Json?
  snapshotDate      DateTime @default(now())

  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, snapshotDate])
}

model LearningRecommendation {
  id          String   @id @default(uuid())
  userId      String
  domain      String
  title       String
  reason      String
  targetUrl   String
  priority    Int      @default(1)
  isCompleted Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isCompleted])
}
`;

if (!content.includes('model CustomGameRoom')) {
  content += newModels;
}

fs.writeFileSync(schemaPath, content, 'utf8');
console.log('Schema successfully updated with all upgrade models!');

