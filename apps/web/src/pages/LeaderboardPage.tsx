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
  AlertTriangle,
  Clock,
  ArrowRight,
  UserCheck,
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Title Banner */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider">
            <Trophy className="w-4 h-4" />
            <span>Đấu Trường Học Thuật VocabFlow</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-indigo-600 to-rose-500">
            Bảng Xếp Hạng Toàn Năng
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Vinh danh những học viên kiên trì, phản xạ nhanh và thành thạo kho từ vựng tiếng Anh mỗi ngày.
          </p>
        </div>

        {/* Anti-Cheat & Fair Play Shield Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm block">Thuật toán Fair-Play & Chống Gian Lận Đang Hoạt Động</span>
              <span className="text-emerald-700/80 dark:text-emerald-400/80">
                Tự động kiểm soát tốc độ đọc hiểu (&ge; 1.2s/thẻ), chống bot/macro, loại trừ điểm bất thường để đảm bảo công bằng tuyệt đối.
              </span>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Fair-Play 100% Verified</span>
          </div>
        </div>

        {/* Category Tabs & Timeframe Switcher */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/60 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('xp')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'xp'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Điểm Thi & XP</span>
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'flashcards'
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Flashcard Cao Thủ</span>
            </button>

            <button
              onClick={() => setActiveTab('streak')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                activeTab === 'streak'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span>Chuỗi Học (Streak)</span>
            </button>
          </div>

          {activeTab === 'xp' && (
            <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-900 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tuần Này
              </button>
              <button
                onClick={() => setTimeframe('all-time')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeframe === 'all-time'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Mọi Thời Đại
              </button>
            </div>
          )}
        </div>

        {/* Podium for Top 3 */}
        {!loading && top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-8 pb-4">
            {/* Rank 2 (Silver) */}
            {top3[1] && (
              <div className="order-2 md:order-1 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-center relative overflow-hidden group hover:border-slate-400 transition">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-400 to-slate-200" />
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-sm mb-3">
                  #2
                </div>
                <img
                  src={top3[1].avatar}
                  alt={top3[1].displayName}
                  className="w-16 h-16 rounded-2xl mx-auto mb-3 ring-4 ring-slate-300 dark:ring-slate-700 object-cover shadow-md"
                />
                <h3 className="font-bold text-base truncate">{top3[1].displayName}</h3>
                <span className="text-xs text-slate-400 block mb-2">{top3[1].emailMasked}</span>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm">
                  {activeTab === 'xp' && `${top3[1].score?.toLocaleString()} XP`}
                  {activeTab === 'flashcards' && `${top3[1].masteredWordsCount} từ`}
                  {activeTab === 'streak' && `${top3[1].currentStreak} ngày 🔥`}
                </div>
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Play 100</span>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold - Champion) */}
            {top3[0] && (
              <div className="order-1 md:order-2 p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 to-amber-500/5 dark:from-amber-950/30 dark:to-slate-900 border-2 border-amber-400/50 shadow-2xl shadow-amber-500/10 text-center relative overflow-hidden -translate-y-2">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
                <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/40 mb-3 animate-bounce">
                  <Crown className="w-6 h-6" />
                </div>
                <img
                  src={top3[0].avatar}
                  alt={top3[0].displayName}
                  className="w-20 h-20 rounded-2xl mx-auto mb-3 ring-4 ring-amber-400 object-cover shadow-xl"
                />
                <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase mb-1">
                  Quán Quân Bảng Vàng
                </div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white truncate">
                  {top3[0].displayName}
                </h3>
                <span className="text-xs text-slate-400 block mb-3">{top3[0].emailMasked}</span>
                <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500 text-white font-black text-base shadow-md shadow-amber-500/30">
                  {activeTab === 'xp' && `${top3[0].score?.toLocaleString()} XP`}
                  {activeTab === 'flashcards' && `${top3[0].masteredWordsCount} từ thuộc lòng`}
                  {activeTab === 'streak' && `${top3[0].currentStreak} ngày liên tục 🔥`}
                </div>
                <div className="mt-3 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Play 100 • Xác Thực Tuyệt Đối</span>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {top3[2] && (
              <div className="order-3 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg text-center relative overflow-hidden group hover:border-amber-700/50 transition">
                <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-700 to-amber-500" />
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-400 font-extrabold text-sm mb-3">
                  #3
                </div>
                <img
                  src={top3[2].avatar}
                  alt={top3[2].displayName}
                  className="w-16 h-16 rounded-2xl mx-auto mb-3 ring-4 ring-amber-700/40 object-cover shadow-md"
                />
                <h3 className="font-bold text-base truncate">{top3[2].displayName}</h3>
                <span className="text-xs text-slate-400 block mb-2">{top3[2].emailMasked}</span>
                <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-sm">
                  {activeTab === 'xp' && `${top3[2].score?.toLocaleString()} XP`}
                  {activeTab === 'flashcards' && `${top3[2].masteredWordsCount} từ`}
                  {activeTab === 'streak' && `${top3[2].currentStreak} ngày 🔥`}
                </div>
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Fair Play 100</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Table for Remaining Ranks */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <span>Thứ Hạng & Học Viên</span>
            <span>Thành Tích & Chỉ Số Fair Play</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang đối chiếu dữ liệu xếp hạng và kiểm tra tính hợp lệ Fair-Play...
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {remaining.map((item) => (
                <div
                  key={item.userId}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 text-center font-black text-sm text-slate-400">
                      #{item.rank}
                    </span>
                    <img
                      src={item.avatar}
                      alt={item.displayName}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 dark:ring-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate">
                          {item.displayName}
                        </span>
                        {item.englishLevel && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                            {item.englishLevel}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 block truncate">{item.emailMasked}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-sm text-indigo-600 dark:text-indigo-400">
                      {activeTab === 'xp' && `${item.score?.toLocaleString()} XP`}
                      {activeTab === 'flashcards' && `${item.masteredWordsCount} từ`}
                      {activeTab === 'streak' && `${item.currentStreak} ngày 🔥`}
                    </div>
                    <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{item.fairPlayScore || 100}% Fair-Play</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sticky Current User Rank Bar */}
        {user && myRank && (
          <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-500/25 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-base">
                #{activeTab === 'xp' ? myRank.xpRank : activeTab === 'flashcards' ? myRank.flashcardRank : myRank.streakRank}
              </div>
              <div>
                <span className="text-xs text-indigo-200 block font-bold uppercase tracking-wider">
                  Vị trí xếp hạng của bạn ({user.displayName || user.email})
                </span>
                <span className="text-sm font-extrabold">
                  {myRank.fairPlayScore >= 80 ? 'Hồ Sơ Hợp Lệ & Đạt Chuẩn Fair-Play 🛡️' : 'Đang Cần Xem Xét'}
                </span>
              </div>
            </div>

            <Link
              to="/review"
              className="px-4 py-2 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 text-xs font-black shadow-md flex items-center gap-1.5 transition shrink-0"
            >
              <span>Học & Bứt Phá Rank</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
