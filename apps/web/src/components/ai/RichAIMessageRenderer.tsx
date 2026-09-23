import React, { useState } from 'react';
import { Volume2, Sparkles, BookOpen, CheckCircle2, HelpCircle, Lightbulb } from 'lucide-react';
import { audioEngine } from '../../lib/audioEngine';
import { CountryFlag } from '../language/CountryFlag';
import { useLearningContext } from '../../contexts/LearningContext';

interface RichAIMessageRendererProps {
  content: string;
  provider?: string;
  onSelectQuizOption?: (option: string) => void;
  className?: string;
}

export const RichAIMessageRenderer: React.FC<RichAIMessageRendererProps> = ({
  content,
  provider,
  onSelectQuizOption,
  className = '',
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const { activeLanguage } = useLearningContext();
  const effectiveTargetLocale = activeLanguage?.speechLocale || 'en-US';

  const isOfflineFallback = provider === 'vocabflow-core' || content.includes('VocalFlow AI');
  const isGemini = provider?.includes('gemini');
  const isOpenAI = provider?.includes('openai');

  // Helper to play single sentence/phrase
  const handlePlayAudio = (text: string, lang?: string) => {
    const playLang = lang || effectiveTargetLocale;
    setIsPlayingAudio(true);
    audioEngine.playWord(text, {
      lang: playLang,
      rate: playLang === 'vi-VN' ? 1.0 : 0.9,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Helper to play full bilingual text (EN + VI)
  const handlePlayBilingual = () => {
    setIsPlayingAudio(true);
    audioEngine.playBilingualText(content, {
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  // Parse CEFR level if present (e.g. C2, B1, etc.)
  const cefrMatch = content.match(/Trình độ:\s*\*?\*?([A-C][12])\*?\*?/i);
  const cefrLevel = cefrMatch ? cefrMatch[1].toUpperCase() : null;

  // Render inline formatting (**bold**)
  const formatInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-extrabold text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded bg-indigo-100/70 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-900/50">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} className="italic text-slate-500 dark:text-slate-400">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  };

  // Parse lines into styled structured blocks
  const lines = content.split('\n');

  return (
    <div className={`space-y-3.5 font-sans leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}>
      {/* 1. Header Banner with CEFR Level Pill, Provider Badge & Bilingual Audio Button */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-lg shadow-inner">
            🤖
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-xs sm:text-sm tracking-wide">VocalFlow AI Tutor</span>
              {cefrLevel && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider shadow-xs">
                  Level {cefrLevel}
                </span>
              )}
            </div>
            
            <div className="mt-0.5 flex items-center gap-1.5">
              {provider?.includes('cache') ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-400/40 flex items-center gap-1">
                  ⚡ Kho Dữ Liệu Thông Minh (Tiết Kiệm Token)
                </span>
              ) : isGemini ? (
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-400/40">
                  ✨ Gemini 1.5 Flash AI Direct
                </span>
              ) : isOpenAI ? (
                <span className="text-[10px] font-bold text-sky-300 bg-sky-950/60 px-2 py-0.5 rounded-full border border-sky-400/40">
                  ⚡ OpenAI GPT-4o Direct
                </span>
              ) : isOfflineFallback ? (
                <span className="text-[10px] font-bold text-amber-200 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-400/40">
                  ⚠️ Offline Engine (GEMINI_API_KEY không hợp lệ)
                </span>
              ) : (
                <span className="text-[10px] opacity-85 font-medium">Trợ Lý Ngôn Ngữ Thông Minh 24/7</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handlePlayBilingual}
          disabled={isPlayingAudio}
          className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-extrabold flex items-center gap-1.5 border border-white/30 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
          title="Đọc toàn bộ câu trả lời bằng giọng Nam Brian (Đa ngôn ngữ, chuẩn bản xứ tốc độ 1.25x)"
        >
          <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-amber-300' : ''}`} />
          <span>{isPlayingAudio ? 'Đang đọc...' : 'Giọng Nam Brian'}</span>
        </button>
      </div>

      {/* 2. Structured Body Content */}
      <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Main Header (###)
          if (trimmed.startsWith('### ')) {
            const titleText = trimmed.replace(/^###\s*/, '').replace(/[*#]/g, '');
            return (
              <div key={idx} className="pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <h3 className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>{titleText}</span>
                </h3>
              </div>
            );
          }

          // Section Titles (1. **Giải thích...**, 2. **Ví dụ...**, 3. **Thử thách...**)
          if (/^\d+\.\s*\*\*/.test(trimmed)) {
            const secTitle = trimmed.replace(/[*#]/g, '');
            const isEx = secTitle.toLowerCase().includes('ví dụ');
            const isQuiz = secTitle.toLowerCase().includes('thử thách');

            return (
              <div
                key={idx}
                className={`mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 font-black text-xs sm:text-sm ${
                  isQuiz
                    ? 'text-amber-700 dark:text-amber-400'
                    : isEx
                    ? 'text-purple-700 dark:text-purple-400'
                    : 'text-indigo-700 dark:text-indigo-400'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isQuiz ? <HelpCircle className="w-4 h-4 shrink-0" /> : isEx ? <span>💬</span> : <BookOpen className="w-4 h-4 shrink-0" />}
                  <span>{secTitle}</span>
                </div>
              </div>
            );
          }

          // Target Language Example Sentence Line (🇬🇧, 🇩🇪, 🇯🇵, etc.)
          const isTargetLangLine =
            trimmed.includes('🇬🇧') ||
            (activeLanguage?.flag && trimmed.includes(activeLanguage.flag));

          if (isTargetLangLine) {
            const cleanTarget = trimmed
              .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
              .replace(/^[*\s"'“”]+|[*\s"'“”]+$/g, '')
              .replace(/[*"]/g, '');
            return (
              <div key={idx} className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 my-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CountryFlag languageId={activeLanguage?.id || 'en'} size="xs" /> {activeLanguage?.name || 'Target'} Sentence
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(cleanTarget, effectiveTargetLocale)}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title={`Nghe câu ví dụ bằng ${activeLanguage?.name || 'tiếng bản xứ'}`}
                  >
                    <Volume2 className="w-3 h-3 text-amber-300" />
                    <span>Nghe {activeLanguage?.id?.toUpperCase() || 'EN'}</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-100 leading-relaxed italic">
                  {formatInline(trimmed.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '').replace(/^[*\s"'“”]+|[*\s"'“”]+$/g, '').trim())}
                </p>
              </div>
            );
          }

          // Vietnamese Translation Line (🇻🇳)
          if (trimmed.includes('🇻🇳')) {
            const cleanVi = trimmed.replace(/^[🇻🇳\s*"'“]+|[*\s"'”]+$/g, '').replace(/^🇻🇳\s*/, '').replace(/[*\"]/g, '');
            return (
              <div key={idx} className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 my-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CountryFlag languageId="vi" size="xs" /> Bản Dịch Tiếng Việt
                  </span>
                  <button
                    onClick={() => handlePlayAudio(cleanVi, 'vi-VN')}
                    className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Đọc chuẩn giọng Tiếng Việt (Ngọc Huyền 2.0)"
                  >
                    <Volume2 className="w-3 h-3 text-emerald-200" />
                    <span>Đọc TV (Ngọc Huyền 2.0)</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-100 leading-relaxed">
                  {formatInline(trimmed.replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '').replace(/^[*\s"'“”]+|[*\s"'“”]+$/g, '').trim())}
                </p>
              </div>
            );
          }

          // Quiz Option Bullet Items (- A), - B), - C))
          if (/^[-•]\s*[A-C]\)/i.test(trimmed)) {
            const optionKey = trimmed.match(/^[-•]\s*([A-C])\)/i)?.[1].toUpperCase();
            const optionText = trimmed.replace(/^[-•]\s*[A-C]\)\s*/i, '');

            return (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-3 my-1 font-semibold text-xs sm:text-sm hover:border-amber-400 transition"
              >
                <span className="w-6 h-6 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                  {optionKey}
                </span>
                <span className="text-slate-800 dark:text-slate-200">{formatInline(optionText)}</span>
              </div>
            );
          }

          // Bullet list items (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2 my-1">
                <span className="text-indigo-500 font-bold text-xs shrink-0 mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-medium">{formatInline(trimmed.slice(2))}</p>
              </div>
            );
          }

          // Standard text paragraph
          return (
            <p key={idx} className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              {formatInline(trimmed)}
            </p>
          );
        })}
      </div>
    </div>
  );
};
