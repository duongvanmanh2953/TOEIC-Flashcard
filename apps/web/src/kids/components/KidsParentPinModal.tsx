import React, { useState, useEffect, useRef } from 'react';
import { ModalPortal } from '../../components/common/ModalPortal';
import { KidsLockIcon, KidsIcon } from '../assets/icons/KidsIcons';
import { soundManager } from '../services/sound/KidsSoundManager';

interface KidsParentPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const KidsParentPinModal: React.FC<KidsParentPinModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const [step, setStep] = useState<'hold' | 'pin'>('hold');
  const [holdProgress, setHoldProgress] = useState(0);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parent PIN is fixed to "1984" for demo purposes, could be fetched from user profile
  const CORRECT_PIN = '1984';

  useEffect(() => {
    if (isOpen) {
      setStep('hold');
      setHoldProgress(0);
      setPin('');
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePointerDown = () => {
    if (step !== 'hold') return;
    soundManager.playDing();
    
    // Start progress
    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += 5; // 5% per 100ms = 2 seconds total
      setHoldProgress(Math.min(currentProgress, 100));
    }, 100);

    holdTimerRef.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setHoldProgress(100);
      setStep('pin');
      soundManager.playPop();
    }, 2000); // 2 seconds hold
  };

  const handlePointerUp = () => {
    if (step !== 'hold') return;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      soundManager.playFanfare();
      onVerified();
      onClose();
    } else {
      soundManager.playIncorrect();
      setErrorMsg('Mã PIN chưa đúng!');
      setPin('');
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="m-auto relative w-full max-w-sm rounded-3xl kids-glass-panel bg-white/90 p-6 sm:p-7 space-y-4 animate-scale-up text-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 mx-auto flex items-center justify-center border-2 border-amber-300">
          <KidsLockIcon size={28} />
        </div>

        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Khu Vực Phụ Huynh
          </h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            {step === 'hold' ? 'Nhấn giữ 2 giây để xác nhận bạn là người lớn.' : 'Nhập mã PIN của phụ huynh để tiếp tục.'}
          </p>
        </div>

        {step === 'hold' ? (
          <div className="py-6 flex flex-col items-center gap-4">
            <button
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              className="relative w-32 h-32 rounded-full border-4 border-amber-200 bg-amber-50 flex items-center justify-center overflow-hidden active:scale-95 transition-transform touch-none"
            >
              <div 
                className="absolute bottom-0 left-0 right-0 bg-amber-400 opacity-30 transition-all duration-75"
                style={{ height: `${holdProgress}%` }}
              />
              <span className="relative z-10 font-black text-amber-700">NHẤN GIỮ</span>
            </button>
            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              {holdProgress === 0 ? 'Chưa mở khóa' : holdProgress === 100 ? 'Đã mở khóa!' : 'Đang mở khóa...'}
            </p>
          </div>
        ) : (
          <div className="py-2">
            {errorMsg && (
              <p className="text-xs text-rose-500 font-bold animate-shake mb-2">{errorMsg}</p>
            )}
            <form onSubmit={handlePinSubmit} className="space-y-3">
              <input
                type="password"
                autoFocus
                required
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập PIN (1984)"
                className="w-full text-center text-2xl font-bold tracking-widest py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 focus:outline-none focus:border-amber-400 text-slate-900"
              />

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs transition"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition"
                >
                  Mở Khóa
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </ModalPortal>
  );
};

export default KidsParentPinModal;
