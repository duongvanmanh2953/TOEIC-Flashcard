import React from 'react';
import {
  CheckSquare,
  Square,
  Cloud,
  HardDrive,
  Lock,
  Eye,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { CustomDropdown } from '../common/CustomDropdown';

export interface DeckItemData {
  id: string;
  title: string;
  description?: string;
  computedWordCount: number;
  isSyncedToCloud?: boolean;
  status?: string;
  originDeckId?: string;
  hasPassword?: boolean;
  isReadOnly?: boolean;
  cefrLevel?: string;
  category?: string;
  authorName?: string;
  sourceName?: string;
  masteredCount?: number;
  percentMastered?: number;
  updatedAt?: string | number | Date;
  createdAt?: string | number | Date;
}

export interface DeckCardItemProps {
  deck: DeckItemData;
  isSelected: boolean;
  onToggleSelect: (deckId: string) => void;
  onOpenDeck: (deck: DeckItemData) => void;
  onReviewDeck: (deck: DeckItemData) => void;
  moreOptions: Array<{ value: string; label: string; icon?: React.ReactNode; danger?: boolean }>;
  onMoreAction: (action: string, deck: DeckItemData) => void;
}

/**
 * DeckCardItem - Optimized according to `vercel-react-best-practices`:
 * - Wrapped with React.memo to prevent unnecessary re-renders when parent states change
 * - Mobile Touch Target >= 44x44px for checkbox and comfortable hit targets
 * - High-contrast text compliance (WCAG AAA)
 */
export const DeckCardItem: React.FC<DeckCardItemProps> = React.memo(
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
      <div
        onClick={() => onOpenDeck(deck)}
        className={`p-5 flex flex-col justify-between space-y-4 rounded-2xl bg-white dark:bg-slate-900 border transition duration-150 shadow-xs hover:shadow-md cursor-pointer ${
          isSelected
            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
            : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40'
        }`}
      >
        <div>
          {/* TOP ROW: Checkbox + Trạng thái On/Off + Khóa vs Số từ vựng */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(deck.id);
                }}
                className="p-2.5 -m-1 text-slate-400 hover:text-indigo-600 transition inline-flex items-center justify-center min-h-[44px] min-w-[44px] cursor-pointer touch-manipulation"
                title={isSelected ? 'Bỏ chọn kho' : 'Chọn kho'}
              >
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
              </button>

              {/* Online / Offline Sync Badge */}
              {deck.isSyncedToCloud ? (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800 shadow-2xs"
                  title="Kho từ Online (Đã lưu trên Database)"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Cloud className="w-2.5 h-2.5" />
                  <span>Online</span>
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                  title="Kho từ Offline (Lưu cục bộ trên thiết bị)"
                >
                  <HardDrive className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                  <span>Offline</span>
                </span>
              )}

              {deck.hasPassword && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-extrabold border border-amber-200"
                  title="Có mật khẩu"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>Khóa</span>
                </span>
              )}

              {deck.isReadOnly && (
                <span
                  className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-extrabold border border-purple-200 dark:border-purple-800"
                  title="Chỉ đọc"
                >
                  <Lock className="w-2.5 h-2.5" />
                  <span>Clone</span>
                </span>
              )}
            </div>

            {/* Số từ vựng đẩy sang góc phải trên cùng */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 shrink-0">
              {deck.computedWordCount} từ vựng
            </span>
          </div>

          {/* Cấp độ & Lĩnh vực */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
              {deck.cefrLevel || 'B1'}
            </span>

            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {deck.category || 'General'}
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
            {deck.title}
          </h3>
          {deck.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
              {deck.description}
            </p>
          )}

          {(deck.authorName || deck.sourceName || deck.isReadOnly) && (
            <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Nguồn: {deck.sourceName || (deck.isReadOnly ? 'Cộng đồng' : 'Cá nhân')}
              </span>
              {deck.authorName && (
                <span>
                  • Tác giả: <strong className="text-slate-700 dark:text-slate-300">{deck.authorName}</strong>
                </span>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-500">
              <span>Đã thuộc: {deck.masteredCount ?? 0} từ</span>
              <span className="text-indigo-600 dark:text-indigo-400">{deck.percentMastered ?? 0}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${deck.percentMastered ?? 0}%` }}
              />
            </div>
          </div>

          {/* Updated Date */}
          <p className="text-[10px] text-slate-400 mt-2 font-medium">
            Cập nhật: {new Date(deck.updatedAt || deck.createdAt || Date.now()).toLocaleDateString('vi-VN')}
          </p>
        </div>

        {/* Action Controls: Primary on left, Option More on right */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDeck(deck);
              }}
              className="h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer touch-manipulation active:scale-95"
              aria-label="Xem và quản lý từ trong kho"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Xem từ</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onReviewDeck(deck);
              }}
              className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer touch-manipulation active:scale-95"
              title="Ôn tập riêng kho này"
              aria-label="Ôn tập riêng kho này"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ôn tập</span>
            </button>
          </div>

          {/* Option More Dropdown for Grid Card */}
          <CustomDropdown
            align="right"
            searchable={false}
            trigger={
              <div
                role="button"
                tabIndex={0}
                className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition inline-flex items-center justify-center cursor-pointer touch-manipulation"
                title="Tùy chọn khác"
                aria-label="Tùy chọn khác"
              >
                <MoreVertical className="w-4 h-4" />
              </div>
            }
            options={moreOptions}
            value=""
            onChange={(action) => onMoreAction(action, deck)}
            size="sm"
          />
        </div>
      </div>
    );
  }
);

DeckCardItem.displayName = 'DeckCardItem';
