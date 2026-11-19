import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import { LeaderboardPlayer, ArenaPodium } from './ArenaPodium';
import { ArenaTrophyArtwork } from './ArenaTrophyArtwork';
import {
  ArenaIconTrophy,
  ArenaIconFlame,
  ArenaIconSparkles,
  ArenaIconCheck,
  ArenaIconVolume2,
  ArenaIconSwords,
  ArenaIconCrown,
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
  fullLeaderboard?: LeaderboardPlayer[];
  correctCommentersCount?: number;
  currentUserId?: string;
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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'review'>('leaderboard');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const missedWords = data.reviewVocabs.filter((v) => v.isCorrect === false);

  // Full leaderboard combines fullLeaderboard prop with topPlayers fallback
  const fullList = useMemo(() => {
    if (data.fullLeaderboard && data.fullLeaderboard.length > 0) {
      return data.fullLeaderboard;
    }
    return data.topPlayers || [];
  }, [data.fullLeaderboard, data.topPlayers]);

  // Play victory fanfare once on mount and render metallic golden confetti animation
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

    // Metallic gold, amber, and celebratory royal sparks
    const colors = ['#F59E0B', '#FBBF24', '#FEF08A', '#FCD34D', '#D97706', '#FFFFFF', '#60A5FA', '#34D399'];
    const w = (canvas.width = canvas.offsetWidth || 1000);
    const h = (canvas.height = canvas.offsetHeight || 800);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * -h * 0.6,
        vx: (Math.random() - 0.5) * 3.5,
        vy: Math.random() * 3 + 2,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 9,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, w, h);
      let aliveCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y < h + 25) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = Math.max(0, 1 - p.y / h);
          ctx.shadowBlur = 8;
          ctx.shadowColor = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
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
      className={`w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-10 rounded-3xl relative overflow-hidden select-none animate-scale-up border-2 border-amber-500/40 shadow-[0_0_80px_rgba(245,158,11,0.25)] bg-[#0A0D18] ${className}`}
    >
      {/* ======================================================== */}
      {/* 0. MAGNIFICENT VICTORY HALL BACKGROUND IMAGE & LIGHT RAYS*/}
      {/* ======================================================== */}
      <img
        src="/game-assets/arena/arena-victory-hall-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen pointer-events-none filter brightness-110 contrast-125"
      />

      {/* Volumetric Central Golden God Rays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[42rem] h-[30rem] bg-gradient-to-b from-amber-400/25 via-yellow-500/10 to-transparent blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[30rem] h-[25rem] bg-indigo-600/15 rounded-full blur-[130px] pointer-events-none" />

      {/* Particle Canvas for Metallic Gold Confetti */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* ======================================================== */}
      {/* 1. TOURNAMENT CHAMPIONSHIP HEADER & TROPHY ARTWORK       */}
      {/* ======================================================== */}
      <div className="text-center space-y-3 relative z-20 flex flex-col items-center">
        {/* Original Vector Trophy Artwork with Luminous Pedestal Glow */}
        <div className="relative">
          <div className="absolute -inset-4 bg-radial-gradient from-amber-400/40 via-yellow-500/10 to-transparent rounded-full blur-xl pointer-events-none animate-pulse" />
          <ArenaTrophyArtwork size={150} className="relative z-10 mb-1 drop-shadow-[0_10px_35px_rgba(251,191,36,0.6)]" />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 text-amber-200 border border-amber-400/50 text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(251,191,36,0.3)]">
          <ArenaIconCrown className="w-4 h-4 text-amber-300" />
          <span>VINH DANH QUÁN QUÂN • LỄ TRAO GIẢI TRANG NGHIÊM</span>
        </div>

        <h1 className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 tracking-tight drop-shadow-[0_4px_30px_rgba(251,191,36,0.7)]">
          BẢNG VÀNG VOCABFLOW ARENA
        </h1>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-300 font-medium">
          <span className="font-mono font-black text-amber-300 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-400/40 shadow-sm">
            #{data.roomCode}
          </span>
          <span>•</span>
          <span className="text-white font-bold">{data.gameModeTitle}</span>
          <span>•</span>
          <span className="text-amber-200 font-semibold">{data.totalPlayers} đấu thủ</span>
          <span>•</span>
          <span className="text-slate-300 font-medium">{data.totalQuestions} câu hỏi</span>
          {typeof data.correctCommentersCount === 'number' && data.correctCommentersCount > 0 && (
            <>
              <span>•</span>
              <span className="text-emerald-400 font-bold">{data.correctCommentersCount} khán giả đoán đúng</span>
            </>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ESPORTS PODIUM TOP 3 (GOLD / SILVER / BRONZE)         */}
      {/* ======================================================== */}
      <div className="relative z-20 py-1 sm:py-3">
        <ArenaPodium topPlayers={data.topPlayers} />
      </div>

      {/* ======================================================== */}
      {/* 3. PERSONAL PERFORMANCE SUMMARY HERO CARD                */}
      {/* ======================================================== */}
      {data.personalStats && (
        <div className="relative z-20 p-4 sm:p-7 rounded-3xl bg-slate-950/85 border border-amber-500/30 shadow-2xl space-y-4 backdrop-blur-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <ArenaIconSparkles className="w-4 h-4 text-amber-300" />
                <span>KẾT QUẢ THI ĐẤU CỦA BẠN</span>
              </span>
              <p className="text-xs sm:text-sm font-bold text-white pt-1">
                {getRankCommentary(data.personalStats.finalRank)}
              </p>
            </div>

            <div className="self-start sm:self-center">
              <span className="px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/30 font-mono tracking-wider">
                HẠNG #{data.personalStats.finalRank}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 text-center">
            {/* Total Score */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Tổng Điểm Trận
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-amber-300 tabular-nums">
                {data.personalStats.totalScore.toLocaleString()}
              </span>
            </div>

            {/* Accuracy */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Độ Chính Xác
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-emerald-400 tabular-nums">
                {Math.round(data.personalStats.accuracyPercent)}%
              </span>
            </div>

            {/* Streak */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Chuỗi Streak Max
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-rose-400 tabular-nums flex items-center justify-center gap-1">
                <ArenaIconFlame className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-500" />
                <span>{data.personalStats.maxStreak}x</span>
              </span>
            </div>

            {/* XP Earned */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-black/60 border border-white/10 space-y-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                XP Tích Lũy
              </span>
              <span className="text-lg sm:text-2xl font-black font-mono text-amber-200 tabular-nums">
                +{data.personalStats.xpEarned} XP
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SEGMENTED TABS (LEADERBOARD VS VOCABULARY REVIEW)     */}
      {/* ======================================================== */}
      <div className="relative z-20 space-y-4">
        {/* Tab Switcher Bar */}
        <div className="flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArenaIconTrophy className="w-4 h-4" />
            <span>BẢNG TỔNG SẮP ({fullList.length})</span>
          </button>

          {data.reviewVocabs && data.reviewVocabs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('review')}
              className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'review'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>ÔN TẬP TỪ VỰNG ({data.reviewVocabs.length})</span>
            </button>
          )}
        </div>

        {/* ------------------------------------------------------ */}
        {/* TAB 1: FULL LEADERBOARD TABLE                         */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'leaderboard' && fullList.length > 0 && (
          <div className="p-4 sm:p-7 rounded-3xl bg-slate-950/85 border border-white/10 shadow-2xl space-y-3 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <ArenaIconTrophy className="w-4 h-4 text-amber-400" />
                  <span>BẢNG TỔNG SẮP TOÀN TRẬN ({fullList.length} NGƯỜI)</span>
                </h3>
                <p className="text-xs text-slate-400 pt-0.5">
                  Chi tiết thứ hạng và điểm số của tất cả đấu thủ tham gia trận đấu
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {fullList.map((player, idx) => {
                const rankNum = idx + 1;
                const isMe = Boolean(data.currentUserId && player.id === data.currentUserId);

                return (
                  <div
                    key={player.id || idx}
                    className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-amber-950/60 border-amber-400/80 ring-2 ring-amber-400/40 shadow-lg'
                        : rankNum === 1
                        ? 'bg-amber-950/30 border-amber-500/40'
                        : rankNum === 2
                        ? 'bg-slate-900/60 border-slate-400/30'
                        : rankNum === 3
                        ? 'bg-[#1e0f06]/60 border-amber-700/40'
                        : 'bg-black/50 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl font-black font-mono text-xs sm:text-sm flex items-center justify-center shrink-0 ${
                          rankNum === 1
                            ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-sm'
                            : rankNum === 2
                            ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-950 shadow-sm'
                            : rankNum === 3
                            ? 'bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 shadow-sm'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {rankNum}
                      </span>

                      <img
                        src={player.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${player.id}`}
                        alt=""
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover border border-white/10 shrink-0 bg-slate-800"
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs sm:text-sm truncate max-w-[130px] sm:max-w-[240px]">
                            {player.name}
                          </span>
                          {isMe && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black uppercase">
                              BẠN
                            </span>
                          )}
                          {rankNum === 1 && (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                              <ArenaIconCrown className="w-3 h-3 text-amber-400" />
                              <span>Vô Địch</span>
                            </span>
                          )}
                        </div>

                        {player.streak && player.streak >= 2 && (
                          <span className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5 pt-0.5">
                            <ArenaIconFlame className="w-3 h-3 fill-rose-500" />
                            <span>Chuỗi {player.streak}x</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-black text-sm sm:text-base text-amber-300 block tabular-nums">
                        {player.score.toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">XP</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------ */}
        {/* TAB 2: POST-GAME VOCABULARY REVIEW                    */}
        {/* ------------------------------------------------------ */}
        {activeTab === 'review' && data.reviewVocabs && data.reviewVocabs.length > 0 && (
          <div className="p-4 sm:p-7 rounded-3xl bg-slate-950/85 border border-white/10 shadow-2xl space-y-4 backdrop-blur-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black uppercase tracking-wider text-white flex items-center gap-2">
                  <span>ÔN TẬP TỪ VỰNG TRẬN ĐẤU (SPACED REPETITION)</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                    {data.reviewVocabs.length} từ
                  </span>
                </h3>
                <p className="text-xs text-slate-400 pt-0.5">
                  Lưu các từ vựng này vào Sổ Từ để thuật toán FSRS nhắc nhở ôn luyện định kỳ
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveNotebook}
                disabled={savedToNotebook}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 ${
                  savedToNotebook
                    ? 'bg-emerald-600 text-white cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-amber-500/30'
                }`}
              >
                <ArenaIconCheck className="w-4 h-4" />
                <span>{savedToNotebook ? 'Đã Lưu Vào Sổ Từ FSRS!' : 'Lưu Vào Sổ Từ Vựng'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 text-xs">
              {data.reviewVocabs.map((v) => (
                <div
                  key={v.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${
                    v.isCorrect === false
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-100'
                      : 'bg-black/50 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => handlePronounce(v.word, v.id)}
                        className={`p-1.5 rounded-xl transition cursor-pointer ${
                          playingWordId === v.id
                            ? 'bg-amber-400 text-slate-950 animate-spin'
                            : 'bg-white/10 hover:bg-white/20 text-slate-300'
                        }`}
                        title="Nghe phát âm chuẩn"
                      >
                        <ArenaIconVolume2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-white text-sm truncate">{v.word}</span>
                      {v.phonetic && (
                        <span className="text-[11px] font-mono text-amber-300/90">[{v.phonetic}]</span>
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
      </div>

      {/* ======================================================== */}
      {/* 5. ACTION NAVIGATION BUTTONS                             */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3 relative z-20">
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
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer hover:text-white shadow-lg"
          >
            <span>VỀ SẢNH ĐẤU TRƯỜNG</span>
          </button>
        )}
      </div>
    </div>
  );
};
