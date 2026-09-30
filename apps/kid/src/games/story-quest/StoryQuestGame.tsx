// ============================================================================
// GAME 17: STORY QUEST (SÁCH TRANH CỔ TÍCH TƯƠNG TÁC)
// Listening Comprehension + Context • Interactive Picture Book • Narrative Flow
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { KidsGameWrapper } from '../core/KidsGameWrapper';
import { KIDS_GAMES_REGISTRY } from '../../data/games/gamesRegistry';
import { KidsIllustration } from '../../assets/illustrations/KidsIllustration';
import { soundManager } from '../../services/sound/KidsSoundManager';
import { voiceService } from '../../services/voice/voiceService';

interface StoryPage {
  pageNumber: number;
  storyEn: string;
  storyVi: string;
  questionEn: string;
  questionVi: string;
  targetItem: { id: string; nameEn: string; nameVi: string; icon: string };
  distractors: { id: string; nameEn: string; nameVi: string; icon: string }[];
}

const STORY_PAGES: StoryPage[] = [
  {
    pageNumber: 1,
    storyEn: 'Little Bear walks into the green forest. He hears a sound: "Hop hop!"',
    storyVi: 'Chú Gấu con bước vào khu rừng xanh biếc. Chú nghe tiếng: "Nhảy tung tăng!"',
    questionEn: 'Where is the fluffy rabbit?',
    questionVi: 'Chú thỏ trắng đang ở đâu nhỉ?',
    targetItem: { id: 'rabbit', nameEn: 'Rabbit', nameVi: 'Thỏ trắng', icon: '🐰' },
    distractors: [
      { id: 'mushroom', nameEn: 'Mushroom', nameVi: 'Cây nấm', icon: '🍄' },
      { id: 'tree', nameEn: 'Tree', nameVi: 'Cây cối', icon: '🌳' },
    ],
  },
  {
    pageNumber: 2,
    storyEn: 'Rabbit says: "I found sweet apples on the tree! Let us pick them!"',
    storyVi: 'Bạn Thỏ reo lên: "Tớ tìm thấy những quả táo ngọt lịm! Chúng mình cùng hái nhé!"',
    questionEn: 'Touch the red apple!',
    questionVi: 'Chạm vào quả táo đỏ thơm ngon nào!',
    targetItem: { id: 'apple', nameEn: 'Apple', nameVi: 'Quả táo', icon: '🍎' },
    distractors: [
      { id: 'flower', nameEn: 'Flower', nameVi: 'Bông hoa', icon: '🌸' },
      { id: 'leaf', nameEn: 'Leaf', nameVi: 'Chiếc lá', icon: '🍃' },
    ],
  },
  {
    pageNumber: 3,
    storyEn: 'Bear and Rabbit sit under the rainbow and enjoy fresh sweet fruit together.',
    storyVi: 'Gấu và Thỏ ngồi dưới cầu vồng, cùng thưởng thức trái cây ngọt ngào và ca hát vui vẻ!',
    questionEn: 'Where is the colorful rainbow?',
    questionVi: 'Cầu vồng bảy sắc lung linh ở đâu bé ơi?',
    targetItem: { id: 'rainbow', nameEn: 'Rainbow', nameVi: 'Cầu vồng', icon: '🌈' },
    distractors: [
      { id: 'sun', nameEn: 'Sun', nameVi: 'Mặt trời', icon: '☀️' },
      { id: 'cloud', nameEn: 'Cloud', nameVi: 'Đám mây', icon: '☁️' },
    ],
  },
];

interface StoryQuestGameProps {
  onExit: () => void;
  onStarsAwarded?: (stars: number) => void;
  onNextGame?: () => void;
}

