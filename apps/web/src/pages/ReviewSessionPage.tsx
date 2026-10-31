import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Zap,
  BookOpen,
  Layers,
  Volume2,
  HelpCircle,
  BrainCircuit,
  Filter,
  Flame,
  Award,
  ChevronRight,
  Bookmark,
  Check,
  Lock,
  LockOpen,
  Mic,
  PenTool,
  X,
  AlertCircle,
  Clock,
  Shuffle,
} from 'lucide-react';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { SpeechButton } from '../components/common/SpeechButton';
import { PronunciationPracticeCard } from '../components/audio/PronunciationPracticeCard';
import { VocabularyHandwritingPractice } from '../components/handwriting/VocabularyHandwritingPractice';
import { isHandwritingSupportedForLanguage } from '../config/languages';
import { useAuth } from '../contexts/AuthContext';
import { useLearningContext } from '../contexts/LearningContext';
import { CountryFlag } from '../components/language/CountryFlag';
import { LanguageFlashcard } from '../components/flashcard/LanguageFlashcard';

import {
  idbGetLocalDecks,
  idbGetWords,
  idbGetWordsByDeck,
  idbUpdateWordProgress,
  CachedWordItem,
  LocalDeck,
} from '../lib/idb';
import { WordDiagnosticModal } from '../components/vocabflow/WordDiagnosticModal';
import { VictoryStarModal } from '@vocabflow/shared';

export interface ReviewQueueItem {
  vocabularyId: string;
  word: string;
  pronunciation?: string;
  meaning: string;
  meaningVi: string;
  englishDefinition?: string;
  example?: string;
  exampleTranslation?: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  topic?: string;
  origin?: string;
  deckId?: string;
  deckTitle?: string;
  options: string[];
  correctAnswer: string;
  // Multi-language metadata
  article?: string;
  gender?: string;
  pinyin?: string;
  tone?: string;
  romaji?: string;
  transliteration?: string;
  script?: string;
  languageId?: string;
  // Spaced Repetition (FSRS-compatible) parameters
  dueAt: number;
  lastReviewedAt: number;
  reviewCount: number;
  correctCount: number;
  wrongCount: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  interval: number; // in days
  stability: number; // in days
  difficulty: number; // 1.0 - 10.0
  retrievability: number; // 0.0 - 1.0
  priorityScore: number;
}

export const DEFAULT_TOPIC_OPTIONS = [
  { id: 'ALL', label: 'Tất cả từ cần ôn (SRS Smart)', icon: Sparkles },
  { id: 'MEMORY_RESCUE', label: 'Giải cứu trí nhớ (Slipping Words)', icon: Flame },
  { id: 'MY_WORDS', label: 'Kho từ của tôi (Tất cả)', icon: Bookmark },
];

/**
 * FSRS / Spaced Repetition Priority Score Calculator
 * High score = high urgency to review right now
 */
export function calculateWordPriority(item: Partial<ReviewQueueItem>): number {
  const now = Date.now();
  const dueAt = item.dueAt || 0;
  const lastRev = item.lastReviewedAt || 0;
  const elapsedDays = lastRev > 0 ? (now - lastRev) / (1000 * 60 * 60 * 24) : 999;
  const stability = Math.max(0.5, item.stability || 1.0);
  const difficulty = Math.max(1.0, Math.min(10.0, item.difficulty || 5.0));
  const wrongCount = item.wrongCount || 0;
  const reviewCount = item.reviewCount || 0;
  const consecutiveCorrect = item.consecutiveCorrect || 0;

  // FSRS retrievability estimation: R = exp(-elapsed / (9 * stability))
  const retrievability = reviewCount > 0 ? Math.exp(-elapsedDays / (9 * stability)) : 0;

  let score = 0;

  // Priority 1: Due cards (dueAt <= now)
  if (dueAt <= now) {
    score += 50;
    const overdueHours = (now - dueAt) / (1000 * 60 * 60);
    score += Math.min(30, Math.max(0, overdueHours * 0.5));
  } else {
    // If future due, lower urgency
    const hoursUntilDue = (dueAt - now) / (1000 * 60 * 60);
    score -= Math.min(35, hoursUntilDue * 0.2);
  }

  // Priority 2: High risk of forgetting (low retrievability / slip risk)
  if (reviewCount > 0) {
    score += (1 - retrievability) * 35;
  }

  // Mistake history
  score += Math.min(25, wrongCount * 5);

  // Intrinsic difficulty
  score += (difficulty / 10) * 20;

  // Low stability (unstable memories need earlier rehearsal)
  score += 15 / (1 + stability);

  // Priority 3: New words (never reviewed)
  if (reviewCount === 0) {
    score += 20;
  }

  // Mastered words not due get penalized so user doesn't waste time
  if (reviewCount >= 3 && consecutiveCorrect >= 2 && dueAt > now) {
    score -= 40;
  }

  // Minor jitter (+/- 1.0) so identical priority scores don't appear in mechanical order
  score += Math.random() * 2 - 1.0;

  return score;
}

/**
 * Maps raw word object to structured ReviewQueueItem
 */
function mapToReviewItem(raw: any, defaultTopic = 'General', origin = 'DECK'): ReviewQueueItem {
  const v = raw.vocabulary || raw;
  const wordMeaning =
    v.meanings?.[0]?.meaning ||
    raw.meanings?.[0]?.meaning ||
    v.meaning ||
    v.meaningVi ||
    raw.meaning ||
    raw.meaningVi ||
    v.shortDefinition ||
    raw.shortDefinition ||
    v.definition ||
    raw.definition ||
    'Nghĩa từ vựng';

  const now = Date.now();
  const dueAt = raw.dueAt || v.dueAt || now - 1000;
  const lastReviewedAt = raw.lastReviewedAt || v.lastReviewedAt || 0;
  const reviewCount = raw.reviewCount || v.reviewCount || 0;
  const correctCount = raw.correctCount || v.correctCount || 0;
  const wrongCount = raw.wrongCount || v.wrongCount || 0;
  const consecutiveCorrect = raw.consecutiveCorrect || v.consecutiveCorrect || 0;
  const consecutiveWrong = raw.consecutiveWrong || v.consecutiveWrong || 0;
  const interval = raw.interval || v.interval || 1;
  const stability = raw.stability || v.stability || 1.0;
  const difficulty = raw.difficulty || v.difficulty || 5.0;

  const item: ReviewQueueItem = {
    vocabularyId: v.id || raw.id || `vocab_${Math.random()}`,
    word: v.word || raw.word || 'Vocabulary',
    pronunciation: v.phonetic || raw.phonetic || v.pronunciation || raw.pronunciation || '',
    meaning: wordMeaning,
    meaningVi: wordMeaning,
    englishDefinition: v.definition || raw.definition || '',
    example: v.examples?.[0]?.sentence || v.example || raw.example || '',
    exampleTranslation: v.examples?.[0]?.translation || v.exampleTranslation || raw.exampleTranslation || '',
    partOfSpeech: v.partOfSpeech || raw.partOfSpeech || 'n.',
    cefrLevel: v.cefrLevel || raw.cefrLevel || 'B1',
    topic: v.topic || raw.topic || defaultTopic,
    origin,
    deckId: raw.deckId || v.deckId,
    deckTitle: raw.deckName || v.deckName || defaultTopic,
    // Multi-language metadata
    article: v.article || raw.article,
    gender: v.gender || raw.gender,
    pinyin: v.pinyin || raw.pinyin,
    tone: v.tone || raw.tone,
    romaji: v.romaji || raw.romaji,
    transliteration: v.transliteration || raw.transliteration,
    script: v.script || raw.script,
    languageId: v.languageId || raw.languageId,
    options: raw.options && Array.isArray(raw.options) && raw.options.length >= 2
      ? raw.options
      : [wordMeaning],
    correctAnswer: raw.correctAnswer || wordMeaning,
    dueAt,
    lastReviewedAt,
    reviewCount,
    correctCount,
    wrongCount,
    consecutiveCorrect,
    consecutiveWrong,
    interval,
    stability,
    difficulty,
    retrievability: 1.0,
    priorityScore: 0,
  };

  item.priorityScore = calculateWordPriority(item);
  return item;
}

