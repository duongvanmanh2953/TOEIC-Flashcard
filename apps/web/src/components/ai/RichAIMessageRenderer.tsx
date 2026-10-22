import React, { useState } from 'react';
import { LetStuNLogo } from '@letstun/shared';
import {
  Volume2,
  Globe,
  Languages,
  Copy,
  Check,
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  Zap,
  AlertTriangle,
  Bot,
  ChevronRight,
  Quote,
} from 'lucide-react';
import { audioEngine } from '../../lib/audioEngine';
import { CountryFlag } from '../language/CountryFlag';
import { useLearningContext } from '../../contexts/LearningContext';

export interface RichAIMessageRendererProps {
  content: string;
  provider?: string;
  onSelectQuizOption?: (option: string) => void;
  className?: string;
  isCompact?: boolean;
  isCached?: boolean;
  hideActions?: boolean;
  citations?: Array<{
    id?: string;
    title?: string;
    summary?: string;
    authorName?: string;
    likeCount?: number;
    url?: string;
  }>;
}

export const RichAIMessageRenderer: React.FC<RichAIMessageRendererProps> = ({
  content,
  provider,
  onSelectQuizOption,
  className = '',
  isCompact = false,
  isCached = false,
  hideActions = false,
  citations = [],
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [copied, setCopied] = useState(false);
  const handleCopyContent = () => {
    navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const { activeLanguage } = useLearningContext();
  const effectiveTargetLocale = activeLanguage?.speechLocale || 'en-US';

  const isOfflineFallback = provider === 'letstun-core' || content.includes('LetStuN AI');
  const isGemini = provider?.includes('gemini');
  const isOpenAI = provider?.includes('openai');

  // Helper to play single sentence/phrase
  const handlePlayAudio = (text: string, lang?: string, idx?: number) => {
    const playLang = lang || effectiveTargetLocale;
    if (typeof idx === 'number') setPlayingSentenceIdx(idx);
    audioEngine.playWord(text, {
      lang: playLang,
      rate: playLang === 'vi-VN' ? 1.0 : 0.95,
      onEnd: () => setPlayingSentenceIdx(null),
      onError: () => setPlayingSentenceIdx(null),
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
  const cefrMatch = content.match(/(?:Trình độ|Level|CEFR):\s*\*?\*?([A-C][12])\*?\*?/i);
  const cefrLevel = cefrMatch ? cefrMatch[1].toUpperCase() : null;

  // Ultra-clean inline markdown formatter (eliminates raw ** and * completely)
  const formatInline = (text: string) => {
    if (!text) return null;

    // Pattern matches: [link](url), `code`, **bold**, *italic*
    const parts = text.split(/(\[.*?\]\(.*?\)|\`.*?\`|\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, i) => {
      if (!part) return null;

      // Markdown links: [text](url)
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2"
          >
            {linkMatch[1]}
          </a>
        );
      }

      // Inline code `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={i}
            className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-300 border border-slate-700/80 font-bold"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Bold **bold**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        const inner = part.slice(2, -2).trim();
        return (
          <strong key={i} className="font-extrabold text-white tracking-wide">
            {inner}
          </strong>
        );
      }

      // Italic *italic*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={i} className="italic text-slate-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Plain text cleanup: strip any leftover stray asterisks or hashes
      const clean = part.replace(/[*#]/g, '');
      return <span key={i}>{clean}</span>;
    });
  };

  // Split lines
  const lines = content.split('\n');

  return (
    <div
      className={`font-sans leading-relaxed text-slate-100 ${
        isCompact ? 'space-y-2 text-xs' : 'space-y-3.5 text-xs sm:text-sm'
      } ${className}`}
    >
      {/* 2. Structured Body Content */}
      <div
        className={`${
          isCompact
            ? 'space-y-2'
            : 'space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-sm text-slate-800 dark:text-slate-100'
        }`}
      >
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className={isCompact ? 'h-0.5' : 'h-1'} />;

          // 2.1 Main Header (# or ##)
          if (/^#{1,2}\s+/.test(trimmed)) {
            const titleClean = trimmed.replace(/^#{1,2}\s+/, '').replace(/[*#]/g, '').trim();
            return (
              <div
                key={idx}
                className="pb-2 border-b border-indigo-500/30 my-2 pt-1 flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h2 className="text-xs sm:text-sm font-black text-indigo-300 tracking-wide uppercase">
                  {titleClean}
                </h2>
              </div>
            );
          }

          // 2.2 Subsection Header (### or ####)
          if (/^#{3,4}\s+/.test(trimmed)) {
            const titleClean = trimmed.replace(/^#{3,4}\s+/, '').replace(/[*#]/g, '').trim();
            return (
              <div key={idx} className="pt-2 pb-1 my-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <h3 className="text-xs sm:text-sm font-bold text-white">
                  {titleClean}
                </h3>
              </div>
            );
          }

          // 2.3 Major Section Header with Numbers (e.g. 1. 📌 **Giải thích...**, 2. **Ví dụ...**, 3. **Thử thách...**)
          if (/^\d+\.\s*(?:[📌🌐🇻🇳🔗🎯💡💬]\s*)?\*?\*?/.test(trimmed)) {
            const cleanTitle = trimmed
              .replace(/[*#]/g, '')
              .replace(/^[0-9]+\.\s*/, '')
              .replace(/^[📌🌐🇻🇳🔗🎯💡💬]\s*/, '')
              .trim();
            const numMatch = trimmed.match(/^([0-9]+)\./);
            const secNumber = numMatch ? numMatch[1] : '';

            const isEx = cleanTitle.toLowerCase().includes('ví dụ') || cleanTitle.toLowerCase().includes('example');
            const isQuiz =
              cleanTitle.toLowerCase().includes('thử thách') ||
              cleanTitle.toLowerCase().includes('quiz') ||
              cleanTitle.toLowerCase().includes('phản xạ');
            const isColloc =
              cleanTitle.toLowerCase().includes('từ vựng') ||
              cleanTitle.toLowerCase().includes('cụm từ') ||
              cleanTitle.toLowerCase().includes('collocation');

            return (
              <div
                key={idx}
                className="mt-3.5 pt-2.5 border-t border-slate-700/60 flex items-center gap-2 font-black text-xs sm:text-sm"
              >
                {secNumber && (
                  <span className="w-5 h-5 rounded-md bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-[10px] font-black flex items-center justify-center shrink-0">
                    {secNumber}
                  </span>
                )}
                <div
                  className={`flex items-center gap-1.5 ${
                    isQuiz
                      ? 'text-amber-400'
                      : isEx
                      ? 'text-purple-300'
                      : isColloc
                      ? 'text-emerald-300'
                      : 'text-indigo-300'
                  }`}
                >
                  {isQuiz ? (
                    <HelpCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  ) : isEx ? (
                    <Lightbulb className="w-4 h-4 shrink-0 text-purple-400" />
                  ) : isColloc ? (
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  ) : (
                    <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
                  )}
                  <span>{cleanTitle}</span>
                </div>
              </div>
            );
          }

          // 2.4 Target Language Example Sentence Line (🇬🇧, 🇩🇪, 🇯🇵, 🌐, or EN: or quoted sentence)
          const isTargetLangLine =
            trimmed.includes('🇬🇧') ||
            trimmed.includes('🌐') ||
            trimmed.startsWith('EN:') ||
            (activeLanguage?.flag && trimmed.includes(activeLanguage.flag));

          if (isTargetLangLine) {
            const cleanTarget = trimmed
              .replace(/[\uD83C][\uDDE6-\uDDFF][\uD83C][\uDDE6-\uDDFF]/g, '')
              .replace(/^[🌐\s*"'“”EN:]+|[*\s"'“”]+$/g, '')
              .replace(/[*"]/g, '')
              .trim();

            return (
              <div
                key={idx}
                className="p-2.5 sm:p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 my-1.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CountryFlag languageId={activeLanguage?.id || 'en'} size="xs" />
                    <span>{activeLanguage?.name || 'Target'} Sentence</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(cleanTarget, effectiveTargetLocale, idx)}
                    className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title={`Nghe câu ví dụ bằng ${activeLanguage?.name || 'tiếng bản xứ'}`}
                  >
                    <Volume2
                      className={`w-3 h-3 text-amber-300 ${
                        playingSentenceIdx === idx ? 'animate-pulse' : ''
                      }`}
                    />
                    <span>Nghe</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-indigo-100 leading-relaxed italic">
                  "{cleanTarget}"
                </p>
              </div>
            );
          }

          // 2.5 Vietnamese Translation Line (🇻🇳 or VI:)
          if (trimmed.includes('🇻🇳') || trimmed.startsWith('VI:')) {
            if (!showTranslation) return null;
            const cleanVi = trimmed
              .replace(/^[🇻🇳\s*"'“VI:]+|[*\s"'”]+$/g, '')
              .replace(/^🇻🇳\s*/, '')
              .replace(/[*\"]/g, '')
              .trim();

            return (
              <div
                key={idx}
                className="p-2.5 sm:p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 my-1.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CountryFlag languageId="vi" size="xs" />
                    <span>Bản dịch tiếng Việt</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(cleanVi, 'vi-VN', idx)}
                    className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
                    title="Đọc bằng tiếng Việt"
                  >
                    <Volume2
                      className={`w-3 h-3 text-emerald-200 ${
                        playingSentenceIdx === idx ? 'animate-pulse' : ''
                      }`}
                    />
                    <span>Đọc TV</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm font-medium text-emerald-100 leading-relaxed">
                  {cleanVi}
                </p>
              </div>
            );
          }

          // 2.6 Interactive Quiz Option Bullet Items (- A), - B), - C), - D) or A), B))
          if (/^[-•]?\s*([A-D])\)\s*(.*)/i.test(trimmed)) {
            const quizMatch = trimmed.match(/^[-•]?\s*([A-D])\)\s*(.*)/i);
            const optionKey = quizMatch ? quizMatch[1].toUpperCase() : 'A';
            const optionText = quizMatch ? quizMatch[2].replace(/[*#]/g, '').trim() : '';

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectQuizOption?.(`${optionKey}) ${optionText}`)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 hover:border-amber-400/80 flex items-center gap-2.5 my-1 font-semibold text-xs transition group cursor-pointer active:scale-98"
              >
                <span className="w-5 h-5 rounded-md bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  {optionKey}
                </span>
                <span className="text-slate-200 group-hover:text-white flex-1 truncate">
                  {optionText}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-300 transition-colors shrink-0" />
              </button>
            );
          }

          // 2.7 Key-Value Bullet Item (- **word**: definition)
          if (/^[-*•]\s*\*\*([^*]+)\*\*:?\s*(.*)/.test(trimmed)) {
            const kvMatch = trimmed.match(/^[-*•]\s*\*\*([^*]+)\*\*:?\s*(.*)/);
            const keyTerm = kvMatch ? kvMatch[1].trim() : '';
            const valDesc = kvMatch ? kvMatch[2].trim() : '';

            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
                <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                <div className="text-xs sm:text-sm font-medium leading-relaxed">
                  <span className="font-extrabold text-indigo-300 mr-1.5">{keyTerm}:</span>
                  <span>{formatInline(valDesc)}</span>
                </div>
              </div>
            );
          }

          // 2.8 Standard Bullet List Items (- or *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
                <span className="text-indigo-400 font-bold shrink-0 mt-0.5">•</span>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {formatInline(trimmed.slice(2))}
                </p>
              </div>
            );
          }

          // 2.9 Numbered List Items (1. , 2. )
          if (/^\d+\.\s+/.test(trimmed)) {
            const numVal = trimmed.match(/^(\d+)\./)?.[1] || '1';
            const rest = trimmed.replace(/^\d+\.\s+/, '');
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5 my-1">
                <span className="text-[10px] font-bold text-indigo-400 shrink-0 mt-0.5 w-4 h-4 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                  {numVal}
                </span>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  {formatInline(rest)}
                </p>
              </div>
            );
          }

          // 2.10 Blockquote (> )
          if (trimmed.startsWith('> ')) {
            return (
              <div
                key={idx}
                className="p-2.5 rounded-r-xl border-l-4 border-indigo-500 bg-indigo-950/30 my-1.5 flex items-start gap-2 text-xs italic text-indigo-200"
              >
                <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <p>{formatInline(trimmed.slice(2))}</p>
              </div>
            );
          }

          // 2.11 Horizontal Rule (---)
          if (/^(---|___|\*\*\*)$/.test(trimmed)) {
            return <hr key={idx} className="my-2.5 border-t border-slate-700/60" />;
          }

          // 2.12 Standard Text Paragraph
          return (
            <p key={idx} className="text-xs sm:text-sm font-medium text-slate-200 leading-relaxed">
              {formatInline(trimmed)}
            </p>
          );
        })}
      </div>

      {!hideActions && (
        <div className="flex items-center gap-1.5 mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/60 not-prose">
          <button
            type="button"
            onClick={handlePlayBilingual}
            disabled={isPlayingAudio}
            className="p-1.5 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
            title="Phát âm (Đọc to)"
          >
            <Volume2 className={`w-3.5 h-3.5 ${isPlayingAudio ? 'animate-pulse text-amber-500' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowTranslation(!showTranslation)}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              showTranslation
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/40'
                : 'text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
            }`}
            title="Dịch sang tiếng Việt"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Citations & Community Posts (if any) */}
      {citations && citations.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/40 space-y-1.5 not-prose">
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-indigo-300">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Bài viết dẫn chứng từ Kho Tri Thức Cộng Đồng:</span>
          </div>
          <div className="space-y-1.5">
            {citations.map((c: any) => (
              <a
                key={c.id}
                href={c.url || `/community?post=${c.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg bg-slate-900/90 hover:bg-slate-900 border border-slate-700/80 hover:border-indigo-400 transition group"
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                  <span className="truncate">{c.title}</span>
                  {c.likeCount !== undefined && (
                    <span className="text-[10px] text-rose-400 shrink-0">❤️ {c.likeCount}</span>
                  )}
                </div>
                {c.summary && (
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{c.summary}</p>
                )}
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400">
                  {c.authorName && <span>Tác giả: {c.authorName}</span>}
                  <span className="text-indigo-400 font-bold group-hover:underline flex items-center gap-0.5">
                    Đọc bài viết <ChevronRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
