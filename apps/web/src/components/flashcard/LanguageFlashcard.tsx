import React, { useState } from 'react';
import { LanguageDefinition } from '../../config/languages';
import { CountryFlag } from '../language/CountryFlag';
import { audioEngine } from '../../lib/audioEngine';
import { usePerformance } from '../../contexts/PerformanceContext';
import {
  Volume2,
  RotateCw,
  Heart,
  Eye,
  EyeOff,
  BookOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react';

export interface FlashcardItem {
  id?: string;
  word: string;
  meaning: string;
  definition?: string;
  phonetic?: string;
  pronunciation?: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  topic?: string;
  example?: string;
  exampleTranslation?: string;
  // Multi-language metadata
  article?: string;
  gender?: string;
  pinyin?: string;
  tone?: string;
  romaji?: string;
  transliteration?: string;
  script?: string;
  isFavorite?: boolean;
}

interface LanguageFlashcardProps {
  language: LanguageDefinition;
  item: FlashcardItem;
  isFlipped: boolean;
  onFlip: () => void;
  onToggleFavorite?: (id?: string) => void;
  className?: string;
}

export const LanguageFlashcard: React.FC<LanguageFlashcardProps> = ({
  language,
  item,
  isFlipped,
  onFlip,
  onToggleFavorite,
  className = '',
}) => {
  const { isUltraEfficient } = usePerformance();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScriptHelper, setShowScriptHelper] = useState(true);

  // Play audio for the target word using the language's native speech locale
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    const textToSpeak =
      language.id === 'de' && item.article
        ? `${item.article} ${item.word}`
        : item.word;

    audioEngine.playWord(textToSpeak, {
      lang: language.speechLocale,
      rate: 1.0,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const getGermanArticleColor = (article?: string) => {
    switch ((article || '').toLowerCase()) {
      case 'der':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'die':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'das':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    }
  };

  const hasScriptHelper = Boolean(
    (language.id === 'zh' && item.pinyin) ||
    (language.id === 'ja' && item.romaji) ||
    (language.id === 'ko' && item.transliteration) ||
    (language.id === 'th' && item.transliteration)
  );

  const scriptHelperText =
    language.id === 'zh'
      ? item.pinyin
      : language.id === 'ja'
        ? item.romaji
        : item.transliteration;

  return (
    <div
      onClick={onFlip}
      className={`flashcard-container cursor-pointer select-none group w-full max-w-2xl mx-auto ${className}`}
      title="Bấm để lật thẻ (hoặc nhấn phím Space)"
    >
      <div
        className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''} ${
          isUltraEfficient ? 'ultra-fast' : ''
        }`}
        style={{ minHeight: '380px' }}
      >
        {/* ========================================================================= */}
        {/* FRONT SIDE (Single Clear Hero Focus: Target Word + Audio + Script Helper)*/}
        {/* ========================================================================= */}
        <div
          className={`flashcard-face flashcard-front p-5 sm:p-7 md:p-8 flex flex-col justify-between rounded-3xl shadow-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top Header: Language Badge, CEFR & Minimal Controls */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                <CountryFlag languageId={language.id} countryCode={language.countryCode} size="xs" />
                <span className="truncate">{language.name}</span>
              </span>

              {item.cefrLevel && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
                  {item.cefrLevel}
                </span>
              )}

              {item.partOfSpeech && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-lg text-[10px] font-semibold text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 italic shrink-0">
                  {item.partOfSpeech}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasScriptHelper && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScriptHelper(!showScriptHelper);
                  }}
                  className="px-2 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                  title={showScriptHelper ? 'Ẩn phiên âm hỗ trợ' : 'Hiện phiên âm hỗ trợ'}
                >
                  {showScriptHelper ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">Phiên âm</span>
                </button>
              )}

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    item.isFavorite
                      ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                      : 'text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="Yêu thích từ vựng"
                >
                  <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
                </button>
              )}
            </div>
          </div>

          {/* Center Stage: Target Word as Uncluttered Hero */}
          <div className="my-auto py-6 text-center space-y-3">
            {/* German/Spanish Article Badge if applicable */}
            {language.id === 'de' && item.article && (
              <div className="inline-flex items-center gap-1.5">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border ${getGermanArticleColor(item.article)}`}>
                  {item.article}
                </span>
                {item.gender && (
                  <span className="text-[11px] font-medium text-slate-400 capitalize">
                    {item.gender}
                  </span>
                )}
              </div>
            )}

            {language.id === 'es' && item.article && (
              <div className="inline-flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {item.article}
                </span>
              </div>
            )}

            {/* Target Word Main Title */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight break-words px-2">
              {item.word}
            </h2>

            {/* Script Helper (Pinyin / Romaji / Transliteration) */}
            {hasScriptHelper && showScriptHelper && scriptHelperText && (
              <div className="flex items-center justify-center gap-2">
                <p className="text-base sm:text-xl font-semibold text-indigo-600 dark:text-indigo-400 tracking-wide font-mono truncate max-w-full px-2">
                  {scriptHelperText}
                </p>
                {language.id === 'zh' && item.tone && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    Tone {item.tone}
                  </span>
                )}
              </div>
            )}

            {/* Phonetic / IPA */}
            {(item.phonetic || item.pronunciation) && (
              <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 tracking-wider truncate max-w-full px-2">
                {item.phonetic || item.pronunciation}
              </p>
            )}

            {/* Pronunciation Audio CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  isPlaying
                    ? 'bg-indigo-600 text-white scale-95 ring-2 ring-indigo-400'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60'
                }`}
                title="Nghe phát âm chuẩn bản xứ"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                <span>{isPlaying ? 'Đang phát...' : 'Nghe phát âm'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Footer: Visual Flip Prompt */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chạm thẻ để xem nghĩa & ví dụ</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              [Phím Space]
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BACK SIDE (Meaning Hierarchy, Context Definition, Real Example & Note)   */}
        {/* ========================================================================= */}
        <div
          className={`flashcard-face flashcard-back p-5 sm:p-7 md:p-8 flex flex-col justify-between rounded-3xl shadow-xl border border-indigo-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ý nghĩa & Ngữ cảnh</span>
            </span>

            <button
              type="button"
              onClick={handlePlayAudio}
              className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
              title="Nghe lại phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Center Stage: Ordered Information Hierarchy */}
          <div className="my-auto py-4 space-y-4 text-left overflow-y-auto max-h-[260px] pr-1">
            {/* 1. Primary Meaning */}
            <div>
              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mb-1">
                Nghĩa tiếng Việt
              </p>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-snug break-words">
                {item.meaning}
              </h3>
              {item.definition && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 italic leading-relaxed">
                  {item.definition}
                </p>
              )}
            </div>

            {/* 2. Example Sentence in Context with Translation */}
            {item.example && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed break-words">
                  "{item.example}"
                </p>
                {item.exampleTranslation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                    → {item.exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 font-medium">
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chạm thẻ để quay lại mặt trước</span>
            </span>
            <span className="font-extrabold text-indigo-600 dark:text-indigo-400 truncate max-w-[120px]">
              {item.word}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
