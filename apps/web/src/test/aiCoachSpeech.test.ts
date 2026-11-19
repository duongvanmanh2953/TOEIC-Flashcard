import { describe, it, expect } from 'vitest';
import {
  stripHeadingsForSpeech,
  getTutorsForLanguage,
  getAILanguageFallbackReply,
} from '../pages/AICoachStudioPage';

describe('AI Coach Speech & Text Processing', () => {
  it('strips markdown headings (#, ##, ###) while preserving conversational body text', () => {
    const input = `### 💡 Lời chào thân thiện
Hello! How are you doing today?
## Section 2
I am your personal AI language coach. Let's practice!`;
    const clean = stripHeadingsForSpeech(input);
    expect(clean).not.toContain('###');
    expect(clean).not.toContain('##');
    expect(clean).not.toContain('Section 2');
    expect(clean).toContain('Hello! How are you doing today?');
    expect(clean).toContain("I am your personal AI language coach. Let's practice!");
  });

  it('strips numbered/bulleted meta title headers and bold labels', () => {
    const input = `1. 📌 **Giải thích & Ngữ cảnh (Core Explanation):**
This sentence illustrates the subjunctive mood in English.
2. 🌐 🇻🇳 **Ví dụ thực tế song ngữ:**
If I were you, I would study diligently.
**Tiêu đề:** Chủ đề ngữ pháp`;
    const clean = stripHeadingsForSpeech(input);
    expect(clean).not.toContain('Giải thích & Ngữ cảnh');
    expect(clean).not.toContain('Ví dụ thực tế');
    expect(clean).not.toContain('Tiêu đề:');
    expect(clean).toContain('This sentence illustrates the subjunctive mood in English.');
    expect(clean).toContain('If I were you, I would study diligently.');
  });

  it('does not limit word length or truncate long messages', () => {
    const longText = Array(150).fill('vocabulary').join(' ');
    const clean = stripHeadingsForSpeech(longText);
    expect(clean.split(' ').length).toBe(150);
  });

  it('filters system voices strictly matching the active language code', () => {
    const mockVoices = [
      { name: 'Google US English', lang: 'en-US', voiceURI: 'google-en' },
      { name: 'Microsoft David', lang: 'en-US', voiceURI: 'ms-david' },
      { name: 'Microsoft Haruka', lang: 'ja-JP', voiceURI: 'ms-haruka' },
      { name: 'Google 普通话', lang: 'zh-CN', voiceURI: 'google-zh' },
      { name: 'Google 國語', lang: 'cmn-TW', voiceURI: 'google-cmn' },
      { name: 'Google Français', lang: 'fr-FR', voiceURI: 'google-fr' },
      { name: 'Google Deutsch', lang: 'de-DE', voiceURI: 'google-de' },
      { name: 'Google Tiếng Việt', lang: 'vi-VN', voiceURI: 'google-vi' },
    ];

    const filterVoices = (voices: typeof mockVoices, langCode: string) => {
      const code = langCode.toLowerCase();
      return voices.filter(v => {
        const vLang = v.lang.toLowerCase().replace('_', '-');
        if (code === 'zh') return vLang.startsWith('zh') || vLang.startsWith('cmn');
        return vLang.startsWith(code);
      });
    };

    const enVoices = filterVoices(mockVoices, 'en');
    expect(enVoices.length).toBe(2);
    expect(enVoices.every(v => v.lang.startsWith('en'))).toBe(true);

    const jaVoices = filterVoices(mockVoices, 'ja');
    expect(jaVoices.length).toBe(1);
    expect(jaVoices[0].name).toBe('Microsoft Haruka');

    const zhVoices = filterVoices(mockVoices, 'zh');
    expect(zhVoices.length).toBe(2);
    expect(zhVoices.some(v => v.lang === 'zh-CN')).toBe(true);
    expect(zhVoices.some(v => v.lang === 'cmn-TW')).toBe(true);

    const frVoices = filterVoices(mockVoices, 'fr');
    expect(frVoices.length).toBe(1);
    expect(frVoices[0].lang).toBe('fr-FR');
  });

  it('returns native coaches matching the active language space (no UK/US teachers in Chinese space)', () => {
    const zhTutors = getTutorsForLanguage('zh');
    expect(zhTutors.length).toBeGreaterThanOrEqual(4);

    // Absolutely NO US/UK native coach titles or accents in Chinese space
    expect(zhTutors.every(t => !t.accent.includes('UK') && !t.accent.includes('US Native'))).toBe(true);
    expect(zhTutors.some(t => t.name.includes('Wang Laoshi') || t.name.includes('王老师'))).toBe(true);
    expect(zhTutors.some(t => t.name.includes('Li Na') || t.name.includes('李娜'))).toBe(true);
    expect(zhTutors.every(t => t.languageId === 'zh')).toBe(true);
    // Greetings must be in Chinese
    expect(zhTutors.every(t => /[\u4e00-\u9fa5]/.test(t.greeting))).toBe(true);

    // Japanese tutors
    const jaTutors = getTutorsForLanguage('ja');
    expect(jaTutors.some(t => t.name.includes('Kenji Sato') || t.name.includes('佐藤'))).toBe(true);
    expect(jaTutors.every(t => /[\u3040-\u30ff\u4e00-\u9faf]/.test(t.greeting))).toBe(true);

    // English tutors
    const enTutors = getTutorsForLanguage('en');
    expect(enTutors.some(t => t.name === 'Alex Johnson')).toBe(true);
    expect(enTutors.some(t => t.name === 'Jack O\'Connor')).toBe(true);
  });

  it('generates target-language fallback replies instead of falling back to English', () => {
    const zhFallback = getAILanguageFallbackReply('zh', 'Chinese');
    expect(/[\u4e00-\u9fa5]/.test(zhFallback)).toBe(true);
    expect(zhFallback).not.toContain('I heard you clearly');

    const jaFallback = getAILanguageFallbackReply('ja', 'Japanese');
    expect(/[\u3040-\u30ff]/.test(jaFallback)).toBe(true);

    const koFallback = getAILanguageFallbackReply('ko', 'Korean');
    expect(/[\uac00-\ud7af]/.test(koFallback)).toBe(true);
  });
});
