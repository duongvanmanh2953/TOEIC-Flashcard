/**
 * Language Registry for LetStuN Multi-Language Learning Platform
 * Defines core supported languages, speech locales, writing scripts, CEFR/Proficiency levels,
 * feature flags, and visual identity tokens.
 */

export type ScriptType = 'Latin' | 'Hanzi' | 'Kana-Kanji' | 'Hangul' | 'Thai' | 'Cyrillic' | 'Arabic';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageFeatures {
  supportsIPA?: boolean;
  supportsRomanization?: boolean;
  supportsPinyin?: boolean;
  supportsRomaji?: boolean;
  supportsHangul?: boolean;
  supportsTransliteration?: boolean;
  supportsTones?: boolean;
  supportsGender?: boolean; // German der/die/das, French le/la, Spanish el/la
  supportsConjugation?: boolean;
  supportsScriptToggle?: boolean; // e.g. Show/Hide Pinyin or Romaji
  supportsKidMode?: boolean; // Kid Mode support capability
}

export interface LanguageDefinition {
  id: string; // e.g. 'de'
  code: string; // ISO 639-1 code e.g. 'de'
  name: string; // English display name e.g. 'German'
  nativeName: string; // Native name e.g. 'Deutsch'
  flag: string; // Emoji flag or icon code
  countryCode?: string; // e.g. 'GB', 'DE', 'JP'
  region: 'Europe' | 'Asia' | 'Americas' | 'Global' | 'Middle East';
  script: ScriptType;
  direction: TextDirection;
  speechLocale: string; // Primary BCP 47 locale e.g. 'de-DE'
  secondaryLocales?: { id: string; label: string; speechLocale: string }[];
  accentColor: {
    primary: string;
    border: string;
    bg: string;
    gradient: string;
    text: string;
    badgeBg: string;
  };
  supportedLevels: string[];
  defaultLevel: string;
  difficulty: 'Beginner Friendly' | 'Moderate' | 'Challenging';
  enabled: boolean;
  features: LanguageFeatures;
  description: string;
  sampleWord: {
    word: string;
    pronunciation?: string;
    translation: string;
    article?: string;
  };
}

