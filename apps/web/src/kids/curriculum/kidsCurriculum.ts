/**
 * kidsCurriculum.ts
 * Hierarchical Learning Roadmap & Curriculum Data for Kids English Learning System
 * Level -> World -> Chapter -> Lesson -> Activity
 *
 * Rules:
 * - Content is STRICTLY English (English words, sentences, dialogues, phonics)
 * - UI titles can be translated via i18n keys
 * - SVG vector illustrations for crystal clear child-safe visuals
 */

export type ActivityType =
  | 'flashcard'
  | 'listen'
  | 'speak'
  | 'match'
  | 'multiple_choice'
  | 'story'
  | 'game'
  | 'review';

export interface KidActivity {
  id: string;
  type: ActivityType;
  title: string;
  instruction: string;
  targetWord?: string;
  targetSentence?: string;
  phonetic?: string;
  imageSvg?: string; // Inline SVG icon/illustration identifier
  emoji?: string;
  options?: Array<{
    id: string;
    text: string;
    imageSvg?: string;
    emoji?: string;
    isCorrect: boolean;
  }>;
  matchPairs?: Array<{
    id: string;
    word: string;
    matchText: string;
    emoji: string;
  }>;
  storyScene?: {
    narratorSpeech: string;
    questionPrompt: string;
    expectedReply: string;
    backgroundSvg: string;
  };
}

export interface KidLesson {
  id: string;
  chapterId: string;
  worldId: string;
  order: number;
  title: string; // English
  titleKey?: string; // i18n
  description: string;
  emoji: string;
  bannerColor: string;
  activities: KidActivity[];
  requiredStarsToUnlock?: number;
}

export interface KidChapter {
  id: string;
  worldId: string;
  order: number;
  title: string;
  titleKey: string;
  icon: string;
  description: string;
  lessons: KidLesson[];
}

export interface KidWorld {
  id: string;
  level: number; // 1 = Starter (3-6 yrs), 2 = Explorer (7-10 yrs)
  title: string;
  titleKey: string;
  theme: string;
  themeColor: string;
  bgGradient: string;
  icon: string;
  description: string;
  chapters: KidChapter[];
}

