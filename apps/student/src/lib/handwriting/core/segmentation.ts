/**
 * Script-Aware Grapheme and Syllable Segmentation Engine
 * 
 * Strict Unicode & linguistic handling for 5 Language Spaces:
 * - Chinese: Atomic Hanzi ideographs
 * - Japanese: Kanji, Hiragana, Katakana grapheme clusters
 * - Korean: Syllabic Hangul blocks with Jamo decomposition
 * - Thai: Combining vowels, tone marks and base consonant clustering
 * - Arabic: RTL word/cursive integrity, preserving tashkeel, dots & hamza
 */

// Korean Jamo Constants (Unicode Hangul Syllable Decomposition)
const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const CHOSUNG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];
const JUNGSUNG = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];
const JONGSUNG = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export interface DecomposedHangul {
  syllable: string;
  chosung: string;
  jungsung: string;
  jongsung: string;
  isHangul: boolean;
}

/**
 * Decompose a Korean Hangul syllable into its constituent Jamo (Chosung, Jungsung, Jongsung)
 * Prevents treating a 3-part syllable as a single stroke or treating codepoints naively.
 */
export function decomposeHangulSyllable(char: string): DecomposedHangul {
  if (!char || char.length === 0) {
    return { syllable: '', chosung: '', jungsung: '', jongsung: '', isHangul: false };
  }
  const code = char.charCodeAt(0);
  if (code < HANGUL_BASE || code > HANGUL_END) {
    return { syllable: char, chosung: char, jungsung: '', jongsung: '', isHangul: false };
  }
  const syllableIndex = code - HANGUL_BASE;
  const chosungIndex = Math.floor(syllableIndex / (21 * 28));
  const jungsungIndex = Math.floor((syllableIndex % (21 * 28)) / 28);
  const jongsungIndex = syllableIndex % 28;

  return {
    syllable: char,
    chosung: CHOSUNG[chosungIndex] || '',
    jungsung: JUNGSUNG[jungsungIndex] || '',
    jongsung: JONGSUNG[jongsungIndex] || '',
    isHangul: true,
  };
}

/**
 * Check if text contains RTL scripts (such as Arabic, Hebrew, Persian)
 */
export function isRTLScript(text: string, languageCode?: string): boolean {
  if (languageCode === 'ar' || languageCode === 'fa' || languageCode === 'he' || languageCode === 'ur') {
    return true;
  }
  return /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
}

/**
 * Universal Grapheme Segmenter using Intl.Segmenter with regex fallback
 */
export function segmentGraphemes(text: string, locale: string = 'en'): string[] {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    try {
      const segmenter = new (Intl as any).Segmenter(locale, { granularity: 'grapheme' });
      const segments: string[] = [];
      for (const seg of segmenter.segment(text)) {
        segments.push(seg.segment);
      }
      return segments;
    } catch {
      // Fallback below
    }
  }

  // Regex fallback matching combining mark sequences
  // \p{M} matches combining marks (accents, tone marks, vowel signs)
  return Array.from(text.matchAll(/\P{M}\p{M}*/gu) || []).map((m) => m[0]);
}

export interface WritingUnit {
  index: number;
  unit: string;
  script: 'HANZI' | 'KANJI' | 'KANA' | 'HANGUL' | 'THAI' | 'ARABIC' | 'LATIN' | 'OTHER';
  isRTL: boolean;
  metadata?: {
    hangulComponents?: DecomposedHangul;
    thaiVowelsTones?: string[];
  };
}

/**
 * Segment a vocabulary target text into script-aware practice units.
 * Respects Thai vowel/tone clusters, Arabic cursive whole words, and East Asian graphemes.
 */
export function segmentIntoWritingUnits(text: string, languageCode: string = 'ja'): WritingUnit[] {
  if (!text || text.trim().length === 0) return [];
  const clean = text.trim();
  const lang = languageCode.toLowerCase().split(/[-_]/)[0];

  // Arabic: Whole word segmentation (Arabic letters connect cursively; do not chop into Latin-style glyphs)
  if (lang === 'ar' || isRTLScript(clean, lang)) {
    const words = clean.split(/\s+/).filter(Boolean);
    return words.map((w, index) => ({
      index,
      unit: w,
      script: 'ARABIC',
      isRTL: true,
    }));
  }

  // Thai: Segment by grapheme clusters (Intl.Segmenter 'th' ensures Sara Am, tone marks stay with consonant)
  if (lang === 'th') {
    const rawGraphemes = segmentGraphemes(clean, 'th-TH');
    return rawGraphemes.map((g, index) => ({
      index,
      unit: g,
      script: 'THAI',
      isRTL: false,
    }));
  }

  // Korean: Hangul syllables with Jamo breakdown
  if (lang === 'ko') {
    const graphemes = segmentGraphemes(clean, 'ko-KR');
    return graphemes.map((g, index) => {
      const decomp = decomposeHangulSyllable(g);
      return {
        index,
        unit: g,
        script: 'HANGUL',
        isRTL: false,
        metadata: {
          hangulComponents: decomp,
        },
      };
    });
  }

  // Chinese: Hanzi ideographs
  if (lang === 'zh') {
    const graphemes = segmentGraphemes(clean, 'zh-CN');
    return graphemes.map((g, index) => ({
      index,
      unit: g,
      script: 'HANZI',
      isRTL: false,
    }));
  }

  // Japanese: Kanji, Hiragana, Katakana
  if (lang === 'ja') {
    const graphemes = segmentGraphemes(clean, 'ja-JP');
    return graphemes.map((g, index) => {
      const code = g.charCodeAt(0);
      const isKanji = code >= 0x4e00 && code <= 0x9faf;
      const isKana = (code >= 0x3040 && code <= 0x309f) || (code >= 0x30a0 && code <= 0x30ff);
      return {
        index,
        unit: g,
        script: isKanji ? 'KANJI' : isKana ? 'KANA' : 'OTHER',
        isRTL: false,
      };
    });
  }

  // Default / Latin
  const graphemes = segmentGraphemes(clean, 'en-US');
  return graphemes.map((g, index) => ({
    index,
    unit: g,
    script: 'LATIN',
    isRTL: false,
  }));
}
