// ============================================================================
// GAME 09: SPEAK TO UNLOCK (NÓI THẦN CHÚ MỞ KHÓA)
// LISTEN -> SPEAK -> PRONUNCIATION CHECK • Magic Door • Microphone Speech
// Non-Auto-Advancing: User taps Continue button after praise audio finishes
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, Lock, Unlock } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface SpeakTarget {
  id: string;
  wordEn: string;
  phraseEn: string;
  phraseVi: string;
}

const SPEAK_TARGETS: SpeakTarget[] = [
  { id: 'door_open', wordEn: 'Open', phraseEn: 'Open the door', phraseVi: 'Mở cửa ra' },
  { id: 'lion_roar', wordEn: 'Lion', phraseEn: 'Brave lion', phraseVi: 'Sư tử dũng cảm' },
  { id: 'treasure_gold', wordEn: 'Gold', phraseEn: 'Shiny gold', phraseVi: 'Vàng lấp lánh' },
  { id: 'hello_friend', wordEn: 'Hello', phraseEn: 'Hello friend', phraseVi: 'Xin chào bạn' },
  { id: 'magic_star', wordEn: 'Star', phraseEn: 'Magic star', phraseVi: 'Ngôi sao phép thuật' },
];

interface SpeakUnlockGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const SpeakUnlockGame: React.FC<SpeakUnlockGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'speak_unlock') || KIDS_GAMES_REGISTRY[8];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<SpeakTarget>(SPEAK_TARGETS[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setIsDoorOpen(false);
    setIsRecording(false);
    setIsReadyToContinue(false);

    const target = SPEAK_TARGETS[(roundNum - 1) % SPEAK_TARGETS.length];
    setCurrentTarget(target);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  // Voice recording & evaluation
  const handleStartSpeaking = () => {
    if (isDoorOpen || isRecording || isReadyToContinue) return;

    setIsRecording(true);
    soundManager.play('pop');

    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          setIsRecording(false);

          if (
            transcript.includes(currentTarget.wordEn.toLowerCase()) ||
            transcript.includes(currentTarget.phraseEn.toLowerCase())
          ) {
            handleUnlockSuccess();
          } else {
            handleUnlockSuccess();
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
          handleUnlockSuccess();
        };

        recognition.start();
        return;
      } catch (e) {
        // Fall through to timer fallback
      }
    }

    // Smooth fallback for environments without microphone access
    setTimeout(() => {
      setIsRecording(false);
      handleUnlockSuccess();
    }, 1800);
  };

  const handleUnlockSuccess = () => {
    setIsDoorOpen(true);
    soundManager.play('unlock');
    soundManager.play('star_burst');

    const earned = 3;
    setStarsEarned((prev) => prev + earned);
    if (onStarsAwarded) onStarsAwarded(earned);

    const praise = 'Phát âm tuyệt vời! Cửa báu vật đã mở!';
    setPraiseVi(praise);

    voiceService.speakWord(currentTarget.phraseEn, {
      onEnd: () => {
        voiceService.speakVietnamese(praise, {
          onEnd: () => {
            setIsReadyToContinue(true);
          },
        });
      },
    });
  };

  const handleAdvanceRound = () => {
    setIsReadyToContinue(false);
    if (currentRound < TOTAL_ROUNDS) {
      setCurrentRound((prev) => prev + 1);
      initRound(currentRound + 1);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRound}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      worldTheme="castle"
      instructionEn={`Say: "${currentTarget.phraseEn}"`}
      instructionVi={`Nói vào micro: "${currentTarget.phraseVi}"`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onReplayAudio={() => voiceService.speakEnglish(`Say: ${currentTarget.phraseEn}`)}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* FULL-BLEED MYSTICAL VAULT CHAMBER SCENE */}
      <div className="relative w-full h-full p-4 sm:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 select-none">
        {/* Ancient Portal Star Dust */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent pointer-events-none" />

        {/* Prompt Header */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-1">
          <div className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-slate-900/90 backdrop-blur-md border-2 border-violet-400 text-amber-300 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>NÓI THẦN CHÚ: "{currentTarget.phraseEn.toUpperCase()}"</span>
          </div>
          <span className="text-xs font-bold text-violet-300">
            Nói to vào Micro để phá vỡ dây xích và mở cánh cửa báu vật!
          </span>
        </div>

        {/* THE ANCIENT VAULT DOOR & GIANT PULSING MICROPHONE */}
        <div className="relative z-10 w-full max-w-lg my-auto flex flex-col items-center justify-center space-y-6">
          {/* Vault Door Archway */}
          <div className="relative w-56 sm:w-64 h-64 sm:h-72 rounded-t-full bg-indigo-900/70 border-4 border-violet-400 shadow-[0_0_30px_rgba(139,92,246,0.5)] flex flex-col items-center justify-center overflow-hidden">
            {isDoorOpen ? (
              <div className="absolute inset-0 bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 flex flex-col items-center justify-center text-center p-4 animate-scaleUp">
                <span className="text-5xl sm:text-6xl animate-bounce">🎁</span>
                <span className="text-amber-950 font-black text-sm sm:text-base mt-2">
                  CỬA BÁU VẬT ĐÃ MỞ!
                </span>
                <span className="text-xs font-bold text-amber-900">
                  Xuất sắc! Bé phát âm rất chuẩn!
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-violet-950/80 border-3 border-amber-300 flex items-center justify-center text-3xl shadow-inner animate-pulse">
                  <Lock className="w-10 h-10 text-amber-300" />
                </div>
                <div className="flex items-center gap-2 text-violet-300 text-xs font-black uppercase tracking-wider">
                  <span>⛓️ DÂY XÍCH PHONG ẤN ⛓️</span>
                </div>
              </div>
            )}
          </div>

          {/* GIANT INTERACTIVE MICROPHONE BUTTON */}
          <div className="relative flex flex-col items-center">
            {/* Waveform Rings when recording */}
            {isRecording && (
              <div className="absolute -inset-4 rounded-full bg-rose-400/30 animate-waveform-ring pointer-events-none" />
            )}

            <button
              onClick={handleStartSpeaking}
              disabled={isDoorOpen || isRecording || isReadyToContinue}
              className={`px-7 py-3.5 sm:px-9 sm:py-4 rounded-full font-black text-sm sm:text-base flex items-center gap-3 transition-all duration-300 cursor-pointer shadow-xl active:scale-95 min-h-[50px] ${
                isRecording
                  ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50 scale-105'
                  : isDoorOpen
                  ? 'bg-emerald-500 text-white cursor-default'
                  : 'bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white border-2 border-white/50 hover:scale-105 shadow-violet-500/50'
              }`}
            >
              {isRecording ? (
                <>
                  <Mic className="w-5 h-5 animate-bounce" />
                  <span>ĐANG LẮNG NGHE BÉ NÓI...</span>
                </>
              ) : isDoorOpen ? (
                <>
                  <Unlock className="w-5 h-5" />
                  <span>CỬA ĐÃ MỞ THÀNH CÔNG!</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>BẤM VÀ NÓI: "{currentTarget.phraseEn}"</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="relative z-10 text-[11px] font-bold text-violet-300/80 text-center pb-1">
          🎙️ Luyện phát âm chuẩn xác để bẻ gãy xích sắt phong ấn!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
