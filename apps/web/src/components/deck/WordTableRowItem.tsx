import React from 'react';
import {
  Volume2,
  Heart,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';

export interface WordItemData {
  id: string;
  word: string;
  meaning: string;
  example?: string;
  phonetic?: string;
  partOfSpeech?: string;
  status?: string;
  topic?: string;
  cefrLevel?: string;
  isFavorite?: boolean;
  vocabulary?: {
    topic?: string;
    cefrLevel?: string;
  };
}

export interface WordTableRowItemProps {
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
 * WordTableRowItem - Memoized row component for vocabulary table
 * Eliminates re-renders of the entire 100+ items list on search/selection updates.
 * Touch targets meet Apple HIG & Android standard (min 36-44px).
 */
export const WordTableRowItem: React.FC<WordTableRowItemProps> = React.memo(
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
      <tr
        className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition duration-150 cv-auto-row ${
          isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
        }`}
      >
        <td className="py-3 px-4">
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => onToggleSelect(item.id)}
              className="p-2.5 -m-2 rounded-lg text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
              title={isSelected ? 'Bỏ chọn từ' : 'Chọn từ'}
            >
              {isSelected ? (
                <CheckSquare className="w-4 h-4 text-indigo-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          )}
        </td>

        <td className="py-3 px-2 text-center">
          <button
            type="button"
            onClick={(e) => onPlayAudio(item.word, e)}
            className="p-2 min-h-[36px] min-w-[36px] rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition inline-flex items-center justify-center cursor-pointer touch-manipulation active:scale-95"
            title="Phát âm chuẩn (Web Speech)"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </td>

        <td className="py-3 px-4">
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-base leading-tight">
              {item.word}
            </span>
            {item.partOfSpeech && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                ({item.partOfSpeech})
              </span>
            )}
          </div>
          {item.phonetic && (
            <span className="text-xs text-sky-500 dark:text-sky-300 font-mono tracking-tight">
              {item.phonetic}
            </span>
          )}
        </td>

        <td className="py-3 px-4 max-w-xs sm:max-w-sm">
          <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm line-clamp-1">
            {item.meaning}
          </p>
          {item.example && (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1 mt-0.5">
              "{item.example}"
            </p>
          )}
        </td>

        <td className="py-3 px-3 whitespace-nowrap">
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/50">
            {realTopic}
          </span>
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50">
            {cefrLevel}
          </span>
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <span
            className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              item.status === 'MASTERED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50'
                : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200/50'
            }`}
          >
            {item.status === 'MASTERED' ? 'Đã thuộc' : 'Đang học'}
          </span>
        </td>

        <td className="py-3 px-2 text-center">
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
        </td>

        <td className="py-3 px-4 text-right whitespace-nowrap">
          {!isReadOnly && (
            <div className="inline-flex items-center justify-end gap-1">
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
                title="Xóa từ này"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </td>
      </tr>
    );
  }
);

WordTableRowItem.displayName = 'WordTableRowItem';
