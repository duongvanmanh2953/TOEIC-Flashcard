import React from 'react';
import { Lock, AlertCircle, Trash2, Crown, CheckCircle } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { LocalDeck } from '../../lib/indexedDB';

export interface WordBankConfirmModalsProps {
  // Unlock Password Modal
  deckToUnlock: LocalDeck | null;
  onCloseUnlock: () => void;
  deckUnlockInput: string;
  setDeckUnlockInput: (val: string) => void;
  deckUnlockError: string;
  onUnlockSubmit: (e: React.FormEvent) => void;
  deckUnlocking: boolean;

  // Delete Single Deck Modal
  deckToDelete: LocalDeck | null;
  onCloseDeleteDeck: () => void;
  onConfirmDeleteDeck: () => void;
  deletingDecks: boolean;

  // Bulk Delete Decks Modal
  showBulkDeleteDecksModal: boolean;
  onCloseBulkDeleteDecks: () => void;
  onConfirmBulkDeleteDecks: () => void;
  selectedDeckCount: number;

  // Delete Single Word Modal
  wordToDelete: { id: string; word: string; meaning: string } | null;
  onCloseDeleteWord: () => void;
  onConfirmDeleteWord: () => void;
  deletingWords: boolean;

  // Bulk Delete Words Modal
  showBulkDeleteWordsModal: boolean;
  onCloseBulkDeleteWords: () => void;
  onConfirmBulkDeleteWords: () => void;
  selectedWordCount: number;

  // VIP Upgrade Modal
  showVipModal: boolean;
  onCloseVipModal: () => void;
}

/**
 * WordBankConfirmModals - Encapsulates confirmation, deletion, password unlock, and VIP modals.
 * Extracted according to `vercel-react-best-practices` to keep MyWordBankPage lean and avoid re-renders.
 */