export const KIDS_CURRICULUM: KidWorld[] = [
  // =========================================================================
  // WORLD 1: MY FIRST ENGLISH (Jungle & Safari)
  // =========================================================================
  {
    id: 'world-1-jungle',
    level: 1,
    title: 'My First English',
    titleKey: 'kids.world1.title',
    theme: 'Jungle Adventure',
    themeColor: '#10b981',
    bgGradient: 'from-emerald-400 via-teal-500 to-emerald-600',
    icon: '🌴',
    description: 'Explore the happy jungle! Learn greetings, colors, numbers & friendly animals.',
    chapters: [
      {
        id: 'w1-c1-greetings',
        worldId: 'world-1-jungle',
        order: 1,
        title: 'Hello & Friendly Greetings',
        titleKey: 'kids.world1.c1.title',
        icon: '👋',
        description: 'Say hello and introduce yourself with big smiles!',
        lessons: [
          {
            id: 'lesson-1-hello',
            chapterId: 'w1-c1-greetings',
            worldId: 'world-1-jungle',
            order: 1,
            title: 'Hello! Wave & Smile',
            description: 'Learn how to greet your new friends!',
            emoji: '👋',
            bannerColor: '#3b82f6',
            activities: [
              {
                id: 'act-1-1',
                type: 'flashcard',
                title: 'New Word: Hello',
                instruction: 'Listen and repeat after Bobby!',
                targetWord: 'Hello',
                phonetic: '/həˈloʊ/',
                targetSentence: 'Hello! Nice to meet you.',
                emoji: '👋',
              },
              {
                id: 'act-1-2',
                type: 'listen',
                title: 'Listen & Pick',
                instruction: 'Which friendly friend says "Hello"?',
                targetWord: 'Hello',
                emoji: '👋',
                options: [
                  { id: 'opt-1', text: 'Hello', emoji: '👋', isCorrect: true },
                  { id: 'opt-2', text: 'Sleep', emoji: '😴', isCorrect: false },
                  { id: 'opt-3', text: 'Stop', emoji: '🛑', isCorrect: false },
                ],
              },
              {
                id: 'act-1-3',
                type: 'speak',
                title: 'Your Turn to Speak!',
                instruction: 'Tap the microphone and say "Hello" loud and proud!',
                targetWord: 'Hello',
                targetSentence: 'Hello',
                emoji: '🎙️',
              },
              {
                id: 'act-1-4',
                type: 'multiple_choice',
                title: 'Friendly Quiz',
                instruction: 'What do you say when meeting Bobby?',
                targetWord: 'Hello',
                emoji: '🐻',
                options: [
                  { id: 'mc-1', text: 'Hello, Bobby!', emoji: '👋', isCorrect: true },
                  { id: 'mc-2', text: 'Good night', emoji: '🌙', isCorrect: false },
                  { id: 'mc-3', text: 'No thanks', emoji: '🙅', isCorrect: false },
                ],
              },
            ],
          },
          {
            id: 'lesson-2-goodbye',
            chapterId: 'w1-c1-greetings',
            worldId: 'world-1-jungle',
            order: 2,
            title: 'Goodbye & See You!',
            description: 'Say goodbye nicely to your animal pals.',
            emoji: '👋',
            bannerColor: '#8b5cf6',
            activities: [
              {
                id: 'act-2-1',
                type: 'flashcard',
                title: 'New Word: Goodbye',
                instruction: 'Tap to listen to the word Goodbye!',
                targetWord: 'Goodbye',
                phonetic: '/ˌɡʊdˈbaɪ/',
                targetSentence: 'Goodbye, see you tomorrow!',
                emoji: '👋',
              },
              {
                id: 'act-2-2',
                type: 'speak',
                title: 'Speak: Goodbye',
                instruction: 'Tap the mic and say: "Goodbye"',
                targetWord: 'Goodbye',
                targetSentence: 'Goodbye',
                emoji: '🎙️',
              },
              {
                id: 'act-2-3',
                type: 'story',
                title: 'Jungle Story: Bobby waves goodbye',
                instruction: 'Listen to the story and answer Bobby!',
                emoji: '📖',
                storyScene: {
                  narratorSpeech: 'The sun is setting over the jungle. Bobby waves his paw. What does Bobby say?',
                  questionPrompt: 'Say: Goodbye!',
                  expectedReply: 'Goodbye',
                  backgroundSvg: 'sunset',
                },
              },
            ],
          },
          {
            id: 'lesson-3-name',
            chapterId: 'w1-c1-greetings',
            worldId: 'world-1-jungle',
            order: 3,
            title: 'My Name is...',
            description: 'Introduce your own special name!',
            emoji: '⭐',
            bannerColor: '#ec4899',
            activities: [
              {
                id: 'act-3-1',
                type: 'flashcard',
                title: 'Useful Sentence: My name is',
                instruction: 'Listen to Bobby introduce himself.',
                targetWord: 'My name is Bobby',
                phonetic: '/maɪ neɪm ɪz ˈbɒbi/',
                targetSentence: 'Hello, my name is Bobby the Bear!',
                emoji: '🐻',
              },
              {
                id: 'act-3-2',
                type: 'speak',
                title: 'Speak: What is your name?',
                instruction: 'Tap mic and say: "My name is friend"',
                targetWord: 'My name is friend',
                targetSentence: 'My name is friend',
                emoji: '🎙️',
              },
              {
                id: 'act-3-3',
                type: 'review',
                title: 'Chapter 1 Review Booster',
                instruction: 'Let us celebrate all 3 friendly greetings!',
                targetWord: 'Hello and Goodbye',
                emoji: '🎉',
              },
            ],
          },
        ],
      },
      {
        id: 'w1-c2-colors',
        worldId: 'world-1-jungle',
        order: 2,
        title: 'Magic Colors',
        titleKey: 'kids.world1.c2.title',
        icon: '🎨',
        description: 'Paint the world with Red, Blue, Yellow and Green!',
        lessons: [
          {
            id: 'lesson-4-red-blue',
            chapterId: 'w1-c2-colors',
            worldId: 'world-1-jungle',
            order: 4,
            title: 'Red & Blue Friends',
            description: 'Red apples and blue ocean skies.',
            emoji: '🔴',
            bannerColor: '#ef4444',
            activities: [
              {
                id: 'act-4-1',
                type: 'flashcard',
                title: 'Color: Red',
                instruction: 'Look at the red ruby apple!',
                targetWord: 'Red',
                phonetic: '/rɛd/',
                targetSentence: 'The apple is bright red.',
                emoji: '🍎',
              },
              {
                id: 'act-4-2',
                type: 'flashcard',
                title: 'Color: Blue',
                instruction: 'Look at the deep blue ocean!',
                targetWord: 'Blue',
                phonetic: '/bluː/',
                targetSentence: 'The blue bird flies high.',
                emoji: '💙',
              },
              {
                id: 'act-4-3',
                type: 'match',
                title: 'Match the Colors',
                instruction: 'Connect each color with its picture!',
                emoji: '🧩',
                matchPairs: [
                  { id: 'm1', word: 'Red', matchText: 'Apple', emoji: '🍎' },
                  { id: 'm2', word: 'Blue', matchText: 'Sky', emoji: '🌊' },
                ],
              },
              {
                id: 'act-4-4',
                type: 'speak',
                title: 'Say: Blue Bird',
                instruction: 'Tap the mic and say "Blue"',
                targetWord: 'Blue',
                emoji: '🎙️',
              },
            ],
          },
          {
            id: 'lesson-5-yellow-green',
            chapterId: 'w1-c2-colors',
            worldId: 'world-1-jungle',
            order: 5,
            title: 'Yellow & Green Nature',
            description: 'Yellow sunshine and green jungle leaves.',
            emoji: '🟡',
            bannerColor: '#eab308',
            activities: [
              {
                id: 'act-5-1',
                type: 'flashcard',
                title: 'Color: Yellow',
                instruction: 'Yellow banana and yellow sunshine!',
                targetWord: 'Yellow',
                phonetic: '/ˈjɛloʊ/',
                targetSentence: 'The sun is warm and yellow.',
                emoji: '🍌',
              },
              {
                id: 'act-5-2',
                type: 'flashcard',
                title: 'Color: Green',
                instruction: 'Green frog on a green leaf!',
                targetWord: 'Green',
                phonetic: '/ɡriːn/',
                targetSentence: 'The green tree is tall.',
                emoji: '🍃',
              },
              {
                id: 'act-5-3',
                type: 'game',
                title: 'Find the Green Frog!',
                instruction: 'Quick! Tap the green circle before it hops away!',
                targetWord: 'Green',
                emoji: '🐸',
                options: [
                  { id: 'g1', text: 'Green', emoji: '🟢', isCorrect: true },
                  { id: 'g2', text: 'Red', emoji: '🔴', isCorrect: false },
                  { id: 'g3', text: 'Blue', emoji: '🔵', isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 'w1-c3-numbers',
        worldId: 'world-1-jungle',
        order: 3,
        title: 'Number Friends (1 to 5)',
        titleKey: 'kids.world1.c3.title',
        icon: '🔢',
        description: 'Count magical stars and jumping monkeys!',
        lessons: [
          {
            id: 'lesson-6-one-two-three',
            chapterId: 'w1-c3-numbers',
            worldId: 'world-1-jungle',
            order: 6,
            title: 'One, Two, Three!',
            description: 'Count 1, 2, 3 with happy claps!',
            emoji: '1️⃣',
            bannerColor: '#f97316',
            activities: [
              {
                id: 'act-6-1',
                type: 'flashcard',
                title: 'Number: One',
                instruction: 'One sun in the sky!',
                targetWord: 'One',
                phonetic: '/wʌn/',
                targetSentence: 'I see one big sun.',
                emoji: '☀️',
              },
              {
                id: 'act-6-2',
                type: 'flashcard',
                title: 'Number: Two',
                instruction: 'Two funny eyes!',
                targetWord: 'Two',
                phonetic: '/tuː/',
                targetSentence: 'Two eyes can see.',
                emoji: '👀',
              },
              {
                id: 'act-6-3',
                type: 'flashcard',
                title: 'Number: Three',
                instruction: 'Three yummy bananas!',
                targetWord: 'Three',
                phonetic: '/θriː/',
                targetSentence: 'Three bananas for monkey.',
                emoji: '🍌',
              },
              {
                id: 'act-6-4',
                type: 'speak',
                title: 'Speak: Three',
                instruction: 'Tap the mic and say: "Three"',
                targetWord: 'Three',
                emoji: '🎙️',
              },
            ],
          },
        ],
      },
      {
        id: 'w1-c4-animals',
        worldId: 'world-1-jungle',
        order: 4,
        title: 'Animal Kingdom',
        titleKey: 'kids.world1.c4.title',
        icon: '🦁',
        description: 'Meet Cat, Dog, Lion, Bird & Elephant!',
        lessons: [
          {
            id: 'lesson-7-pets',
            chapterId: 'w1-c4-animals',
            worldId: 'world-1-jungle',
            order: 7,
            title: 'Cat & Dog Companions',
            description: 'Meet playful furry friends at home!',
            emoji: '🐱',
            bannerColor: '#06b6d4',
            activities: [
              {
                id: 'act-7-1',
                type: 'flashcard',
                title: 'Animal: Cat',
                instruction: 'Listen to the cute cat purr!',
                targetWord: 'Cat',
                phonetic: '/kæt/',
                targetSentence: 'The little cat says meow.',
                emoji: '🐱',
              },
              {
                id: 'act-7-2',
                type: 'flashcard',
                title: 'Animal: Dog',
                instruction: 'The happy dog wags its tail!',
                targetWord: 'Dog',
                phonetic: '/dɔːɡ/',
                targetSentence: 'The dog loves to run and play.',
                emoji: '🐶',
              },
              {
                id: 'act-7-3',
                type: 'multiple_choice',
                title: 'Which pet says "Woof"?',
                instruction: 'Touch the picture of the Dog!',
                targetWord: 'Dog',
                emoji: '🐶',
                options: [
                  { id: 'a1', text: 'Dog', emoji: '🐶', isCorrect: true },
                  { id: 'a2', text: 'Cat', emoji: '🐱', isCorrect: false },
                  { id: 'a3', text: 'Fish', emoji: '🐟', isCorrect: false },
                ],
              },
            ],
          },
          {
            id: 'lesson-8-wild-animals',
            chapterId: 'w1-c4-animals',
            worldId: 'world-1-jungle',
            order: 8,
            title: 'Lion & Elephant Giants',
            description: 'Roar with Lion and stomp with Elephant!',
            emoji: '🐘',
            bannerColor: '#14b8a6',
            activities: [
              {
                id: 'act-8-1',
                type: 'flashcard',
                title: 'Animal: Lion',
                instruction: 'The brave king of the jungle!',
                targetWord: 'Lion',
                phonetic: '/ˈlaɪ.ən/',
                targetSentence: 'The golden lion can roar!',
                emoji: '🦁',
              },
              {
                id: 'act-8-2',
                type: 'flashcard',
                title: 'Animal: Elephant',
                instruction: 'Big elephant with a long trunk!',
                targetWord: 'Elephant',
                phonetic: '/ˈɛl.ə.fənt/',
                targetSentence: 'The elephant is strong and friendly.',
                emoji: '🐘',
              },
              {
                id: 'act-8-3',
                type: 'speak',
                title: 'Roar like a Lion!',
                instruction: 'Tap mic and say: "Lion"',
                targetWord: 'Lion',
                emoji: '🎙️',
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // WORLD 2: YUMMY FARM & FRUITS (Sunny Farm)
  // =========================================================================
  {
    id: 'world-2-farm',
    level: 1,
    title: 'Yummy Fruit Farm',
    titleKey: 'kids.world2.title',
    theme: 'Sunny Orchard',
    themeColor: '#f59e0b',
    bgGradient: 'from-amber-400 via-orange-500 to-amber-600',
    icon: '🍎',
    description: 'Harvest delicious apples, bananas, sweet mangoes and fresh milk on the farm!',
    chapters: [
      {
        id: 'w2-c1-fruits',
        worldId: 'world-2-farm',
        order: 1,
        title: 'Sweet Orchard Fruits',
        titleKey: 'kids.world2.c1.title',
        icon: '🍓',
        description: 'Pick juicy apples, sweet bananas & fresh oranges!',
        lessons: [
          {
            id: 'lesson-9-apple-banana',
            chapterId: 'w2-c1-fruits',
            worldId: 'world-2-farm',
            order: 1,
            title: 'Apple & Banana Harvest',
            description: 'Crisp red apples and sweet yellow bananas.',
            emoji: '🍎',
            bannerColor: '#ef4444',
            activities: [
              {
                id: 'act-9-1',
                type: 'flashcard',
                title: 'Fruit: Apple',
                instruction: 'Listen to the word Apple.',
                targetWord: 'Apple',
                phonetic: '/ˈæp.əl/',
                targetSentence: 'I like to eat a sweet red apple.',
                emoji: '🍎',
              },
              {
                id: 'act-9-2',
                type: 'flashcard',
                title: 'Fruit: Banana',
                instruction: 'Monkeys love yellow bananas!',
                targetWord: 'Banana',
                phonetic: '/bəˈnæn.ə/',
                targetSentence: 'The banana is long and yellow.',
                emoji: '🍌',
              },
              {
                id: 'act-9-3',
                type: 'speak',
                title: 'Speak: Apple',
                instruction: 'Tap the mic and say "Apple"!',
                targetWord: 'Apple',
                emoji: '🎙️',
              },
              {
                id: 'act-9-4',
                type: 'game',
                title: 'Catch the Apple!',
                instruction: 'Touch the sweet Apple!',
                targetWord: 'Apple',
                emoji: '🍎',
                options: [
                  { id: 'f1', text: 'Apple', emoji: '🍎', isCorrect: true },
                  { id: 'f2', text: 'Book', emoji: '📕', isCorrect: false },
                  { id: 'f3', text: 'Chair', emoji: '🪑', isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },

  // =========================================================================
  // WORLD 3: WONDER TOWN & BODY (Playground)
  // =========================================================================
  {
    id: 'world-3-town',
    level: 1,
    title: 'Playground & My Body',
    titleKey: 'kids.world3.title',
    theme: 'Wonder Playground',
    themeColor: '#6366f1',
    bgGradient: 'from-indigo-400 via-purple-500 to-indigo-600',
    icon: '⚽',
    description: 'Learn your head, eyes, ears, jump, run, and explore your school backpack!',
    chapters: [
      {
        id: 'w3-c1-body',
        worldId: 'world-3-town',
        order: 1,
        title: 'My Wonderful Body',
        titleKey: 'kids.world3.c1.title',
        icon: '👀',
        description: 'Touch your nose, blink your eyes and clap your hands!',
        lessons: [
          {
            id: 'lesson-10-head-eyes',
            chapterId: 'w3-c1-body',
            worldId: 'world-3-town',
            order: 1,
            title: 'Head, Eyes & Ears',
            description: 'Point and touch your head and ears!',
            emoji: '👦',
            bannerColor: '#8b5cf6',
            activities: [
              {
                id: 'act-10-1',
                type: 'flashcard',
                title: 'Body: Head',
                instruction: 'Nod your head up and down!',
                targetWord: 'Head',
                phonetic: '/hɛd/',
                targetSentence: 'Put your hands on your head.',
                emoji: '👦',
              },
              {
                id: 'act-10-2',
                type: 'flashcard',
                title: 'Body: Eyes',
                instruction: 'Blink your two eyes!',
                targetWord: 'Eyes',
                phonetic: '/aɪz/',
                targetSentence: 'My eyes can see bright colors.',
                emoji: '👀',
              },
              {
                id: 'act-10-3',
                type: 'speak',
                title: 'Speak: Eyes',
                instruction: 'Tap mic and say "Eyes"',
                targetWord: 'Eyes',
                emoji: '🎙️',
              },
            ],
          },
        ],
      },
    ],
  },
];

export type KidsWorld = KidWorld;
export type KidsChapter = KidChapter;
export type KidsLesson = KidLesson;
export type KidsActivity = KidActivity;
export const WORLDS_DATA = KIDS_CURRICULUM;
