import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, RotateCcw, Trophy, Timer, Zap, Volume2, 
  Sparkles, CheckCircle2, HelpCircle, Flame, Award, ChevronRight, Lightbulb 
} from 'lucide-react';
import api from '../../lib/api';
import { useAudioPronunciation } from '../../hooks/useAudioPronunciation';

export const WordScrambleGame: React.FC = () => {
  const navigate = useNavigate();
  const { speak } = useAudioPronunciation();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambledLetters, setScrambledLetters] = useState<{ char: string; originalIdx: number }[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{ char: string; originalIdx: number }[]>([]);
  const [userTyped, setUserTyped] = useState('');
  
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [showHint, setShowHint] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    setIsGameOver(false);
    setScore(0);
    setStreak(0);
    setCurrentIndex(0);

    try {
      const res = await api.get('/vocabulary?limit=10&page=' + Math.floor(Math.random() * 15 + 1));
      const vocabs = res.data?.data?.items || res.data?.items || [];
      // Filter words with 4 to 10 letters for fun gameplay
      const validVocabs = vocabs.filter((v: any) => v.word.length >= 4 && v.word.length <= 10 && !v.word.includes(' '));
      setQuestions(validVocabs.slice(0, 8));
      if (validVocabs.length > 0) {
        setupRound(validVocabs[0]);
      }
    } catch (err) {
      console.error('Failed to load scramble questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupRound = (item: any) => {
    setStatus('IDLE');
    setShowHint(false);
    setTimeLeft(25);
    setSelectedLetters([]);
    setUserTyped('');

    const word = item.word.toUpperCase();
    const chars = word.split('').map((char: string, originalIdx: number) => ({ char, originalIdx }));
    
    // Shuffle ensuring it's not identical to the target word
    let shuffled = [...chars].sort(() => Math.random() - 0.5);
    if (shuffled.map(s => s.char).join('') === word && word.length > 1) {
      shuffled = shuffled.reverse();
    }

    setScrambledLetters(shuffled);
    setIsPlaying(true);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Timer countdown per word
  useEffect(() => {
    let timer: any = null;
    if (isPlaying && !isGameOver && status === 'IDLE') {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, isGameOver, status]);

  const handleTimeOut = () => {
    setStatus('WRONG');
    setStreak(0);
    setTimeout(() => {
      nextWord();
    }, 1800);
  };

  const currentWordItem = questions[currentIndex];

  const handleLetterClick = (item: { char: string; originalIdx: number }) => {
    if (status !== 'IDLE') return;

    // Move to selected
    setScrambledLetters((prev) => prev.filter((l) => l.originalIdx !== item.originalIdx));
    const nextSelected = [...selectedLetters, item];
    setSelectedLetters(nextSelected);

    const builtWord = nextSelected.map((l) => l.char).join('');
    checkWord(builtWord);
  };

  const handleRemoveSelected = (item: { char: string; originalIdx: number }) => {
    if (status !== 'IDLE') return;

    setSelectedLetters((prev) => prev.filter((l) => l.originalIdx !== item.originalIdx));
    setScrambledLetters((prev) => [...prev, item]);
  };

  const checkWord = (builtWord: string) => {
    if (!currentWordItem) return;
    const target = currentWordItem.word.toUpperCase();

    if (builtWord.length === target.length) {
      if (builtWord === target) {
        // CORRECT!
        setStatus('CORRECT');
        speak(currentWordItem.word);
        const addedScore = 150 + timeLeft * 10 + streak * 30;
        setScore((prev) => prev + addedScore);
        setStreak((prev) => prev + 1);

        setTimeout(() => {
          nextWord();
        }, 1200);
      } else {
        // WRONG!
        setStatus('WRONG');
        setStreak(0);
        setTimeout(() => {
          // Reset current round letters
          setupRound(currentWordItem);
        }, 900);
      }
    }
  };

  const nextWord = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setupRound(questions[nextIdx]);
    } else {
      setIsGameOver(true);
      setIsPlaying(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/games')}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về Sảnh Đấu</span>
        </button>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border transition ${
            timeLeft <= 5 
              ? 'bg-rose-500/15 text-rose-500 border-rose-500/30 animate-pulse' 
              : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
          }`}>
            <Timer className="w-3.5 h-3.5" />
            <span>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-black">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score} pts</span>
          </div>

          {streak > 1 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black shadow-sm">
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{streak} Streak!</span>
            </div>
          )}
        </div>

        <button
          onClick={fetchQuestions}
          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title="Chơi lại ván mới"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Progress & Round Info */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Phản Xạ Ghép Ký Tự TOEIC</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
          Word Scramble Rush
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Từ {currentIndex + 1} / {questions.length} • Sắp xếp các ký tự bị xáo trộn để tạo thành từ vựng chuẩn
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : isGameOver ? (
        <div className="p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-950 text-white text-center space-y-4 shadow-2xl border border-indigo-500/30">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-400/30">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black">🎉 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH!</h2>
          <p className="text-sm text-slate-300">
            Tổng điểm của bạn: <span className="text-amber-400 font-extrabold text-xl">{score} điểm</span>.
          </p>
          <div className="flex items-center justify-center gap-3 pt-4">
            <button
              onClick={fetchQuestions}
              className="btn-glass-primary !py-3 !px-6 !rounded-xl text-xs font-black"
            >
              Chơi Vòng Mới
            </button>
            <button
              onClick={() => navigate('/games')}
              className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
            >
              Về Sảnh Đấu
            </button>
          </div>
        </div>
      ) : currentWordItem ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Meaning & CEFR Hint */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                CEFR {currentWordItem.cefrLevel || 'B2'}
              </span>
              <span className="text-xs text-slate-400 font-bold">
                ({currentWordItem.partOfSpeech || 'n.'})
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              <span>{currentWordItem.meanings?.[0]?.meaning || currentWordItem.shortDefinition || currentWordItem.definition}</span>
            </p>
            {showHint && currentWordItem.pronunciation && (
              <p className="text-xs text-indigo-500 font-semibold animate-fade-in">
                Phiên âm: /{currentWordItem.pronunciation}/
              </p>
            )}
          </div>

          {/* User Built Word Slots */}
          <div className="flex items-center justify-center gap-2 min-h-[56px] flex-wrap">
            {selectedLetters.map((l, i) => (
              <button
                key={`sel_${l.originalIdx}`}
                onClick={() => handleRemoveSelected(l)}
                className={`w-11 h-12 sm:w-13 sm:h-14 rounded-2xl font-black text-lg sm:text-xl shadow-md transition-all duration-200 flex items-center justify-center border ${
                  status === 'CORRECT'
                    ? 'bg-emerald-500 border-emerald-400 text-white scale-105'
                    : status === 'WRONG'
                    ? 'bg-rose-500 border-rose-400 text-white animate-shake'
                    : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                }`}
                title="Bấm để gỡ ký tự này"
              >
                {l.char}
              </button>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: currentWordItem.word.length - selectedLetters.length }).map((_, i) => (
              <div
                key={`empty_${i}`}
                className="w-11 h-12 sm:w-13 sm:h-14 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-300 dark:text-slate-700 font-bold"
              >
                _
              </div>
            ))}
          </div>

          {/* Scrambled Available Letters */}
          <div className="space-y-3 pt-2">
            <div className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chọn ký tự để ghép từ:
            </div>
            <div className="flex items-center justify-center gap-2.5 flex-wrap min-h-[50px]">
              {scrambledLetters.map((l) => (
                <button
                  key={`scram_${l.originalIdx}`}
                  onClick={() => handleLetterClick(l)}
                  className="w-11 h-12 sm:w-12 sm:h-13 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-600 text-slate-800 dark:text-slate-100 font-black text-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-all duration-150 active:scale-95"
                >
                  {l.char}
                </button>
              ))}
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowHint(true)}
              disabled={showHint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold transition disabled:opacity-50"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Gợi ý phiên âm</span>
            </button>

            <button
              onClick={() => speak(currentWordItem.word)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold transition"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Nghe phát âm</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WordScrambleGame;
