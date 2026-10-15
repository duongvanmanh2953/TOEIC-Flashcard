import React from 'react';
import {
  Volume2,
  Heart,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  Lock,
} from 'lucide-react';
import { WordItemData } from './WordTableRowItem';

export interface WordCardItemProps {
  item: WordItemData;
  isSelected: boolean;
  isFavorite: boolean;
  isReadOnly?: boolean;
  onToggleSelect: (wordId: string) => void;
  onPlayAudio: (word: string, e: React.MouseEvent) => void;
  onToggleFavorite: (wordId: string, e: React.MouseEvent) => void;
  onEditWord: (word: WordItemData, e: React.MouseEvent) => void;
  onDeleteWord: (word: WordItemData, e: React.MouseEvent) => void;
}

/**
 * WordCardItem - Memoized card component for vocabulary grid
 * Prevents re-rendering cards during search filtering or unrelated state updates.
 * Touch targets meet Apple HIG & Android standard (min 36-44px).
 */
export const WordCardItem: React.FC<WordCardItemProps> = React.memo(
  ({
    item,
    isSelected,
    isFavorite,
    isReadOnly,
    onToggleSelect,
    onPlayAudio,
    onToggleFavorite,
    onEditWord,
    onDeleteWord,
  }) => {
    const realTopic = item.topic || item.vocabulary?.topic || 'General';
    const cefrLevel = item.cefrLevel || item.vocabulary?.cefrLevel || 'B1';

    return (
      <div
        className={`p-4 flex flex-col justify-between space-y-3 rounded-2xl bg-white dark:bg-slate-900 border transition duration-150 shadow-xs hover:shadow-md cv-auto-card ${
          isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
        }`}
      >
        <div>
          {/* Top Bar: Checkbox + Tags on Left, Fixed Action Icons (🔊 ♥) on Top-Right */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {/* Left: Checkbox + Topic Tag + CEFR */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item.id);
                  }}
                  className="p-2.5 -m-1 text-slate-400 hover:text-indigo-600 transition shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center cursor-pointer touch-manipulation"
                  title={isSelected ? 'Bỏ chọn từ' : 'Chọn từ'}
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              )}

              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50 truncate max-w-[130px]"
                title={`Chủ đề: ${realTopic}`}
              >
                {realTopic}
              </span>

              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 shrink-0">
                {cefrLevel}
              </span>
            </div>

            {/* Top-Right: Fixed Position Actions (Pronounce & 2-Way Favorite) */}
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <button
                type="button"
                onClick={(e) => onPlayAudio(item.word, e)}
                className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
                title="Phát âm chuẩn (Web Speech)"
              >
                <Volume2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => onToggleFavorite(item.id, e)}
                className={`p-2 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 transition inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95 ${
                  isFavorite ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                }`}
                title={isFavorite ? 'Bỏ yêu thích' : 'Yêu thích từ này'}
              >
                <Heart
                  className={`w-4 h-4 ${
                    isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Word & Phonetic */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 min-w-0">
              <h4 className="text-base font-black text-slate-900 dark:text-white truncate flex-1 leading-tight">
                {item.word}
              </h4>
              {item.partOfSpeech && (
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 italic shrink-0">
                  ({item.partOfSpeech})
                </span>
              )}
            </div>
            {item.phonetic && (
              <p className="text-xs text-sky-500 dark:text-sky-300 font-mono tracking-tight mt-0.5 truncate">
                {item.phonetic}
              </p>
            )}
          </div>

          {/* Meaning */}
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-2 line-clamp-2 leading-snug">
            {item.meaning}
          </p>

          {/* Example Sentence */}
          {item.example && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic line-clamp-2 border-l-2 border-indigo-300 dark:border-indigo-700 pl-2 leading-relaxed">
              "{item.example}"
            </p>
          )}
        </div>

        {/* Word Quick Edit / Delete Controls */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              item.status === 'MASTERED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50'
            }`}
          >
            {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
          </span>

          {isReadOnly ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/50">
              <Lock className="w-2.5 h-2.5" />
              Chỉ đọc
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => onEditWord(item, e)}
                className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
                title="Sửa từ này"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => onDeleteWord(item, e)}
                className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
                title="Xóa từ này khỏi kho"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

WordCardItem.displayName = 'WordCardItem';
