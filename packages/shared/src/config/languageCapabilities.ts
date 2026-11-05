/**
 * Language Learning Capability Registry (VocabFlow Core)
 * Strictly defines granular multi-tier capabilities:
 * Language -> Script -> Dataset -> Capabilities
 *
 * Prevents naive boolean flags or hardcoded language name checks in the frontend.
 */

export interface GeneralCapabilities {
  vocabularyPractice: boolean;
  grammarPractice: boolean;
  flashcards: boolean;
  readingPractice: boolean;
  listeningPractice: boolean;
  writingPractice: boolean; // text/essay practice
  pronunciationPractice: boolean;
  speechRecognition: boolean;
  textToSpeech: boolean;
}

export interface HandwritingCapabilities {
  handwritingBoard: boolean;
  characterTracing: boolean;
  guidedWriting: boolean;
  freeWriting: boolean;
  strokeOrderAnimation: boolean;
  strokeOrderEvaluation: boolean;
  strokeDirectionEvaluation: boolean;
  shapeSimilarityEvaluation: boolean;
  automaticStrokeCorrection: boolean;
  characterRecognition: boolean;
}

export interface PronunciationCapabilities {
  tts: boolean;
  audioPlayback: boolean;
  speechRecognition: boolean;
  pronunciationAssessment: boolean;
  phonemeAssessment: boolean;
  wordLevelAssessment: boolean;
  sentenceLevelAssessment: boolean;
}

export type CapabilityStatus =
  | 'available'
  | 'unavailable'
  | 'dataset_missing'
  | 'dataset_incomplete'
  | 'pending_verification'
  | 'disabled_by_admin';

export interface ScriptDatasetInfo {
  provider: string;
  version: string;
  sourceUrl: string;
  license: string;
  characterCoverage: number;
  script: string;
  validationStatus: 'verified' | 'provisional' | 'unverified';
}

export interface LanguageScriptDefinition {
  scriptCode: string;
  name: string;
  nativeName: string;
  description: string;
  dataset: ScriptDatasetInfo;
  capabilities: HandwritingCapabilities;
  status: CapabilityStatus;
}

export interface LanguageCapabilityRegistryEntry {
  languageId: string;
  name: string;
  nativeName: string;
  general: GeneralCapabilities;
  handwriting: HandwritingCapabilities;
  pronunciation: PronunciationCapabilities;
  supportedScripts: LanguageScriptDefinition[];
}

