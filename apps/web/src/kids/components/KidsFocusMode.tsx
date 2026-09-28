import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { soundManager } from '../services/sound/KidsSoundManager';
import { KidsParentPinModal } from './KidsParentPinModal';

interface KidsFocusModeProps {
  children: React.ReactNode;
  onExit?: () => void;
  title?: string;
  allowDirectExit?: boolean;
}

export const KidsFocusMode: React.FC<KidsFocusModeProps> = ({
  children,
  onExit,
  title = 'Bài Học Tập Trung',
  allowDirectExit = false,
}) => {
  const navigate = useNavigate();
  const [parentModalOpen, setParentModalOpen] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const HOLD_DURATION_MS = 2500; // 2.5 seconds hold to trigger parent gate

  const startHold = () => {
    if (allowDirectExit) {
      handleCompleteExit();
      return;
    }
    setIsHolding(true);
    startTimeRef.current = Date.now();
    soundManager.playClick();

    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / HOLD_DURATION_MS) * 100));
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdTimerRef.current);
        setIsHolding(false);
        setHoldProgress(0);
        soundManager.playPop();
        setParentModalOpen(true);
      }
    }, 50);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
    setIsHolding(false);
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const handleCompleteExit = () => {
    if (onExit) {
      onExit();
    } else {
      navigate('/kids');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#FFFDF7] flex flex-col overflow-hidden select-none">
      {/* Top Focus Bar */}
      <header className="h-14 px-4 sm:px-6 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center text-lg font-black">
            🌟
          </div>
          <span className="font-black text-sm sm:text-base text-slate-950 tracking-tight">
            {title}
          </span>
        </div>

        {/* Parent Protected Exit Button */}
        <div className="relative">
          <button
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            className="relative px-3.5 py-1.5 rounded-2xl bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 text-amber-950 font-black text-xs transition cursor-pointer flex items-center gap-1.5 overflow-hidden active:scale-95"
            title="Nhấn giữ 3 giây để mở khóa thoát"
          >
            {/* Fill progress indicator */}
            {isHolding && (
              <div
                className="absolute inset-0 bg-amber-400/70 transition-all duration-75 z-0"
                style={{ width: `${holdProgress}%` }}
              />
            )}
            <Lock className="w-3.5 h-3.5 relative z-10 text-amber-950 shrink-0" />
            <span className="relative z-10 font-black">
              {isHolding ? `Giữ để thoát (${Math.round(holdProgress)}%)` : 'Giữ 3s để thoát'}
            </span>
          </button>
        </div>
      </header>

      {/* Main Focus Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 relative z-10 flex flex-col items-center justify-center">
        {children}
      </main>

      {/* Parent Verification Gate */}
      <KidsParentPinModal
        isOpen={parentModalOpen}
        onClose={() => setParentModalOpen(false)}
        onVerified={handleCompleteExit}
      />
    </div>
  );
};

export default KidsFocusMode;
