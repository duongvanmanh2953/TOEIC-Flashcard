/**
 * pronunciationEvaluator.ts
 * Enterprise Pronunciation Evaluation & Scoring Engine
 * Supports:
 * - Multi-lingual speech recognition (Web Speech API with BCP-47 locale support)
 * - Normalized Levenshtein edit-distance + Character Bigram / Dice similarity + Phonetic variant matching
 * - Multi-tiered realistic thresholds:
 *     >= 85%: Excellent (Xuất sắc)
 *     >= 70%: Good / Standard (Tốt / Đạt chuẩn)
 *     >= 55%: Understandable / Pass (Dễ hiểu / Đạt yêu cầu)
 *     < 55%: Needs Improvement (Cần cải thiện)
 *     Empty / Short: Not Enough Audio (Không trừ điểm)
 * - Support for common speech contractions, connected speech, and dialect variants
 * - Actionable sound-level feedback & pronunciation tips in Vietnamese
 */

export type EvaluationMode = 'kid' | 'adult';

export type PronunciationTier =
  | 'excellent'
  | 'good'
  | 'understandable'
  | 'needs_improvement'
  | 'not_enough_audio';

export interface SoundFeedbackDetail {
  sound: string;
  type: 'good' | 'missing' | 'mispronounced';
  tip?: string;
}

export interface PronunciationEvaluationResult {
  target: string;
  spoken: string;
  score: number; // 0 to 100
  isPassing: boolean;
  tier: PronunciationTier;
  threshold: number; // 55 for adult pass, 50 for kids
  mode: EvaluationMode;
  stars?: number; // 1 to 3
  feedback: string;
  status: 'perfect' | 'passed' | 'failed' | 'empty';
  detailedDifferences?: {
    missingWords?: string[];
    extraWords?: string[];
    soundFeedback?: SoundFeedbackDetail[];
    suggestion?: string;
  };
}

/**
 * Common English contractions and speech variants dictionary
 */
const COMMON_SPEECH_VARIANTS: Record<string, string[]> = {
  "i'm": ['i am'],
  "i am": ["i'm"],
  "you're": ['you are'],
  "you are": ["you're"],
  "he's": ['he is', 'he has'],
  "he is": ["he's"],
  "she's": ['she is', 'she has'],
  "she is": ["she's"],
  "it's": ['it is', 'it has'],
  "it is": ["it's"],
  "we're": ['we are'],
  "we are": ["we're"],
  "they're": ['they are'],
  "they are": ["they're"],
  "can't": ['cannot', 'can not'],
  "cannot": ["can't"],
  "don't": ['do not'],
  "do not": ["don't"],
  "doesn't": ['does not'],
  "does not": ["doesn't"],
  "didn't": ['did not'],
  "did not": ["didn't"],
  "won't": ['will not'],
  "will not": ["won't"],
  "haven't": ['have not'],
  "have not": ["haven't"],
  "hasn't": ['has not'],
  "has not": ["hasn't"],
  "hadn't": ['had not'],
  "had not": ["hadn't"],
  "isn't": ['is not'],
  "is not": ["isn't"],
  "aren't": ['are not'],
  "are not": ["aren't"],
  "wasn't": ['was not'],
  "was not": ["wasn't"],
  "weren't": ['were not'],
  "were not": ["weren't"],
  "gonna": ['going to'],
  "going to": ['gonna'],
  "wanna": ['want to'],
  "want to": ['wanna'],
  "gotta": ['got to'],
  "got to": ['gotta'],
  "let's": ['let us'],
  "let us": ["let's"],
  "that's": ['that is'],
  "there's": ['there is'],
  "what's": ['what is'],
  "1": ['one'],
  "2": ['two'],
  "3": ['three'],
  "4": ['four'],
  "5": ['five'],
  "6": ['six'],
  "7": ['seven'],
  "8": ['eight'],
  "9": ['nine'],
  "10": ['ten'],
};

