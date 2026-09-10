import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Trophy, Timer, Zap, Volume2, 
  Sparkles, CheckCircle2, Award 
} from 'lucide-react';
import api from '../../lib/api';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';

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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sảnh Đấu</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-black">
            <Timer className="w-3.5 h-3.5" />
            <span>{formatTime(time)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black">
            <Trophy className="w-3.5 h-3.5" />
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
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
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

      {/* Cards Grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => {
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card)}
                disabled={card.isMatched || card.isFlipped}
                className={`h-28 sm:h-32 p-3 rounded-2xl font-bold transition-all duration-300 flex flex-col items-center justify-center text-center relative border shadow-sm ${
                  card.isMatched
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 scale-95 opacity-80 pointer-events-none'
                    : card.isFlipped
                    ? card.type === 'WORD'
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-102'
                      : 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25 scale-102'
                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:scale-102'
                }`}
              >
                {card.isFlipped || card.isMatched ? (
                  <>
                    <span className="text-xs opacity-75 uppercase tracking-wider mb-1 font-semibold">
                      {card.type === 'WORD' ? '🇬🇧 Tiếng Anh' : '🇻🇳 Tiếng Việt'}
                    </span>
                    <span className="text-sm sm:text-base line-clamp-2 px-1">
                      {card.content}
                    </span>
                    {card.isMatched && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-1.5 opacity-60">
                    <span className="text-2xl">🃏</span>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">
                      Lật Thẻ
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Completion Modal */}
      {isCompleted && (
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 text-white text-center space-y-4 shadow-2xl border border-indigo-500/30 animate-scale-up">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/30">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">🎉 XUẤT SẮC! HOÀN THÀNH WORD MATCH</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Bạn đã ghép đúng toàn bộ 6 cặp từ vựng trong thời gian{' '}
            <span className="font-bold text-amber-400">{formatTime(time)}</span> với số điểm{' '}
            <span className="font-bold text-amber-400">{score} điểm</span> (Combo tối đa: {maxCombo}x)!
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={initGame}
              className="btn-glass-primary !py-2.5 !px-6 !rounded-xl text-xs font-black"
            >
              Chơi Ván Mới Ngay
            </button>
            <button
              onClick={() => navigate('/games')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
            >
              Về Sảnh Đấu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WordMatchGame;
