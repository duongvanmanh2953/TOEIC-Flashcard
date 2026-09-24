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
  Gamepad2,
  Medal,
  Star,
  CheckCircle2,
  Calendar,
  Filter,
  ArrowUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { CustomDropdown } from '../components/common/CustomDropdown';

interface LeaderboardItem {
  rank: number;
  userId: string;
  displayName: string;
  emailMasked?: string;
  avatar: string;
  role?: string;
  englishLevel?: string;
  score: number;
  totalXP?: number;
  level?: number;
  accuracy?: number;
  bestStreak?: number;
  masteredWordsCount?: number;
  currentStreak?: number;
  fairPlayScore?: number;
  isFairPlayVerified?: boolean;
  gameMode?: string;
}

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useTranslation();

  const [activeTab, setActiveTab] = useState<'games' | 'xp' | 'flashcards' | 'streak'>('games');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('daily');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [dailyChampion, setDailyChampion] = useState<LeaderboardItem | null>(null);
  const [myRank, setMyRank] = useState<any>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, timeframe, selectedMode]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (activeTab === 'games') {
        const queryParams = new URLSearchParams();
        queryParams.set('timeframe', timeframe);
        if (selectedMode !== 'ALL') queryParams.set('gameMode', selectedMode);
        if (user?.id) queryParams.set('userId', user.id);

        const res = await api.get(`/games/leaderboard?${queryParams.toString()}`);
        const data = res.data?.data || res.data || {};
        setItems(data.items || []);
        setDailyChampion(data.dailyChampion || null);
        setMyRank(data.currentUserRank || null);
      } else {
        let endpoint = `/leaderboard/${activeTab}`;
        if (activeTab === 'xp') {
          endpoint += `?timeframe=${timeframe === 'all-time' ? 'all-time' : 'weekly'}`;
        }
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setItems(list);
        setDailyChampion(list[0] || null);

        if (user?.id) {
          try {
            const rankRes = await api.get('/leaderboard/my-rank');
            setMyRank(rankRes.data?.data || null);
          } catch {
            // guest fallback
          }
        }
      }
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const top1 = items[0] || null;
  const top2 = items[1] || null;
  const top3 = items[2] || null;
  const remaining = items.slice(3);

  const formatScore = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('en-US');
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* 1. Header Title & Hero */}
      <div className="text-center space-y-3 relative pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider backdrop-blur-md">
          <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
          <span>{t('leaderboardSection.title', 'Bảng Xếp Hạng & Bục Vinh Danh')}</span>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
          Đấu Trường Vinh Danh Bảng Vàng
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto font-medium">
          {t(
            'leaderboardSection.subtitle',
            'Vinh danh các bậc thầy ngôn ngữ dẫn đầu bảng xếp hạng mỗi ngày, tuần và tháng.',
          )}
        </p>

        {/* Quick CTA to join live games */}
        <div className="pt-2">
          <Link
            to="/games"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition transform hover:-translate-y-0.5"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>Tham Gia Đấu Trường Trực Tiếp Tối Nay</span>
          </Link>
        </div>
      </div>

      {/* 2. Today's Champion Showcase (if on Daily tab) */}
      {timeframe === 'daily' && dailyChampion && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-indigo-500/10 to-rose-500/15 border-2 border-amber-500/30 backdrop-blur-xl relative overflow-hidden shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={dailyChampion.avatar}
                alt={dailyChampion.displayName}
                className="w-20 h-20 rounded-2xl border-2 border-amber-400 object-cover shadow-md shadow-amber-500/30 bg-slate-800"
              />
              <span className="absolute -top-2.5 -right-2.5 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow">
                👑 #1
              </span>
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-black uppercase tracking-wider">
                  {t('leaderboardSection.dailyChampion', "TODAY'S CHAMPION")}
                </span>
                <span className="text-xs text-slate-500 tabular-nums">
                  {new Date().toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                {dailyChampion.displayName}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                {t('leaderboardSection.championSub', 'Nhà vô địch phản xạ từ vựng')} • Cấp độ {dailyChampion.englishLevel || 'B1'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 self-stretch md:self-auto justify-between md:justify-end border-t md:border-t-0 border-amber-500/20 pt-4 md:pt-0">
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                Điểm Trận
              </span>
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {formatScore(dailyChampion.score)} XP
              </span>
            </div>
            {dailyChampion.bestStreak !== undefined && (
              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                  Chuỗi Đúng
                </span>
                <span className="text-2xl font-black text-rose-500 flex items-center justify-center gap-1">
                  <Flame className="w-5 h-5 fill-rose-500" />
                  {dailyChampion.bestStreak}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Main Category Tabs */}
        <div className="tab-pill-container w-full sm:w-auto overflow-x-auto flex-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('games')}
            className={`tab-pill shrink-0 ${activeTab === 'games' ? 'tab-pill-active' : ''}`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span>{t('leaderboardSection.tabGames', 'Đấu Trường Realtime')}</span>
          </button>
          <button
            onClick={() => setActiveTab('xp')}
            className={`tab-pill shrink-0 ${activeTab === 'xp' ? 'tab-pill-active' : ''}`}
          >
            <Zap className="w-4 h-4" />
            <span>Điểm Kinh Nghiệm (XP)</span>
          </button>
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`tab-pill shrink-0 ${activeTab === 'flashcards' ? 'tab-pill-active' : ''}`}
          >
            <Layers className="w-4 h-4" />
            <span>{t('leaderboardSection.tabFlashcards', 'Thành Thạo Từ Vựng')}</span>
          </button>
          <button
            onClick={() => setActiveTab('streak')}
            className={`tab-pill shrink-0 ${activeTab === 'streak' ? 'tab-pill-active' : ''}`}
          >
            <Flame className="w-4 h-4" />
            <span>{t('leaderboardSection.tabStreak', 'Chuỗi Học')}</span>
          </button>
        </div>

        {/* Timeframe & Mode Selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto justify-end">
          {activeTab === 'games' && (
            <CustomDropdown
              value={selectedMode}
              onChange={(val) => setSelectedMode(val)}
              options={[
                { value: 'ALL', label: 'Tất Cả Game Mode' },
                { value: 'TRANSLATION_RUSH', label: 'Translation Rush' },
                { value: 'WORD_BLITZ', label: 'Word Blitz' },
                { value: 'SENTENCE_SPRINT', label: 'Sentence Sprint' },
                { value: 'MISSING_WORD', label: 'Missing Word' },
                { value: 'LISTENING_RUSH', label: 'Listening Rush' },
                { value: 'SYNONYM_BATTLE', label: 'Synonym Battle' },
              ]}
              size="sm"
              className="w-full sm:w-52 h-9"
            />
          )}

          <div className="grid grid-cols-3 sm:flex items-center w-full sm:w-auto p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 text-xs font-bold">
            <button
              onClick={() => setTimeframe('daily')}
              className={`flex-1 text-center whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-lg transition ${
                timeframe === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('leaderboardSection.tabDaily', 'Hôm Nay')}
            </button>
            <button
              onClick={() => setTimeframe('weekly')}
              className={`flex-1 text-center whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-lg transition ${
                timeframe === 'weekly'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('leaderboardSection.tabWeekly', 'Tuần Này')}
            </button>
            <button
              onClick={() => setTimeframe('all-time')}
              className={`flex-1 text-center whitespace-nowrap px-2 sm:px-3 py-1.5 rounded-lg transition ${
                timeframe === 'all-time'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t('leaderboardSection.tabAllTime', 'Mọi Thời Điểm')}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Top 3 Liquid Glass Podium */}
      {items.length >= 3 && (
        <div className="relative py-4">
          <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-2xl mx-auto">
            {/* Rank 2: Silver (Left) */}
            {top2 && (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <img
                    src={top2.avatar}
                    alt={top2.displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-slate-300 dark:border-slate-500 object-cover shadow-md bg-slate-800"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow">
                    🥈 #2
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
                    {top2.displayName}
                  </h3>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                    {formatScore(top2.score)} XP
                  </span>
                </div>
                {/* Silver Podium Block */}
                <div className="w-full h-24 sm:h-28 rounded-t-2xl podium-silver flex flex-col items-center justify-center border-t-2">
                  <span className="text-2xl font-black text-slate-500 dark:text-slate-300">2</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">Silver</span>
                </div>
              </div>
            )}

            {/* Rank 1: Gold (Center Elevated) */}
            {top1 && (
              <div className="flex flex-col items-center text-center space-y-2 relative -top-3 sm:-top-5">
                <div className="relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                    <Crown className="w-8 h-8 text-amber-500 fill-amber-500 animate-bounce" />
                  </div>
                  <img
                    src={top1.avatar}
                    alt={top1.displayName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl border-3 border-amber-400 object-cover shadow-xl shadow-amber-500/20 bg-slate-800"
                  />
                  <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs shadow">
                    🥇 #1
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[180px]">
                    {top1.displayName}
                  </h3>
                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatScore(top1.score)} XP
                  </span>
                </div>
                {/* Gold Podium Block */}
                <div className="w-full h-32 sm:h-36 rounded-t-2xl podium-gold flex flex-col items-center justify-center border-t-2">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">1</span>
                  <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-300">
                    Champion
                  </span>
                </div>
              </div>
            )}

            {/* Rank 3: Bronze (Right) */}
            {top3 && (
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="relative">
                  <img
                    src={top3.avatar}
                    alt={top3.displayName}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-700/60 object-cover shadow-md bg-slate-800"
                  />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-700 text-white font-black text-xs shadow">
                    🥉 #3
                  </span>
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[160px]">
                    {top3.displayName}
                  </h3>
                  <span className="text-xs font-black text-slate-600 dark:text-slate-300">
                    {formatScore(top3.score)} XP
                  </span>
                </div>
                {/* Bronze Podium Block */}
                <div className="w-full h-20 sm:h-24 rounded-t-2xl podium-bronze flex flex-col items-center justify-center border-t-2">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-500">3</span>
                  <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400">
                    Bronze
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Sticky Current User Rank Bar (if user has rank) */}
      {myRank && (
        <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg flex items-center justify-between gap-4 sticky bottom-4 z-20 border border-indigo-400">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm">
              #{myRank.rank || myRank.xpRank || '27'}
            </span>
            <div>
              <span className="text-xs text-indigo-200 block font-bold uppercase">
                {t('leaderboardSection.myPosition', 'Vị trí hiện tại của bạn')}
              </span>
              <h4 className="font-black text-sm text-white">
                {user?.displayName || 'Learner'}
              </h4>
            </div>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-xs text-indigo-200 block font-medium">Điểm số</span>
              <span className="text-base font-black text-white">
                {formatScore(myRank.score || 0)} XP
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-emerald-300 text-xs font-black bg-white/10 px-2.5 py-1 rounded-lg">
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Đang thăng hạng</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. Ranks 4-100 Table */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="flex items-center gap-4">
            <span className="w-8 text-center">{t('leaderboardSection.rankHeader', 'Hạng')}</span>
            <span>{t('leaderboardSection.playerHeader', 'Người học')}</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline">{t('leaderboardSection.streakHeader', 'Chuỗi')}</span>
            <span>{t('leaderboardSection.scoreHeader', 'Điểm số')}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.userId + item.rank}
                className={`p-4 flex items-center justify-between transition ${
                  item.userId === user?.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-600'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-2">
                  <span
                    className={`w-7 sm:w-8 text-center font-black text-xs sm:text-sm shrink-0 ${
                      item.rank === 1
                        ? 'text-amber-500'
                        : item.rank === 2
                        ? 'text-slate-400'
                        : item.rank === 3
                        ? 'text-amber-700'
                        : 'text-slate-500'
                    }`}
                  >
                    #{item.rank}
                  </span>

                  <img
                    src={item.avatar}
                    alt={item.displayName}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[110px] sm:max-w-xs">
                        {item.displayName}
                      </h4>
                      {item.userId === user?.id && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-500 text-white shrink-0">
                          BẠN
                        </span>
                      )}
                      {item.isFairPlayVerified && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Fair-Play Verified" />
                      )}
                    </div>
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate block">
                      CEFR {item.englishLevel || 'B1'} {item.gameMode ? `• ${item.gameMode}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                  {(item.bestStreak !== undefined || item.currentStreak !== undefined) && (
                    <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-rose-500">
                      <Flame className="w-4 h-4 fill-rose-500" />
                      {item.bestStreak ?? item.currentStreak}
                    </span>
                  )}
                  <span className="font-black text-xs sm:text-base text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                    {formatScore(item.score)} XP
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-sm text-slate-500 space-y-2">
              <Trophy className="w-8 h-8 mx-auto text-slate-400 opacity-50" />
              <p>Chưa có dữ liệu thi đấu trong khung thời gian này.</p>
              <Link to="/games" className="text-indigo-600 font-bold hover:underline">
                Hãy là người đầu tiên tham gia đấu trường!
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;
