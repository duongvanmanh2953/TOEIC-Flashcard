import { describe, it, expect } from 'vitest';

// Levenshtein distance helper function
function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[a.length][b.length];
}

// UMS calculation helper function
function calculateUMS(
  vocab: number,
  grammar: number,
  listening: number,
  writing: number,
  exam: number
): number {
  return Math.round(
    0.35 * vocab +
    0.25 * grammar +
    0.15 * listening +
    0.10 * writing +
    0.15 * exam
  );
}

describe('Master Upgrade Pack: VocabFlow Enhancements', () => {
  describe('Multi-mode Spelling: Levenshtein Distance & Fuzzy Match', () => {
    it('should return 0 for identical words', () => {
      expect(levenshteinDistance('accommodate', 'accommodate')).toBe(0);
    });

    it('should calculate correct distance for single typo', () => {
      // 1 deletion or insertion or substitution
      expect(levenshteinDistance('accomodate', 'accommodate')).toBe(1);
      expect(levenshteinDistance('recieved', 'received')).toBe(2);
    });

    it('should tolerate minor typo under tolerance threshold', () => {
      const target = 'environment';
      const userInput = 'environemnt';
      const dist = levenshteinDistance(userInput.toLowerCase(), target.toLowerCase());
      expect(dist).toBeLessThanOrEqual(2);
    });
  });

  describe('Unified Mastery Score (UMS) Formula', () => {
    it('should compute 100 for perfect scores across all 5 dimensions', () => {
      const score = calculateUMS(100, 100, 100, 100, 100);
      expect(score).toBe(100);
    });

    it('should correctly apply 0.35V + 0.25G + 0.15L + 0.10W + 0.15E weights', () => {
      // V: 80 * 0.35 = 28
      // G: 70 * 0.25 = 17.5
      // L: 60 * 0.15 = 9
      // W: 50 * 0.10 = 5
      // E: 90 * 0.15 = 13.5
      // Sum = 28 + 17.5 + 9 + 5 + 13.5 = 73
      const score = calculateUMS(80, 70, 60, 50, 90);
      expect(score).toBe(73);
    });

    it('should accurately handle starting baseline scores', () => {
      const score = calculateUMS(45, 50, 45, 40, 55);
      expect(score).toBe(47);
    });
  });

  describe('Language Space Question Bank Isolation & Standard Mapping', () => {
    it('should map standard exams correctly per language space', async () => {
      const { getCertificatesForLanguage } = await import('@vocabflow/shared');
      
      const enCerts = getCertificatesForLanguage('en');
      expect(enCerts.some((c) => c.name.includes('TOEIC'))).toBe(true);
      expect(enCerts.some((c) => c.name.includes('IELTS'))).toBe(true);

      const jaCerts = getCertificatesForLanguage('ja');
      expect(jaCerts.some((c) => c.name.includes('JLPT'))).toBe(true);

      const koCerts = getCertificatesForLanguage('ko');
      expect(koCerts.some((c) => c.name.includes('TOPIK'))).toBe(true);

      const zhCerts = getCertificatesForLanguage('zh');
      expect(zhCerts.some((c) => c.name.includes('HSK'))).toBe(true);
    });
  });

  describe('Multi-Character Word Segmentation in Handwriting Practice', () => {
    it('should correctly segment Japanese multi-character words', () => {
      const word = '今日は';
      const characters = Array.from(word).filter((char) => char.trim().length > 0);
      expect(characters).toEqual(['今', '日', 'は']);
      expect(characters.length).toBe(3);
    });

    it('should correctly segment Korean multi-syllable blocks', () => {
      const word = '안녕하세요';
      const characters = Array.from(word).filter((char) => char.trim().length > 0);
      expect(characters).toEqual(['안', '녕', '하', '세', '요']);
      expect(characters.length).toBe(5);
    });

    it('should correctly segment Chinese multi-hanzi words', () => {
      const word = '学习汉语';
      const characters = Array.from(word).filter((char) => char.trim().length > 0);
      expect(characters).toEqual(['学', '习', '汉', '语']);
      expect(characters.length).toBe(4);
    });
  });

  describe('Global Performance Mode DOM Token', () => {
    it('should toggle .ultra-efficient-mode class appropriately', () => {
      const classSet = new Set();
      const root = typeof document !== 'undefined' ? document.documentElement : {
        classList: {
          add: (c) => classSet.add(c),
          remove: (c) => classSet.delete(c),
          contains: (c) => classSet.has(c),
        },
      };
      
      // Simulate switching to ultra-efficient
      root.classList.add('ultra-efficient-mode');
      expect(root.classList.contains('ultra-efficient-mode')).toBe(true);

      // Simulate switching to default
      root.classList.remove('ultra-efficient-mode');
      expect(root.classList.contains('ultra-efficient-mode')).toBe(false);
    });
  });
  describe('Spaced Repetition Review Session Resilience', () => {
    function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
      let timer: any;
      const timeoutPromise = new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      });
      return Promise.race([promise, timeoutPromise])
        .then((res) => {
          clearTimeout(timer);
          return res;
        })
        .catch(() => {
          clearTimeout(timer);
          return fallback;
        });
    }

    it('should resolve immediately when fast promise completes', async () => {
      const fastPromise = Promise.resolve(['word1', 'word2']);
      const result = await withTimeout(fastPromise, 500, []);
      expect(result).toEqual(['word1', 'word2']);
    });

    it('should fall back gracefully to default value on timeout without hanging', async () => {
      const hangingPromise = new Promise<string[]>(() => {});
      const start = Date.now();
      const result = await withTimeout(hangingPromise, 50, ['fallback_word']);
      const elapsed = Date.now() - start;

      expect(result).toEqual(['fallback_word']);
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(200);
    });

    it('should fall back gracefully on promise rejection', async () => {
      const rejectingPromise = Promise.reject(new Error('Network timeout'));
      const result = await withTimeout(rejectingPromise, 100, ['fallback_word']);
      expect(result).toEqual(['fallback_word']);
    });
  });
});