import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Trophy, Timer, Zap, Volume2, 
  Sparkles, CheckCircle2, Award 
} from 'lucide-react';
import api from '../../lib/api';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';
import { CountryFlag } from '../../components/language/CountryFlag';
import { LetStuNLogo, VictoryStarModal } from '@letstun/shared';

interface MatchCard {
  id: string;
  type: 'WORD' | 'MEANING';
  content: string;
  matchId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const WordMatchGame: React.FC = () => {
  const navigate = useNavigate();
  const { speak } = useAudioPronunciation();

  const [cards, setCards] = useState<MatchCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const initGame = async () => {
    setLoading(true);
    setIsCompleted(false);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setTime(0);
    setSelectedCards([]);

    try {
      // Fetch 6 random vocabularies from database
      const res = await api.get('/vocabulary?limit=6&page=' + Math.floor(Math.random() * 20 + 1));
      const vocabs = res.data?.data?.items || res.data?.items || [];
      
      const gamePairs: MatchCard[] = [];
      const selectedVocabs = vocabs.slice(0, 6);

      selectedVocabs.forEach((v: any) => {
        const meaning = v.meanings?.[0]?.meaning || v.shortDefinition || v.definition;
        const shortMeaning = meaning.split(',')[0].split(';')[0].trim();

        // English Card
        gamePairs.push({
          id: `word_${v.id}`,
          type: 'WORD',
          content: v.word,
          matchId: v.id,
          isFlipped: false,
          isMatched: false,
        });

        // Vietnamese Card
        gamePairs.push({
          id: `meaning_${v.id}`,
          type: 'MEANING',
          content: shortMeaning,
          matchId: v.id,
          isFlipped: false,
          isMatched: false,
        });
      });

      // Shuffle cards
      const shuffled = [...gamePairs].sort(() => Math.random() - 0.5);
      setCards(shuffled);
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to load vocabularies for match game:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && !isCompleted) {
      timer = setInterval(() => {
        setTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isCompleted]);

  const handleCardClick = (card: MatchCard) => {
    if (!isPlaying || card.isMatched || card.isFlipped || selectedCards.length >= 2) return;

    // Flip card
    const updatedCards = cards.map((c) => (c.id === card.id ? { ...c, isFlipped: true } : c));
    setCards(updatedCards);

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);

    // If card is a word, pronounce it
    if (card.type === 'WORD') {
      speak(card.content);
    }

    if (newSelected.length === 2) {
      const [first, second] = newSelected;
      if (first.matchId === second.matchId && first.type !== second.type) {
        // MATCHED!
        setTimeout(() => {
          const matchedCards = cards.map((c) =>
            c.matchId === first.matchId ? { ...c, isFlipped: true, isMatched: true } : c,
          );
          setCards(matchedCards);
          setSelectedCards([]);

          const newCombo = combo + 1;
          setCombo(newCombo);
          if (newCombo > maxCombo) setMaxCombo(newCombo);
          setScore((prev) => prev + 100 * newCombo);

          // Check if all matched
          const allMatched = matchedCards.every((c) => c.isMatched);
          if (allMatched) {
            setIsCompleted(true);
            setIsPlaying(false);
          }
        }, 500);
      } else {
        // MISMATCH!
        setCombo(0);
        setTimeout(() => {
          setCards(
            cards.map((c) =>
              c.id === first.id || c.id === second.id ? { ...c, isFlipped: false } : c,
            ),
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/games')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs font-black transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sảnh Đấu</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-black shadow-2xs">
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-black shadow-2xs">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>{score} pts</span>
          </div>
          {combo > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500 text-white text-xs font-black animate-bounce shadow-md shadow-rose-500/30">
              <Zap className="w-3 h-3 fill-white" />
              <span>{combo}x Combo!</span>
            </div>
          )}
        </div>

        <button
          onClick={initGame}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Chơi lại ván mới"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Game Title Info */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mini Game Rèn Trí Nhớ Từ Vựng</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Word Match Challenge
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Lật mở các thẻ để tìm đúng cặp <span className="font-bold text-indigo-500">Từ Vựng Tiếng Anh</span> và <span className="font-bold text-purple-500">Nghĩa Tiếng Việt</span> tương ứng
        </p>
      </div>

      {/* Cards Grid - 3/4 Aspect Ratio & Crisp Unrounded Card Styling */}
      {loading ? (
        <div className="h-72 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 max-w-4xl mx-auto">
          {cards.map((card) => {
            const isWord = card.type === 'WORD';
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched || card.isFlipped}
                className={`aspect-[3/4] w-full rounded-none p-3.5 sm:p-4.5 font-bold transition-all duration-200 flex flex-col items-center justify-between text-center relative border select-none cursor-pointer ${
                  card.isMatched
                    ? 'card-gold-glimmer text-emerald-300 font-black shadow-lg scale-95 pointer-events-none'
                    : card.isFlipped
                    ? isWord
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/25 scale-[1.02]'
                      : 'bg-purple-700 text-white border-purple-400 shadow-lg shadow-purple-600/25 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-500/60 dark:hover:border-indigo-400/60 hover:-translate-y-1 shadow-sm'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <>
                    <div className="w-full flex items-center justify-between text-[11px] opacity-80 uppercase tracking-wider font-semibold border-b border-white/15 dark:border-white/10 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <CountryFlag languageId={isWord ? 'en' : 'vi'} size="xs" />
                        <span>{isWord ? 'Tiếng Anh' : 'Tiếng Việt'}</span>
                      </span>
                      {card.isMatched && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="my-auto px-1 py-2">
                      <span className="text-base sm:text-lg md:text-xl font-black leading-snug line-clamp-3 block">
                        {card.content}
                      </span>
                    </div>
                    <div className="text-[10px] opacity-60 tracking-wider uppercase font-semibold">
                      LetStuN
                    </div>
                  </>
                ) : (
                  <>
                    {/* Geometric inner border frame for authentic poker/flashcard aesthetic */}
                    <div className="absolute inset-2 border border-slate-200/90 dark:border-slate-800 pointer-events-none" />
                    <div className="w-full text-right text-[10px] text-slate-400 font-bold opacity-60">
                      VF
                    </div>
                    <div className="my-auto flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800/90 flex items-center justify-center p-2 border border-slate-200/80 dark:border-slate-700">
                        <LetStuNLogo size="xs" showContainer={false} className="w-6 h-6 object-contain" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-slate-400 dark:text-slate-500">
                        Lật Thẻ
                      </span>
                    </div>
                    <div className="w-full text-left text-[10px] text-slate-400 font-bold opacity-60">
                      VF
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 1-2-3 Stars Celebration Victory Modal */}
      <VictoryStarModal
        isOpen={isCompleted}
        title="CHIẾN THẮNG WORD MATCH"
        stars={time <= 25 ? 3 : time <= 45 ? 2 : 1}
        xpEarned={time <= 25 ? 60 : time <= 45 ? 40 : 25}
        stats={[
          { label: 'Thời Gian', value: formatTime(time) },
          { label: 'Điểm Số', value: `${score} pts` },
          { label: 'Combo Max', value: `${maxCombo}x` },
        ]}
        onPlayAgain={initGame}
        onContinue={() => navigate('/games')}
        playAgainText="Chơi Ván Mới Ngay"
        continueText="Về Sảnh Đấu"
      />
    </div>
  );
};

export default WordMatchGame;
