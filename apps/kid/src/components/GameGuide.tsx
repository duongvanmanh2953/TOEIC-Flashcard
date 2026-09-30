import React, { useState, useEffect } from 'react';
import { KidsMascot, MascotMood } from './KidsMascot';
import { voiceService } from '../services/voice/voiceService';
import { soundManager } from '../services/sound/KidsSoundManager';
import { Play, Volume2, Sparkles } from 'lucide-react';

interface GameGuideProps {
  gameId: string;
  gameTitle: string;
  gameSubtitle: string;
  instructionVi: string;
  instructionEn?: string;
  targetWord?: string;
  targetWordVi?: string;
  onStart: () => void;
}

type GuidePhase = 'intro' | 'demonstrating' | 'your_turn';

export const GameGuide: React.FC<GameGuideProps> = ({
  gameId,
  gameTitle,
  gameSubtitle,
  instructionVi,
  instructionEn,
  targetWord,
  targetWordVi,
  onStart,
}) => {
  const [guidePhase, setGuidePhase] = useState<GuidePhase>('intro');
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechBubbleText, setSpeechBubbleText] = useState('Mình chơi nhé!');

  // Check if first time playing this game
  const storageKey = `kids_guide_played_${gameId}`;
  const isFirstTime = !sessionStorage.getItem(storageKey);

  const startGuideSequence = () => {
    soundManager.playPop();
    setIsSpeaking(true);

    // Phase 1: Intro
    setGuidePhase('intro');
    setMascotMood('happy');
    setSpeechBubbleText('Mình chơi nhé!');

    voiceService.speakInstruction('Mình chơi nhé!', 'vi', {
      onEnd: () => {
        // Phase 2: Demonstration with pointing
        setTimeout(() => {
          setGuidePhase('demonstrating');
          setMascotMood('thinking');
          const demoText = targetWordVi
            ? `Bé hãy tìm ${targetWordVi}!`
            : instructionVi;
          setSpeechBubbleText(demoText);

          voiceService.speakInstruction(demoText, 'vi', {
            onEnd: () => {
              if (targetWord) {
                // English audio first
                setTimeout(() => {
                  voiceService.speakEnglish(targetWord, {
                    onEnd: () => {
                      triggerYourTurn();
                    },
                  });
                }, 200);
              } else {
                triggerYourTurn();
              }
            },
            onError: () => triggerYourTurn(),
          });
        }, 300);
      },
      onError: () => triggerYourTurn(),
    });
  };

  const triggerYourTurn = () => {
    setGuidePhase('your_turn');
    setMascotMood('excited');
    setSpeechBubbleText('Đến lượt bé nhé! Your turn!');
    setIsSpeaking(false);
    soundManager.playDing();
    voiceService.speakInstruction('Đến lượt bé nhé!', 'vi');
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      startGuideSequence();
    }, 400);

    return () => {
      clearTimeout(timer);
      voiceService.stop();
    };
  }, [gameId]);

  const handleStartGame = () => {
    soundManager.playDing();
    voiceService.stop();
    sessionStorage.setItem(storageKey, 'true');
    onStart();
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-amber-50 to-orange-50/80 border-2 border-amber-300 p-6 sm:p-8 flex flex-col items-center justify-between text-center space-y-6 max-w-lg mx-auto w-full animate-fadeIn select-none shadow-lg">
      {/* Soft floating background lights */}
      <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-amber-200/40 pointer-events-none blur-xl" />
      <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-orange-200/30 pointer-events-none blur-xl" />

      {/* Header Badge */}
      <div className="relative z-10 flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-amber-300 text-amber-950 text-xs font-black shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        <span>Hướng Dẫn Chơi Cùng Bobby</span>
      </div>

      {/* Mascot & Speech Bubble */}
      <div className="relative z-10 flex flex-col items-center space-y-4 w-full">
        <div className="hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={startGuideSequence}>
          <KidsMascot
            mood={mascotMood}
            size={120}
            speechText={speechBubbleText}
          />
        </div>

        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950">
            {gameTitle}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-700">
            {gameSubtitle}
          </p>
        </div>

        {/* Target Challenge Prompt Box with Pointing Animation */}
        <div className={`relative w-full p-4 rounded-2xl bg-white/95 border-2 text-slate-900 space-y-1 transition-all ${
          guidePhase === 'demonstrating'
            ? 'border-amber-400 ring-4 ring-amber-300/60 scale-102 shadow-md'
            : 'border-amber-200 shadow-sm'
        }`}>
          {/* Animated Mascot Pointing Finger Demonstration */}
          {guidePhase === 'demonstrating' && (
            <div className="absolute -top-7 right-6 text-3xl animate-bounce pointer-events-none">
              👉
            </div>
          )}

          <p className="text-xs font-black uppercase text-amber-800 tracking-wider">
            Nhiệm vụ của bé:
          </p>
          <p className="text-base sm:text-lg font-black text-slate-950">
            "{instructionVi}"
          </p>
          {targetWord && (
            <div className="pt-2 flex items-center justify-center gap-2">
              <span className="px-3.5 py-1.5 rounded-xl bg-amber-100 border border-amber-300 font-black text-amber-950 text-sm shadow-sm">
                {targetWord}
              </span>
              {targetWordVi && (
                <span className="text-xs font-bold text-slate-600">
                  ({targetWordVi})
                </span>
              )}
              <button
                onClick={startGuideSequence}
                className="p-2 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 transition cursor-pointer"
                title="Nghe lại hướng dẫn"
              >
                <Volume2 className="w-4 h-4 text-amber-900" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="relative z-10 w-full space-y-2 pt-2">
        <button
          onClick={handleStartGame}
          className={`w-full py-4 rounded-2xl text-white font-black text-base sm:text-lg border-b-4 active:scale-95 transition flex items-center justify-center gap-2.5 cursor-pointer shadow-md ${
            guidePhase === 'your_turn'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-emerald-700 animate-bounce'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 border-amber-700'
          }`}
        >
          <span>{guidePhase === 'your_turn' ? '👉 ĐẾN LƯỢT BÉ CHƠI! BẮT ĐẦU' : '▶ BẮT ĐẦU CHƠI NGAY'}</span>
          <Play className="w-5 h-5 fill-current" />
        </button>

        <p className="text-[11px] font-bold text-slate-500">
          {isFirstTime ? '🌟 Lần đầu bé chơi trò này' : '👍 Bé đã quen luật chơi rồi!'}
        </p>
      </div>
    </div>
  );
};


export default GameGuide;
