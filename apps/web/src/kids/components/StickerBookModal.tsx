import React from 'react';
import { MeadowAudioEngine } from '../services/audio/MeadowAudioEngine';
import { meadowStore, INITIAL_STICKERS } from '../core/meadowStateStore';

interface StickerBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StickerBookModal: React.FC<StickerBookModalProps> = ({ isOpen, onClose }) => {
  const state = meadowStore.getState();
  const unlockedIds = state.stickers;

  if (!isOpen) return null;

  const handleTapSticker = (item: typeof INITIAL_STICKERS[0], isUnlocked: boolean) => {
    if (isUnlocked) {
      MeadowAudioEngine.playWoodTap('C6');
      MeadowAudioEngine.speak(item.nameEn, { rate: 0.85, pitch: 1.2 });
    } else {
      MeadowAudioEngine.playSoftBounce();
      MeadowAudioEngine.speak('Play more games to unlock this magical sticker!', { rate: 0.85 });
    }
  };

  const unlockedCount = INITIAL_STICKERS.filter((s) => unlockedIds.includes(s.id)).length;

  return (
    <div className="fixed inset-0 z-[9980] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
      <div className="meadow-clay-card max-w-2xl w-full p-6 sm:p-8 bg-gradient-to-b from-[#FFFDF5] to-[#FEF3C7]/40 border-4 border-amber-300 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={() => {
            MeadowAudioEngine.playWoodTap('C5');
            onClose();
          }}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 flex items-center justify-center font-extrabold text-xl cursor-pointer"
          aria-label="Đóng sổ nhãn dán"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6 shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-display font-extrabold text-xs mb-2">
            <span>📖 Cuốn Sổ Thần Kỳ</span>
            <span>•</span>
            <span>{unlockedCount} / {INITIAL_STICKERS.length} Đã Mở Khóa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] font-display">
            Bộ Sưu Tập Nhãn Dán Rừng Xanh
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-[#475569] font-body mt-1">
            Chạm vào nhãn dán để nghe tên tiếng Anh và khám phá thế giới sinh thái!
          </p>
        </div>

        {/* Sticker Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
          {INITIAL_STICKERS.map((sticker) => {
            const isUnlocked = unlockedIds.includes(sticker.id);
            return (
              <button
                key={sticker.id}
                type="button"
                onClick={() => handleTapSticker(sticker, isUnlocked)}
                className={`meadow-clay-card p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer transition-transform active:scale-95 min-h-[140px] relative ${
                  isUnlocked
                    ? 'hover:scale-105 border-amber-200 bg-white'
                    : 'opacity-50 grayscale hover:grayscale-0 hover:opacity-75 bg-slate-100'
                }`}
              >
                {/* Visual Icon from SVG Vault */}
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full drop-shadow-sm">
                    <use href={sticker.svgSymbol}></use>
                  </svg>
                </div>

                <div className="w-full">
                  <p className="font-display font-extrabold text-[#1E293B] text-base leading-tight">
                    {sticker.nameEn}
                  </p>
                  <p className="font-body text-[11px] font-bold text-slate-500 mt-0.5 truncate">
                    {sticker.nameVi}
                  </p>
                </div>

                {!isUnlocked && (
                  <div className="absolute top-2 right-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full font-bold">
                    🔒
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer tip */}
        <div className="pt-4 mt-2 border-t border-amber-200/80 text-center text-xs font-bold text-amber-800 font-body shrink-0">
          💡 Mẹo nhỏ: Hoàn thành mỗi màn trong 5 trò chơi sinh thái để nhận thêm nhiều nhãn dán quý hiếm nhé!
        </div>
      </div>
    </div>
  );
};

export default StickerBookModal;
