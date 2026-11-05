import { describe, it, expect } from 'vitest';
import {
  segmentIntoWritingUnits,
  segmentGraphemes,
  decomposeHangulSyllable,
  isRTLScript,
} from '../lib/handwriting/core/segmentation';
import {
  handwritingRegistry,
  HandwritingProviderRegistry,
} from '../lib/handwriting/core/registry';
import { HanziWriterAdapter } from '../lib/handwriting/adapters/hanziWriterAdapter';
import { KakitoriAdapter } from '../lib/handwriting/adapters/kakitoriAdapter';
import { SelvasAdapter } from '../lib/handwriting/adapters/selvasAdapter';
import { MyScriptAdapter } from '../lib/handwriting/adapters/myscriptAdapter';
import {
  HandwritingRequest,
  InkStroke,
} from '../lib/handwriting/core/types';

describe('Multi-Script Grapheme & Linguistic Segmentation (5 Language Spaces)', () => {
  it('1. Chinese: segments multi-character compounds into individual atomic Hanzi', () => {
    const units = segmentIntoWritingUnits('你好世界', 'zh');
    expect(units.length).toBe(4);
    expect(units.map((u) => u.unit)).toEqual(['你', '好', '世', '界']);
    expect(units[0].script).toBe('HANZI');
    expect(units[0].isRTL).toBe(false);
  });

  it('2. Japanese: handles Kanji, Hiragana and Katakana with voiced marks correctly', () => {
    const units = segmentIntoWritingUnits('学校で勉強します', 'ja');
    expect(units.length).toBe(8);
    expect(units[0].unit).toBe('学');
    expect(units[0].script).toBe('KANJI');
    expect(units[2].unit).toBe('で');
    expect(units[2].script).toBe('KANA');

    // Voiced Hiragana should remain a single atomic grapheme
    const graphemes = segmentGraphemes('がばぱ', 'ja-JP');
    expect(graphemes).toEqual(['が', 'ば', 'ぱ']);
  });

  it('3. Korean: decomposes Hangul syllables into Chosung, Jungsung and Jongsung', () => {
    // "한" = ㅎ (chosung) + ㅏ (jungsung) + ㄴ (jongsung)
    const han = decomposeHangulSyllable('한');
    expect(han.isHangul).toBe(true);
    expect(han.chosung).toBe('ㅎ');
    expect(han.jungsung).toBe('ㅏ');
    expect(han.jongsung).toBe('ㄴ');

    // "글" = ㄱ + ㅡ + ㄹ
    const geul = decomposeHangulSyllable('글');
    expect(geul.isHangul).toBe(true);
    expect(geul.chosung).toBe('ㄱ');
    expect(geul.jungsung).toBe('ㅡ');
    expect(geul.jongsung).toBe('ㄹ');

    // Multi-syllable segmentation
    const units = segmentIntoWritingUnits('한국어', 'ko');
    expect(units.length).toBe(3);
    expect(units[0].unit).toBe('한');
    expect(units[0].metadata?.hangulComponents?.chosung).toBe('ㅎ');
  });

  it('4. Thai: strictly preserves combining vowels, tone marks and base consonants in clusters', () => {
    // "น้ำ" = น (base) + ้ำ (sara am + mai tho combining marks)
    const units = segmentIntoWritingUnits('น้ำ', 'th');
    expect(units.length).toBe(1);
    expect(units[0].unit).toBe('น้ำ');
    expect(units[0].script).toBe('THAI');

    // "สวัสดี" (Hello): ส, ว, ัส, ด, ี
    const sawasdee = segmentIntoWritingUnits('สวัสดี', 'th');
    expect(sawasdee.length).toBeGreaterThanOrEqual(4);
    // Neither tone marks nor combining vowels should ever be split into disjoint standalone boxes
    sawasdee.forEach((u) => {
      expect(u.unit.length).toBeGreaterThan(0);
      expect(u.isRTL).toBe(false);
    });
  });

  it('5. Arabic: preserves RTL word orientation, whole-word cursive structure and tashkeel', () => {
    const arabicText = 'مَرْحَبًا'; // "Marhaban" with tashkeel
    const isRtl = isRTLScript(arabicText, 'ar');
    expect(isRtl).toBe(true);

    const units = segmentIntoWritingUnits('مَرْحَبًا بِكُمْ', 'ar');
    expect(units.length).toBe(2);
    expect(units[0].unit).toBe('مَرْحَبًا');
    expect(units[0].isRTL).toBe(true);
    expect(units[1].unit).toBe('بِكُمْ');
    expect(units[1].isRTL).toBe(true);
  });
});