export const StoryQuestGame: React.FC<StoryQuestGameProps> = ({
  onExit,
  onStarsAwarded,
  onNextGame,
}) => {
  const gameDef = KIDS_GAMES_REGISTRY.find((g) => g.id === 'story_quest') || KIDS_GAMES_REGISTRY[13];

  const TOTAL_ROUNDS = 3;
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [starsEarned, setStarsEarned] = useState(0);
  const currentPage = STORY_PAGES[currentPageIndex];

  const [options, setOptions] = useState<{ id: string; nameEn: string; nameVi: string; icon: string }[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isReadyToContinue, setIsReadyToContinue] = useState(false);
  const [praiseVi, setPraiseVi] = useState('Bé nghe truyện giỏi quá!');

  // Initialize story page
  const initPage = useCallback((pageIdx: number) => {
    setIsAnswered(false);
    setIsReadyToContinue(false);
    const page = STORY_PAGES[pageIdx];

    const shuffled = [page.targetItem, ...page.distractors].sort(() => Math.random() - 0.5);
    setOptions(shuffled);
  }, []);

  useEffect(() => {
    initPage(0);
  }, [initPage]);

  const handleContinueRound = () => {
    soundManager.play('pop');
    if (currentPageIndex < STORY_PAGES.length - 1) {
      const nextIdx = currentPageIndex + 1;
      setCurrentPageIndex(nextIdx);
      initPage(nextIdx);
    } else {
      setIsGameComplete(true);
      soundManager.play('celebration');
    }
  };

  const handleChooseItem = (item: { id: string; nameEn: string; nameVi: string; icon: string }) => {
    if (isAnswered || isReadyToContinue) return;

    if (item.id === currentPage.targetItem.id) {
      // CORRECT STORY CHOICE!
      setIsAnswered(true);
      soundManager.play('star_burst');
      soundManager.play('correct');

      const earned = 3;
      setStarsEarned((prev) => prev + earned);
      if (onStarsAwarded) onStarsAwarded(earned);

      const praise = 'Giỏi quá! Bé trả lời đúng chi tiết câu chuyện rồi!';
      setPraiseVi(praise);

      voiceService.speakWord(item.nameEn, {
        onEnd: () => {
          voiceService.speakVietnamese(praise, {
            onEnd: () => {
              if (currentPageIndex < STORY_PAGES.length - 1) {
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
      // WRONG
      soundManager.play('pop');
      voiceService.speakVietnamese(`Chưa phải rồi, bé hãy tìm: ${currentPage.targetItem.nameVi} nhé!`);
    }
  };

  return (
    <KidsGameWrapper
      game={gameDef}
      currentRound={currentPageIndex + 1}
      totalRounds={TOTAL_ROUNDS}
      starsEarned={starsEarned}
      instructionEn={currentPage.questionEn}
      instructionVi={currentPage.questionVi}
      onExit={onExit}
      onNextGame={onNextGame}
      onPlayAgain={() => {
        setCurrentPageIndex(0);
        setStarsEarned(0);
        setIsGameComplete(false);
        setIsReadyToContinue(false);
        initPage(0);
      }}
      isGameComplete={isGameComplete}
      isReadyToContinue={isReadyToContinue}
      onContinueRound={handleContinueRound}
      praiseVi={praiseVi}
      onReplayAudio={() => voiceService.speakEnglish(currentPage.questionEn)}
    >
      <div className="p-4 sm:p-8 flex flex-col justify-between min-h-[440px] bg-gradient-to-b from-amber-50 via-rose-50 to-white select-none space-y-5">
        {/* Story Book Open Page Layout */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border-2 border-amber-300 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0">
            📖
          </div>
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-950 font-black text-[10px]">
              TRANG {currentPage.pageNumber}/3
            </span>
            <p className="text-sm sm:text-base font-black text-slate-900 mt-1 leading-snug">
              "{currentPage.storyEn}"
            </p>
            <p className="text-xs text-slate-500 font-semibold mt-0.5">
              {currentPage.storyVi}
            </p>
          </div>
        </div>

        {/* Story Interactive Question Prompt */}
        <div className="text-center">
          <span className="text-xs sm:text-sm font-black text-rose-700 bg-rose-100 border border-rose-300 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 animate-bounce">
            <span>✨</span>
            <span>{currentPage.questionEn} ({currentPage.questionVi})</span>
          </span>
        </div>

        {/* 3 Story Interactive Choice Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-6 w-full max-w-xl mx-auto">
          {options.map((opt) => {
            const isTarget = opt.id === currentPage.targetItem.id;
            const isSuccess = isAnswered && isTarget;

            return (
              <button
                key={opt.id}
                onClick={() => handleChooseItem(opt)}
                disabled={isAnswered}
                className={`p-4 rounded-3xl bg-white border-3 shadow-md flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 ${
                  isSuccess
                    ? 'border-emerald-500 bg-emerald-100 scale-110 animate-bounce'
                    : 'border-slate-200 hover:border-amber-400'
                }`}
              >
                <span className="text-5xl sm:text-6xl">{opt.icon}</span>
                <span className="text-sm font-black text-slate-900 mt-1">
                  {opt.nameEn}
                </span>
                <span className="text-[10px] text-slate-500 font-semibold">
                  ({opt.nameVi})
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </KidsGameWrapper>
  );
};
