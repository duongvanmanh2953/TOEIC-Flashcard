import React, { useState, useEffect, useRef } from 'react';
import { ModalPortal } from '../../components/common/ModalPortal';
import { KidsLockIcon, KidsIcon } from '../assets/icons/KidsIcons';
import { soundManager } from '../services/sound/KidsSoundManager';

interface KidsParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified?: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
}

export const KidsParentPinModal: React.FC<KidsParentPinModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  onSuccess,
  title,
  description,
}) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setHoldProgress(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = () => {
    soundManager.play('pop');

    // Start progress (1.5s total hold time)
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 7; // ~1.4s
      setHoldProgress(Math.min(currentProgress, 100));
    }, 100);

    holdTimerRef.current = setTimeout(() => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setHoldProgress(100);
      soundManager.play('unlock');
      setTimeout(() => {
        if (typeof onVerified === 'function') {
          onVerified();
        } else if (typeof onSuccess === 'function') {
          onSuccess();
        }
        onClose();
      }, 200);
    }, 1500);
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="kids-layout kids-modal relative w-full max-w-sm my-auto rounded-3xl bg-white p-6 sm:p-7 space-y-4 animate-scale-up text-center select-none border-2 border-slate-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center border-2 border-amber-300">
          <KidsLockIcon size={28} />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            {title || 'Khu Vực Phụ Huynh'}
          </h3>
          <p className="text-xs font-bold text-slate-700 mt-1 leading-relaxed">
            {description || 'Nhấn và giữ nút tròn bên dưới để mở khóa.'}
          </p>
        </div>

        <div className="py-4 flex flex-col items-center gap-3">
          <button
            type="button"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="relative w-32 h-32 rounded-full border-4 border-amber-300 bg-amber-50 flex items-center justify-center overflow-hidden active:scale-95 transition-transform touch-none shadow-md cursor-pointer"
          >
            <div
              className="absolute bottom-0 left-0 right-0 bg-amber-400 opacity-40 transition-all duration-75"
              style={{ height: `${holdProgress}%` }}
            />
            <span className="relative z-10 font-black text-amber-900 text-sm">NHẤN GIỮ</span>
          </button>
          <p className="text-[11px] font-black text-amber-600">
            {holdProgress === 0
              ? 'Chạm và giữ 1.5 giây'
              : holdProgress >= 100
              ? '✨ Đã mở khóa thành công!'
              : 'Đang mở khóa...'}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition cursor-pointer"
        >
          Hủy bỏ
        </button>
      </div>
    </ModalPortal>
  );
};

export default KidsParentPinModal;