export const WordBankConfirmModals: React.FC<WordBankConfirmModalsProps> = React.memo(
  ({
    deckToUnlock,
    onCloseUnlock,
    deckUnlockInput,
    setDeckUnlockInput,
    deckUnlockError,
    onUnlockSubmit,
    deckUnlocking,

    deckToDelete,
    onCloseDeleteDeck,
    onConfirmDeleteDeck,
    deletingDecks,

    showBulkDeleteDecksModal,
    onCloseBulkDeleteDecks,
    onConfirmBulkDeleteDecks,
    selectedDeckCount,

    wordToDelete,
    onCloseDeleteWord,
    onConfirmDeleteWord,
    deletingWords,

    showBulkDeleteWordsModal,
    onCloseBulkDeleteWords,
    onConfirmBulkDeleteWords,
    selectedWordCount,

    showVipModal,
    onCloseVipModal,
  }) => {
    return (
      <>
        {/* 1. PASSWORD UNLOCK MODAL FOR PERSONAL / CLONED DECKS */}
        <ModalPortal isOpen={Boolean(deckToUnlock)} onClose={onCloseUnlock}>
          {deckToUnlock && (
            <form
              onSubmit={onUnlockSubmit}
              className="m-auto max-w-md w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-6 shadow-2xl animate-fade-in text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-sm">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    Kho từ vựng được bảo vệ
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Nhập mật khẩu / PIN để mở khóa kho &quot;{deckToUnlock.title}&quot;
                  </p>
                </div>
              </div>

              {deckUnlockError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deckUnlockError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-xs sm:text-sm">
                  Mật khẩu mở khóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={deckUnlockInput}
                  onChange={(e) => setDeckUnlockInput(e.target.value)}
                  placeholder="Nhập mã PIN hoặc mật khẩu..."
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-semibold text-sm text-slate-900 dark:text-white transition"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCloseUnlock}
                  className="btn-glass-secondary btn-glass-sm !px-5"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={deckUnlocking || !deckUnlockInput.trim()}
                  className="btn-glass-primary btn-glass-sm !px-6 font-bold disabled:opacity-50"
                >
                  {deckUnlocking ? 'Đang kiểm tra...' : 'Mở khóa'}
                </button>
              </div>
            </form>
          )}
        </ModalPortal>

        {/* 2. DELETE SINGLE DECK CONFIRMATION MODAL */}
        <ModalPortal isOpen={Boolean(deckToDelete)} onClose={onCloseDeleteDeck}>
          {deckToDelete && (
            <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
              <div className="flex items-center gap-3.5 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Kho Từ Vựng?</h3>
                  <p className="text-xs text-slate-500">Hành động này không thể hoàn tác.</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa kho từ <strong className="text-indigo-600 dark:text-indigo-400">{deckToDelete.title}</strong> không? Toàn bộ từ vựng thuộc kho này sẽ bị xóa khỏi bộ nhớ và dữ liệu cá nhân của bạn.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onCloseDeleteDeck}
                  className="btn-glass-secondary btn-glass-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onConfirmDeleteDeck}
                  disabled={deletingDecks}
                  className="btn-glass-danger btn-glass-sm"
                >
                  {deletingDecks ? 'Đang xóa...' : 'Xác nhận xóa kho'}
                </button>
              </div>
            </div>
          )}
        </ModalPortal>

        {/* 3. BULK DELETE DECKS MODAL */}
        <ModalPortal isOpen={showBulkDeleteDecksModal} onClose={onCloseBulkDeleteDecks}>
          <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Nhiều Kho Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Đã chọn {selectedDeckCount} kho từ vựng.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-rose-600 font-bold">{selectedDeckCount} kho từ vựng đã chọn</strong>? Toàn bộ từ vựng thuộc các kho này cũng sẽ bị xóa vĩnh viễn.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseBulkDeleteDecks}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onConfirmBulkDeleteDecks}
                disabled={deletingDecks}
                className="btn-glass-danger btn-glass-sm"
              >
                {deletingDecks ? 'Đang xóa...' : 'Xác nhận xóa các kho'}
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* 4. DELETE SINGLE WORD MODAL */}
        <ModalPortal isOpen={Boolean(wordToDelete)} onClose={onCloseDeleteWord}>
          {wordToDelete && (
            <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
              <div className="flex items-center gap-3.5 text-rose-600">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Từ Vựng?</h3>
                  <p className="text-xs text-slate-500">Từ vựng: &quot;{wordToDelete.word}&quot;</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bạn có chắc chắn muốn xóa từ vựng <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{wordToDelete.word}</strong> ({wordToDelete.meaning}) không?
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onCloseDeleteWord}
                  className="btn-glass-secondary btn-glass-sm"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={onConfirmDeleteWord}
                  disabled={deletingWords}
                  className="btn-glass-danger btn-glass-sm"
                >
                  {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          )}
        </ModalPortal>

        {/* 5. BULK DELETE WORDS MODAL */}
        <ModalPortal isOpen={showBulkDeleteWordsModal} onClose={onCloseBulkDeleteWords}>
          <div className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-7 space-y-5 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center gap-3.5 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Xóa Nhiều Từ Vựng?</h3>
                <p className="text-xs text-slate-500">Đã chọn {selectedWordCount} từ vựng.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-rose-600 font-bold">{selectedWordCount} từ vựng đã chọn</strong> khỏi kho từ?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onCloseBulkDeleteWords}
                className="btn-glass-secondary btn-glass-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={onConfirmBulkDeleteWords}
                disabled={deletingWords}
                className="btn-glass-danger btn-glass-sm"
              >
                {deletingWords ? 'Đang xóa...' : 'Xác nhận xóa các từ'}
              </button>
            </div>
          </div>
        </ModalPortal>

        {/* 6. VIP UPGRADE MODAL */}
        <ModalPortal isOpen={showVipModal} onClose={onCloseVipModal}>
          <div className="m-auto max-w-lg w-full rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                  Mở Khóa Lưu Trữ & Đồng Bộ Cloud
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Lưu trữ từ vựng không giới hạn, đồng bộ đa thiết bị tự động.
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Đồng bộ tức thì mọi từ vựng giữa PC, Laptop và Điện thoại.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Sao lưu dữ liệu an toàn vĩnh viễn trên máy chủ đám mây.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Không giới hạn số lượng kho từ và từ vựng import.</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => {
                  onCloseVipModal();
                  window.location.href = '/upgrade';
                }}
                className="w-full px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4 text-amber-200" />
                <span>Nâng Cấp VIP Ngay</span>
              </button>
              <button
                onClick={onCloseVipModal}
                className="w-full sm:w-auto px-4 py-3 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </ModalPortal>
      </>
    );
  }
);

WordBankConfirmModals.displayName = 'WordBankConfirmModals';
