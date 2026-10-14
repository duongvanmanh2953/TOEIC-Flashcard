import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../services/audio/MeadowAudioEngine';
import { meadowStore } from '../core/meadowStateStore';

interface ParentalMathGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const ParentalMathGateModal: React.FC<ParentalMathGateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Khu Vực Dành Cho Ba Mẹ',
  description = 'Vui lòng giải phép tính nhanh bên dưới để xác thực người lớn:',
}) => {
  const [numA, setNumA] = useState(7);
  const [numB, setNumB] = useState(8);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorWobble, setErrorWobble] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const a = Math.floor(Math.random() * 8) + 4; // 4 to 11
      const b = Math.floor(Math.random() * 8) + 3; // 3 to 10
      setNumA(a);
      setNumB(b);
      setUserAnswer('');
      setErrorWobble(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const correctAnswer = numA + numB;

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (parseInt(userAnswer.trim(), 10) === correctAnswer) {
      MeadowAudioEngine.playMagicalSuccess();
      onSuccess();
    } else {
      MeadowAudioEngine.playSoftBounce();
      setErrorWobble(true);
      setTimeout(() => setErrorWobble(false), 500);
      setUserAnswer('');
    }
  };

  const handleKeypadPress = (val: string) => {
    MeadowAudioEngine.playWoodTap('E5');
    if (val === 'C') {
      setUserAnswer('');
    } else if (val === 'OK') {
      handleVerify();
    } else {
      if (userAnswer.length < 3) {
        setUserAnswer((prev) => prev + val);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn select-none">
      <div
        className={`meadow-clay-card max-w-sm w-full p-6 bg-[#FFFDF5] border-4 border-white shadow-2xl relative ${
          errorWobble ? 'wobble-hint' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            MeadowAudioEngine.playWoodTap('D4');
            onClose();
          }}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-lg cursor-pointer"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl shadow-inner mb-3">
          🛡️
        </div>

        <h3 className="text-xl font-extrabold text-[#1E293B] font-display text-center">
          {title}
        </h3>
        <p className="text-xs font-semibold text-[#475569] text-center mt-1 mb-4 font-body leading-relaxed">
          {description}
        </p>

        {/* Math Question Box */}
        <div className="bg-amber-50 border-2 border-amber-200/80 rounded-2xl p-4 text-center mb-4">
          <div className="text-xs uppercase font-extrabold tracking-wider text-amber-800 font-display">
            Xác thực người lớn
          </div>
          <div className="text-3xl font-extrabold text-[#1E293B] font-display mt-1">
            {numA} + {numB} = <span className="text-emerald-600 underline">{userAnswer || '?'}</span>
          </div>
        </div>

        {/* Numeric Keypad (Ergonomic Touch Targets) */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => {
            const isOk = key === 'OK';
            const isClear = key === 'C';
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleKeypadPress(key)}
                className={`min-h-[50px] rounded-xl font-display font-extrabold text-lg flex items-center justify-center transition-all cursor-pointer active:scale-95 border ${
                  isOk
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm col-span-1'
                    : isClear
                    ? 'bg-rose-100 hover:bg-rose-200 text-rose-700 border-rose-300'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-xs'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>

        <div className="text-center text-[11px] font-bold text-slate-400 font-body">
          Cổng bảo vệ an toàn giúp giữ bé trong không gian học tập lành mạnh.
        </div>
      </div>
    </div>
  );
};

export default ParentalMathGateModal;
