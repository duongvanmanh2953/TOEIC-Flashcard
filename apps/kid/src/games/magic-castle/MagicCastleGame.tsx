// ============================================================================
// GAME 19: MAGIC CASTLE (LÂU ĐÀI PHÉP THUẬT)
// Sentence + Context • Fantasy Pastel Castle • Secret Door Unlocks
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, Key, DoorOpen, Lock } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface CastleRoom {
  id: string;
  roomNameVi: string;
  roomNameEn: string;
  secretSentenceEn: string;
  secretSentenceVi: string;
  interiorIcon: string;
  options: string[];
}

const CASTLE_ROOMS: CastleRoom[] = [
  {
    id: 'room_animals',
    roomNameVi: 'Phòng Thú Thần Tiên',
    roomNameEn: 'Animal Sanctuary Room',
    secretSentenceEn: 'Open the magic door',
    secretSentenceVi: 'Mở cánh cửa thần tiên',
    interiorIcon: '🦁 🐼 🦄',
    options: ['Open the magic door', 'Close the window', 'Fly to the sky'],
  },
  {
    id: 'room_food',
    roomNameVi: 'Phòng Ẩm Thực Hoàng Gia',
    roomNameEn: 'Royal Banquet Room',
    secretSentenceEn: 'I like sweet apples',
    secretSentenceVi: 'Tôi thích những quả táo ngọt',
    interiorIcon: '🍰 🍎 🧃',
    options: ['I like sweet apples', 'I run fast', 'See the moon'],
  },
  {
    id: 'room_treasure',
    roomNameVi: 'Tháp Kho Báu Vàng',
    roomNameEn: 'Golden Treasure Tower',
    secretSentenceEn: 'The stars are shining',
    secretSentenceVi: 'Những vì sao đang tỏa sáng',
    interiorIcon: '👑 💎 🏆',
    options: ['The stars are shining', 'The dog sleeps', 'Walk in forest'],
  },
];

interface MagicCastleGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const MagicCastleGame: React.FC<MagicCastleGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'magic_castle') || KIDS_GAMES_REGISTRY[18];

  const TOTAL_ROOMS = 3;
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const currentRoom = CASTLE_ROOMS[currentRoomIndex];

  const [isDoorOpen, setIsDoorOpen] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé mở cửa thần kỳ rất giỏi!');

  // Initialize round
  const initRoom = useCallback((roomIdx: number) => {
    setIsDoorOpen(false);
    setIsReadyToContinue(false);
  }, []);

  useEffect(() => {
    initRoom(0);
  }, [initRoom]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentRoomIndex < CASTLE_ROOMS.length - 1) {
      const nextIdx = currentRoomIndex + 1;
      setCurrentRoomIndex(nextIdx);
      initRoom(nextIdx);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  const handleSelectSpell = (spell: string) => {
    if (isDoorOpen || isReadyToContinue) return;

    if (spell === currentRoom.secretSentenceEn) {
      // CORRECT SPELL!
      setIsDoorOpen(true);
      soundManager.play('unlock');
      soundManager.play('star_burst');

      const earned = 3;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = `Giỏi quá! Cánh cửa phòng ${currentRoom.roomNameVi} đã mở ra!`;
      setPraiseVi(praise);

      voiceService.speakSentence(spell, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentRoomIndex < CASTLE_ROOMS.length - 1) {
                setIsReadyToContinue(true);
              } else {
                setIsGameComplete(true);
                soundManager.play('celebration');
              }
            },
          });
        },
      });
    } else {
      // WRONG SPELL
      soundManager.play('wrong');
      voiceService.speakVietnamese('Câu thần chú chưa khớp rồi, bé chọn lại nhé!');
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentRoomIndex + 1}
      totalRounds={TOTAL_ROOMS}
      starsEarned={starsEarned}
      instructionEn={`Spell: "${currentRoom.secretSentenceEn}"`}
      instructionVi={`Mật mã: "${currentRoom.secretSentenceVi}"`}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentRoomIndex(0);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initRoom(0);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakSentence(currentRoom.secretSentenceEn)}
    >
      <div className="relative w-full aspect-[800/500] max-h-[65vh] mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-purple-200 via-pink-100 to-indigo-100 select-none flex flex-col justify-between p-6">
        {/* Castle Spire Header */}
        <div className="text-center z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 border-2 border-purple-400 shadow-md">
            <span className="text-2xl animate-bounce">🏰</span>
            <span className="text-sm sm:text-base font-black text-slate-900">
              PHÒNG {currentRoomIndex + 1}/3: <span className="text-purple-700 underline">{currentRoom.roomNameVi}</span>
            </span>
          </div>
        </div>

        {/* Fantasy Magic Door in Center */}
        <div className="relative flex flex-col items-center justify-center my-auto z-10">
          <div
            className={`w-56 h-64 sm:w-64 sm:h-72 rounded-t-full bg-gradient-to-b from-purple-900 to-slate-900 border-4 border-amber-400 shadow-2xl flex flex-col items-center justify-center p-4 transition-all duration-700 ${
              isDoorOpen ? 'bg-yellow-200 border-yellow-300 scale-105' : ''
            }`}
          >
            {isDoorOpen ? (
              // Open Door Interior with Magical Items
              <div className="flex flex-col items-center justify-center text-center animate-scaleUp">
                <span className="text-5xl sm:text-6xl mb-2">{currentRoom.interiorIcon}</span>
                <span className="text-sm font-black text-purple-950 bg-white/90 px-3 py-1 rounded-full shadow-md">
                  CỬA ĐÃ MỞ BỪNG SÁNG!
                </span>
              </div>
            ) : (
              // Closed Magic Door with Ornate Padlock
              <div className="flex flex-col items-center justify-center space-y-3">
                <span className="text-4xl text-amber-300">🚪</span>
                <div className="p-3 rounded-full bg-purple-950 border-2 border-amber-400">
                  <Lock className="w-8 h-8 text-amber-400 animate-pulse" />
                </div>
                <span className="text-xs font-bold text-purple-200">
                  CẦN CÂU THẦN CHÚ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 3 Magic Sentence Spells at Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-2xl mx-auto z-10">
          {currentRoom.options.map((spell) => (
            <button
              key={spell}
              onClick={() => handleSelectSpell(spell)}
              disabled={isDoorOpen}
              className="w-full sm:w-auto flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-purple-100 border-2 border-purple-300 hover:border-purple-500 font-black text-xs sm:text-sm text-purple-950 shadow-md cursor-pointer transition-all hover:scale-105 active:scale-95 text-center"
            >
              ✨ "{spell}"
            </button>
          ))}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
