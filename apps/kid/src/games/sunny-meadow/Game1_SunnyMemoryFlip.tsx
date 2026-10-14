import React, { useState, useEffect } from 'react';
import { SunnyAudioEngine } from '../../services/audio/SunnyAudioEngine';
import SunnyBilingualGuide from '../../components/SunnyBilingualGuide';
import VictoryCelebrationModal from '../../components/VictoryCelebrationModal';
import { meadowStore } from '../../core/meadowStateStore';

interface Game1Props {
  onExit: () => void;
  onComplete?: () => void;
}

interface MemoryCard {
  uniqueId: string;
  pairKey: string;
  wordEn: string;
  wordVi: string;
  svgSymbol: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const ALL_CARDS_DATA = [
  { key: 'apple', wordEn: 'Apple', wordVi: 'Quả táo đỏ', symbol: '#svg-apple' },
  { key: 'banana', wordEn: 'Banana', wordVi: 'Quả chuối vàng', symbol: '#svg-banana' },
  { key: 'strawberry', wordEn: 'Strawberry', wordVi: 'Quả dâu tây', symbol: '#svg-strawberry' },
  { key: 'orange', wordEn: 'Orange', wordVi: 'Quả cam', symbol: '#svg-orange' },
  { key: 'cat', wordEn: 'Cat', wordVi: 'Con mèo cam', symbol: '#svg-cat' },
  { key: 'dog', wordEn: 'Dog', wordVi: 'Con chó cún', symbol: '#svg-dog' },
];

export const Game1_SunnyMemoryFlip: React.FC<Game1Props> = ({ onExit, onComplete }) => {
  const [level, setLevel] = useState<number>(1); // Level 1 (4 pairs = 8 cards), Level 2 (6 pairs = 12 cards)
  const totalLevels = 2;

  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MemoryCard[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorsCount, setErrorsCount] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [showVictory, setShowVictory] = useState<boolean>(false);

  const currentPairCount = level === 1 ? 4 : 6;

  useEffect(() => {
    initLevel(level);
  }, [level]);

  const initLevel = (lvl: number) => {
    const pairCount = lvl === 1 ? 4 : 6;
    const selected = ALL_CARDS_DATA.slice(0, pairCount);
    const deck: MemoryCard[] = [];

    selected.forEach((item, idx) => {
      // Card A: Both Image SVG + Word Label (Fix Bug #1)
      deck.push({
        uniqueId: `${item.key}_a_${idx}`,
        pairKey: item.key,
        wordEn: item.wordEn,
        wordVi: item.wordVi,
        svgSymbol: item.symbol,
        isFlipped: false,
        isMatched: false,
      });

      // Card B: Both Image SVG + Word Label (Fix Bug #1)
      deck.push({
        uniqueId: `${item.key}_b_${idx}`,
        pairKey: item.key,
        wordEn: item.wordEn,
        wordVi: item.wordVi,
        svgSymbol: item.symbol,
        isFlipped: false,
        isMatched: false,
      });
    });

    const shuffled = deck.sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setSelectedCards([]);
    setIsEvaluating(false);
    setErrorsCount(0);
    setMatchedPairs(0);
    setShowVictory(false);
  };

  const handleCardClick = (card: MemoryCard) => {
    if (isEvaluating || card.isFlipped || card.isMatched || selectedCards.length >= 2) return;

    SunnyAudioEngine.playFlip();
    SunnyAudioEngine.speakEnglish(card.wordEn);

    const updatedCards = cards.map((c) =>
      c.uniqueId === card.uniqueId ? { ...c, isFlipped: true } : c
    );
    setCards(updatedCards);

    const nextSelected = [...selectedCards, card];
    setSelectedCards(nextSelected);

    if (nextSelected.length === 2) {
      setIsEvaluating(true);
      const [first, second] = nextSelected;

      if (first.pairKey === second.pairKey) {
        // MATCHED!
        setTimeout(() => {
          SunnyAudioEngine.playCorrect();
          const matchedList = updatedCards.map((c) =>
            c.pairKey === first.pairKey ? { ...c, isMatched: true } : c
          );
          setCards(matchedList);
          setSelectedCards([]);
          setIsEvaluating(false);

          const nextCount = matchedPairs + 1;
          setMatchedPairs(nextCount);

          if (nextCount >= currentPairCount) {
            // Level victory!
            setTimeout(() => {
              setShowVictory(true);
              if (onComplete) onComplete();
            }, 600);
          }
        }, 550);
      } else {
        // NOT MATCHED
        setTimeout(() => {
          SunnyAudioEngine.playWrong();
          setErrorsCount((prev) => prev + 1);

          setTimeout(() => {
            const resetList = updatedCards.map((c) =>
              c.uniqueId === first.uniqueId || c.uniqueId === second.uniqueId
                ? { ...c, isFlipped: false }
                : c
            );
            setCards(resetList);
            setSelectedCards([]);
            setIsEvaluating(false);
          }, 650);
        }, 600);
      }
    }
  };

  const handleReplay = () => {
    initLevel(level);
  };

  const handleNextLevel = () => {
    if (level < totalLevels) {
      setLevel((prev) => prev + 1);
    }
  };

  const viPrompt = `Bé hãy lật tìm 2 thẻ bài có hình và từ vựng giống nhau nhé!`;
  const enPrompt = `Find the matching pairs of cards!`;

  return (
    <div className="game-viewport select-none animate-fadeIn">
      {/* 1. Header Navigation Bar */}
      <div className="w-full max-w-[920px] flex items-center justify-between pb-2 border-b border-[#BAE6FD]">
        <button
          type="button"
          onClick={() => {
            SunnyAudioEngine.playClick();
            onExit();
          }}
          className="toy-btn bg-white hover:bg-slate-50 text-[#0F172A] border-2 border-[#CBD5E1] px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-xs"
        >
          <span>← Thoát Game</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black font-display border border-emerald-300">
            Cấp Độ {level} / {totalLevels}
          </span>
          <span className="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black font-display border border-amber-300">
            Đã ghép: {matchedPairs} / {currentPairCount} cặp
          </span>
          <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black font-display border border-rose-300">
            Lỗi: {errorsCount}
          </span>
        </div>
      </div>

      {/* 2. Bilingual Guide Bar with Sunny the Fox Mascot */}
      <SunnyBilingualGuide
        viPrompt={viPrompt}
        enPrompt={enPrompt}
        badgeTitle="Lật Thẻ Trí Nhớ Rừng Xanh"
        extraRightSlot={
          <div className="flex items-center gap-2 bg-amber-50 px-3 py-1 rounded-xl border border-amber-300">
            <span className="text-xs font-extrabold text-amber-900">Ghép:</span>
            <span className="text-sm font-black text-amber-950 font-display">
              {matchedPairs}/{currentPairCount}
            </span>
          </div>
        }
      />

      {/* 3. Central Stage Card (Fix Bug #5: Centered Stage Architecture) */}
      <div className="game-board-stage">
        {/* Memory Grid: 4 columns desktop, 3 columns mobile */}
        <div className="memory-grid">
          {cards.map((card) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <div
                key={card.uniqueId}
                onClick={() => handleCardClick(card)}
                className="card-perspective cursor-pointer"
                style={{ width: '140px', height: '176px' }}
              >
                <div className={`card-flip-inner ${isRevealed ? 'is-flipped' : ''}`}>
                  {/* Card Back Face: Green Meadow Leaves Texture (#svg-card-back) */}
                  <div className="card-face card-face-back flex items-center justify-center bg-white rounded-[24px] shadow-sm">
                    <svg className="w-full h-full">
                      <use href="#svg-card-back"></use>
                    </svg>
                  </div>

                  {/* Card Front Face: Strict [Image SVG + Word Label] Combo (Fix Bug #1) */}
                  <div
                    className={`card-face card-face-front word-card-item ${
                      card.isMatched
                        ? 'border-[#22C55E] ring-4 ring-emerald-300 bg-[#F0FDF4]'
                        : 'border-[#BAE6FD]'
                    }`}
                  >
                    {/* SVG Illustration */}
                    <div className="card-illust-svg flex items-center justify-center mt-1">
                      <svg className="w-full h-full drop-shadow-xs">
                        <use href={card.svgSymbol}></use>
                      </svg>
                    </div>

                    {/* Word English Label */}
                    <div className="card-word-en">
                      {card.wordEn}
                    </div>

                    {/* Vietnamese Subtitle */}
                    <div className="card-word-vi pb-1">
                      {card.wordVi}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Victory Celebration Modal */}
      <VictoryCelebrationModal
        isOpen={showVictory}
        errorsCount={errorsCount}
        gameTitle="Lật Thẻ Trí Nhớ Rừng Xanh"
        currentLevel={level}
        totalLevels={totalLevels}
        onReplay={handleReplay}
        onNextLevel={handleNextLevel}
        onExit={onExit}
      />
    </div>
  );
};

export default Game1_SunnyMemoryFlip;
