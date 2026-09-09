import React from 'react';
import { Volume2, BookOpen, Sparkles, Check, Bookmark, ArrowRight, HelpCircle } from 'lucide-react';
import { SpeechButton } from '../common/SpeechButton';

export interface VocabularyCardData {
  word: string;
  cefrLevel?: string;
  partOfSpeech?: string;
  definition: string;
  meaningVi?: string;
  pronunciation?: string;
}

export interface ExampleCardData {
  sentence: string;
  translation?: string;
  context?: string;
}

export interface QuizCardData {
  question: string;
  options: string[];
  correctAnswer?: string;
  explanation?: string;
}

interface StructuredAICardProps {
  vocabularyCard?: VocabularyCardData | null;
  examples?: ExampleCardData[];
  synonyms?: string[];
  collocations?: string[];
  quizCard?: QuizCardData | null;
  onSaveWord?: (word: string) => void;
  onSelectOption?: (option: string) => void;
  className?: string;
}

export const StructuredAICard: React.FC<StructuredAICardProps> = ({
  vocabularyCard,
  examples = [],
  synonyms = [],
  collocations = [],
  quizCard,
  onSaveWord,
  onSelectOption,
  className = '',
}) => {
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const handleSave = (w: string) => {
    setSaved(true);
    if (onSaveWord) onSaveWord(w);
  };

  return (
    <div className={`space-y-4 animate-fade-in ${className}`}>
      {/* 1. Main Vocabulary Card */}
      {vocabularyCard && (
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 backdrop-blur-xl shadow-lg relative overflow-hidden card-brand-effect">
          <div className="flex items-start justify-between gap-3 mb-2.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {vocabularyCard.word}
                </h3>
                {vocabularyCard.cefrLevel && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {vocabularyCard.cefrLevel}
                  </span>
                )}
                {vocabularyCard.partOfSpeech && (
                  <span className="text-xs font-serif italic text-slate-400">
                    ({vocabularyCard.partOfSpeech})
                  </span>
                )}
              </div>

              {vocabularyCard.pronunciation && (
                <div className="flex items-center gap-2 text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  <span>{vocabularyCard.pronunciation}</span>
                  <SpeechButton text={vocabularyCard.word} />
                </div>
              )}
            </div>

            {/* Quick Action Button */}
            <button
              type="button"
              onClick={() => handleSave(vocabularyCard.word)}
              className={`p-2.5 rounded-2xl border transition shadow-xs flex items-center gap-1.5 text-xs font-bold ${
                saved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {saved ? <Check className="w-4 h-4 text-emerald-500" /> : <Bookmark className="w-4 h-4" />}
              <span>{saved ? 'Đã lưu' : 'Lưu từ'}</span>
            </button>
          </div>

          {/* Meaning & Definition */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
            {vocabularyCard.meaningVi && (
              <p className="text-sm sm:text-base font-bold text-brand-700 dark:text-brand-300">
                {vocabularyCard.meaningVi}
              </p>
            )}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {vocabularyCard.definition}
            </p>
          </div>
        </div>
      )}

      {/* 2. Examples Card */}
      {examples.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white/60 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 backdrop-blur-md space-y-3">
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 block">
            Ví dụ ngữ cảnh thực tế
          </span>
          <div className="space-y-2.5">
            {examples.map((ex, idx) => (
              <div key={idx} className="space-y-0.5 text-xs sm:text-sm">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  • "{ex.sentence}"
                </p>
                {ex.translation && (
                  <p className="text-slate-500 dark:text-slate-400 pl-3.5 italic text-xs">
                    ↳ {ex.translation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Synonym & Collocation Chips */}
      {(synonyms.length > 0 || collocations.length > 0) && (
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-slate-200/60 dark:border-slate-800 backdrop-blur-md space-y-3">
          {synonyms.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Từ đồng nghĩa (Synonyms)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {synonyms.map((s, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-500/10 hover:text-brand-600 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {collocations.length > 0 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                Cụm từ hay gặp (Collocations)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {collocations.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-500/20"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Interactive Quiz Challenge Card */}
      {quizCard && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-brand-500/5 to-purple-500/10 border-2 border-indigo-500/30 backdrop-blur-xl shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
            <HelpCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs uppercase font-black tracking-wider">
              Thử Thách Phản Xạ Ngay (Active Recall)
            </span>
          </div>

          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            {quizCard.question}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quizCard.options.map((opt, idx) => {
              const isChosen = selectedOption === opt;
              const isCorrect = quizCard.correctAnswer && opt === quizCard.correctAnswer;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedOption(opt);
                    if (onSelectOption) onSelectOption(opt);
                  }}
                  className={`p-3 rounded-2xl text-left text-xs sm:text-sm font-bold border transition shadow-xs flex items-center justify-between gap-2 ${
                    isChosen
                      ? isCorrect
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-rose-500 text-white border-rose-600'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  <span>{opt}</span>
                  {isChosen && (
                    <span>{isCorrect ? '✓' : '✗'}</span>
                  )}
                </button>
              );
            })}
          </div>

          {selectedOption && quizCard.explanation && (
            <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-2 border-t border-indigo-500/20">
              💡 {quizCard.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
