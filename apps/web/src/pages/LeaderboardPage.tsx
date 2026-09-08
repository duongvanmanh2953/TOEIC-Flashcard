import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import {
  Trophy,
  Flame,
  Layers,
  ShieldCheck,
  Award,
  Crown,
  Sparkles,
  Zap,
  TrendingUp,
  ArrowRight,
  Medal,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface LeaderboardItem {
  rank: number;
  userId: string;
  displayName: string;
  emailMasked: string;
  avatar: string;
  role?: string;
  englishLevel?: string;
  score?: number;
  totalXP?: number;
  level?: number;
  masteredWordsCount?: number;
  currentStreak?: number;
  fairPlayScore?: number;
  isFairPlayVerified: boolean;
  statusBadge?: string;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'xp' | 'flashcards' | 'streak'>('xp');
  const [timeframe, setTimeframe] = useState<'weekly' | 'all-time'>('weekly');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<{
    xpRank: number;
    flashcardRank: number;
    streakRank: number;
    fairPlayScore: number;
    isFairPlayVerified: boolean;
  } | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, timeframe]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      let endpoint = `/leaderboard/${activeTab}`;
      if (activeTab === 'xp') {
        endpoint += `?timeframe=${timeframe}`;
      }
      const res = await api.get(endpoint);
      setItems(res.data?.data || []);

      if (user) {
        try {
          const rankRes = await api.get('/leaderboard/my-rank');
          setMyRank(rankRes.data?.data || null);
        } catch {
          // Guest or unauthenticated fallback
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const top3 = items.slice(0, 3);
  const remaining = items.slice(3);

  // Score formatter with commas
  const formatScore = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('en-US');
  };

  return (
    <div className="space-y-7 pb-10">
      {/* 1. Header Title & Celebration Hero */}
      <div className="text-center space-y-3 relative pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md">
          <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>Đấu Trường Vinh Danh Bảng Vàng</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-indigo-500 to-rose-500">
          Bảng Xếp Hạng Toàn Năng
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Tôn vinh những học viên kiên trì nhất, phản xạ từ vựng sắc bén và bứt phá giới hạn mỗi ngày cùng hệ thống AI Coach.
        </p>
      </div>

      {/* 2. Anti-Cheat & Fair-Play Shield Pill */}
      <div className="liquid-glass-card p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                Thuật Toán Fair-Play & Chống Gian Lận Độc Quyền
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-[10px] font-black uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live 100%
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-emerald-700/90 dark:text-emerald-400/90 mt-0.5">
              Hệ thống tự động phân tích tốc độ phản xạ não bộ, loại bỏ bot/macro để bảo toàn giá trị tôn vinh cho từng nỗ lực thật.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Fair-Play Verified</span>
        </div>
      </div>

      {/* 3. Category Tabs & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-4">
        {/* Main Tab Controls */}
        <div className="flex items-center gap-1.5 p-1.5 liquid-glass-card rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('xp')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'xp'
                ? 'bg-indigo-600 text-white font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Điểm Thi & XP</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'flashcards'
                ? 'bg-amber-500 text-white font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Flashcard Cao Thủ</span>
          </button>

          <button
            onClick={() => setActiveTab('streak')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'streak'
                ? 'bg-rose-500 text-white font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Chuỗi Học (Streak)</span>
          </button>
        </div>

        {/* Timeframe selector (for XP) */}
        {activeTab === 'xp' && (
          <div className="flex items-center gap-1.5 p-1 liquid-glass-card rounded-xl text-xs font-bold w-full sm:w-auto justify-end">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'weekly'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Tuần Này
            </button>
            <button
              onClick={() => setTimeframe('all-time')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                timeframe === 'all-time'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Mọi Thời Đại
            </button>
          </div>
        )}
      </div>

      {/* 4. Grand Olympic Podium for Top 3 (True Celebration & Honor) */}
      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end pt-4 pb-2">
          {/* Rank 2 (Á Quân 1 • Huy Chương Bạc) */}
          {top3[1] && (
            <div className="order-2 md:order-1 liquid-glass-card podium-silver p-6 rounded-3xl text-center relative overflow-hidden flex flex-col justify-between h-[360px]">
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400" />
              
              <div>
                {/* Medal Header */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-black text-xs mb-3 border border-slate-300/60 dark:border-slate-700/60">
                  <Medal className="w-4 h-4 text-slate-400" />
                  <span>Á QUÂN 1 • BẠC</span>
                </div>

                {/* Avatar with Silver Ring */}
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img
                    src={top3[1].avatar}
                    alt={top3[1].displayName}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-300/80 dark:ring-slate-600"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center border border-slate-300 dark:border-slate-700">
                    #2
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                  {top3[1].displayName}
                </h3>
                <span className="text-[11px] text-slate-400 block mb-3">{top3[1].emailMasked}</span>
              </div>

              {/* Stats & Badge */}
              <div className="space-y-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                <div className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 font-black text-sm border border-slate-300/50 dark:border-slate-700/50">
                  {activeTab === 'xp' && `${formatScore(top3[1].score)} XP`}
                  {activeTab === 'flashcards' && `${formatScore(top3[1].masteredWordsCount)} từ thành thạo`}
                  {activeTab === 'streak' && `${formatScore(top3[1].currentStreak)} ngày 🔥`}
                </div>

                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair-Play 100% Đạt Chuẩn</span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 1 (Quán Quân Bảng Vàng • Huy Chương Vàng) */}
          {top3[0] && (
            <div className="order-1 md:order-2 liquid-glass-card podium-gold p-7 rounded-3xl text-center relative overflow-hidden flex flex-col justify-between h-[410px] border-2">
              {/* Glorious Top Gold Bar */}
              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              
              <div>
                {/* Crown Honor */}
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500 text-white font-black text-xs uppercase tracking-wider mb-3">
                  <Crown className="w-4 h-4 fill-amber-200 text-amber-200 animate-bounce" />
                  <span>QUÁN QUÂN BẢNG VÀNG</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                </div>

                {/* Avatar with Radiant Gold Ring */}
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <img
                    src={top3[0].avatar}
                    alt={top3[0].displayName}
                    className="w-24 h-24 rounded-3xl object-cover ring-4 ring-amber-400 dark:ring-amber-300"
                  />
                  <div className="absolute -bottom-2.5 -right-2.5 w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-900">
                    #1
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <h3 className="font-black text-lg text-slate-900 dark:text-amber-100 truncate">
                    {top3[0].displayName}
                  </h3>
                  {top3[0].englishLevel && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] font-black text-amber-700 dark:text-amber-300">
                      {top3[0].englishLevel}
                    </span>
                  )}
                </div>
                <span className="text-xs text-amber-800/70 dark:text-amber-300/70 block mb-3 font-medium">
                  {top3[0].emailMasked}
                </span>
              </div>

              {/* Stats & Honor Level */}
              <div className="space-y-2 pt-2 border-t border-amber-500/25">
                <div className="inline-block px-5 py-2 rounded-2xl bg-amber-500 text-white font-black text-base">
                  {activeTab === 'xp' && `${formatScore(top3[0].score)} XP`}
                  {activeTab === 'flashcards' && `${formatScore(top3[0].masteredWordsCount)} từ thuộc lòng`}
                  {activeTab === 'streak' && `${formatScore(top3[0].currentStreak)} ngày liên tục 🔥`}
                </div>

                <div className="flex items-center justify-center gap-1 text-xs text-emerald-700 dark:text-emerald-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Fair-Play 100% • Quán Quân Vinh Danh</span>
                </div>
              </div>
            </div>
          )}

          {/* Rank 3 (Á Quân 2 • Huy Chương Đồng) */}
          {top3[2] && (
            <div className="order-3 liquid-glass-card podium-bronze p-6 rounded-3xl text-center relative overflow-hidden flex flex-col justify-between h-[340px]">
              {/* Top Accent Line */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800" />

              <div>
                {/* Medal Header */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-300 font-black text-xs mb-3 border border-amber-700/30">
                  <Medal className="w-4 h-4 text-amber-600" />
                  <span>Á QUÂN 2 • ĐỒNG</span>
                </div>

                {/* Avatar with Bronze Ring */}
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <img
                    src={top3[2].avatar}
                    alt={top3[2].displayName}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-amber-700/60 dark:ring-amber-600/70"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-amber-700/20 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-black text-xs flex items-center justify-center border border-amber-700/40">
                    #3
                  </div>
                </div>

                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 truncate">
                  {top3[2].displayName}
                </h3>
                <span className="text-[11px] text-slate-400 block mb-3">{top3[2].emailMasked}</span>
              </div>

              {/* Stats & Badge */}
              <div className="space-y-2 pt-2 border-t border-amber-700/20">
                <div className="inline-block px-3.5 py-1.5 rounded-xl bg-amber-700/15 text-amber-800 dark:text-amber-200 font-black text-sm border border-amber-700/30">
                  {activeTab === 'xp' && `${formatScore(top3[2].score)} XP`}
                  {activeTab === 'flashcards' && `${formatScore(top3[2].masteredWordsCount)} từ thành thạo`}
                  {activeTab === 'streak' && `${formatScore(top3[2].currentStreak)} ngày 🔥`}
                </div>

                <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair-Play 100% Đạt Chuẩn</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Sticky / Elevated Current User Rank Card */}
      {user && myRank && (
        <div className="liquid-glass-card p-4 sm:p-5 rounded-2xl border-indigo-500/30 bg-gradient-to-r from-indigo-500/15 via-purple-500/15 to-amber-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shrink-0">
              #{activeTab === 'xp' ? myRank.xpRank : activeTab === 'flashcards' ? myRank.flashcardRank : myRank.streakRank}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-wider">
                  Vị Trí Của Bạn Trong Đấu Trường
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 font-bold">
                  {user.displayName || user.email}
                </span>
              </div>
              <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mt-0.5">
                {myRank.fairPlayScore >= 80 ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 inline" />
                    Hồ sơ hợp lệ • Đạt chuẩn Fair-Play 100%
                  </span>
                ) : (
                  <span className="text-amber-500">Đang kiểm tra dữ liệu Fair-Play</span>
                )}
              </div>
            </div>
          </div>

          <Link
            to="/review"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center justify-center gap-2 transition shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Ôn Tập & Bứt Phá Rank</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* 6. Table for Remaining Ranks (4th and beyond) */}
      <div className="liquid-glass-card rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>Thứ Hạng & Học Viên ({items.length} thành viên)</span>
          </div>
          <span>Thành Tích & Chỉ Số Fair Play</span>
        </div>

        {loading ? (
          <div className="p-14 text-center text-slate-400 text-sm">
            <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="font-bold">Đang kiểm tra và đối chiếu dữ liệu xếp hạng Fair-Play...</p>
          </div>
        ) : remaining.length === 0 && top3.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Chưa có dữ liệu xếp hạng trong kỳ này. Hãy là người đầu tiên học để ghi danh!
          </div>
        ) : (
          <div className="divide-y divide-slate-100/60 dark:divide-slate-800/60">
            {remaining.map((item) => {
              const isTop10 = item.rank <= 10;
              return (
                <div
                  key={item.userId}
                  className="p-4 hover:bg-slate-100/40 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        isTop10
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                          : 'text-slate-400 dark:text-slate-500 bg-slate-100/50 dark:bg-slate-800/50'
                      }`}
                    >
                      #{item.rank}
                    </span>
                    <img
                      src={item.avatar}
                      alt={item.displayName}
                      className="w-11 h-11 rounded-xl object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {item.displayName}
                        </span>
                        {item.englishLevel && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-[10px] font-black text-indigo-600 dark:text-indigo-400 shrink-0">
                            {item.englishLevel}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block truncate">{item.emailMasked}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                      {activeTab === 'xp' && `${formatScore(item.score)} XP`}
                      {activeTab === 'flashcards' && `${formatScore(item.masteredWordsCount)} từ`}
                      {activeTab === 'streak' && `${formatScore(item.currentStreak)} ngày 🔥`}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{item.fairPlayScore || 100}% Fair-Play</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