/**
 * Enriches review items with dynamic, realistic distractors from other words in the current session
 */
function enrichItemsWithOptions(queue: ReviewQueueItem[]): ReviewQueueItem[] {
  if (queue.length === 0) return queue;
  const allMeanings = queue.map((q) => q.meaning).filter(Boolean);

  return queue.map((item, idx) => {
    if (item.options && item.options.length >= 4 && item.options.includes(item.correctAnswer)) {
      return item;
    }

    const otherMeanings = Array.from(
      new Set(allMeanings.filter((m) => m.toLowerCase().trim() !== item.meaning.toLowerCase().trim()))
    );
    const distractors = otherMeanings.sort(() => Math.random() - 0.5).slice(0, 3);

    const fallbackPool = [
      'Khái niệm hoặc phương pháp phân tích',
      'Đặc điểm cấu trúc hoặc tính chất cốt lõi',
      'Mục tiêu cụ thể cần đạt được',
      'Quá trình trao đổi hoặc thảo luận nhóm',
      'Điều kiện thuận lợi để phát triển năng lực',
      'Trạng thái duy trì hoặc phát triển ổn định',
    ];

    while (distractors.length < 3) {
      const fb = fallbackPool.find((f) => f !== item.meaning && !distractors.includes(f));
      if (fb) distractors.push(fb);
      else distractors.push(`Ý nghĩa tham chiếu ${distractors.length + 1}`);
    }

    const quizOptions = [item.meaning, ...distractors].sort(() => Math.random() - 0.5);

    return {
      ...item,
      options: quizOptions,
      correctAnswer: item.meaning,
    };
  });
}

