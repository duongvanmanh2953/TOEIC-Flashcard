import React, { useEffect, useRef, useState } from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import { LeaderboardPlayer, ArenaPodium } from './ArenaPodium';
import {
  ArenaIconTrophy,
  ArenaIconFlame,
  ArenaIconSparkles,
  ArenaIconCheck,
  ArenaIconVolume2,
  ArenaIconSwords,
} from './ArenaIcons';
import { playVictoryFanfare } from '../../utils/feedbackSound';

export interface VocabularyReviewItem {
  id: string;
  word: string;
  meaning: string;
  phonetic?: string;
  exampleSentence?: string;
  isCorrect?: boolean;
}

export interface MatchSummaryData {
  roomCode: string;
  gameModeTitle: string;
  totalPlayers: number;
  totalQuestions: number;
  topPlayers: LeaderboardPlayer[];
  personalStats?: {
    finalRank: number;
    totalScore: number;
    correctCount: number;
    accuracyPercent: number;
    maxStreak: number;
    xpEarned: number;
  };
  reviewVocabs: VocabularyReviewItem[];
}

export interface WinnerCelebrationProps {
  data: MatchSummaryData;
  onRematch?: () => void;
  onReturnToLobby?: () => void;
  onSaveToNotebook?: (words: VocabularyReviewItem[]) => void;
  className?: string;
}

