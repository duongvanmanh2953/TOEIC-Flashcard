import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  LanguageDefinition,
  SUPPORTED_LANGUAGES,
  DEFAULT_LEARNING_LANGUAGE,
  getLanguage,
  getActiveLanguages,
} from '../config/languages';
import {
  idbGetWords,
  idbGetLocalDecks,
  idbSaveWords,
  idbSaveLocalDeck,
  idbResetLanguageData,
  migrateUserLearningData,
} from '../lib/idb';
import { getSeedDecksForLanguage } from '../data/seedDecks';
import { useAuth } from './AuthContext';

export interface LearningProfile {
  languageId: string;
  level: string;
  dailyGoal: number; // in minutes e.g. 15
  dailyWordGoal: number; // in words e.g. 20
  goalCategory: string; // 'Conversation' | 'Travel' | 'Work' | 'Study' | 'Media' | 'Fluency'
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string;
  wordsLearned: number;
  masteryPercent: number;
  xp: number;
  createdAt: number;
  lastActiveAt: number;
}

export interface AddLanguageParams {
  languageId: string;
  level: string;
  goalCategory: string;
  dailyGoal: number;
}

interface LearningContextType {
  activeLanguage: LanguageDefinition;
  activeProfile: LearningProfile;
  userLanguages: string[]; // List of language IDs user is learning
  learningProfiles: Record<string, LearningProfile>;
  availableLanguages: LanguageDefinition[];
  isSwitching: boolean;
  switchLanguage: (languageId: string) => Promise<void>;
  addLanguage: (params: AddLanguageParams) => Promise<void>;
  resetLanguage: (languageId: string) => Promise<void>;
  removeLanguage: (languageId: string) => Promise<void>;
  updateActiveProfile: (updates: Partial<LearningProfile>) => void;
  recordStudyActivity: (wordsReviewed: number, isCorrect: boolean, xpEarned?: number) => Promise<void>;
  getLanguageStats: () => {
    totalLanguages: number;
    totalWordsAcrossLanguages: number;
    totalXPAcrossLanguages: number;
    activeLanguageWords: number;
    activeLanguageStreak: number;
  };
}

const LearningContext = createContext<LearningContextType | undefined>(undefined);

const STORAGE_ACTIVE_LANG = 'letstun:active_learning_language';
const STORAGE_PROFILES_PREFIX = 'letstun:user_profiles:';