/**
 * Normalize text for accurate linguistic comparison across all world writing scripts
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'“”‘’[\]<>«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

/**
 * Character Bigram (Dice Coefficient) Similarity
 */
function getBigrams(str: string): Set<string> {
  const bigrams = new Set<string>();
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.add(str.slice(i, i + 2));
  }
  return bigrams;
}

export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return a === b ? 1.0 : 0.0;

  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  let intersection = 0;
  bgA.forEach((bg) => {
    if (bgB.has(bg)) intersection++;
  });
  return (2 * intersection) / (bgA.size + bgB.size);
}

/**
 * Checks whether user speech matches accepted contractions or colloquial forms
 */
function isAcceptedVariant(target: string, spoken: string): boolean {
  const normT = normalizeText(target);
  const normS = normalizeText(spoken);
  if (normT === normS) return true;

  const variants = COMMON_SPEECH_VARIANTS[normT];
  if (variants && variants.some((v) => normalizeText(v) === normS)) {
    return true;
  }

  const reverseVariants = COMMON_SPEECH_VARIANTS[normS];
  if (reverseVariants && reverseVariants.some((v) => normalizeText(v) === normT)) {
    return true;
  }

  return false;
}

/**
 * Pedagogical sound-level analysis for common pronunciation errors in English
 */
function analyzeSoundFeatures(target: string, spoken: string): {
  soundFeedback: SoundFeedbackDetail[];
  suggestion: string;
} {
  const soundFeedback: SoundFeedbackDetail[] = [];
  const suggestions: string[] = [];
  const t = target.toLowerCase();
  const s = spoken.toLowerCase();

  // 1. Missing ending sounds /s/, /z/, /t/, /d/, /ed/, /ing/
  const endingConsonants = [
    { sound: 's', desc: 'âm đuôi /s/' },
    { sound: 't', desc: 'âm đuôi /t/' },
    { sound: 'd', desc: 'âm đuôi /d/' },
    { sound: 'k', desc: 'âm đuôi /k/' },
    { sound: 'p', desc: 'âm đuôi /p/' },
  ];

  for (const { sound, desc } of endingConsonants) {
    if (t.endsWith(sound) && !s.endsWith(sound)) {
      soundFeedback.push({
        sound: desc,
        type: 'missing',
        tip: `Hãy bật rõ ${desc} khi kết thúc từ.`,
      });
      suggestions.push(`Cần bật rõ ${desc} để người nghe nhận diện chính xác.`);
      break;
    }
  }

  // 2. /th/ sound check
  if ((t.includes('th') && !s.includes('th')) || (t.includes('think') && s.includes('sink'))) {
    soundFeedback.push({
      sound: 'âm /θ/ hoặc /ð/',
      type: 'mispronounced',
      tip: 'Đặt đầu lưỡi giữa hai hàm răng và đẩy luồng hơi nhẹ ra ngoài.',
    });
    suggestions.push('Lưu ý âm "th": đặt đầu lưỡi giữa hai hàm răng, tránh đọc thành âm /s/ hoặc /d/.');
  }

  // 3. /r/ vs /l/
  if ((t.includes('r') && s.includes('l')) || (t.includes('l') && s.includes('r'))) {
    soundFeedback.push({
      sound: 'cặp âm /r/ và /l/',
      type: 'mispronounced',
      tip: 'Với âm /l/, đầu lưỡi chạm chân răng trên. Với âm /r/, uốn cong lưỡi về phía sau.',
    });
    suggestions.push('Phân biệt rõ âm /l/ (chạm đầu lưỡi) và âm /r/ (uốn lưỡi).');
  }

  // 4. Good overall pronunciation
  if (soundFeedback.length === 0) {
    soundFeedback.push({
      sound: 'Khẩu hình & Ngữ điệu',
      type: 'good',
      tip: 'Phát âm tự nhiên, nối âm mượt mà.',
    });
  }

  return {
    soundFeedback,
    suggestion: suggestions[0] || 'Phát âm to, rõ ràng và giữ nhịp độ tự nhiên.',
  };
}