/**
 * Calculate Levenshtein distance between two strings for fuzzy spelling evaluation
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

export type ReviewStudyMode = 'flashcard' | 'quiz' | 'typing' | 'listening' | 'speaking' | 'handwriting';

export const ReviewSessionPage: React.FC = () => {
  const [diagnosticWordId, setDiagnosticWordId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { activeLanguage, recordStudyActivity } = useLearningContext();

  // Mode: Interactive Learning Modes (Flashcard, Quiz, Typing, Listening, Speaking, Handwriting)
  const initialModeParam = searchParams.get('mode') as ReviewStudyMode;
  const [studyMode, setStudyMode] = useState<ReviewStudyMode>(() => {
    if (
      initialModeParam &&
      ['flashcard', 'quiz', 'typing', 'listening', 'speaking', 'handwriting'].includes(initialModeParam)
    ) {
      return initialModeParam;
    }
    return 'flashcard';
  });


  // Typing test state
  const [typingInput, setTypingInput] = useState('');
  const [typingFeedback, setTypingFeedback] = useState<{
    status: 'correct' | 'typo' | 'wrong' | null;
    message: string;
    distance?: number;
  }>({ status: null, message: '' });

  // Listening test state
  const [listenSpeed, setListenSpeed] = useState<number>(1.0);
  const [listenFeedback, setListenFeedback] = useState<boolean | null>(null);
  const [selectedListeningWord, setSelectedListeningWord] = useState<string | null>(null);

  // Topic & Deck Selection
  const initialTopic =
    searchParams.get('type') === 'MEMORY_RESCUE'
      ? 'MEMORY_RESCUE'
      : searchParams.get('deckId')
        ? `deck_${searchParams.get('deckId')}`
        : searchParams.get('topic') || 'ALL';

  const [selectedTopic, setSelectedTopic] = useState<string>(initialTopic);
  const [topicOptions, setTopicOptions] = useState<any[]>(DEFAULT_TOPIC_OPTIONS);
  const [userDecks, setUserDecks] = useState<LocalDeck[]>([]);
  const [systemTopics, setSystemTopics] = useState<any[]>([]);

  // Review Queue states
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [transitionNotice, setTransitionNotice] = useState<string | null>(null);

  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
    xpEarned: 0,
  });

  // Quiz states
  const [session, setSession] = useState<any>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [confidence, setConfidence] = useState(4);
  const [feedback, setFeedback] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // General states
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [sessionMood, setSessionMood] = useState<'great' | 'good' | 'okay' | 'tired' | null>(null);
  const [showSmartBreak, setShowSmartBreak] = useState(false);
  const [showVoicePractice, setShowVoicePractice] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const sessionDurationRef = useRef<number>(Date.now());

  // Load user decks & system topics on mount or when language changes
  useEffect(() => {
    Promise.allSettled([
      idbGetLocalDecks(user?.id, activeLanguage.id),
      api.get('/community/my-decks', { params: { languageId: activeLanguage.id } }).catch(() => []),
      api.get('/vocabulary/topics', { params: { languageId: activeLanguage.id } }).catch(() => ({ data: [] })),
    ]).then(([localDecksRes, cloudDecksRes, topicsRes]) => {
      const localDecks: LocalDeck[] =
        localDecksRes.status === 'fulfilled' && Array.isArray(localDecksRes.value) ? localDecksRes.value : [];
      const cloudDecks: any[] =
        cloudDecksRes.status === 'fulfilled' && Array.isArray(cloudDecksRes.value) ? cloudDecksRes.value : [];
      const sysTopics: any[] =
        topicsRes.status === 'fulfilled' && topicsRes.value?.data ? topicsRes.value.data : [];

      const mergedMap = new Map<string, any>();
      for (const d of cloudDecks) mergedMap.set(d.id, d);
      for (const d of localDecks) {
        if (!mergedMap.has(d.id)) mergedMap.set(d.id, d);
      }
      const decks = Array.from(mergedMap.values());
      setUserDecks(decks);
      setSystemTopics(sysTopics);

      const opts: any[] = [
        { id: 'ALL', label: `Tất cả từ cần ôn (${activeLanguage.name} SRS)`, icon: Sparkles },
        { id: 'MEMORY_RESCUE', label: 'Giải cứu trí nhớ (Slipping Words)', icon: Flame },
        { id: 'MY_WORDS', label: 'Kho từ của tôi (Tất cả)', icon: Bookmark },
      ];

      if (decks.length > 0) {
        decks.forEach((d) => {
          opts.push({
            id: `deck_${d.id}`,
            deckId: d.id,
            deckTitle: d.title,
            label: `${d.title} (${d.wordCount || d.words?.length || 0} từ)`,
            icon: BookOpen,
            type: 'DECK',
          });
        });
      }

      if (sysTopics.length > 0) {
        sysTopics.forEach((st: any) => {
          opts.push({
            id: `topic_${st.slug}`,
            slug: st.slug,
            name: st.name,
            label: `${st.name} (${st._count?.items || 0} từ)`,
            icon: Layers,
            type: 'TOPIC',
          });
        });
      }

      setTopicOptions(opts);
    });
  }, [user?.id, activeLanguage.id]);

  // Smart Break Monitor: Trigger gentle reminder after 25 minutes of continuous study
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsedMinutes = (Date.now() - sessionDurationRef.current) / 60000;
      if (elapsedMinutes >= 25) {
        setShowSmartBreak(true);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Find next deck with reviewable words when current deck clears
  const findNextReviewableDeck = async (currentTopicKey: string) => {
    try {
      const [localDecks, allWords] = await Promise.all([
        idbGetLocalDecks(user?.id, activeLanguage.id),
        idbGetWords(user?.id, activeLanguage.id),
      ]);
      const cleanCurrentId = currentTopicKey.replace('deck_', '');

      const otherDecks = localDecks.filter(
        (d) => d.id !== cleanCurrentId && d.title !== currentTopicKey && `deck_${d.id}` !== currentTopicKey
      );

      for (const deck of otherDecks) {
        const deckWords = allWords.filter(
          (w) => w.deckId === deck.id || (w.deckName && w.deckName === deck.title)
        );
        if (deckWords.length > 0) {
          return { deck, words: deckWords };
        }
      }
    } catch (err) {
      console.warn('Next deck scan warning:', err);
    }
    return null;
  };

  // Load study items based on selected topic or deck
  const loadStudyItems = async (topicKey: string) => {
    setLoading(true);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSummary(null);
    setFeedback(null);
    setTransitionNotice(null);
    setSessionStats({ again: 0, hard: 0, good: 0, easy: 0, xpEarned: 0 });

    try {
      // 1. MEMORY RESCUE
      if (topicKey === 'MEMORY_RESCUE') {
        const res: any = await api.post('/reviews/memory-rescue/session', { languageId: activeLanguage.id }).catch(() => ({ data: { items: [] } }));
        if (res?.success && res.data?.items?.length > 0) {
          setSession(res.data.session);
          const mapped = res.data.items.map((item: any) => mapToReviewItem(item, 'Memory Rescue', 'MEMORY_RESCUE'));
          mapped.sort((a: ReviewQueueItem, b: ReviewQueueItem) => b.priorityScore - a.priorityScore);
          setItems(enrichItemsWithOptions(mapped));
        } else {
          // Fallback to local slipping words for this language
          const localWords = await idbGetWords(user?.id, activeLanguage.id);
          const slipping = localWords
            .filter((w) => (w.wrongCount || 0) > 0 || (w.stability || 1.0) < 1.5)
            .map((w) => mapToReviewItem(w, 'Memory Rescue', 'LOCAL'));
          slipping.sort((a, b) => b.priorityScore - a.priorityScore);
          setItems(enrichItemsWithOptions(slipping));
        }
      }
      // 2. MY WORDS (ALL)
      else if (topicKey === 'MY_WORDS') {
        let localWords = await idbGetWords(user?.id, activeLanguage.id);
        if (localWords.length === 0) {
          const cloudRes: any = await api.get(`/community/my-words?filter=ALL&languageId=${activeLanguage.id}`).catch(() => []);
          localWords = Array.isArray(cloudRes) ? cloudRes : cloudRes?.data || [];
        }
        const mapped = localWords.map((item: any) => mapToReviewItem(item, 'My Words', 'WORD_BANK'));
        mapped.sort((a, b) => b.priorityScore - a.priorityScore);
        setItems(enrichItemsWithOptions(mapped));
      }
      // 3. SPECIFIC DECK OR QUERY DECK ID
      else if (
        topicKey.startsWith('deck_') ||
        searchParams.get('deckId') ||
        searchParams.get('topic')
      ) {
        const targetDeckId = topicKey.startsWith('deck_')
          ? topicKey.replace('deck_', '')
          : searchParams.get('deckId');

        const [localDecks, allLocalWords] = await Promise.all([
          idbGetLocalDecks(user?.id, activeLanguage.id),
          idbGetWords(user?.id, activeLanguage.id),
        ]);

        let matchedDeck = targetDeckId
          ? localDecks.find((d) => d.id === targetDeckId) || userDecks.find((d) => d.id === targetDeckId)
          : null;

        if (!matchedDeck) {
          matchedDeck =
            localDecks.find((d) => d.title === topicKey || d.id === topicKey) ||
            userDecks.find((d) => d.title === topicKey || d.id === topicKey);
        }

        let deckWords: any[] = [];
        const deckIdToSearch = matchedDeck?.id || targetDeckId;
        const deckTitleToSearch = matchedDeck?.title || topicKey;

        if (deckIdToSearch) {
          deckWords = await idbGetWordsByDeck(deckIdToSearch);
        }

        if (deckWords.length === 0) {
          deckWords = allLocalWords.filter(
            (w: any) =>
              (deckIdToSearch && w.deckId === deckIdToSearch) ||
              (w.deckName && w.deckName === deckTitleToSearch) ||
              (w.topic && w.topic === deckTitleToSearch)
          );
        }

        // If still empty and deckId is present, query Cloud API
        if (deckWords.length === 0 && deckIdToSearch) {
          const cloudDeck: any = await api.get(`/community/decks/${deckIdToSearch}`, { params: { languageId: activeLanguage.id } }).catch(() => null);
          if (cloudDeck?.words && cloudDeck.words.length > 0) {
            deckWords = cloudDeck.words;
          }
        }

        // If words exist, map them all and sort by Spaced Repetition priority
        if (deckWords.length > 0) {
          const mapped = deckWords.map((item: any) =>
            mapToReviewItem(item, deckTitleToSearch, 'DECK')
          );
          mapped.sort((a, b) => b.priorityScore - a.priorityScore);
          setItems(enrichItemsWithOptions(mapped));
        } else {
          // If no words found for deck, fall back to general vocabulary
          setItems([]);
        }
      }
      // 4. ALL DUE (SMART SRS SESSION)
      else if (topicKey === 'ALL') {
        const [localDecks, allLocalWords] = await Promise.all([
          idbGetLocalDecks(user?.id, activeLanguage.id),
          idbGetWords(user?.id, activeLanguage.id),
        ]);

        if (allLocalWords.length > 0) {
          const mapped = allLocalWords.map((item: any) => mapToReviewItem(item, 'General', 'WORD_BANK'));
          mapped.sort((a: ReviewQueueItem, b: ReviewQueueItem) => b.priorityScore - a.priorityScore);
          setItems(enrichItemsWithOptions(mapped));
        } else {
          // Fall back to server vocabulary session
          const res: any = await api.post('/reviews/smart-session', { limit: 50, languageId: activeLanguage.id }).catch(() => null);
          if (res?.success && res.data?.items?.length > 0) {
            setSession(res.data.session);
            const mapped = res.data.items.map((item: any) => mapToReviewItem(item, 'Smart Review', 'SYSTEM'));
            mapped.sort((a: ReviewQueueItem, b: ReviewQueueItem) => b.priorityScore - a.priorityScore);
            setItems(enrichItemsWithOptions(mapped));
          } else {
            const vocabRes: any = await api.get('/vocabulary', { params: { limit: 50, languageId: activeLanguage.id } }).catch(() => ({ data: { items: [] } }));
            const raw = vocabRes.data?.items || vocabRes.data || [];
            const mapped = raw.map((v: any) => mapToReviewItem(v, 'Vocabulary', 'VOCABULARY'));
            mapped.sort((a: ReviewQueueItem, b: ReviewQueueItem) => b.priorityScore - a.priorityScore);
            setItems(enrichItemsWithOptions(mapped));
          }
        }
      }
      // 5. TOPIC SLUG
      else {
        const cleanSlug = topicKey.startsWith('topic_') ? topicKey.replace('topic_', '') : topicKey;
        const res: any = await api.get('/vocabulary', { params: { topic: cleanSlug, limit: 100, languageId: activeLanguage.id } }).catch(() => ({ data: { items: [] } }));
        const rawList = res?.data?.items || res?.data || [];
        const totalPages = res?.meta?.pagination?.totalPages || res?.data?.pagination?.totalPages || 1;

        let allWords = [...rawList];
        if (totalPages > 1) {
          const nextPages = await Promise.allSettled(
            Array.from({ length: Math.min(totalPages, 5) - 1 }, (_, i) =>
              api.get('/vocabulary', { params: { topic: cleanSlug, page: i + 2, limit: 100, languageId: activeLanguage.id } })
            )
          );
          nextPages.forEach((p) => {
            if (p.status === 'fulfilled') {
              const pItems = p.value?.data?.items || p.value?.data || [];
              allWords.push(...pItems);
            }
          });
        }

        const mapped = allWords.map((v: any) => mapToReviewItem(v, cleanSlug, 'TOPIC'));
        mapped.sort((a, b) => b.priorityScore - a.priorityScore);
        setItems(enrichItemsWithOptions(mapped));
      }

      startTimeRef.current = Date.now();
    } catch (err) {
      console.error('Failed to load study items', err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudyItems(selectedTopic);
  }, [selectedTopic, activeLanguage.id, user?.id]);

  const currentItem = items[currentIndex];

  // Helper for Cloze example
  const getClozeSentence = (sentence?: string, word?: string) => {
    if (!sentence || !word) return '';
    const regex = new RegExp(`\\b${word}\\w*\\b`, 'gi');
    return sentence.replace(regex, '__________');
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (summary) return;

      if (studyMode === 'flashcard') {
        if (e.code === 'Space') {
          e.preventDefault();
          setIsFlipped((prev) => !prev);
        } else if (['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const ratings: Array<'AGAIN' | 'HARD' | 'GOOD' | 'EASY'> = ['AGAIN', 'HARD', 'GOOD', 'EASY'];
          const r = ratings[parseInt(e.key, 10) - 1];
          handleRateFlashcard(r);
        }
      } else {
        // Quiz shortcuts
        if (['1', '2', '3', '4'].includes(e.key) && currentItem?.options && !feedback) {
          const optIndex = parseInt(e.key, 10) - 1;
          if (currentItem.options[optIndex]) {
            handleQuizSubmit(currentItem.options[optIndex]);
          }
        } else if (e.key === 'Enter' && feedback) {
          handleNextQuiz();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [studyMode, isFlipped, currentItem, feedback, summary, currentIndex, items]);

  // Handle Flashcard Rating & SRS Interval Update
  const handleRateFlashcard = async (rating: 'AGAIN' | 'HARD' | 'GOOD' | 'EASY') => {
    if (!currentItem) return;

    const qualityMap = { AGAIN: 1, HARD: 2, GOOD: 4, EASY: 5 };
    const xpMap = { AGAIN: 5, HARD: 10, GOOD: 15, EASY: 20 };
    const xp = xpMap[rating];

    // Optimistic stats
    setSessionStats((prev) => ({
      ...prev,
      [rating.toLowerCase()]: (prev as any)[rating.toLowerCase()] + 1,
      xpEarned: prev.xpEarned + xp,
    }));

    const now = Date.now();
    let updatedInterval = currentItem.interval;
    let updatedStability = currentItem.stability;
    let updatedDifficulty = currentItem.difficulty;
    let updatedConsecutiveCorrect = currentItem.consecutiveCorrect;
    let updatedConsecutiveWrong = currentItem.consecutiveWrong;
    let updatedWrongCount = currentItem.wrongCount;
    let updatedCorrectCount = currentItem.correctCount;
    let updatedDueAt = currentItem.dueAt;
    let nextStatus = 'LEARNING';

    if (rating === 'AGAIN') {
      // User forgot or failed recall: re-queue card
      updatedWrongCount += 1;
      updatedConsecutiveWrong += 1;
      updatedConsecutiveCorrect = 0;
      updatedStability = Math.max(0.5, updatedStability * 0.5);
      updatedDifficulty = Math.min(10.0, updatedDifficulty + 1.0);
      updatedInterval = 1;
      updatedDueAt = now + 10 * 60 * 1000; // repeat soon
      nextStatus = 'LEARNING';
    } else if (rating === 'HARD') {
      updatedCorrectCount += 1;
      updatedConsecutiveWrong = 0;
      updatedInterval = Math.max(1, Math.round(updatedInterval * 1.2));
      updatedStability = Math.max(1.0, updatedStability * 1.1);
      updatedDifficulty = Math.min(10.0, updatedDifficulty + 0.3);
      updatedDueAt = now + updatedInterval * 86400000;
      nextStatus = 'REVIEW';
    } else if (rating === 'GOOD') {
      updatedCorrectCount += 1;
      updatedConsecutiveCorrect += 1;
      updatedConsecutiveWrong = 0;
      updatedInterval = Math.max(1, Math.round(updatedInterval * 2.5));
      updatedStability = updatedStability * 1.8;
      updatedDueAt = now + updatedInterval * 86400000;
      nextStatus = updatedConsecutiveCorrect >= 3 ? 'MASTERED' : 'REVIEW';
    } else if (rating === 'EASY') {
      updatedCorrectCount += 1;
      updatedConsecutiveCorrect += 1;
      updatedConsecutiveWrong = 0;
      updatedInterval = Math.max(2, Math.round(updatedInterval * 4.0));
      updatedStability = updatedStability * 2.5;
      updatedDifficulty = Math.max(1.0, updatedDifficulty - 1.0);
      updatedDueAt = now + updatedInterval * 86400000;
      nextStatus = 'MASTERED';
    }

    // Persist locally in IndexedDB
    if (currentItem.vocabularyId) {
      await idbUpdateWordProgress(currentItem.vocabularyId, {
        dueAt: updatedDueAt,
        lastReviewedAt: now,
        reviewCount: (currentItem.reviewCount || 0) + 1,
        correctCount: updatedCorrectCount,
        wrongCount: updatedWrongCount,
        consecutiveCorrect: updatedConsecutiveCorrect,
        consecutiveWrong: updatedConsecutiveWrong,
        interval: updatedInterval,
        stability: updatedStability,
        difficulty: updatedDifficulty,
        status: nextStatus,
      });
    }

    // Record study activity in multi-language LearningContext
    recordStudyActivity(1, rating !== 'AGAIN', 1);

    // Post review answer if cloud session exists
    if (session?.id) {
      try {
        await api.post(`/reviews/${session.id}/answer`, {
          vocabularyId: currentItem.vocabularyId,
          answer: currentItem.word,
          confidence: qualityMap[rating],
          responseTimeMs: Date.now() - startTimeRef.current,
        });
      } catch {
        // continue optimistically
      }
    }

    setIsFlipped(false);
    startTimeRef.current = Date.now();

    const updatedCurrentItem: ReviewQueueItem = {
      ...currentItem,
      dueAt: updatedDueAt,
      lastReviewedAt: now,
      reviewCount: (currentItem.reviewCount || 0) + 1,
      correctCount: updatedCorrectCount,
      wrongCount: updatedWrongCount,
      consecutiveCorrect: updatedConsecutiveCorrect,
      consecutiveWrong: updatedConsecutiveWrong,
      interval: updatedInterval,
      stability: updatedStability,
      difficulty: updatedDifficulty,
    };

    // QUEUE LOGIC: If AGAIN, re-insert card 2-3 positions ahead in the active queue
    if (rating === 'AGAIN') {
      const newItems = [...items];
      newItems.splice(currentIndex, 1);
      const reInsertPos = Math.min(currentIndex + 2, newItems.length);
      newItems.splice(reInsertPos, 0, updatedCurrentItem);
      setItems(newItems);
      // Stay at currentIndex which now points to the next item
      return;
    }

    // If HARD, GOOD, EASY: card is cleared from current queue!
    if (currentIndex + 1 < items.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Finished current deck/topic! Check if another deck has reviewable words
      const nextDeckInfo = await findNextReviewableDeck(selectedTopic);
      if (nextDeckInfo) {
        setTransitionNotice(
          `🎉 Hoàn thành kho "${currentItem.deckTitle || selectedTopic}"! Tự động chuyển tiếp sang kho "${nextDeckInfo.deck.title}" còn ${nextDeckInfo.words.length} từ...`
        );
        setTimeout(() => setTransitionNotice(null), 4000);
        const nextQueue = nextDeckInfo.words.map((w) => mapToReviewItem(w, nextDeckInfo.deck.title, 'DECK'));
        nextQueue.sort((a, b) => b.priorityScore - a.priorityScore);
        setItems(enrichItemsWithOptions(nextQueue));
        setCurrentIndex(0);
        setSelectedTopic(`deck_${nextDeckInfo.deck.id}`);
        return;
      }

      // Truly no reviewable words remain across all topics!
      const totalReviews = sessionStats.again + sessionStats.hard + sessionStats.good + sessionStats.easy + 1;
      setSummary({
        totalQuestions: totalReviews,
        xpEarned: sessionStats.xpEarned + xp,
        accuracy: Math.round(((sessionStats.good + sessionStats.easy + 1) / totalReviews) * 100),
      });
      if (session?.id) {
        api.post(`/reviews/${session.id}/complete`).catch(() => { });
      }
    }
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    handleRateFlashcard(rating.toUpperCase() as any);
  };

  // Handle Quiz submit
  const handleQuizSubmit = (answer: string) => {
    setUserAnswer(answer);
    setSubmitting(true);
    const cleanUser = answer.trim().toLowerCase();
    const cleanCorrect = (currentItem.correctAnswer || currentItem.meaningVi || currentItem.meaning || '').trim().toLowerCase();

    const isCorrect =
      cleanUser === cleanCorrect ||
      cleanCorrect.includes(cleanUser) ||
      cleanUser.includes(cleanCorrect);

    setFeedback({
      isCorrect,
      correctAnswer: currentItem.correctAnswer || currentItem.meaningVi || currentItem.meaning,
      explanation: currentItem.englishDefinition || currentItem.meaningVi || currentItem.meaning,
    });
    setSubmitting(false);
  };

  const handleNextQuiz = async () => {
    const wasCorrect = feedback?.isCorrect;
    setFeedback(null);
    setUserAnswer('');
    setShowHint(false);
    startTimeRef.current = Date.now();
    await handleRateFlashcard(wasCorrect ? 'GOOD' : 'AGAIN');
  };

  // Typing mode handlers (PROMPT 3)
  const handleTypingSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentItem || !typingInput.trim() || typingFeedback.status) return;

    const cleanInput = typingInput.trim().toLowerCase();
    const cleanWord = currentItem.word.trim().toLowerCase();
    const dist = getLevenshteinDistance(cleanInput, cleanWord);

    if (dist === 0) {
      setTypingFeedback({
        status: 'correct',
        message: 'Hoàn hảo! Bạn đã nhớ chính xác 100% chính tả từ này. (+15 XP)',
        distance: 0,
      });
    } else if (dist === 1) {
      setTypingFeedback({
        status: 'typo',
        message: `Gần chính xác! Chỉ khác 1 ký tự typo (Bạn gõ "${typingInput}", từ đúng là "${currentItem.word}").`,
        distance: 1,
      });
    } else {
      setTypingFeedback({
        status: 'wrong',
        message: `Chưa chính xác! Từ đúng là: "${currentItem.word}".`,
        distance: dist,
      });
    }
  };

  const handleNextTyping = async () => {
    const wasCorrect = typingFeedback.status === 'correct' || typingFeedback.status === 'typo';
    setTypingInput('');
    setTypingFeedback({ status: null, message: '' });
    await handleRateFlashcard(wasCorrect ? 'GOOD' : 'AGAIN');
  };

  // Listening mode handlers (PROMPT 3)
  const handlePlayListening = () => {
    if (!currentItem) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentItem.word);
      utterance.lang = activeLanguage?.speechLocale || 'en-US';
      utterance.rate = listenSpeed;
      window.speechSynthesis.speak(utterance);
    }
  };

  const listeningWords = useMemo(() => {
    if (!currentItem) return [];
    const otherWords = items
      .filter((it, idx) => idx !== currentIndex && it.word.toLowerCase() !== currentItem.word.toLowerCase())
      .map((it) => it.word);
    const distractors = Array.from(new Set(otherWords)).sort(() => Math.random() - 0.5).slice(0, 3);
    return [currentItem.word, ...distractors].sort(() => Math.random() - 0.5);
  }, [currentItem, items, currentIndex]);

  const handleListeningSelect = (opt: string) => {
    if (listenFeedback !== null || !currentItem) return;
    const isCorrect = opt.trim().toLowerCase() === currentItem.word.trim().toLowerCase();
    setSelectedListeningWord(opt);
    setListenFeedback(isCorrect);
  };

  const handleNextListening = async () => {
    const wasCorrect = Boolean(listenFeedback);
    setListenFeedback(null);
    setSelectedListeningWord(null);
    await handleRateFlashcard(wasCorrect ? 'GOOD' : 'AGAIN');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        <p className="text-xs font-semibold text-slate-500">Đang khởi tạo thuật toán Spaced Repetition (FSRS)...</p>
      </div>
    );
  }

  // Summary Screen
  if (summary) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Bạn Đã Ôn Hết!
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Không còn từ vựng nào cần ôn lúc này. Các thẻ đã được cập nhật chu kỳ Spaced Repetition vào tương lai.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[11px] text-slate-400 font-bold uppercase">Lượt thẻ ôn</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {summary.totalQuestions}
              </p>
            </div>
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40">
              <p className="text-[11px] text-emerald-600 font-bold uppercase">Tỷ lệ nhớ</p>
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {summary.accuracy}%
              </p>
            </div>
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40">
              <p className="text-[11px] text-indigo-600 font-bold uppercase">XP Thưởng</p>
              <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                +{summary.xpEarned}
              </p>
            </div>
          </div>

          {/* Session Mood Feedback */}
          <div className="space-y-2 pt-1 text-left border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bạn cảm thấy phiên học này như thế nào?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'great', label: '😄 Tuyệt vời' },
                { id: 'good', label: '🙂 Rất tốt' },
                { id: 'okay', label: '😐 Vừa sức' },
                { id: 'tired', label: '😴 Hơi mệt' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSessionMood(m.id as any)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition border ${sessionMood === m.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {sessionMood && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 italic">
                ✓ Đã ghi nhận tâm trạng học để cá nhân hóa cường độ phiên kế tiếp.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={() => loadStudyItems(selectedTopic)}
              className="btn-glass-primary w-full !py-3 text-xs gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Ôn tập củng cố lại</span>
            </button>
            <button
              onClick={() => navigate('/word-bank')}
              className="btn-glass-secondary w-full !py-3 text-xs"
            >
              Xem Kho Từ Vựng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // All cards reviewed - Celebratory Victory Modal
  if (!currentItem) {
    return (
      <div className="py-12">
        <VictoryStarModal
          isOpen={true}
          title="HOÀN THÀNH PHIÊN ÔN TẬP SRS"
          subtitle={`Bạn đã củng cố toàn bộ từ vựng ${activeLanguage?.name || 'tiếng Anh'} đến hạn ôn tập hôm nay vào trí nhớ dài hạn.`}
          stars={3}
          xpEarned={50}
          stats={[
            { label: 'Từ đã ôn', value: `${items.length} từ` },
            { label: 'Ngôn ngữ', value: activeLanguage?.name || 'TOEIC' },
            { label: 'Độ bền SRS', value: '> 85%' },
          ]}
          onPlayAgain={() => setSelectedTopic('ALL')}
          onContinue={() => navigate('/word-bank')}
          playAgainText="Ôn Thêm Từ Khác"
          continueText="Về Kho Từ Vựng"
        />
      </div>
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / items.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in py-2">
      {/* Multi-topic Auto Transition Notice */}
      {transitionNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-800 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>{transitionNotice}</span>
        </div>
      )}

      {/* Smart Break Prompt */}
      {showSmartBreak && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-semibold">
              Bạn đang học rất tốt suốt 25 phút qua! Một khoảng nghỉ ngắn 3 phút sẽ giúp não bộ củng cố nơ-ron tốt hơn.
            </span>
          </div>
          <button
            onClick={() => setShowSmartBreak(false)}
            className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0 ml-2"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* Top Controls: Mode Switcher & Topic Selector */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 zen-mode-ambient">
        {/* Mode Switcher: Sleek, compact segmented bar */}
        <div className="w-full sm:w-auto overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <button
              onClick={() => setStudyMode('flashcard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'flashcard'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcard</span>
            </button>
            <button
              onClick={() => setStudyMode('quiz')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'quiz'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>Trắc nghiệm</span>
            </button>
            <button
              onClick={() => {
                setStudyMode('typing');
                setTypingInput('');
                setTypingFeedback({ status: null, message: '' });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'typing'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Luyện gõ</span>
            </button>
            <button
              onClick={() => {
                setStudyMode('listening');
                setListenFeedback(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'listening'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Luyện nghe</span>
            </button>
            <button
              onClick={() => setStudyMode('speaking')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'speaking'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                }`}
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Phát âm</span>
            </button>
            {isHandwritingSupportedForLanguage(activeLanguage?.id) && (
              <button
                onClick={() => setStudyMode('handwriting')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${studyMode === 'handwriting'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-slate-800/80'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/40'
                  }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Viết chữ</span>
              </button>
            )}
          </div>
        </div>


        {/* Topic Selector Custom Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase text-slate-400 shrink-0">Chủ đề:</span>
          <CustomDropdown
            value={selectedTopic}
            onChange={(val) => {
              setSelectedTopic(val);
              setSearchParams({ topic: val });
            }}
            options={topicOptions.map((opt) => ({
              value: opt.id,
              label: opt.label,
            }))}
            size="sm"
            className="w-52 sm:w-64"
          />
        </div>
      </div>

      {/* Memory Rescue Special Session Banner */}
      {selectedTopic === 'MEMORY_RESCUE' && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-indigo-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-200 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Phiên Giải Cứu Trí Nhớ (Memory Rescue) — Củng cố nơ-ron các từ vựng nguy cơ quên cao</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
            <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] uppercase font-black">
              SRS ACTIVE
            </span>
          </div>
        </div>
      )}

      {/* Progress Bar & Counter */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-700 dark:text-slate-300">
            Thẻ {currentIndex + 1} / {items.length}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold">
            {progressPercent}% tiến độ
          </span>
          {currentItem.deckTitle && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
              📁 {currentItem.deckTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-500" />
            <span>+{sessionStats.xpEarned} XP</span>
          </div>
          <button
            onClick={() => navigate('/word-bank')}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            ✕ Thoát
          </button>
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TACTILE 3D FLASHCARD INTERACTIVE LEARNING                        */}
      {/* ========================================================================= */}
      {studyMode === 'flashcard' && (
        <div className="space-y-4">
          {/* Multi-Language Generic Flashcard */}
          <LanguageFlashcard
            language={activeLanguage}
            item={{
              id: currentItem.vocabularyId,
              word: currentItem.word,
              meaning: currentItem.meaning || currentItem.meaningVi,
              definition: currentItem.englishDefinition,
              phonetic: currentItem.pronunciation,
              pronunciation: currentItem.pronunciation,
              partOfSpeech: currentItem.partOfSpeech,
              cefrLevel: currentItem.cefrLevel,
              topic: currentItem.topic,
              example: currentItem.example,
              exampleTranslation: currentItem.exampleTranslation,
              article: currentItem.article,
              gender: currentItem.gender,
              pinyin: currentItem.pinyin,
              tone: currentItem.tone,
              romaji: currentItem.romaji,
              transliteration: currentItem.transliteration,
              script: currentItem.script,
            }}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {/* Quick Voice Practice Modal Trigger & VocabFlow Diagnostic */}
          <div className="flex items-center justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setDiagnosticWordId(currentItem.vocabularyId)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Chẩn đoán vì sao hay quên</span>
            </button>

            <button
              type="button"
              onClick={() => setShowVoicePractice(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/10 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200/50 dark:border-slate-800 transition active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
            >
              <Mic className="w-3.5 h-3.5 text-rose-500" />
              <span>Luyện phát âm AI ({activeLanguage.name})</span>
            </button>
          </div>

          {/* Voice Practice & Recording Modal */}
          {showVoicePractice && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
              onClick={() => setShowVoicePractice(false)}
            >
              <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setShowVoicePractice(false)}
                  className="absolute -top-3 -right-3 z-10 p-2 rounded-full bg-slate-800 text-white border border-slate-700 shadow-md hover:bg-slate-700 transition"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
                <PronunciationPracticeCard
                  word={currentItem.word}
                  ipa={currentItem.pronunciation}
                  meaning={currentItem.meaningVi || currentItem.meaning}
                  lang={activeLanguage?.speechLocale || activeLanguage?.id}
                  languageName={activeLanguage?.name}
                  languageFlag={activeLanguage?.flag}
                />
              </div>
            </div>
          )}

          {/* SRS 4-Tier Evaluation Buttons */}
          <div className="p-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md space-y-2">
            <p className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Đánh giá mức độ ghi nhớ (Spaced Repetition FSRS):
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* AGAIN */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateFlashcard('AGAIN');
                }}
                className="p-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 dark:bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 transition text-left relative overflow-hidden backdrop-blur-sm active:scale-95 shadow-xs group"
                title="Chưa nhớ — Ôn lại trong phiên này"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <RotateCcw className="w-3 h-3 text-rose-500" />
                    Quên
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold">
                    [1]
                  </span>
                </div>
                <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80 font-medium mt-0.5 block">
                  Ôn lại ngay
                </span>
              </button>

              {/* HARD */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateFlashcard('HARD');
                }}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 hover:from-amber-500/25 hover:to-orange-500/20 dark:from-amber-500/20 dark:to-orange-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 transition text-left relative overflow-hidden backdrop-blur-md active:scale-95 shadow-sm group"
                title="Khá khó nhớ — Ôn lại sau 1-2 ngày"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                    Khó
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/25 text-amber-800 dark:text-amber-200 font-black border border-amber-500/30">
                    [2]
                  </span>
                </div>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 block">
                  1 - 2 ngày
                </span>
              </button>

              {/* GOOD */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateFlashcard('GOOD');
                }}
                className="p-3.5 rounded-2xl bg-indigo-500/10 hover:bg-indigo-500/20 dark:bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 transition text-left relative overflow-hidden backdrop-blur-sm active:scale-95 shadow-xs group"
                title="Nhớ tốt — Ôn lại sau 3-5 ngày"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Check className="w-3 h-3 text-indigo-500" />
                    Nhớ tốt
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold">
                    [3]
                  </span>
                </div>
                <span className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 font-medium mt-0.5 block">
                  3 - 5 ngày
                </span>
              </button>

              {/* EASY */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRateFlashcard('EASY');
                }}
                className="p-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 transition text-left relative overflow-hidden backdrop-blur-sm active:scale-95 shadow-xs group"
                title="Rất dễ — Ôn lại sau 7-14 ngày"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Rất dễ
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                    [4]
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium mt-0.5 block">
                  7 - 14 ngày
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: MULTIPLE CHOICE QUIZ & RESPONSE CHECKING                          */}
      {/* ========================================================================= */}
      {studyMode === 'quiz' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              {currentItem.topic} • {currentItem.cefrLevel}
            </span>
            <SpeechButton text={currentItem.word} lang={activeLanguage?.speechLocale || 'en-US'} />
          </div>

          <div className="text-center py-2 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {currentItem.word}
            </h2>
            {currentItem.pronunciation && (
              <p className="text-sm tabular-nums text-slate-400 font-semibold">{currentItem.pronunciation}</p>
            )}
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 pt-2">
              Chọn nghĩa đúng nhất của từ vựng trên trong ngữ cảnh:
            </p>
          </div>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(currentItem.options || []).map((opt: string, idx: number) => {
              const isSelected = userAnswer === opt;
              let btnClass =
                'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200';

              if (feedback) {
                if (opt.toLowerCase().trim() === feedback.correctAnswer.toLowerCase().trim()) {
                  btnClass =
                    'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else if (isSelected) {
                  btnClass =
                    'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={!!feedback || submitting}
                  onClick={() => handleQuizSubmit(opt)}
                  className={`p-4 rounded-2xl border text-left text-xs sm:text-sm transition flex items-center justify-between ${btnClass}`}
                >
                  <span>{opt}</span>
                  <span className="text-xs tabular-nums font-bold text-slate-400">[{idx + 1}]</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Continue */}
          {feedback && (
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                {feedback.isCorrect ? (
                  <span className="text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> Chính xác! +15 XP
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1.5">
                    <XCircle className="w-5 h-5" /> Chưa chính xác (thẻ sẽ được ôn lại)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300">{feedback.explanation}</p>
              <button
                onClick={handleNextQuiz}
                className="btn-glass-primary w-full !py-2.5 text-xs gap-2"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: TYPING / SPELLING TEST WITH LEVENSHTEIN FUZZY CHECK (PROMPT 3)   */}
      {/* ========================================================================= */}
      {studyMode === 'typing' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              {currentItem.topic} • Luyện Gõ Chính Tả
            </span>
            <span className="text-xs font-bold text-slate-400">
              Độ dài: {currentItem.word.length} ký tự
            </span>
          </div>

          <div className="text-center py-2 space-y-3">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400 block">
                Nghĩa tiếng Việt
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                "{currentItem.meaningVi || currentItem.meaning}"
              </h2>
            </div>

            {currentItem.example && (
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-medium">
                <strong>Ngữ cảnh:</strong>{' '}
                {currentItem.example.replace(new RegExp(currentItem.word, 'gi'), '______')}
              </div>
            )}
          </div>

          {/* Typing Input Form */}
          <form onSubmit={handleTypingSubmit} className="max-w-md mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                value={typingInput}
                onChange={(e) => setTypingInput(e.target.value)}
                placeholder="Gõ từ tiếng Anh chính xác..."
                autoFocus
                disabled={!!typingFeedback.status}
                className="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-base font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {!typingFeedback.status && (
              <button
                type="submit"
                disabled={!typingInput.trim()}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition disabled:opacity-50 cursor-pointer"
              >
                Kiểm Tra Chính Tả
              </button>
            )}
          </form>

          {/* Typing Feedback */}
          {typingFeedback.status && (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${typingFeedback.status === 'correct'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                  : typingFeedback.status === 'typo'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-800 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300'
                }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {typingFeedback.status === 'correct' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : typingFeedback.status === 'typo' ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span>{typingFeedback.message}</span>
              </div>

              <button
                onClick={handleNextTyping}
                className="btn-glass-primary w-full !py-2.5 text-xs gap-2"
              >
                <span>Từ tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 4: LISTENING COMPREHENSION WITH SPEED CONTROL (PROMPT 3)             */}
      {/* ========================================================================= */}
      {studyMode === 'listening' && (
        <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
              {currentItem.topic} • Luyện Nghe Phản Xạ
            </span>

            {/* Speed Control */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
              {[0.75, 1.0, 1.25].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setListenSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg transition ${listenSpeed === spd
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Big Speaker Button */}
          <div className="text-center py-6 space-y-4">
            <button
              onClick={handlePlayListening}
              className="w-20 h-20 rounded-3xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-purple-600/40 hover:scale-105 active:scale-95 transition cursor-pointer"
              title="Phát lại âm thanh"
            >
              <Volume2 className="w-9 h-9" />
            </button>
            <p className="text-xs font-bold text-slate-500">
              Nhấn loa để nghe audio phát âm chuẩn ({listenSpeed}x) và chọn từ tương ứng
            </p>
          </div>

          {/* Multiple choices: foreign words to identify */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {listeningWords.map((opt, idx) => {
              const isSelected = selectedListeningWord === opt;
              let btnClass = 'bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
              if (listenFeedback !== null) {
                if (opt.toLowerCase().trim() === currentItem.word.toLowerCase().trim()) {
                  btnClass = 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-300 font-bold';
                } else if (isSelected) {
                  btnClass = 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300';
                }
              }
              return (
                <button
                  key={idx}
                  disabled={listenFeedback !== null}
                  onClick={() => handleListeningSelect(opt)}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold text-left transition ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {listenFeedback !== null && (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-in fade-in ${listenFeedback
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-800 dark:text-rose-300'
                }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {listenFeedback ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <span>
                  {listenFeedback
                    ? 'Tuyệt vời! Bạn nghe rất chuẩn xác.'
                    : `Chưa đúng! Từ được phát âm là: "${currentItem.word}" (${currentItem.meaningVi || currentItem.meaning})`}
                </span>
              </div>

              <button
                onClick={handleNextListening}
                className="btn-glass-primary w-full !py-2.5 text-xs gap-2"
              >
                <span>Từ tiếp theo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 5: SPEAKING / PRONUNCIATION PRACTICE (PROMPT 3)                      */}
      {/* ========================================================================= */}
      {studyMode === 'speaking' && (
        <div className="space-y-4">
          <PronunciationPracticeCard
            word={currentItem.word}
            phonetic={currentItem.pronunciation || '/.../'}
            meaning={currentItem.meaningVi || currentItem.meaning}
            exampleSentence={currentItem.example}
            onComplete={() => {
              handleRating('good');
              if (currentIndex + 1 < items.length) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                handleNextQuiz();
              }
            }}
          />

          <div className="flex justify-end">
            <button
              onClick={() => {
                if (currentIndex + 1 < items.length) {
                  setCurrentIndex((prev) => prev + 1);
                } else {
                  handleNextQuiz();
                }
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-2"
            >
              <span>Bỏ qua từ này</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 6: HANDWRITING / VOCABULARY WRITING PRACTICE (TASK 1 & 2)           */}
      {/* ========================================================================= */}
      {studyMode === 'handwriting' && currentItem && (
        <VocabularyHandwritingPractice
          key={`hw-${currentItem.vocabularyId || currentItem.word}`}
          word={currentItem.word}
          meaning={currentItem.meaningVi || currentItem.meaning}
          pronunciation={currentItem.pronunciation}
          romaji={currentItem.romaji}
          pinyin={currentItem.pinyin}
          languageId={activeLanguage?.id}
          onWordComplete={(accuracy, isCorrect) => {
            // Progress recorded on onNextWord
          }}
          onNextWord={async () => {
            await handleRateFlashcard('GOOD');
          }}
        />
      )}

      {/* VocabFlow Word Diagnostic Modal */}
      <WordDiagnosticModal

        vocabularyId={diagnosticWordId}
        onClose={() => setDiagnosticWordId(null)}
      />
    </div>
  );
};
