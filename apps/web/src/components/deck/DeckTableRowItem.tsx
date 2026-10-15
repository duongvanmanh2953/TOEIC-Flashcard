import React from 'react';
import {
  Folder,
  CheckSquare,
  Square,
  Cloud,
  HardDrive,
  Lock,
  Eye,
  Sparkles,
  MoreHorizontal,
} from 'lucide-react';
import { CustomDropdown } from '../common/CustomDropdown';
import { DeckItemData } from './DeckCardItem';

export interface DeckTableRowItemProps {
  deck: DeckItemData;
  isSelected: boolean;
  onToggleSelect: (deckId: string) => void;
  onOpenDeck: (deck: DeckItemData) => void;
  onReviewDeck: (deck: DeckItemData) => void;
  moreOptions: Array<{ value: string; label: string; icon?: React.ReactNode; danger?: boolean }>;
  onMoreAction: (action: string, deck: DeckItemData) => void;
}

/**
 * DeckTableRowItem - Optimized according to `vercel-react-best-practices`:
 * - Wrapped with React.memo to eliminate re-renders on sibling rows
 * - Touch Targets >= 44x44px for checkbox and actions
 * - High-contrast text compliance (WCAG AAA)
 */
export const DeckTableRowItem: React.FC<DeckTableRowItemProps> = React.memo(
  ({
    deck,
    isSelected,
    onToggleSelect,
    onOpenDeck,
    onReviewDeck,
    moreOptions,
    onMoreAction,
  }) => {
    return (
      <tr
        className={`hover:bg-indigo-50/30 dark:hover:bg-slate-800/40 transition duration-150 cv-auto-row ${
          isSelected ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
        }`}
      >
        <td className="py-3 px-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(deck.id);
            }}
            className="p-2.5 -m-2 rounded-lg text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
            title={isSelected ? 'Bỏ chọn kho' : 'Chọn kho'}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        </td>

        <td className="py-3 px-4">
          <div
            onClick={() => onOpenDeck(deck)}
            className="cursor-pointer group flex items-start gap-2.5"
          >
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
              <Folder className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition truncate max-w-xs sm:max-w-md">
                  {deck.title}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 shrink-0">
                  {deck.computedWordCount} từ
                </span>
              </div>
              {deck.description && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {deck.description}
                </p>
              )}
            </div>
          </div>
        </td>

        <td className="py-3 px-3 whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            {deck.category || 'General'}
          </span>
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <span className="inline-flex items-center px-2 py-0.5 rounded font-black text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            {deck.cefrLevel || 'B1'}
          </span>
        </td>

        <td className="py-3 px-4 min-w-[130px]">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-500">
              <span>{deck.masteredCount ?? 0} từ</span>
              <span className="text-indigo-600 dark:text-indigo-400">{deck.percentMastered ?? 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
                style={{ width: `${deck.percentMastered ?? 0}%` }}
              />
            </div>
          </div>
        </td>

        <td className="py-3 px-3 text-center whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5">
            {deck.isSyncedToCloud ? (
              <span
                className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1 shadow-2xs"
                title="Kho từ vựng Online — Đã đồng bộ an toàn trên Cơ sở dữ liệu Cloud"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Cloud className="w-2.5 h-2.5" />
                <span>Online</span>
              </span>
            ) : (
              <span
                className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800/60 inline-flex items-center gap-1 shadow-2xs"
                title="Kho từ vựng Offline — Chỉ lưu trên máy này (Ngoại tuyến, chưa có trên DB)"
              >
                <HardDrive className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                <span>Offline</span>
              </span>
            )}
            {deck.status === 'PENDING' && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200">
                Chờ duyệt
              </span>
            )}
            {deck.hasPassword && (
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-950 text-amber-600" title="Có mật khẩu bảo vệ">
                <Lock className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </td>

        <td className="py-3 px-4 text-right whitespace-nowrap">
          <div className="inline-flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => onOpenDeck(deck)}
              className="btn-glass-primary btn-glass-sm text-xs font-semibold touch-manipulation cursor-pointer"
              title="Xem và quản lý từ trong kho"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem từ</span>
            </button>
            <button
              type="button"
              onClick={() => onReviewDeck(deck)}
              className="btn-glass-secondary btn-glass-sm text-xs font-semibold touch-manipulation cursor-pointer"
              title="Ôn tập kho này"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-500" />
              <span>Ôn tập</span>
            </button>

            {/* Option More Menu for List Row */}
            <CustomDropdown
              align="right"
              searchable={false}
              trigger={
                <div
                  role="button"
                  tabIndex={0}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer inline-flex items-center justify-center touch-manipulation min-h-[36px] min-w-[36px]"
                  title="Tùy chọn khác"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              }
              options={moreOptions}
              value=""
              onChange={(action) => onMoreAction(action, deck)}
              size="sm"
            />
          </div>
        </td>
      </tr>
    );
  }
);

DeckTableRowItem.displayName = 'DeckTableRowItem';