export const LANGUAGE_CAPABILITY_REGISTRY: Record<string, LanguageCapabilityRegistryEntry> = {
  ja: {
    languageId: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true,
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: true,
      characterTracing: true,
      guidedWriting: true,
      freeWriting: true,
      strokeOrderAnimation: true,
      strokeOrderEvaluation: true,
      strokeDirectionEvaluation: true,
      shapeSimilarityEvaluation: true,
      automaticStrokeCorrection: true,
      characterRecognition: true,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: true,
      pronunciationAssessment: true,
      phonemeAssessment: true,
      wordLevelAssessment: true,
      sentenceLevelAssessment: false,
    },
    supportedScripts: [
      {
        scriptCode: 'HIRAGANA',
        name: 'Hiragana (Bảng chữ mềm)',
        nativeName: 'ひらがな',
        description: 'Bảng ngữ âm chuẩn gồm 46 ký tự nền tảng cho người mới bắt đầu.',
        dataset: {
          provider: 'KanjiVG & VocabFlow Native Vectors',
          version: '2026.04',
          sourceUrl: 'https://kanjivg.tagaini.net',
          license: 'CC BY-SA 3.0',
          characterCoverage: 46,
          script: 'Hiragana',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: true,
          guidedWriting: true,
          freeWriting: true,
          strokeOrderAnimation: true,
          strokeOrderEvaluation: true,
          strokeDirectionEvaluation: true,
          shapeSimilarityEvaluation: true,
          automaticStrokeCorrection: true,
          characterRecognition: true,
        },
        status: 'available',
      },
      {
        scriptCode: 'KATAKANA',
        name: 'Katakana (Bảng chữ cứng)',
        nativeName: 'カタカナ',
        description: 'Bảng ngữ âm dùng cho từ ngoại lai, tên quốc tế và thuật ngữ khoa học.',
        dataset: {
          provider: 'KanjiVG Vector Dataset',
          version: '2026.04',
          sourceUrl: 'https://kanjivg.tagaini.net',
          license: 'CC BY-SA 3.0',
          characterCoverage: 46,
          script: 'Katakana',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: true,
          guidedWriting: true,
          freeWriting: true,
          strokeOrderAnimation: true,
          strokeOrderEvaluation: true,
          strokeDirectionEvaluation: true,
          shapeSimilarityEvaluation: true,
          automaticStrokeCorrection: true,
          characterRecognition: true,
        },
        status: 'available',
      },
      {
        scriptCode: 'KANJI',
        name: 'Kanji JLPT N5-N1 (Hán tự tiếng Nhật)',
        nativeName: '漢字',
        description: 'Hán tự biểu ý với quy chuẩn thứ tự nét và gốc bộ thủ nghiêm ngặt.',
        dataset: {
          provider: 'KanjiVG Project (Ulrich Apel)',
          version: '2026.04-N5',
          sourceUrl: 'https://github.com/KanjiVG/kanjivg',
          license: 'CC BY-SA 3.0',
          characterCoverage: 110,
          script: 'Kanji',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: true,
          guidedWriting: true,
          freeWriting: true,
          strokeOrderAnimation: true,
          strokeOrderEvaluation: true,
          strokeDirectionEvaluation: true,
          shapeSimilarityEvaluation: true,
          automaticStrokeCorrection: true,
          characterRecognition: true,
        },
        status: 'available',
      },
    ],
  },
  zh: {
    languageId: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true,
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: true,
      characterTracing: true,
      guidedWriting: true,
      freeWriting: true,
      strokeOrderAnimation: true,
      strokeOrderEvaluation: true,
      strokeDirectionEvaluation: true,
      shapeSimilarityEvaluation: true,
      automaticStrokeCorrection: true,
      characterRecognition: true,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: true,
      pronunciationAssessment: true,
      phonemeAssessment: true,
      wordLevelAssessment: true,
      sentenceLevelAssessment: false,
    },
    supportedScripts: [
      {
        scriptCode: 'HANZI_SIMPLIFIED',
        name: 'Hán tự Giản thể (HSK 1 - 3)',
        nativeName: '简体中文',
        description: 'Hán tự chuẩn hóa của Trung Quốc đại lục với bộ dữ liệu nét vector chuẩn.',
        dataset: {
          provider: 'Hanzi Writer Open Data (Chanind)',
          version: '3.5.0',
          sourceUrl: 'https://github.com/chanind/hanzi-writer-data',
          license: 'MIT & Arphic Public License',
          characterCoverage: 500,
          script: 'Simplified Hanzi',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: true,
          guidedWriting: true,
          freeWriting: true,
          strokeOrderAnimation: true,
          strokeOrderEvaluation: true,
          strokeDirectionEvaluation: true,
          shapeSimilarityEvaluation: true,
          automaticStrokeCorrection: true,
          characterRecognition: true,
        },
        status: 'available',
      },
    ],
  },
  ko: {
    languageId: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true,
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: true,
      characterTracing: true,
      guidedWriting: true,
      freeWriting: true,
      strokeOrderAnimation: true,
      strokeOrderEvaluation: true,
      strokeDirectionEvaluation: true,
      shapeSimilarityEvaluation: true,
      automaticStrokeCorrection: true,
      characterRecognition: false,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: true,
      pronunciationAssessment: true,
      phonemeAssessment: true,
      wordLevelAssessment: true,
      sentenceLevelAssessment: false,
    },
    supportedScripts: [
      {
        scriptCode: 'HANGUL',
        name: 'Bảng chữ cái Hangul (한글)',
        nativeName: '한글',
        description: 'Hệ thống khối âm tiết khoa học do vua Sejong sáng chế.',
        dataset: {
          provider: 'VocabFlow Hangul Jamo Vectors',
          version: '1.2.0',
          sourceUrl: 'https://vocabflow.site/datasets/hangul',
          license: 'VocabFlow Open Educational Dataset',
          characterCoverage: 40,
          script: 'Hangul',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: true,
          guidedWriting: true,
          freeWriting: true,
          strokeOrderAnimation: true,
          strokeOrderEvaluation: true,
          strokeDirectionEvaluation: true,
          shapeSimilarityEvaluation: true,
          automaticStrokeCorrection: true,
          characterRecognition: false,
        },
        status: 'available',
      },
    ],
  },
  en: {
    languageId: 'en',
    name: 'English',
    nativeName: 'English',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true, // Essay writing
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: false, // English does not need Kanji/Hanzi stroke board
      characterTracing: false,
      guidedWriting: false,
      freeWriting: false,
      strokeOrderAnimation: false,
      strokeOrderEvaluation: false,
      strokeDirectionEvaluation: false,
      shapeSimilarityEvaluation: false,
      automaticStrokeCorrection: false,
      characterRecognition: false,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: true,
      pronunciationAssessment: true,
      phonemeAssessment: true,
      wordLevelAssessment: true,
      sentenceLevelAssessment: true,
    },
    supportedScripts: [],
  },
  th: {
    languageId: 'th',
    name: 'Thai',
    nativeName: 'ภาษาไทย',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true,
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: true,
      characterTracing: false,
      guidedWriting: false,
      freeWriting: true,
      strokeOrderAnimation: false,
      strokeOrderEvaluation: false,
      strokeDirectionEvaluation: false,
      shapeSimilarityEvaluation: false,
      automaticStrokeCorrection: false,
      characterRecognition: true,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: false,
      pronunciationAssessment: false,
      phonemeAssessment: false,
      wordLevelAssessment: false,
      sentenceLevelAssessment: false,
    },
    supportedScripts: [
      {
        scriptCode: 'THAI',
        name: 'Thai Script (อักษรไทย)',
        nativeName: 'อักษรไทย',
        description: 'Chữ viết tiếng Thái với 44 phụ âm, nguyên âm tổ hợp và 4 thanh điệu.',
        dataset: {
          provider: 'MyScript Digital Ink Cloud',
          version: '4.1',
          sourceUrl: 'https://myscript.github.io/iinkTS/',
          license: 'Commercial Cloud API',
          characterCoverage: 72,
          script: 'Thai',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: false,
          guidedWriting: false,
          freeWriting: true,
          strokeOrderAnimation: false,
          strokeOrderEvaluation: false,
          strokeDirectionEvaluation: false,
          shapeSimilarityEvaluation: false,
          automaticStrokeCorrection: false,
          characterRecognition: true,
        },
        status: 'available',
      },
    ],
  },
  ar: {
    languageId: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    general: {
      vocabularyPractice: true,
      grammarPractice: true,
      flashcards: true,
      readingPractice: true,
      listeningPractice: true,
      writingPractice: true,
      pronunciationPractice: true,
      speechRecognition: true,
      textToSpeech: true,
    },
    handwriting: {
      handwritingBoard: true,
      characterTracing: false,
      guidedWriting: false,
      freeWriting: true,
      strokeOrderAnimation: false,
      strokeOrderEvaluation: false,
      strokeDirectionEvaluation: false,
      shapeSimilarityEvaluation: false,
      automaticStrokeCorrection: false,
      characterRecognition: true,
    },
    pronunciation: {
      tts: true,
      audioPlayback: true,
      speechRecognition: false,
      pronunciationAssessment: false,
      phonemeAssessment: false,
      wordLevelAssessment: false,
      sentenceLevelAssessment: false,
    },
    supportedScripts: [
      {
        scriptCode: 'ARABIC',
        name: 'Arabic Script (الأبجدية العربية)',
        nativeName: 'الأبجدية العربية',
        description: 'Chữ viết Ả Rập viết nối (cursive), hỗ trợ hướng RTL và dấu tashkeel.',
        dataset: {
          provider: 'MyScript REST / Calliar Research',
          version: '4.1',
          sourceUrl: 'https://myscript.github.io/iinkTS/',
          license: 'Commercial Cloud API / Research PoC',
          characterCoverage: 28,
          script: 'Arabic',
          validationStatus: 'verified',
        },
        capabilities: {
          handwritingBoard: true,
          characterTracing: false,
          guidedWriting: false,
          freeWriting: true,
          strokeOrderAnimation: false,
          strokeOrderEvaluation: false,
          strokeDirectionEvaluation: false,
          shapeSimilarityEvaluation: false,
          automaticStrokeCorrection: false,
          characterRecognition: true,
        },
        status: 'available',
      },
    ],
  },
};

