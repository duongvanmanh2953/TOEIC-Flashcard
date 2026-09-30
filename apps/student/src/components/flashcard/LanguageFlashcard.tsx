import React, { useState } from 'react';
import { LanguageDefinition } from '../../config/languages';
import { CountryFlag } from '../language/CountryFlag';
import { audioEngine } from '../../lib/audioEngine';
import {
  Volume2,
  RotateCw,
  Sparkles,
  Heart,
  Eye,
  EyeOff,
  BookOpen,
  Info,
  CheckCircle2,
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
  article?: string; // 'der' | 'die' | 'das' | 'el' | 'la'
  gender?: string; // 'masculine' | 'feminine' | 'neuter'
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showRomaji, setShowRomaji] = useState(true);

  // Play audio for the target word using the language's native speech locale
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) return;

    setIsPlaying(true);
    // If German noun with article, speak article + noun (e.g. "das Haus")
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

  // German article color accents
  const getGermanArticleColor = (article?: string) => {
    switch ((article || '').toLowerCase()) {
      case 'der':
        return 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/40';
      case 'die':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40';
      case 'das':
        return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40';
    }
  };

  return (
    <div
      onClick={onFlip}
      className={`flashcard-container cursor-pointer select-none group ${className}`}
      title="Bấm để lật thẻ (hoặc nhấn phím Space)"
    >
      <div
        className={`flashcard-inner ${isFlipped ? 'is-flipped' : ''}`}
        style={{ minHeight: '340px' }}
      >
        {/* ========================================================================= */}
        {/* FRONT SIDE (Word, Pronunciation, Script Helpers, Audio)                  */}
        {/* ========================================================================= */}
        <div
          className={`flashcard-face flashcard-front p-6 sm:p-8 flex flex-col justify-between rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
            isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top Header: Language Tag, CEFR / Topic, Favorite */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                <CountryFlag languageId={language.id} countryCode={language.countryCode} size="xs" />
                <span>{language.name}</span>
              </span>

              {item.cefrLevel && (
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25">
                  {item.cefrLevel}
                </span>
              )}

              {item.topic && (
                <span className="hidden sm:inline px-2 py-0.5 rounded-lg text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-800/60">
                  {item.topic}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Chinese Pinyin Toggle Button */}
              {language.features.supportsPinyin && item.pinyin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPinyin(!showPinyin);
                  }}
                  className="p-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                  title={showPinyin ? 'Ẩn Pinyin (Chỉ hiển thị chữ Hán)' : 'Hiện Pinyin'}
                >
                  {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">Pinyin</span>
                </button>
              )}

              {/* Japanese Romaji Toggle Button */}
              {language.features.supportsRomaji && item.romaji && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRomaji(!showRomaji);
                  }}
                  className="p-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1"
                  title={showRomaji ? 'Ẩn Romaji' : 'Hiện Romaji'}
                >
                  {showRomaji ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span className="text-[10px] font-bold">Romaji</span>
                </button>
              )}

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(item.id);
                  }}
                  className={`p-2 rounded-xl transition ${
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

          {/* Middle: Word Display & Script helpers */}
          <div className="text-center py-4 sm:py-6 space-y-3">
            {/* German Article & Gender Badge */}
            {language.id === 'de' && item.article && (
              <div className="inline-flex items-center gap-1.5">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border shadow-xs ${getGermanArticleColor(
                    item.article
                  )}`}
                >
                  {item.article}
                </span>
                {item.gender && (
                  <span className="text-xs font-medium text-slate-400 capitalize">
                    • {item.gender}
                  </span>
                )}
              </div>
            )}

            {/* Spanish Article & Gender */}
            {language.id === 'es' && item.article && (
              <div className="inline-flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {item.article}
                </span>
              </div>
            )}

            {/* Main Word / Expression */}
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              {item.word}
            </h2>

            {/* Chinese Pinyin with Tone indication */}
            {language.id === 'zh' && item.pinyin && showPinyin && (
              <div className="flex items-center justify-center gap-2">
                <p className="text-lg sm:text-xl font-semibold text-red-600 dark:text-red-400 tracking-wide font-mono">
                  {item.pinyin}
                </p>
                {item.tone && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                    Tone {item.tone}
                  </span>
                )}
              </div>
            )}

            {/* Japanese Romaji */}
            {language.id === 'ja' && item.romaji && showRomaji && (
              <p className="text-base sm:text-lg font-medium text-rose-500 dark:text-rose-400 italic">
                {item.romaji}
              </p>
            )}

            {/* Korean Romanization */}
            {language.id === 'ko' && item.transliteration && (
              <p className="text-base sm:text-lg font-medium text-sky-600 dark:text-sky-400 font-mono">
                {item.transliteration}
              </p>
            )}

            {/* Thai Transliteration */}
            {language.id === 'th' && item.transliteration && (
              <p className="text-base sm:text-lg font-medium text-amber-600 dark:text-amber-400 font-mono">
                {item.transliteration}
              </p>
            )}

            {/* Phonetic / IPA representation */}
            {(item.phonetic || item.pronunciation) && (
              <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-slate-500 tracking-wider">
                {item.phonetic || item.pronunciation}
              </p>
            )}

            {/* Audio Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition shadow-sm ${
                  isPlaying
                    ? 'bg-indigo-600 text-white scale-95 ring-2 ring-indigo-400'
                    : 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                }`}
                title="Nghe phát âm chuẩn bản xứ"
              >
                <Volume2 className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
                <span>{isPlaying ? 'Đang phát...' : 'Phát âm'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Footer: Hint / Flip Prompt */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chạm thẻ để xem nghĩa & ví dụ</span>
            </span>
            {item.partOfSpeech && (
              <span className="italic font-medium text-slate-500">{item.partOfSpeech}</span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BACK SIDE (Meaning, Examples, Explanations, Extra Grammar)              */}
        {/* ========================================================================= */}
        <div
          className={`flashcard-face flashcard-back p-6 sm:p-8 flex flex-col justify-between rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${
            !isFlipped ? 'pointer-events-none' : ''
          }`}
        >
          {/* Top Header */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Nghĩa & Ngữ cảnh</span>
            </span>

            <button
              type="button"
              onClick={handlePlayAudio}
              className="p-2 rounded-xl text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition"
              title="Nghe phát âm"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Middle: Meaning and Example sentence */}
          <div className="py-3 space-y-4 text-center sm:text-left">
            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-wider mb-1">
                Ý nghĩa chính
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                {item.meaning}
              </h3>
              {item.definition && (
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                  {item.definition}
                </p>
              )}
            </div>

            {/* Example sentence with translation */}
            {item.example && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-left space-y-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                  "{item.example}"
                </p>
                {item.exampleTranslation && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    → {item.exampleTranslation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Footer */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Chạm thẻ để quay lại</span>
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.word}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