export const SUPPORTED_LANGUAGES: LanguageDefinition[] = [
  {
    id: 'en',
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    countryCode: 'GB',
    region: 'Global',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'en-US',
    secondaryLocales: [
      { id: 'en-US', label: 'American English (US)', speechLocale: 'en-US' },
      { id: 'en-GB', label: 'British English (UK)', speechLocale: 'en-GB' },
      { id: 'en-AU', label: 'Australian English (AU)', speechLocale: 'en-AU' },
    ],
    accentColor: {
      primary: '#3b82f6',
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      gradient: 'from-blue-600 to-indigo-600',
      text: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    defaultLevel: 'B1',
    difficulty: 'Beginner Friendly',
    enabled: true,
    features: {
      supportsIPA: true,
      supportsRomanization: false,
      supportsGender: false,
      supportsKidMode: true,
    },
    description: 'Global standard for international business, academia, and travel.',
    sampleWord: {
      word: 'Resilience',
      pronunciation: '/rɪˈzɪl.jəns/',
      translation: 'Khả năng phục hồi, kiên cường',
    },
  },
  {
    id: 'de',
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    region: 'Europe',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'de-DE',
    accentColor: {
      primary: '#f59e0b',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      gradient: 'from-amber-600 via-yellow-600 to-slate-800',
      text: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Moderate',
    enabled: true,
    features: {
      supportsIPA: true,
      supportsGender: true, // der, die, das
      supportsConjugation: true,
    },
    description: 'Europe’s economic powerhouse language, famous for compound words and precision grammar.',
    sampleWord: {
      word: 'Haus',
      article: 'das',
      pronunciation: '/haʊ̯s/',
      translation: 'Ngôi nhà',
    },
  },
  {
    id: 'es',
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    region: 'Europe',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'es-ES',
    secondaryLocales: [
      { id: 'es-ES', label: 'European Spanish (Spain)', speechLocale: 'es-ES' },
      { id: 'es-MX', label: 'Latin American Spanish (Mexico)', speechLocale: 'es-MX' },
    ],
    accentColor: {
      primary: '#ef4444',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      gradient: 'from-rose-600 to-amber-600',
      text: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Beginner Friendly',
    enabled: true,
    features: {
      supportsIPA: true,
      supportsGender: true, // el, la
      supportsConjugation: true,
    },
    description: 'Spoken across Spain and Latin America with vibrant culture, music, and cuisine.',
    sampleWord: {
      word: 'Hablar',
      pronunciation: '/aˈblaɾ/',
      translation: 'Nói chuyện, phát biểu',
    },
  },
  {
    id: 'fr',
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    region: 'Europe',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'fr-FR',
    accentColor: {
      primary: '#6366f1',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-500/10',
      gradient: 'from-blue-600 via-indigo-600 to-rose-600',
      text: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Moderate',
    enabled: true,
    features: {
      supportsIPA: true,
      supportsGender: true, // le, la
      supportsConjugation: true,
    },
    description: 'Language of diplomacy, literature, gastronomy, and international elegance.',
    sampleWord: {
      word: 'Bonjour',
      pronunciation: '/bɔ̃.ʒuʁ/',
      translation: 'Xin chào',
    },
  },
  {
    id: 'zh',
    code: 'zh',
    name: 'Chinese (Mandarin)',
    nativeName: '中文 (普通话)',
    flag: '🇨🇳',
    region: 'Asia',
    script: 'Hanzi',
    direction: 'ltr',
    speechLocale: 'zh-CN',
    accentColor: {
      primary: '#dc2626',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      gradient: 'from-red-600 to-amber-600',
      text: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    },
    supportedLevels: ['HSK 1', 'HSK 2', 'HSK 3', 'HSK 4', 'HSK 5', 'HSK 6'],
    defaultLevel: 'HSK 1',
    difficulty: 'Challenging',
    enabled: true,
    features: {
      supportsPinyin: true,
      supportsTones: true,
      supportsScriptToggle: true, // Toggle Pinyin
    },
    description: 'Tonal language with Hanzi characters, Pinyin romanization, and ancient depth.',
    sampleWord: {
      word: '你好',
      pronunciation: 'nǐ hǎo',
      translation: 'Xin chào (âm sắc 3-3)',
    },
  },
  {
    id: 'ja',
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    region: 'Asia',
    script: 'Kana-Kanji',
    direction: 'ltr',
    speechLocale: 'ja-JP',
    accentColor: {
      primary: '#e11d48',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10',
      gradient: 'from-rose-600 to-slate-900',
      text: 'text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    },
    supportedLevels: ['JLPT N5', 'JLPT N4', 'JLPT N3', 'JLPT N2', 'JLPT N1'],
    defaultLevel: 'JLPT N5',
    difficulty: 'Challenging',
    enabled: true,
    features: {
      supportsRomaji: true,
      supportsScriptToggle: true, // Toggle Romaji
    },
    description: 'Combines Hiragana, Katakana, and Kanji with polite honorific nuances.',
    sampleWord: {
      word: 'こんにちは',
      pronunciation: 'konnichiwa',
      translation: 'Xin chào buổi chiều',
    },
  },
  {
    id: 'ko',
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    region: 'Asia',
    script: 'Hangul',
    direction: 'ltr',
    speechLocale: 'ko-KR',
    accentColor: {
      primary: '#0284c7',
      border: 'border-sky-500/30',
      bg: 'bg-sky-500/10',
      gradient: 'from-sky-600 to-indigo-600',
      text: 'text-sky-600 dark:text-sky-400',
      badgeBg: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    supportedLevels: ['TOPIK 1', 'TOPIK 2', 'TOPIK 3', 'TOPIK 4', 'TOPIK 5+'],
    defaultLevel: 'TOPIK 1',
    difficulty: 'Moderate',
    enabled: true,
    features: {
      supportsHangul: true,
      supportsRomanization: true,
      supportsScriptToggle: true,
    },
    description: 'Scientific Hangul alphabet created by King Sejong with rich pop culture resonance.',
    sampleWord: {
      word: '안녕하세요',
      pronunciation: 'annyeonghaseyo',
      translation: 'Xin chào',
    },
  },
  {
    id: 'th',
    code: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    flag: '🇹🇭',
    region: 'Asia',
    script: 'Thai',
    direction: 'ltr',
    speechLocale: 'th-TH',
    accentColor: {
      primary: '#d97706',
      border: 'border-amber-600/30',
      bg: 'bg-amber-600/10',
      gradient: 'from-amber-600 via-blue-600 to-amber-700',
      text: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-600/15 text-amber-700 dark:text-amber-300 border-amber-600/30',
    },
    supportedLevels: ['Beginner', 'Elementary', 'Intermediate', 'Advanced'],
    defaultLevel: 'Beginner',
    difficulty: 'Challenging',
    enabled: true,
    features: {
      supportsTransliteration: true,
      supportsTones: true,
      supportsScriptToggle: true,
    },
    description: 'Unique Indic-derived script with 5 tones, widely loved for travel, hospitality, and cuisine.',
    sampleWord: {
      word: 'สวัสดี',
      pronunciation: 'sawasdee',
      translation: 'Xin chào',
    },
  },
  {
    id: 'vi',
    code: 'vi',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
    region: 'Asia',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'vi-VN',
    accentColor: {
      primary: '#e11d48',
      border: 'border-red-500/30',
      bg: 'bg-red-500/10',
      gradient: 'from-red-600 to-yellow-500',
      text: 'text-red-600 dark:text-red-400',
      badgeBg: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Moderate',
    enabled: true,
    features: {
      supportsIPA: true,
      supportsTones: true,
    },
    description: 'Chữ Quốc Ngữ with 6 melodic tones and vibrant Southeast Asian cultural roots.',
    sampleWord: {
      word: 'Cảm ơn',
      pronunciation: '/kaːm˧ˀ˩ ʔəːn˧˧/',
      translation: 'Thank you',
    },
  },
  // Upcoming Expandable Languages
  {
    id: 'pt',
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    region: 'Europe',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'pt-PT',
    secondaryLocales: [
      { id: 'pt-BR', label: 'Brazilian Portuguese', speechLocale: 'pt-BR' },
      { id: 'pt-PT', label: 'European Portuguese', speechLocale: 'pt-PT' },
    ],
    accentColor: {
      primary: '#10b981',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      gradient: 'from-emerald-600 to-amber-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Beginner Friendly',
    enabled: false,
    features: {
      supportsIPA: true,
      supportsGender: true,
      supportsConjugation: true,
    },
    description: 'Lush Romance language spoken in Portugal, Brazil, and parts of Africa.',
    sampleWord: {
      word: 'Obrigado',
      pronunciation: '/ɔ.bɾiˈɡa.du/',
      translation: 'Cảm ơn',
    },
  },
  {
    id: 'it',
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    region: 'Europe',
    script: 'Latin',
    direction: 'ltr',
    speechLocale: 'it-IT',
    accentColor: {
      primary: '#16a34a',
      border: 'border-green-600/30',
      bg: 'bg-green-600/10',
      gradient: 'from-green-600 via-slate-100 to-red-600',
      text: 'text-green-600 dark:text-green-400',
      badgeBg: 'bg-green-600/15 text-green-700 dark:text-green-300 border-green-600/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Beginner Friendly',
    enabled: false,
    features: {
      supportsIPA: true,
      supportsGender: true,
      supportsConjugation: true,
    },
    description: 'Musical, expressive language of art, opera, fashion, and history.',
    sampleWord: {
      word: 'Grazie',
      pronunciation: '/ˈɡrat.tsje/',
      translation: 'Cảm ơn',
    },
  },
  {
    id: 'ru',
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    region: 'Europe',
    script: 'Cyrillic',
    direction: 'ltr',
    speechLocale: 'ru-RU',
    accentColor: {
      primary: '#2563eb',
      border: 'border-blue-600/30',
      bg: 'bg-blue-600/10',
      gradient: 'from-blue-600 to-red-600',
      text: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-600/15 text-blue-700 dark:text-blue-300 border-blue-600/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Challenging',
    enabled: false,
    features: {
      supportsRomanization: true,
      supportsGender: true,
    },
    description: 'Cyrillic script Slavic language renowned for classical literature and science.',
    sampleWord: {
      word: 'Спасибо',
      pronunciation: 'spasibo',
      translation: 'Cảm ơn',
    },
  },
  {
    id: 'ar',
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    region: 'Middle East',
    script: 'Arabic',
    direction: 'rtl',
    speechLocale: 'ar-SA',
    accentColor: {
      primary: '#059669',
      border: 'border-emerald-600/30',
      bg: 'bg-emerald-600/10',
      gradient: 'from-emerald-700 to-teal-600',
      text: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/30',
    },
    supportedLevels: ['A1', 'A2', 'B1', 'B2', 'C1'],
    defaultLevel: 'A1',
    difficulty: 'Challenging',
    enabled: false,
    features: {
      supportsTransliteration: true,
      supportsGender: true,
    },
    description: 'Right-to-left poetic Semitic language spoken across the Arab world.',
    sampleWord: {
      word: 'شكراً',
      pronunciation: 'shukran',
      translation: 'Cảm ơn',
    },
  },
];

export const DEFAULT_LEARNING_LANGUAGE = 'en';

export function getLanguage(id: string): LanguageDefinition {
  const clean = (id || '').toLowerCase().trim();
  const langPrefix = clean.split(/[-_]/)[0];
  const found = SUPPORTED_LANGUAGES.find(
    (lang) =>
      lang.id === clean ||
      lang.code === clean ||
      lang.speechLocale.toLowerCase() === clean ||
      lang.id === langPrefix ||
      lang.code === langPrefix
  );
  return found || SUPPORTED_LANGUAGES[0];
}

export function getActiveLanguages(): LanguageDefinition[] {
  return SUPPORTED_LANGUAGES.filter((lang) => lang.enabled);
}

export function getLanguagesByRegion(region: string): LanguageDefinition[] {
  if (region === 'All') return SUPPORTED_LANGUAGES;
  return SUPPORTED_LANGUAGES.filter((lang) => lang.region === region);
}

export function isKidSupportedLanguage(langOrId?: LanguageDefinition | string): boolean {
  if (!langOrId) return false;
  const lang = typeof langOrId === 'string' ? getLanguage(langOrId) : langOrId;
  return Boolean(lang?.features?.supportsKidMode ?? (lang?.id === 'en' || lang?.code === 'en'));
}

export function getLanguageFlag(idOrCode?: string): string {
  if (!idOrCode) return '🌐';
  const lang = getLanguage(idOrCode);
  return lang?.flag || '🌐';
}

export function getSpeechLocale(idOrCode?: string): string {
  if (!idOrCode) return 'en-US';
  const clean = idOrCode.trim();
  if (/^[a-zA-Z]{2,3}[-_][a-zA-Z0-9]{2,4}$/.test(clean)) {
    return clean.replace('_', '-');
  }
  const lang = getLanguage(clean);
  return lang?.speechLocale || 'en-US';
}