/**
 * Evaluates spoken text against the target word or phrase
 * Uses realistic, multi-tiered threshold scoring
 */
export function evaluatePronunciation(
  targetWordOrPhrase: string,
  userSpokenText: string,
  mode: EvaluationMode = 'adult'
): PronunciationEvaluationResult {
  const normTarget = normalizeText(targetWordOrPhrase);
  const normSpoken = normalizeText(userSpokenText);
  // Adult passing threshold is 55% (Understandable / Pass), 70% is Good, 85% is Excellent
  const threshold = mode === 'kid' ? 50 : 55;

  // 1. Check if user didn't speak anything (empty / noise)
  if (!normSpoken) {
    return {
      target: targetWordOrPhrase,
      spoken: '',
      score: 0,
      isPassing: false,
      tier: 'not_enough_audio',
      threshold,
      mode,
      stars: 0,
      status: 'empty',
      feedback:
        mode === 'kid'
          ? 'Chưa nghe thấy giọng của bé! Bé hãy bấm mic rồi đọc thật to nhé! 🎙️'
          : 'Chưa nghe rõ âm thanh. Hãy bấm mic và nói to, rõ ràng hơn gần micro (hệ thống không trừ điểm của bạn). 🎙️',
      detailedDifferences: {
        suggestion: 'Kiểm tra xem micro đã được cấp quyền chưa và nói gần micro hơn một chút.',
      },
    };
  }

  // 2. Exact match or accepted speech variant
  if (normTarget === normSpoken || isAcceptedVariant(normTarget, normSpoken)) {
    const score = 100;
    return {
      target: targetWordOrPhrase,
      spoken: userSpokenText,
      score,
      isPassing: true,
      tier: 'excellent',
      threshold,
      mode,
      stars: 3,
      status: 'perfect',
      feedback:
        mode === 'kid'
          ? 'Xuất sắc! Bé phát âm chuẩn 100% bản xứ! 🌟🌟🌟'
          : 'Phát âm xuất sắc (100%)! Chuẩn âm vị và ngữ điệu người bản xứ! 🎯',
      detailedDifferences: {
        soundFeedback: [{ sound: 'Toàn bộ từ', type: 'good', tip: 'Chuẩn xác 100%' }],
        suggestion: 'Rất tuyệt vời! Tiếp tục duy trì phong độ phát âm tự nhiên này.',
      },
    };
  }

  const targetWords = normTarget.split(' ').filter(Boolean);
  const spokenWords = normSpoken.split(' ').filter(Boolean);
  const soundAnalysis = analyzeSoundFeatures(normTarget, normSpoken);

  // 3. Single word evaluation
  if (targetWords.length === 1) {
    const singleTarget = targetWords[0];

    // If spoken contains exact single word surrounded by fillers
    if (spokenWords.includes(singleTarget) || spokenWords.some((sw) => isAcceptedVariant(singleTarget, sw))) {
      const score = 95;
      return {
        target: targetWordOrPhrase,
        spoken: userSpokenText,
        score,
        isPassing: true,
        tier: 'excellent',
        threshold,
        mode,
        stars: 3,
        status: 'passed',
        feedback:
          mode === 'kid'
            ? 'Tuyệt vời! Bé phát âm rất chính xác! 🌟🌟🌟'
            : `Xuất sắc (${score}%)! Nhận diện từ chuẩn xác và tự nhiên. 🎯`,
        detailedDifferences: soundAnalysis,
      };
    }

    // Compare with closest spoken word
    let bestWordScore = 0;
    for (const sw of spokenWords) {
      if (isAcceptedVariant(singleTarget, sw)) {
        bestWordScore = Math.max(bestWordScore, 92);
        continue;
      }
      const dist = levenshteinDistance(singleTarget, sw);
      const maxLen = Math.max(singleTarget.length, sw.length);
      const levSim = Math.max(0, 1 - dist / maxLen);
      const dSim = diceSimilarity(singleTarget, sw);
      const wordScore = Math.round((levSim * 0.6 + dSim * 0.4) * 100);
      if (wordScore > bestWordScore) {
        bestWordScore = wordScore;
      }
    }

    const distWhole = levenshteinDistance(singleTarget, normSpoken);
    const maxLenWhole = Math.max(singleTarget.length, normSpoken.length);
    const wholeSim = Math.max(0, 1 - distWhole / maxLenWhole);
    const rawScore = Math.max(bestWordScore, Math.round(wholeSim * 100));

    // Multi-tiered calibration
    const finalScore = Math.min(100, Math.max(0, rawScore));
    const isPassing = finalScore >= threshold;

    let tier: PronunciationTier = 'needs_improvement';
    let feedback = '';
    let stars = 0;

    if (finalScore >= 85) {
      tier = 'excellent';
      stars = 3;
      feedback =
        mode === 'kid'
          ? `Tuyệt vời (${finalScore}%)! Bé phát âm rất hay! 🌟🌟🌟`
          : `Xuất sắc (${finalScore}%)! Chuẩn âm vị và ngữ điệu tự nhiên. 🎯`;
    } else if (finalScore >= 70) {
      tier = 'good';
      stars = 2;
      feedback =
        mode === 'kid'
          ? `Rất giỏi (${finalScore}%)! Bé gần đạt chuẩn hoàn hảo rồi! 🌟🌟`
          : `Tốt / Đạt chuẩn (${finalScore}%)! Phát âm rõ ràng, người bản xứ hiểu tốt. ✅`;
    } else if (finalScore >= 55) {
      tier = 'understandable';
      stars = 1;
      feedback =
        mode === 'kid'
          ? `Đạt chuẩn (${finalScore}%)! Bé phát âm được rồi nè! 🌟`
          : `Dễ hiểu (${finalScore}%)! Đạt yêu cầu giao tiếp. Hãy chú ý thêm gợi ý bên dưới để hoàn thiện hơn. 👍`;
    } else {
      tier = 'needs_improvement';
      stars = 0;
      feedback =
        mode === 'kid'
          ? `Bé đạt ${finalScore}%. Cần từ 50% để vượt qua. Bé nghe lại mẫu và thử lại nhé! 💪`
          : `Cần cải thiện (${finalScore}%). Nhận diện: "${userSpokenText}". ${soundAnalysis.suggestion} 💡`;
    }

    return {
      target: targetWordOrPhrase,
      spoken: userSpokenText,
      score: finalScore,
      isPassing,
      tier,
      threshold,
      mode,
      stars,
      status: isPassing ? 'passed' : 'failed',
      feedback,
      detailedDifferences: soundAnalysis,
    };
  }

  // 4. Multi-word phrase evaluation
  let matchedWordCount = 0;
  const remainingSpoken = [...spokenWords];

  targetWords.forEach((tw) => {
    const idx = remainingSpoken.findIndex((sw) => {
      if (isAcceptedVariant(tw, sw)) return true;
      const dist = levenshteinDistance(tw, sw);
      return dist <= (tw.length <= 3 ? 0 : 1);
    });
    if (idx !== -1) {
      matchedWordCount++;
      remainingSpoken.splice(idx, 1);
    }
  });

  const wordAccuracy = (matchedWordCount / targetWords.length) * 100;
  const wholeDistance = levenshteinDistance(normTarget, normSpoken);
  const maxWholeLen = Math.max(normTarget.length, normSpoken.length);
  const charAccuracy = Math.max(0, 1 - wholeDistance / maxWholeLen) * 100;

  const phraseScore = Math.min(
    100,
    Math.max(0, Math.round(wordAccuracy * 0.7 + charAccuracy * 0.3))
  );

  const isPassing = phraseScore >= threshold;
  let tier: PronunciationTier = 'needs_improvement';
  let stars = 0;
  let feedback = '';

  if (phraseScore >= 85) {
    tier = 'excellent';
    stars = 3;
    feedback =
      mode === 'kid'
        ? `Bé đọc câu xuất sắc (${phraseScore}%)! 🌟🌟🌟`
        : `Xuất sắc (${phraseScore}%)! Độ trôi chảy, ngữ điệu và phát âm câu rất tốt. 🎯`;
  } else if (phraseScore >= 70) {
    tier = 'good';
    stars = 2;
    feedback =
      mode === 'kid'
        ? `Rất tốt (${phraseScore}%)! Bé đọc đúng hầu hết các từ rồi! 🌟🌟`
        : `Đạt chuẩn câu (${phraseScore}%)! Các từ chính được phát âm chuẩn xác. ✅`;
  } else if (phraseScore >= 55) {
    tier = 'understandable';
    stars = 1;
    feedback =
      mode === 'kid'
        ? `Đạt chuẩn (${phraseScore}%)! Bé cố gắng rất đáng khen! 🌟`
        : `Dễ hiểu (${phraseScore}%)! Đạt yêu cầu diễn đạt câu. Hãy luyện thêm nhịp nối âm tự nhiên. 👍`;
  } else {
    tier = 'needs_improvement';
    stars = 0;
    feedback =
      mode === 'kid'
        ? `Bé đọc được ${phraseScore}%. Cần 50% để vượt qua. Hãy thử lại to hơn nhé! 💪`
        : `Cần cải thiện (${phraseScore}%). Nhận diện: "${userSpokenText}". Hãy nghe mẫu và đọc lại liền mạch hơn. 💡`;
  }

  return {
    target: targetWordOrPhrase,
    spoken: userSpokenText,
    score: phraseScore,
    isPassing,
    tier,
    threshold,
    mode,
    stars,
    status: isPassing ? 'passed' : 'failed',
    feedback,
    detailedDifferences: {
      ...soundAnalysis,
      missingWords: targetWords.filter((w) => !normSpoken.includes(w)),
      extraWords: spokenWords.filter((w) => !normTarget.includes(w)),
    },
  };
}