export const LearningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // 1. Available languages
  const availableLanguages = getActiveLanguages();

  // 2. Load Profiles from LocalStorage
  const getStorageKey = useCallback(() => `${STORAGE_PROFILES_PREFIX}${userId}`, [userId]);

  const [learningProfiles, setLearningProfiles] = useState<Record<string, LearningProfile>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_PROFILES_PREFIX}${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return parsed;
        }
      }
    } catch { }

    // Default: English Profile initialized for every learner
    const defaultEnProfile: LearningProfile = {
      languageId: 'en',
      level: user?.profile?.englishLevel || 'B1',
      dailyGoal: user?.profile?.dailyGoal || 15,
      dailyWordGoal: 20,
      goalCategory: 'Conversation',
      currentStreak: user?.streak?.currentStreak || 0,
      longestStreak: user?.streak?.longestStreak || 0,
      wordsLearned: 0,
      masteryPercent: 0,
      xp: user?.xp?.totalXP || 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    return { en: defaultEnProfile };
  });

  // 3. Active Learning Language ID
  const [activeLanguageId, setActiveLanguageId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_ACTIVE_LANG);
    return saved && getLanguage(saved) ? saved : DEFAULT_LEARNING_LANGUAGE;
  });

  const [isSwitching, setIsSwitching] = useState(false);

  // Synchronize profiles when user logs in or changes
  useEffect(() => {
    migrateUserLearningData(user?.id).then(() => {
      // Re-read or initialize profiles for this user
      try {
        const saved = localStorage.getItem(getStorageKey());
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Object.keys(parsed).length > 0) {
            setLearningProfiles(parsed);
            return;
          }
        }
      } catch { }

      // Default fallback
      const initial: Record<string, LearningProfile> = {
        en: {
          languageId: 'en',
          level: user?.profile?.englishLevel || 'B1',
          dailyGoal: user?.profile?.dailyGoal || 15,
          dailyWordGoal: 20,
          goalCategory: 'Conversation',
          currentStreak: user?.streak?.currentStreak || 0,
          longestStreak: user?.streak?.longestStreak || 0,
          wordsLearned: 0,
          masteryPercent: 0,
          xp: user?.xp?.totalXP || 0,
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
        },
      };
      setLearningProfiles(initial);
      localStorage.setItem(getStorageKey(), JSON.stringify(initial));
    });
  }, [userId, getStorageKey, user?.id, user?.profile?.englishLevel, user?.profile?.dailyGoal, user?.streak?.currentStreak, user?.streak?.longestStreak, user?.xp?.totalXP]);

  // Save profiles on change
  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(learningProfiles));
    } catch { }
  }, [learningProfiles, getStorageKey]);

  // Pre-seed Starter Decks when a language space is empty
  const ensureSeedContentForLanguage = useCallback(
    async (langId: string) => {
      try {
        const existingDecks = await idbGetLocalDecks(userId, langId);
        if (existingDecks.length === 0) {
          const seedPacks = getSeedDecksForLanguage(langId);
          for (const pack of seedPacks) {
            const localDeck = {
              id: `deck_${langId}_${pack.id}`,
              userId,
              languageId: langId,
              title: pack.title,
              description: pack.description,
              category: pack.category,
              cefrLevel: pack.cefrLevel,
              wordCount: pack.words.length,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isReadOnly: false,
              isSyncedToCloud: false,
            };
            await idbSaveLocalDeck(localDeck, userId, langId);

            // Populate words
            const wordsToSave = pack.words.map((w, idx) => ({
              id: `vocab_${langId}_${idx}_${w.word.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
              userId,
              languageId: langId,
              deckId: localDeck.id,
              deckName: localDeck.title,
              word: w.word,
              meaning: w.meaning,
              definition: w.definition,
              phonetic: w.phonetic,
              pronunciation: w.pronunciation,
              partOfSpeech: w.partOfSpeech,
              cefrLevel: w.cefrLevel,
              topic: w.topic,
              example: w.example,
              exampleTranslation: w.exampleTranslation,
              article: w.article,
              gender: w.gender,
              pinyin: w.pinyin,
              tone: w.tone,
              romaji: w.romaji,
              transliteration: w.transliteration,
              script: w.script,
              status: 'NEW',
              masteryScore: 0,
              dueAt: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }));
            await idbSaveWords(wordsToSave, userId, undefined, langId);
          }
        }
      } catch (err) {
        console.warn('Seed content initialization notice:', err);
      }
    },
    [userId]
  );

  // Active language object
  const activeLanguage = getLanguage(activeLanguageId);

  // Active learning profile
  const activeProfile: LearningProfile = learningProfiles[activeLanguageId] || {
    languageId: activeLanguageId,
    level: activeLanguage.defaultLevel,
    dailyGoal: 15,
    dailyWordGoal: 20,
    goalCategory: 'Conversation',
    currentStreak: 0,
    longestStreak: 0,
    wordsLearned: 0,
    masteryPercent: 0,
    xp: 0,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  const userLanguages = Object.keys(learningProfiles);

  // Ensure content is seeded for active language
  useEffect(() => {
    ensureSeedContentForLanguage(activeLanguageId);
  }, [activeLanguageId, ensureSeedContentForLanguage]);

  /**
   * Switch active language instantaneously (< 300ms transition)
   */
  const switchLanguage = async (newLangId: string) => {
    if (newLangId === activeLanguageId) return;

    setIsSwitching(true);
    setActiveLanguageId(newLangId);
    localStorage.setItem(STORAGE_ACTIVE_LANG, newLangId);

    // Update lastActiveAt on the target profile
    setLearningProfiles((prev) => {
      const existing = prev[newLangId];
      if (!existing) {
        const langDef = getLanguage(newLangId);
        return {
          ...prev,
          [newLangId]: {
            languageId: newLangId,
            level: langDef.defaultLevel,
            dailyGoal: 15,
            dailyWordGoal: 20,
            goalCategory: 'Conversation',
            currentStreak: 0,
            longestStreak: 0,
            wordsLearned: 0,
            masteryPercent: 0,
            xp: 0,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
          },
        };
      }
      return {
        ...prev,
        [newLangId]: {
          ...existing,
          lastActiveAt: Date.now(),
        },
      };
    });

    // Ensure seed starter deck is available
    await ensureSeedContentForLanguage(newLangId);

    // Subtle micro-transition delay
    setTimeout(() => {
      setIsSwitching(false);
    }, 200);
  };

  /**
   * Add a new language space through the onboarding wizard
   */
  const addLanguage = async ({ languageId, level, goalCategory, dailyGoal }: AddLanguageParams) => {
    const langDef = getLanguage(languageId);
    const newProfile: LearningProfile = {
      languageId,
      level: level || langDef.defaultLevel,
      dailyGoal: dailyGoal || 15,
      dailyWordGoal: 20,
      goalCategory: goalCategory || 'Conversation',
      currentStreak: 0,
      longestStreak: 0,
      wordsLearned: 0,
      masteryPercent: 0,
      xp: 0,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };

    setLearningProfiles((prev) => ({
      ...prev,
      [languageId]: newProfile,
    }));

    await ensureSeedContentForLanguage(languageId);
    await switchLanguage(languageId);
  };

  /**
   * Reset learning space for this language ONLY
   */
  const resetLanguage = async (languageId: string) => {
    // 1. Purge IDB words and decks for this language
    await idbResetLanguageData(userId, languageId);

    // 2. Reset profile statistics for this language
    const langDef = getLanguage(languageId);
    setLearningProfiles((prev) => ({
      ...prev,
      [languageId]: {
        languageId,
        level: langDef.defaultLevel,
        dailyGoal: prev[languageId]?.dailyGoal || 15,
        dailyWordGoal: 20,
        goalCategory: prev[languageId]?.goalCategory || 'Conversation',
        currentStreak: 0,
        longestStreak: 0,
        wordsLearned: 0,
        masteryPercent: 0,
        xp: 0,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      },
    }));

    // 3. Re-seed default starter pack
    await ensureSeedContentForLanguage(languageId);
  };

  /**
   * Remove a language from user's active learning spaces
   */
  const removeLanguage = async (languageId: string) => {
    if (userLanguages.length <= 1) {
      throw new Error('Không thể xóa ngôn ngữ duy nhất của bạn.');
    }

    // 1. Clear IDB records
    await idbResetLanguageData(userId, languageId);

    // 2. Remove profile
    setLearningProfiles((prev) => {
      const updated = { ...prev };
      delete updated[languageId];
      return updated;
    });

    // 3. If the removed language was currently active, switch to first remaining
    if (activeLanguageId === languageId) {
      const remainingLang = userLanguages.find((id) => id !== languageId) || 'en';
      await switchLanguage(remainingLang);
    }
  };

  /**
   * Update active profile configuration (e.g. daily goal, target level)
   */
  const updateActiveProfile = (updates: Partial<LearningProfile>) => {
    setLearningProfiles((prev) => {
      const curr = prev[activeLanguageId];
      if (!curr) return prev;
      return {
        ...prev,
        [activeLanguageId]: {
          ...curr,
          ...updates,
          lastActiveAt: Date.now(),
        },
      };
    });
  };

  /**
   * Record review session progress, update streaks, and award XP for active language
   */
  const recordStudyActivity = async (wordsReviewed: number, isCorrect: boolean, xpEarned: number = 10) => {
    const today = new Date().toISOString().split('T')[0];

    setLearningProfiles((prev) => {
      const curr = prev[activeLanguageId];
      if (!curr) return prev;

      let newStreak = curr.currentStreak;
      if (curr.lastStudyDate !== today) {
        // If studied yesterday, increment streak; otherwise reset to 1
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (curr.lastStudyDate === yesterday) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }

      const newWordsLearned = curr.wordsLearned + (isCorrect ? 1 : 0);
      const newXp = curr.xp + xpEarned;
      const longest = Math.max(curr.longestStreak, newStreak);

      return {
        ...prev,
        [activeLanguageId]: {
          ...curr,
          currentStreak: newStreak,
          longestStreak: longest,
          lastStudyDate: today,
          wordsLearned: newWordsLearned,
          xp: newXp,
          lastActiveAt: Date.now(),
        },
      };
    });
  };

  /**
   * Polyglot aggregate statistics
   */
  const getLanguageStats = () => {
    const profiles = Object.values(learningProfiles);
    const totalWords = profiles.reduce((acc, p) => acc + (p.wordsLearned || 0), 0);
    const totalXP = profiles.reduce((acc, p) => acc + (p.xp || 0), 0);

    return {
      totalLanguages: profiles.length,
      totalWordsAcrossLanguages: totalWords,
      totalXPAcrossLanguages: totalXP,
      activeLanguageWords: activeProfile.wordsLearned,
      activeLanguageStreak: activeProfile.currentStreak,
    };
  };

  return (
    <LearningContext.Provider
      value={{
        activeLanguage,
        activeProfile,
        userLanguages,
        learningProfiles,
        availableLanguages,
        isSwitching,
        switchLanguage,
        addLanguage,
        resetLanguage,
        removeLanguage,
        updateActiveProfile,
        recordStudyActivity,
        getLanguageStats,
      }}
    >
      {children}
    </LearningContext.Provider>
  );
};

export const useLearningContext = () => {
  const context = useContext(LearningContext);
  if (!context) {
    throw new Error('useLearningContext must be used within a LearningProvider');
  }
  return context;
};
