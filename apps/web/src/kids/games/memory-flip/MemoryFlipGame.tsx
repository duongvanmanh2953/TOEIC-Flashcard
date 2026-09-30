// ============================================================================
// GAME 02: MEMORY FLIP (REVAMPED GAME TABLE & DECK STACK EXPERIENCE)
// Tactile Table Surface • Multi-Layer Deck Stack • Instant 0ms Flip • Preloaded Audio & Assets
// ============================================================================

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { ArrowLeft, Sparkles, Star, Flame, Volume2, RotateCw, Check, X, Trophy } from 'lucide-react';
import { COMPREHENSIVE_VOCABULARY, VocabularyItem } from '../../data/vocabulary/vocabularyData';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';
import { kidAsset } from '../../utils/kidAsset';

interface MemoryFlipGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

const TOTAL_CARDS_PER_SESSION = 15;
const CARD_BACK_IMAGE = kidAsset('/kid/games/flip-card/card-back.webp');

export const MemoryFlipGame: React.FC<MemoryFlipGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  // 1. Session deck state
  const [deck, setDeck] = useState<VocabularyItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDealingNext, setIsDealingNext] = useState(false);
  const [streak, setStreak] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Sound & Speech mute safety
  useEffect(() => {
    return () => {
      voiceService.stop();
    };
  }, []);

  // 2. Preload all session assets immediately upon mount
  const initGameSession = useCallback(() => {
    // Pick random items for this session
    const shuffled = [...COMPREHENSIVE_VOCABULARY]
      .sort(() => Math.random() - 0.5)
      .slice(0, TOTAL_CARDS_PER_SESSION);

    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsDealingNext(false);
    setStreak(0);
    setStarsEarned(0);
    setMasteredCount(0);
    setIsComplete(false);

    // PRELOAD CARD BACK ASSET
    const cardBackImg = new Image();
    cardBackImg.src = CARD_BACK_IMAGE;

    // PRELOAD ALL VOCABULARY AUDIO & IMAGES IN ADVANCE (0ms lag guarantee)
    voiceService.preloadWords(shuffled.map((v) => v.word));
  }, []);

  useEffect(() => {
    initGameSession();
  }, [initGameSession]);

  const currentCard = deck[currentIndex];
  const nextCard = deck[currentIndex + 1];

  // Preload next card voice right away
  useEffect(() => {
    if (nextCard) {
      voiceService.preloadWords([nextCard.word]);
    }
  }, [nextCard]);

  // 3. FLIP INTERACTION (0ms lag, pure GPU transform)
  const handleFlipCard = useCallback(() => {
    if (isDealingNext) return;

    // Trigger instant flip audio
    soundManager.play('pop');

    // Toggle flip
    setIsFlipped((prev) => {
      const nextState = !prev;
      // If flipping to front side, speak immediately without blocking animation
      if (nextState && currentCard) {
        voiceService.speakWord(currentCard.word);
      }
      return nextState;
    });
  }, [isDealingNext, currentCard]);

  // Pronunciation speaker
  const handleReplayVoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentCard) {
      soundManager.play('pop');
      voiceService.speakWord(currentCard.word);
    }
  };

  // 4. ACTION: NEXT CARD FROM DECK
  const handleAnswer = (remembered: boolean) => {
    if (isDealingNext) return;

    if (remembered) {
      soundManager.play('correct');
      soundManager.play('star_burst');
      setStarsEarned((prev) => prev + 1);
      setStreak((prev) => prev + 1);
      setMasteredCount((prev) => prev + 1);
      if (onStarsAwarded) onStarsAwarded(1);
    } else {
      soundManager.play('pop');
      setStreak(0);
    }

    // Trigger smooth card slide-off deal animation
    setIsDealingNext(true);

    setTimeout(() => {
      if (currentIndex + 1 < deck.length) {
        setCurrentIndex((prev) => prev + 1);
        setIsFlipped(false);
        setIsDealingNext(false);
      } else {
        // Session Complete!
        setIsComplete(true);
        soundManager.play('celebration');
      }
    }, 280);
  };

  const progressPercent = Math.round(((currentIndex + (isComplete ? 1 : 0)) / deck.length) * 100);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-3 sm:space-y-4 select-none px-2 sm:px-4 py-2 animate-fadeIn">
      {/* ========================================================================= */}
      {/* 1. MINIMAL FOCUSED GAME HUD                                               */}
      {/* ========================================================================= */}
      <header className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-full bg-white/90 backdrop-blur-xl border border-white/80 shadow-md">
        {/* Left: Exit button */}
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs active:scale-95 transition-all cursor-pointer min-h-[40px]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Thoát</span>
        </button>

        {/* Center: Clean Title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">🃏</span>
          <span className="font-black text-sm sm:text-base text-slate-800">
            Lật Thẻ Từ Vựng • Memory Match
          </span>
        </div>

        {/* Right: Round & Card Counter */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-900 font-black text-xs">
          <span>Thẻ</span>
          <span className="text-indigo-600">{Math.min(currentIndex + 1, deck.length)}</span>
          <span className="text-indigo-300">/</span>
          <span>{deck.length}</span>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE GAME TABLE (DEDICATED TACTILE PLAYING SURFACE)                     */}
      {/* ========================================================================= */}
      <main className="relative w-full rounded-[36px] sm:rounded-[44px] bg-[#12182D] border-4 border-slate-700/50 shadow-[0_24px_60px_-15px_rgba(0,0,0,0.5),inset_0_2px_12px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col justify-between items-center p-4 sm:p-8 min-h-[580px] sm:min-h-[640px]">
        {/* Soft Radial Ambient Spotlight on Table Center */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15),_transparent_70%)] pointer-events-none" />

        {/* Subtle Decorative Felt Edge Line */}
        <div className="absolute inset-2 sm:inset-3 rounded-[30px] sm:rounded-[38px] border border-white/5 pointer-events-none" />

        {/* Top Hint Pill */}
        <div className="relative z-10 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-sky-200 text-xs font-bold flex items-center gap-2 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
          <span>
            {isFlipped
              ? 'Bé hãy đọc to từ và chọn kết quả bên dưới nhé!'
              : 'Chạm vào lá bài trên đầu chồng bài để lật mở!'}
          </span>
        </div>

        {/* ======================================================================= */}
        {/* 3. CENTER: THE DECK STACK (CHỒNG BÀI THẬT CÓ ĐỘ SÂU)                    */}
        {/* ======================================================================= */}
        <div className="relative z-20 my-auto py-4 flex items-center justify-center [perspective:1400px]">
          {currentCard && !isComplete ? (
            <div className="relative w-72 sm:w-80 h-[380px] sm:h-[430px] flex items-center justify-center">
              {/* DECK LAYER 3 (Bottom Stack Illusion) */}
              <div
                className="absolute inset-0 rounded-[28px] sm:rounded-[32px] overflow-hidden border-2 border-indigo-900/60 shadow-xl pointer-events-none transform translate-y-3.5 translate-x-2 -rotate-2 scale-[0.98] transition-transform duration-300"
                style={{
                  backgroundImage: `url(${CARD_BACK_IMAGE})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-slate-950/40" />
              </div>

              {/* DECK LAYER 2 (Middle Stack Illusion) */}
              <div
                className="absolute inset-0 rounded-[28px] sm:rounded-[32px] overflow-hidden border-2 border-indigo-800/70 shadow-2xl pointer-events-none transform translate-y-2 -translate-x-1.5 rotate-1 scale-[0.99] transition-transform duration-300"
                style={{
                  backgroundImage: `url(${CARD_BACK_IMAGE})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="absolute inset-0 bg-slate-950/20" />
              </div>

              {/* TOP ACTIVE CARD (Interactive 3D Flip with 0ms Latency) */}
              <div
                onClick={handleFlipCard}
                className={`kids-flip-card w-full h-full cursor-pointer relative group transition-all duration-280 ease-out select-none ${
                  isDealingNext
                    ? 'opacity-0 translate-x-32 -rotate-6 scale-95 pointer-events-none'
                    : 'opacity-100 hover:scale-[1.015] active:scale-[0.985]'
                }`}
              >
                <div className={`kids-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
                  {/* ======================================================= */}
                  {/* CARD BACK: Premium Velvet Gold Crest Graphic Asset      */}
                  {/* ======================================================= */}
                  <div
                    className="kids-flip-front border-3 border-amber-300/80 rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex flex-col items-center justify-between p-4"
                    style={{
                      backgroundImage: `url(${CARD_BACK_IMAGE})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {/* Inner Gold Foil Border */}
                    <div className="absolute inset-2 rounded-[22px] sm:rounded-[26px] border border-amber-300/40 pointer-events-none" />

                    {/* Top Branding Pill */}
                    <div className="relative z-10 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-amber-300 border border-amber-300/30">
                      VOCALFLOW KIDS
                    </div>

                    {/* Bottom Prompt Pill */}
                    <div className="relative z-10 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-md group-hover:scale-105 active:scale-95 transition-transform">
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>CHẠM ĐỂ LẬT BÀI</span>
                    </div>
                  </div>

                  {/* ======================================================= */}
                  {/* CARD FRONT: Pearl Porcelain Face with Artwork           */}
                  {/* ======================================================= */}
                  <div className="kids-flip-back bg-gradient-to-b from-white via-slate-50 to-indigo-50/60 border-3 border-indigo-200 rounded-[28px] sm:rounded-[32px] p-4 sm:p-5 flex flex-col items-center justify-between text-center shadow-[0_22px_45px_rgba(0,0,0,0.4)] overflow-hidden">
                    {/* Top Indicator */}
                    <div className="w-full flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-black text-[10px] uppercase tracking-wider">
                        Từ vựng
                      </span>
                      <button
                        onClick={handleReplayVoice}
                        className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 active:scale-90 transition-all cursor-pointer shadow-2xs"
                        title="Phát lại phát âm"
                      >
                        <Volume2 className="w-4 h-4 text-indigo-600" />
                      </button>
                    </div>

                    {/* Big Artwork Pedestal */}
                    <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-indigo-50/80 border border-indigo-100/80 p-3 flex items-center justify-center shadow-inner filter drop-shadow-sm group-hover:scale-105 transition-transform">
                      <KidsIllustration
                        name={currentCard.word.toLowerCase()}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                        alt={currentCard.word}
                      />
                    </div>

                    {/* Vocabulary English + Meaning */}
                    <div className="space-y-1 w-full">
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 capitalize tracking-tight">
                        {currentCard.word}
                      </h3>
                      <p className="text-xs font-bold text-slate-500">
                        {currentCard.phonetic || '/.../'}
                      </p>
                      <div className="pt-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 font-black text-sm border border-emerald-200">
                          {currentCard.viMeaning}
                        </span>
                      </div>
                    </div>

                    {/* Tiny Flip Hint */}
                    <div className="text-[11px] font-bold text-slate-400">
                      Chạm lại để úp thẻ
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VICTORY / COMPLETE CELEBRATION */
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md animate-scaleUp">
              <div className="w-20 h-20 rounded-3xl bg-amber-400 text-amber-950 flex items-center justify-center shadow-xl animate-bounce">
                <Trophy className="w-10 h-10" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Bé Xuất Sắc Hoàn Thành!
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-sky-200">
                Bé đã ôn luyện thành công {deck.length} thẻ từ vựng với {masteredCount} thẻ nhớ siêu chuẩn!
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={initGameSession}
                  className="px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm border border-white/40 active:scale-95 transition-all cursor-pointer"
                >
                  Chơi Lại Vòng Này
                </button>
                {onNextGame && (
                  <button
                    onClick={onNextGame}
                    className="px-7 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    Trò Chơi Tiếp Theo →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* 4. POST-FLIP ANSWER ACTION BUTTONS (APPEARS WHEN CARD IS FLIPPED)       */}
        {/* ======================================================================= */}
        <div className="relative z-20 w-full max-w-sm flex items-center justify-center gap-3 py-2 min-h-[52px]">
          {isFlipped && !isComplete && (
            <div className="flex items-center gap-3 w-full animate-scaleUp">
              {/* Button: Chưa Nhớ */}
              <button
                type="button"
                onClick={() => handleAnswer(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-black text-xs sm:text-sm border border-white/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4 text-rose-400" />
                <span>Chưa Nhớ</span>
              </button>

              {/* Button: Đã Nhớ */}
              <button
                type="button"
                onClick={() => handleAnswer(true)}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Đã Nhớ! +1 ⭐</span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* 5. TABLE FOOTER HUD (SCORE • STREAK • PROGRESS BAR)                     */}
        {/* ======================================================================= */}
        <div className="relative z-10 w-full max-w-xl flex flex-col space-y-2 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-black text-slate-300">
            {/* Score */}
            <div className="flex items-center gap-1.5 text-amber-300">
              <Star className="w-4 h-4 fill-amber-300" />
              <span>{starsEarned} Sao Vàng</span>
            </div>

            {/* Streak */}
            <div className="flex items-center gap-1.5 text-rose-400">
              <Flame className="w-4 h-4 fill-rose-400" />
              <span>{streak} Chuỗi Chuẩn</span>
            </div>

            {/* Progress Label */}
            <span className="text-slate-400 font-bold">
              Tiến độ {progressPercent}%
            </span>
          </div>

          {/* Minimalist Progress Track */}
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemoryFlipGame;