/**
 * Cross-browser SpeechRecognition runner supporting any language locale (BCP 47)
 */
export function listenSpeech(options: {
  maxDurationMs?: number;
  lang?: string; // BCP 47 locale e.g. 'en-US', 'de-DE', 'ja-JP', 'fr-FR', 'zh-CN', 'vi-VN'
  onResult: (spokenText: string) => void;
  onError?: (err: any) => void;
  onEnd?: () => void;
}): { stop: () => void } | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (options.onError) {
      options.onError(new Error('SPEECH_RECOGNITION_NOT_SUPPORTED'));
    }
    return null;
  }

  let isStopped = false;
  let hasResult = false;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 3;
  recognition.lang = options.lang || 'en-US';

  let timer: any = null;
  if (options.maxDurationMs && options.maxDurationMs > 0) {
    timer = setTimeout(() => {
      if (!isStopped) {
        try {
          recognition.stop();
        } catch (_) {}
      }
    }, options.maxDurationMs);
  }

  recognition.onresult = (event: any) => {
    hasResult = true;
    let finalTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      finalTranscript += event.results[i][0].transcript;
    }
    if (finalTranscript.trim()) {
      options.onResult(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: any) => {
    if (event.error === 'no-speech') {
      // User didn't speak in time, not a fatal crash
      return;
    }
    if (options.onError) {
      options.onError(event);
    }
  };

  recognition.onend = () => {
    if (timer) clearTimeout(timer);
    if (!hasResult && !isStopped) {
      options.onResult('');
    }
    if (options.onEnd) {
      options.onEnd();
    }
  };

  try {
    recognition.start();
  } catch (err) {
    if (options.onError) options.onError(err);
    return null;
  }

  return {
    stop: () => {
      isStopped = true;
      if (timer) clearTimeout(timer);
      try {
        recognition.stop();
      } catch (_) {}
    },
  };
}