/**
 * Universal Fallback for European / Latin script languages
 */
export const DEFAULT_LATIN_CAPABILITY: LanguageCapabilityRegistryEntry = {
  languageId: 'general',
  name: 'Standard Latin',
  nativeName: 'Standard',
  general: {
    vocabularyPractice: true,
    grammarPractice: true,
    flashcards: true,
    readingPractice: true,
    listeningPractice: true,
    writingPractice: true,
    pronunciationPractice: true,
    speechRecognition: true,
    textToSpeech: true,
  },
  handwriting: {
    handwritingBoard: false,
    characterTracing: false,
    guidedWriting: false,
    freeWriting: false,
    strokeOrderAnimation: false,
    strokeOrderEvaluation: false,
    strokeDirectionEvaluation: false,
    shapeSimilarityEvaluation: false,
    automaticStrokeCorrection: false,
    characterRecognition: false,
  },
  pronunciation: {
    tts: true,
    audioPlayback: true,
    speechRecognition: true,
    pronunciationAssessment: true,
    phonemeAssessment: false,
    wordLevelAssessment: true,
    sentenceLevelAssessment: false,
  },
  supportedScripts: [],
};

/**
 * Resolve language capabilities for any language code
 */
export function getLanguageCapabilities(languageId?: string): LanguageCapabilityRegistryEntry {
  if (!languageId) return LANGUAGE_CAPABILITY_REGISTRY['en'] || DEFAULT_LATIN_CAPABILITY;
  const clean = languageId.toLowerCase().trim().split(/[-_]/)[0];
  return LANGUAGE_CAPABILITY_REGISTRY[clean] || DEFAULT_LATIN_CAPABILITY;
}

/**
 * Check if handwriting board is supported for the current active learning language
 */
export function isHandwritingSupportedForLanguage(languageId?: string): boolean {
  const cap = getLanguageCapabilities(languageId);
  return cap.handwriting.handwritingBoard && cap.supportedScripts.length > 0;
}

/**
 * Get supported scripts for an active language
 */
export function getSupportedScriptsForLanguage(languageId?: string): LanguageScriptDefinition[] {
  const cap = getLanguageCapabilities(languageId);
  return cap.supportedScripts;
}