export const WinnerCelebration: React.FC<WinnerCelebrationProps> = ({
  data,
  onRematch,
  onReturnToLobby,
  onSaveToNotebook,
  className = '',
}) => {
  const [savedToNotebook, setSavedToNotebook] = useState(false);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const missedWords = data.reviewVocabs.filter((v) => v.isCorrect === false);

  // Play fanfare and spawn golden victory confetti canvas on mount
  useEffect(() => {
    try {
      playVictoryFanfare();
    } catch (_) {}

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      rotSpeed: number;
    }> = [];

    const colors = ['#F59E0B', '#FBBF24', '#EF4444', '#EC4899', '#6366F1', '#10B981', '#38BDF8'];
    const w = (canvas.width = canvas.offsetWidth || 800);
    const h = (canvas.height = canvas.offsetHeight || 500);

    for (let i = 0; i < 90; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * -h * 0.5,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 8,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < h + 20) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - p.y / h);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      }

      if (aliveCount > 0) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSaveNotebook = () => {
    if (onSaveToNotebook) {
      onSaveToNotebook(missedWords.length > 0 ? missedWords : data.reviewVocabs);
    }
    setSavedToNotebook(true);
  };

  const handlePronounce = (word: string, id: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      setPlayingWordId(id);
      const u = new SpeechSynthesisUtterance(word);
      u.rate = 0.95;
      u.onend = () => setPlayingWordId(null);
      u.onerror = () => setPlayingWordId(null);
      window.speechSynthesis.speak(u);
    } catch (_) {
      setPlayingWordId(null);
    }
  };

  const getRankCommentary = (rank?: number) => {
    if (!rank) return '🎖️ HOÀN THÀNH XUẤT SẮC TRẬN ĐẤU!';
    if (rank === 1) return '👑 VÔ ĐỊCH BẢNG VÀNG — Thống trị tuyệt đối đấu trường!';
    if (rank <= 3) return '🥈 ĐỨNG TRÊN ĐỈNH CAO — Á quân xuất sắc của trận đấu!';
    if (rank <= 10) return '⚡ CAO THỦ TOP 10 — Phản xạ thần tốc đáng gờm!';
    return '🎖️ CHIẾN BINH BỀN BỈ — Tiếp tục rèn luyện để chạm đỉnh vinh quang!';
  };

  return (
    <div
      className={`w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 p-5 sm:p-10 rounded-3xl bg-slate-950/95 border-2 border-indigo-500/40 shadow-[0_0_60px_rgba(99,102,241,0.25)] relative overflow-hidden select-none animate-scale-up backdrop-blur-2xl ${className}`}
    >
      {/* Particle Canvas for Confetti */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-0"
      />

      {/* Luminous Ambient Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-80 h-48 bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none" />

      {/* ======================================================== */}
      {/* 1. TOURNAMENT CHAMPIONSHIP HEADER                        */}
      {/* ======================================================== */}
      <div className="text-center space-y-2 relative z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/40 text-xs font-black uppercase tracking-wider shadow-inner animate-pulse">
          <ArenaIconTrophy className="w-4 h-4 text-amber-400" />
          <span>VINH DANH QUÁN QUÂN • HOÀN TẤT TRẬN ĐẤU</span>
        </div>

        <h1 className="text-2xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 tracking-tight drop-shadow">
          BẢNG VÀNG VOCABFLOW ARENA
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-400 font-medium">
          <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            #{data.roomCode}
          </span>
          <span>•</span>
          <span className="text-slate-200 font-bold">{data.gameModeTitle}</span>
          <span>•</span>
          <span className="text-indigo-300 font-semibold">{data.totalPlayers} đấu thủ so tài</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ESPORTS PODIUM TOP 3 (GOLD / SILVER / BRONZE)         */}
      {/* ======================================================== */}
      <div className="relative z-10 py-1 sm:py-3">
        <ArenaPodium topPlayers={data.topPlayers} />
      </div>

      {/* ======================================================== */}
      {/* 3. PERSONAL PERFORMANCE SUMMARY HERO CARD                */}
      {/* ======================================================== */}
      {data.personalStats && (
        <div className="relative z-10 p-5 sm:p-7 rounded-3xl bg-slate-900/90 border border-indigo-500/30 shadow-2xl space-y-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ArenaIconSparkles className="w-4 h-4 text-amber-400" />
                <span>KẾT QUẢ THI ĐẤU CỦA BẠN</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-white pt-1">
                {getRankCommentary(data.personalStats.finalRank)}
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-lg shadow-indigo-600/30 font-mono tracking-wider">
                HẠNG #{data.personalStats.finalRank}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Total Score */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Tổng Điểm Trận
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tabular-nums">
                {data.personalStats.totalScore.toLocaleString()}
              </span>
            </div>

            {/* Accuracy */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Độ Chính Xác
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                {Math.round(data.personalStats.accuracyPercent)}%
              </span>
            </div>

            {/* Streak */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Chuỗi Streak Max
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 tabular-nums flex items-center justify-center gap-1">
                <ArenaIconFlame className="w-5 h-5 fill-rose-500" />
                <span>{data.personalStats.maxStreak}x</span>
              </span>
            </div>

            {/* XP Earned */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-white/10 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                XP Tích Lũy
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-indigo-300 tabular-nums">
                +{data.personalStats.xpEarned} XP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. POST-GAME VOCABULARY MEMORIZATION REVIEW              */}
      {/* ======================================================== */}
      {data.reviewVocabs && data.reviewVocabs.length > 0 && (
        <div className="relative z-10 p-5 sm:p-7 rounded-3xl bg-slate-900/85 border border-white/10 shadow-xl space-y-4 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <span>ÔN TẬP TỪ VỰNG TRẬN ĐẤU (SPACED REPETITION)</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  {data.reviewVocabs.length} từ
                </span>
              </h3>
              <p className="text-xs text-slate-400 pt-0.5">
                Nhấn vào biểu tượng loa để nghe lại phát âm bản xứ hoặc lưu toàn bộ vào Sổ Từ Vựng FSRS
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveNotebook}
              disabled={savedToNotebook}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                savedToNotebook
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white shadow-indigo-600/30'
              }`}
            >
              <ArenaIconCheck className="w-4 h-4" />
              <span>{savedToNotebook ? 'Đã Lưu Vào Sổ Từ FSRS!' : 'Lưu Vào Sổ Từ Vựng'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 text-xs">
            {data.reviewVocabs.map((v) => (
              <div
                key={v.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                  v.isCorrect === false
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-100'
                    : 'bg-slate-950/60 border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => handlePronounce(v.word, v.id)}
                      className={`p-1.5 rounded-xl transition cursor-pointer ${
                        playingWordId === v.id
                          ? 'bg-rose-500 text-white animate-spin'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                      title="Nghe phát âm chuẩn"
                    >
                      <ArenaIconVolume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-white text-sm truncate">{v.word}</span>
                    {v.phonetic && (
                      <span className="text-[11px] font-mono text-indigo-300">[{v.phonetic}]</span>
                    )}
                  </div>

                  <div>
                    {v.isCorrect === false ? (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Cần Ôn Lại
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                        Đã Thuộc
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium">{v.meaning}</p>
                {v.exampleSentence && (
                  <p className="text-[11px] text-slate-400 italic font-normal">
                    &ldquo;{v.exampleSentence}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. ACTION NAVIGATION BUTTONS                             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 relative z-10">
        {onRematch && (
          <button
            type="button"
            onClick={onRematch}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/30 transition hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArenaIconSwords className="w-4 h-4" />
            <span>TÁI ĐẤU NGAY (REMATCH)</span>
          </button>
        )}

        {onReturnToLobby && (
          <button
            type="button"
            onClick={onReturnToLobby}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer hover:text-white"
          >
            <span>VỀ SẢNH ĐẤU TRƯỜNG</span>
          </button>
        )}
      </div>
    </div>
  );
};
