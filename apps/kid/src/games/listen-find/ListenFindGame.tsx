// ============================================================================
// GAME 01: LISTEN & FIND (NGHE TRANH ĐOÁN CHỮ / CHỌN ĐÚNG TRANH)
// Professional Illustrated Stage • 3D Tactile Game Cards • Interactive Audio Station
// Non-spoiled Cards: Answers revealed upon correct tap with celebration!
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Check, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { celebrationManager } from '../../services/celebration/CelebrationManager';
import { preloadUpcomingImages } from '../../services/assets/kidGameAsset';

interface ListenFindGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const ListenFindGame: React.FC<ListenFindGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'listen_find') || KIDS_GAMES_REGISTRY[0];

  const TOTAL_ROUNDS = 5;
  const [currentRound, setCurrentRound] = useState(1);
  const [starsEarned, setStarsEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const [targetItem, setTargetItem] = useState<VocabularyItem>(COMPREHENSIVE_VOCABULARY[0]);
  const [options, setOptions] = useState<VocabularyItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resultState, setResultState] = useState<'correct' | 'wrong' | null>(null);

  // Initialize round
  const initRound = useCallback((roundNum: number) => {
    setSelectedId(null);
    setResultState(null);
    setIsReadyToContinue(false);

    const shuffled = [...COMPREHENSIVE_VOCABULARY].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const choices = shuffled.slice(0, 4).sort(() => Math.random() - 0.5);

    setTargetItem(target);
    setOptions(choices);

    preloadUpcomingImages(choices.map((c) => `/kid/animals/${c.word.toLowerCase()}.png`));
    voiceService.preloadWords([target.word, ...choices.map((c) => c.word)]);

    // Audio prompt with animation trigger
    setIsPlayingAudio(true);
    const promptTimer = setTimeout(() => {
      voiceService.speakWord(target.word, {
        onEnd: () => setIsPlayingAudio(false),
      });
    }, 120);

    return () => clearTimeout(promptTimer);
  }, []);

  useEffect(() => {
    initRound(1);
  }, [initRound]);

  const handleReplayAudio = () => {
    soundManager.play('pop');
    setIsPlayingAudio(true);
    voiceService.speakWord(targetItem.word, {
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  const handleSelectOption = (item: VocabularyItem) => {
    if (resultState === 'correct' || isReadyToContinue) return;

    setSelectedId(item.id);

    if (item.id === targetItem.id) {
      setResultState('correct');
      soundManager.play('star_burst');
      soundManager.play('correct');
      setStreak((prev) => prev + 1);
      const earned = 2;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = celebrationManager.getRandomPraise(false);
      setPraiseVi(praise);

      // Play word audio then Vietnamese praise
      voiceService.speakWord(item.word);
      setTimeout(() => {
        voiceService.speakVietnamese(praise);
      }, 450);

      setTimeout(() => {
        setIsReadyToContinue(true);
      }, 500);
    } else {
      setResultState('wrong');
      soundManager.play('wrong');
      setStreak(0);
      voiceService.speakVietnamese('Bé thử lại nhé!');
      setTimeout(() => {
        setSelectedId(null);
        setResultState(null);
      }, 600);
    }
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
      streak={streak}
      worldTheme="starter"
      instructionEn={`Listen and find: ${targetItem.word}`}
      instructionVi={`Bé hãy nghe âm thanh và chọn đúng bức tranh!`}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleAdvanceRound}
      praiseVi={praiseVi}
      onExit={onExit}
      onReplayAudio={handleReplayAudio}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRound(1);
        setStarsEarned(0);
        setIsGameComplete(false);
        initRound(1);
      }}
      isGameComplete={isGameComplete}
    >
      {/* ================================================================ */}
      {/* ILLUSTRATED CARTOON NATURE STAGE                                  */}
      {/* ================================================================ */}
      <div className="relative w-full h-full p-4 sm:p-6 lg:p-8 flex flex-col justify-between items-center overflow-hidden bg-gradient-to-b from-[#87CEEB] via-[#C5E8FF] to-[#E2F7D8] select-none">
        
        {/* Layer 1: Sky & Atmosphere with Floating Clouds & Sun */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Smiling Cartoon Sun */}
          <div className="absolute -top-4 right-10 w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-200 border-4 border-yellow-300/80 shadow-[0_0_50px_rgba(251,191,36,0.6)] flex items-center justify-center animate-spin-slow">
            <div className="w-16 h-16 rounded-full bg-amber-400/20" />
          </div>

          {/* Drifting Clouds */}
          <div className="absolute top-6 left-12 opacity-80 animate-pulse">
            <svg width="120" height="48" viewBox="0 0 120 48" fill="white">
              <path d="M 20 40 Q 20 20 38 20 Q 48 4 72 10 Q 94 4 100 24 Q 116 28 112 40 Z" />
            </svg>
          </div>
          <div className="absolute top-16 right-1/3 opacity-70 animate-pulse" style={{ animationDelay: '1.5s' }}>
            <svg width="100" height="40" viewBox="0 0 120 48" fill="white">
              <path d="M 20 40 Q 20 20 38 20 Q 48 4 72 10 Q 94 4 100 24 Q 116 28 112 40 Z" />
            </svg>
          </div>

          {/* Rolling Green Hills Background */}
          <div className="absolute bottom-0 inset-x-0 h-44 bg-[#88D475] rounded-t-[45%] scale-x-125 opacity-70" />
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#5EB848] via-[#6ECB56] to-[#7ED966] rounded-t-[35%]" />
          
          {/* Wildflowers and Mushroom Sprinkles on Meadow */}
          <div className="absolute bottom-4 left-8 text-2xl opacity-80">🌼</div>
          <div className="absolute bottom-6 left-28 text-xl opacity-75">🌸</div>
          <div className="absolute bottom-3 right-16 text-2xl opacity-80">🍄</div>
          <div className="absolute bottom-7 right-36 text-xl opacity-75">🌷</div>
        </div>

        {/* ================================================================ */}
        {/* CENTER AUDIO CHALLENGE STATION (MAGIC SPEAKER PODIUM)            */}
        {/* ================================================================ */}
        <div className="relative z-20 flex flex-col items-center text-center space-y-2 max-w-xl mx-auto">
          {/* Whimsical Audio Speaker Pill Button */}
          <button
            onClick={handleReplayAudio}
            type="button"
            className={`group px-6 py-2.5 sm:px-8 sm:py-3 rounded-full bg-white text-emerald-950 font-black text-sm sm:text-base shadow-[0_8px_20px_rgba(16,185,129,0.25)] border-3 border-emerald-400 flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 ${
              isPlayingAudio ? 'ring-4 ring-emerald-300 scale-105 bg-emerald-50' : 'animate-bounce'
            }`}
          >
            {/* Animated Speaker Horn with pulsing Soundwaves */}
            <div className={`w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm shrink-0 transition-transform ${isPlayingAudio ? 'rotate-12 scale-110' : 'group-hover:rotate-6'}`}>
              <Volume2 className="w-5 h-5" />
            </div>

            <div className="flex flex-col text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-xs uppercase tracking-wider text-emerald-600 font-bold">
                  Bấm để nghe âm thanh:
                </span>
                {isPlayingAudio && (
                  <span className="inline-flex gap-0.5 text-emerald-500 font-black animate-pulse">
                    ♫ ♪
                  </span>
                )}
              </div>
              <span className="text-base sm:text-lg font-black text-slate-900 tracking-wide">
                "{targetItem.word.toUpperCase()}"
              </span>
            </div>

            <div className="ml-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black group-hover:bg-emerald-200">
              🔊 Nghe lại
            </div>
          </button>

          {/* Subtitle / Encouragement Banner */}
          <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/85 backdrop-blur-xs border border-emerald-300 text-emerald-900 font-bold text-xs shadow-xs">
            <span>🐾 Bé hãy chạm vào bức tranh tương ứng trên bãi cỏ nhé!</span>
          </div>
        </div>

        {/* ================================================================ */}
        {/* 4 TACTILE 3D CARTOON PICTURE CARDS (TRANH ĐOÁN CHỮ)             */}
        {/* ================================================================ */}
        <div className="relative z-10 w-full max-w-4xl grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 my-auto items-stretch justify-items-center py-4">
          {options.map((opt, idx) => {
            const isSelected = selectedId === opt.id;
            const isTarget = opt.id === targetItem.id;
            const isSuccess = isSelected && isTarget && resultState === 'correct';
            const isError = isSelected && !isTarget && resultState === 'wrong';

            return (
              <div
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className={`group relative w-full max-w-[220px] flex flex-col items-center cursor-pointer select-none rounded-[18px] transition-all duration-200 ${
                  isSuccess
                    ? 'scale-105 -translate-y-2 z-30 drop-shadow-[0_16px_28px_rgba(16,185,129,0.4)]'
                    : isError
                    ? 'animate-shake'
                    : 'hover:-translate-y-1.5 hover:scale-[1.02] active:translate-y-0 active:scale-95'
                }`}
              >
                {/* 3D Toy Tile Surface (High contrast, sharp radius, enlarged frame) */}
                <div
                  className={`relative w-full h-[220px] sm:h-[240px] rounded-[18px] p-3.5 flex flex-col items-center justify-between transition-all duration-200 overflow-hidden border-2 border-b-6 ${
                    isSuccess
                      ? 'bg-emerald-50 border-emerald-700 border-b-emerald-900 ring-4 ring-emerald-400 shadow-md'
                      : isError
                      ? 'bg-rose-50 border-rose-700 border-b-rose-900 ring-4 ring-rose-300'
                      : 'bg-white border-slate-900 border-b-slate-900 shadow-[3px_4px_0px_#0f172a] hover:shadow-[4px_6px_0px_#0f172a]'
                  }`}
                >
                  {/* Top Header: Number Badge & Status */}
                  <div className="w-full flex items-center justify-between">
                    <span
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-xs border ${
                        isSuccess
                          ? 'bg-emerald-500 text-white border-emerald-400'
                          : 'bg-amber-100 text-amber-900 border-amber-300'
                      }`}
                    >
                      {idx + 1}
                    </span>

                    {isSuccess ? (
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md animate-bounce">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-[11px] font-bold group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Centered High-Res 3D Illustration in Glowing Halo */}
                  <div className="relative my-auto w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                    {/* Glowing Soft Backdrop Blob */}
                    <div
                      className={`absolute inset-0 rounded-full blur-md transition-all ${
                        isSuccess
                          ? 'bg-emerald-400/40 scale-110 animate-pulse'
                          : 'bg-amber-200/30 group-hover:scale-105'
                      }`}
                    />

                    <KidsIllustration
                      name={opt.word.toLowerCase()}
                      className={`relative z-10 w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 ${
                        isSuccess ? 'scale-110' : 'group-hover:scale-105'
                      }`}
                      alt={opt.word}
                    />
                  </div>

                  {/* BOTTOM REVEAL BANNER: ONLY REVEALED ON CORRECT TAP (NO SPOILER BEFOREHAND!) */}
                  <div className="w-full pt-1">
                    {isSuccess ? (
                      <div className="w-full py-1.5 px-2 rounded-2xl bg-emerald-600 text-white text-center shadow-md animate-fadeIn">
                        <span className="text-sm font-black uppercase tracking-wider block leading-tight">
                          {opt.word}
                        </span>
                        <span className="text-[10px] font-bold opacity-90 block leading-tight">
                          ({opt.viMeaning})
                        </span>
                      </div>
                    ) : (
                      <div className="w-full py-1.5 px-2 rounded-2xl bg-slate-100/90 group-hover:bg-emerald-100/70 border border-slate-200/60 text-slate-600 group-hover:text-emerald-900 text-center transition-colors">
                        <span className="text-xs font-black tracking-wide block">
                          Chạm để chọn 👆
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tactile Grassy Mound Pedestal Below Card */}
                <div
                  className={`w-28 sm:w-36 h-5 rounded-[50%] transition-all -mt-2 -z-10 ${
                    isSuccess
                      ? 'bg-emerald-600/70 blur-xs scale-110'
                      : 'bg-[#4EA33A]/60 shadow-inner group-hover:scale-105'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* ================================================================ */}
        {/* FOOTER: COZY HINT & STATUS                                       */}
        {/* ================================================================ */}
        <div className="relative z-10 text-[11px] sm:text-xs font-bold text-emerald-950 bg-white/75 backdrop-blur-xs px-4 py-1 rounded-full border border-emerald-300/80 shadow-2xs">
          🌱 Vườn hoa tri thức — Chạm đúng bạn thú để mở khoá từ vựng và nhận sao vàng!
        </div>
      </div>
    </KidsGameWrapper>
  );
};
