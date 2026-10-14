import React, { useState, useEffect } from 'react';
import { MeadowAudioEngine } from '../services/audio/MeadowAudioEngine';

interface SleepyFoxCurtainProps {
  isOpen: boolean;
  onDismiss: () => void;
}

export const SleepyFoxCurtain: React.FC<SleepyFoxCurtainProps> = ({ isOpen, onDismiss }) => {
  const [countdown, setCountdown] = useState(20);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(20);
      return;
    }

    // Play gentle audio guidance
    MeadowAudioEngine.playWoodTap('G4');
    MeadowAudioEngine.speak(
      'Great job playing! Let us rest our eyes for twenty seconds. Look out the window and take a sip of fresh water!',
      { rate: 0.82, pitch: 1.1 }
    );

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          MeadowAudioEngine.playMagicalSuccess();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gradient-to-b from-[#0F3D3E]/85 via-[#1E293B]/90 to-[#0F172A]/95 backdrop-blur-md animate-fadeIn select-none">
      <div className="meadow-clay-card max-w-lg w-full p-8 text-center bg-[#FFFDF5] border-4 border-[#80ED99] relative overflow-hidden shadow-2xl">
        {/* Soft floating stars & leaves */}
        <div className="absolute top-4 left-6 text-2xl animate-bounce">🍃</div>
        <div className="absolute top-6 right-6 text-2xl animate-pulse">✨</div>
        <div className="absolute bottom-6 left-8 text-xl animate-pulse">💧</div>
        <div className="absolute bottom-6 right-8 text-xl animate-bounce">🌿</div>

        {/* Mascot Sleepy Sunny Fox */}
        <div className="w-36 h-36 mx-auto mb-4 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-[#80ED99]/30 rounded-full blur-xl animate-pulse" />
          <svg className="w-full h-full relative z-10 transform hover:scale-105 transition-transform">
            <use href="#svg-sunny-fox"></use>
          </svg>
          {/* Zzz speech bubble */}
          <div className="absolute -top-2 -right-2 bg-white px-3 py-1 rounded-full border-2 border-emerald-300 font-display font-extrabold text-emerald-700 text-sm shadow-sm animate-bounce">
            Zzz... 💤
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-extrabold text-[#1E293B] font-display mb-2">
          Màn Sương Nghỉ Mắt 20-20-20
        </h2>
        <p className="text-sm font-semibold text-[#475569] max-w-md mx-auto mb-6 leading-relaxed font-body">
          Bé đã chăm chỉ học suốt 20 phút rồi! Hãy cùng Cáo Sunny nhìn xa ra ngoài cửa sổ 20 giây và uống một ngụm nước mát nhé.
        </p>

        {/* Visual Countdown Progress */}
        <div className="mb-6 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#57CC99] to-[#80ED99] flex items-center justify-center shadow-inner border-4 border-white text-4xl font-extrabold text-white font-display">
            {countdown > 0 ? countdown : '✨'}
          </div>
          <span className="text-xs font-bold text-slate-500 mt-2 font-body">
            {countdown > 0 ? 'Giây thư giãn mắt...' : 'Mắt bé đã khỏe khoắn lại rồi!'}
          </span>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          {countdown > 0 ? (
            <button
              disabled
              className="toy-btn bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-75 min-h-[58px]"
            >
              ⏳ Hãy nhìn ra xa một chút nhé...
            </button>
          ) : (
            <button
              onClick={() => {
                MeadowAudioEngine.playWoodTap('C6');
                onDismiss();
              }}
              className="toy-btn toy-btn-green animate-bounce min-h-[64px] px-8 text-xl"
            >
              🌟 Mắt Tinh Anh Rừng Xanh — Chơi Tiếp!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepyFoxCurtain;