describe('Handwriting Provider Registry: Dynamic Language Space Routing', () => {
  const registry = handwritingRegistry;

  it('routes Chinese (zh) to HanziWriter with full stroke evaluation capabilities', () => {
    const provider = registry.getProviderForLanguage('zh');
    expect(provider).toBeDefined();
    expect(provider?.metadata.id).toBe('hanzi-writer');
    expect(provider?.metadata.capabilities).toContain('stroke_order');
    expect(provider?.metadata.capabilities).toContain('stroke_direction');
    expect(provider?.metadata.capabilities).toContain('stroke_animation');
  });

  it('routes Japanese (ja) to Kakitori with stroke ending checks (tome, hane, harai)', () => {
    const provider = registry.getProviderForLanguage('ja');
    expect(provider).toBeDefined();
    expect(provider?.metadata.id).toBe('kakitori');
    expect(provider?.metadata.capabilities).toContain('stroke_order');
    expect(provider?.metadata.capabilities).toContain('stroke_ending');
  });

  it('routes Korean (ko) to SELVAS Pen adapter', () => {
    const provider = registry.getProviderForLanguage('ko');
    expect(provider).toBeDefined();
    expect(provider?.metadata.id).toBe('selvas-pen');
    expect(provider?.metadata.capabilities).toContain('stroke_order');
  });

  it('routes Thai (th) to MyScript with recognition-only capability (no fake stroke order)', () => {
    const provider = registry.getProviderForLanguage('th');
    expect(provider).toBeDefined();
    expect(provider?.metadata.id).toBe('myscript');
    expect(provider?.metadata.capabilities).toContain('whole_text_recognition');
    expect(provider?.metadata.capabilities).not.toContain('stroke_order');
  });

  it('routes Arabic (ar) to MyScript with whole_text_recognition only (stroke order disabled)', () => {
    const provider = registry.getProviderForLanguage('ar');
    expect(provider).toBeDefined();
    expect(provider?.metadata.id).toBe('myscript');
    expect(provider?.metadata.capabilities).toContain('whole_text_recognition');
    expect(provider?.metadata.capabilities).not.toContain('stroke_order');
  });
});

describe('HanziWriter Adapter Invariants', () => {
  const adapter = new HanziWriterAdapter();

  it('declares correct metadata and open-source license attribution', () => {
    expect(adapter.metadata.licenseName).toContain('MIT');
    expect(adapter.metadata.licenseName).toContain('Arphic');
    expect(adapter.metadata.requiresLicenseKey).toBe(false);
    expect(adapter.metadata.supportsOffline).toBe(true);
  });

  it('rejects empty stroke submissions with inconclusive status', async () => {
    const req: HandwritingRequest = {
      languageCode: 'zh',
      scriptCode: 'HANZI_SIMPLIFIED',
      targetText: '你',
      strokes: [],
      mode: 'guided',
    };
    const res = await adapter.evaluateStrokes(req);
    expect(res.status).toBe('inconclusive');
    expect(res.feedback).toContain('Chưa có nét vẽ nào');
  });
});

describe('Kakitori Adapter Invariants', () => {
  const adapter = new KakitoriAdapter();

  it('declares Kakitori and KanjiVG data licensing correctly', () => {
    expect(adapter.metadata.licenseName).toContain('CC BY-SA');
    expect(adapter.metadata.capabilities).toContain('stroke_ending');
  });

  it('detects character presence in elementary Japanese grade sets', () => {
    // "日" is a standard Grade 1 Kanji
    expect(adapter.hasCharacterData('日')).toBe(true);
    // "あ" is Hiragana
    expect(adapter.hasCharacterData('あ')).toBe(true);
    // "ア" is Katakana
    expect(adapter.hasCharacterData('ア')).toBe(true);
  });
});

describe('SELVAS Pen Adapter: Strict Disabled/Unsupported Invariant', () => {
  it('reports disabled/unsupported state when SELVAS_LICENSE_KEY is not configured', () => {
    const unconfiguredAdapter = new SelvasAdapter(); // No key provided
    expect(unconfiguredAdapter.isAvailable()).toBe(false);
    expect(unconfiguredAdapter.getUnavailableReason()).toContain('Chưa cấu hình SELVAS_LICENSE_KEY');
  });

  it('evaluates gracefully with diagnostic explanation without faking native license score', async () => {
    const unconfiguredAdapter = new SelvasAdapter();
    const req: HandwritingRequest = {
      languageCode: 'ko',
      scriptCode: 'HANGUL',
      targetText: '한',
      strokes: [{ id: 's1', index: 0, points: [{ x: 100, y: 100, t: 0 }] }],
      mode: 'guided',
    };
    const res = await unconfiguredAdapter.evaluateStrokes(req);
    expect(res.status).toBe('unsupported');
    expect(res.errorCode).toBe('SELVAS_NOT_CONFIGURED');
    expect(res.feedback).toContain('SELVAS');
  });
});

describe('MyScript Adapter: Strict Recognition-Only Invariant (Thai & Arabic)', () => {
  const adapter = new MyScriptAdapter();

  it('strictly marks evaluateStrokes as recognition_only without claiming stroke order verification', async () => {
    const req: HandwritingRequest = {
      languageCode: 'th',
      scriptCode: 'THAI',
      targetText: 'น้ำ',
      strokes: [{ id: 's1', index: 0, points: [{ x: 100, y: 100, t: 0 }] }],
      mode: 'freehand',
    };
    const res = await adapter.evaluateStrokes(req);
    expect(res.status).toBe('recognition_only');
    expect(res.capabilitiesUsed).not.toContain('stroke_order');
    expect(res.feedback).toContain('chỉ hỗ trợ nhận dạng chữ viết tay');
  });

  it('rejects empty stroke recognition requests as inconclusive', async () => {
    const req: HandwritingRequest = {
      languageCode: 'ar',
      scriptCode: 'ARABIC',
      targetText: 'سلام',
      strokes: [],
      mode: 'freehand',
    };
    const res = await adapter.recognizeText(req);
    expect(res.status).toBe('inconclusive');
  });
});

