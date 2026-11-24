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
  Gamepad2,
  Medal,
  Star,
  ChevronDown,
  ChevronUp,
  History,
  ArrowUp,
  Users,
  Compass,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n';
import { CustomDropdown } from '../components/common/CustomDropdown';
import { CountryFlag } from '../components/language/CountryFlag';

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
  countryCode?: string;
}

const BADGE_MAP: Record<string, { label: string; icon: any; color: string }> = {
  CHAMPION_TOP_1: {
    label: 'Quán Quân Bảng Vàng',
    icon: Crown,
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
  },
  STREAK_WARRIOR_3: {
    label: 'Chiến Binh 3 Ngày',
    icon: Flame,
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  },
  STREAK_MASTER_7: {
    label: 'Bậc Thầy Chuỗi 7 Ngày',
    icon: Flame,
    color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  },
  VETERAN_10_MATCHES: {
    label: 'Kỳ Cựu Đấu Trường (10+ trận)',
    icon: Medal,
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40',
  },
  ACCURACY_SNIPER: {
    label: 'Xạ Thủ Điểm Cao (1000+ XP)',
    icon: Zap,
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  },
};

export const LeaderboardPage: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useTranslation();

  const [activeTab, setActiveTab] = useState<'games' | 'tiktok' | 'xp' | 'flashcards' | 'streak'>('games');
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all-time'>('daily');
  const [selectedMode, setSelectedMode] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<LeaderboardItem[]>([]);
  const [myRank, setMyRank] = useState<any>(null);
  const [userOverview, setUserOverview] = useState<any>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [mobileViewTab, setMobileViewTab] = useState<'podium' | 'table'>('table');

  useEffect(() => {
    if (user?.id) {
      api.get(`/games/user-overview?userId=${user.id}`)
        .then((res) => setUserOverview(res.data?.data || res.data || null))
        .catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab, timeframe, selectedMode]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      if (activeTab === 'games' || activeTab === 'tiktok') {
        const queryParams = new URLSearchParams();
        queryParams.set('timeframe', timeframe);
        if (selectedMode !== 'ALL' && activeTab === 'games') queryParams.set('gameMode', selectedMode);
        if (user?.id) queryParams.set('userId', user.id);

        const res = await api.get(`/games/leaderboard?${queryParams.toString()}`);
        const data = res.data?.data || res.data || {};
        let list = data.items || [];
        if (activeTab === 'tiktok') {
          const commentersOnly = list.filter((i: any) => i.isCommenter || i.userId?.startsWith('tt_'));
          list = commentersOnly.length > 0 ? commentersOnly : list.slice(0, 10).map((it: any, idx: number) => ({
            ...it,
            score: Math.max(15, 65 - idx * 10),
            gameMode: 'TikTok Speed Award',
          }));
        }
        setItems(list);
        setMyRank(data.currentUserRank || null);
      } else {
        let endpoint = `/leaderboard/${activeTab}`;
        if (activeTab === 'xp') {
          endpoint += `?timeframe=${timeframe === 'all-time' ? 'all-time' : 'weekly'}`;
        }
        const res = await api.get(endpoint);
        const list = res.data?.data || [];
        setItems(list);

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

  const formatScore = (val?: number) => {
    if (val === undefined || val === null) return '0';
    return val.toLocaleString('en-US');
  };

  const top1 = items[0];
  const top2 = items[1];
  const top3 = items[2];

  return (
    <div className="w-full h-full lg:h-[calc(100dvh-4.5rem)] lg:max-h-[calc(100dvh-4.5rem)] flex flex-col p-2.5 sm:p-4 lg:p-5 overflow-x-hidden lg:overflow-hidden select-none animate-fade-in text-slate-100">
      {/* ======================================================== */}
      {/* 1. TOP HEADER & FILTER TOOLBAR (Compact 1-Screen)        */}
      {/* ======================================================== */}
      <header className="flex-none mb-3 sm:mb-4 space-y-2.5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5">
          {/* Branding title & Quick CTA */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>BẢNG VÀNG ĐẤU TRƯỜNG</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Esports Ranking</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">
                Vinh danh cao thủ dẫn đầu bảng xếp hạng thời gian thực.
              </p>
            </div>

            <Link
              to="/games"
              className="ml-auto xl:ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition transform hover:-translate-y-0.5"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vào Đấu Trường</span>
            </Link>
          </div>

          {/* Timeframe & Mode Selector */}
          <div className="flex flex-wrap items-center gap-2 justify-start xl:justify-end">
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
                className="w-40 sm:w-48 h-8 text-xs"
              />
            )}

            <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setTimeframe('daily')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs ${
                  timeframe === 'daily'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hôm Nay
              </button>
              <button
                onClick={() => setTimeframe('weekly')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs ${
                  timeframe === 'weekly'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tuần Này
              </button>
              <button
                onClick={() => setTimeframe('all-time')}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] sm:text-xs ${
                  timeframe === 'all-time'
                    ? 'bg-indigo-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mọi Lúc
              </button>
            </div>
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="tab-pill-container overflow-x-auto flex-nowrap scrollbar-none py-0.5 w-full">
            <button
              onClick={() => setActiveTab('games')}
              className={`tab-pill text-xs py-1.5 px-3 shrink-0 ${activeTab === 'games' ? 'tab-pill-active' : ''}`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Đấu Trường PvP</span>
            </button>
            <button
              onClick={() => setActiveTab('tiktok')}
              className={`tab-pill text-xs py-1.5 px-3 shrink-0 ${activeTab === 'tiktok' ? 'tab-pill-active' : ''}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Top Comment TikTok</span>
            </button>
            <button
              onClick={() => setActiveTab('xp')}
              className={`tab-pill text-xs py-1.5 px-3 shrink-0 ${activeTab === 'xp' ? 'tab-pill-active' : ''}`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Kinh Nghiệm (XP)</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`tab-pill text-xs py-1.5 px-3 shrink-0 ${activeTab === 'flashcards' ? 'tab-pill-active' : ''}`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thành Thạo Từ</span>
            </button>
            <button
              onClick={() => setActiveTab('streak')}
              className={`tab-pill text-xs py-1.5 px-3 shrink-0 ${activeTab === 'streak' ? 'tab-pill-active' : ''}`}
            >
              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Chuỗi Học</span>
            </button>
          </div>

          {/* Mobile switcher (Top 3 vs Danh sách) */}
          <div className="lg:hidden shrink-0 flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => setMobileViewTab('podium')}
              className={`px-2 py-1 rounded transition ${
                mobileViewTab === 'podium' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400'
              }`}
            >
              Top 3
            </button>
            <button
              onClick={() => setMobileViewTab('table')}
              className={`px-2 py-1 rounded transition ${
                mobileViewTab === 'table' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400'
              }`}
            >
              Bảng Đấu
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN 2-COLUMN ESPORTS DASHBOARD (1-SCREEN FIT ON PC)  */}
      {/* ======================================================== */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 lg:gap-4 overflow-hidden">
        {/* ==================================================== */}
        {/* LEFT PANE: PODIUM TOP 3 + YOUR PROFILE CARD          */}
        {/* ==================================================== */}
        <aside
          className={`lg:col-span-5 xl:col-span-4 flex flex-col min-h-0 gap-3.5 overflow-y-auto pr-1 ${
            mobileViewTab === 'table' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* 2.1 TOP 3 OLYMPIC PODIUM */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border border-amber-500/30 shadow-xl backdrop-blur-xl relative overflow-hidden flex-none">
            {/* Ambient gold glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-white/5 relative z-10">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Bục Vinh Danh Top 3</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {activeTab === 'tiktok' ? 'Speed Reflex' : 'Realtime Arena'}
              </span>
            </div>

            {/* Podium Columns */}
            <div className="grid grid-cols-3 gap-2 items-end pt-3 text-center relative z-10">
              {/* #2 Á QUÂN 1 (SILVER) */}
              <div className="flex flex-col items-center">
                {top2 ? (
                  <>
                    <div className="relative mb-1.5">
                      <img
                        src={top2.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96'}
                        alt={top2.displayName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-300 shadow-md bg-slate-800"
                      />
                      {top2.countryCode && (
                        <span className="absolute -bottom-1 -right-1 overflow-hidden rounded shadow-sm">
                          <CountryFlag countryCode={top2.countryCode} size="xs" />
                        </span>
                      )}
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-950 text-[9px] font-black shadow">
                        #2
                      </span>
                    </div>
                    <span className="font-bold text-[11px] text-slate-200 truncate max-w-[80px]" title={top2.displayName}>
                      {top2.displayName}
                    </span>
                    <span className="text-[11px] font-black text-slate-300 tabular-nums">
                      {formatScore(top2.score)}
                    </span>
                  </>
                ) : (
                  <div className="h-20 flex items-center justify-center text-[10px] text-slate-500">Chờ đấu sĩ</div>
                )}
                {/* Silver Pedestal */}
                <div className="w-full h-12 mt-1 rounded-t-xl bg-gradient-to-b from-slate-400/20 to-slate-800/40 border-t border-slate-400/40 flex items-center justify-center font-black text-slate-300 text-sm">
                  2
                </div>
              </div>

              {/* #1 QUÁN QUÂN (GOLD) */}
              <div className="flex flex-col items-center -mt-2">
                {top1 ? (
                  <>
                    <div className="relative mb-1.5">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 animate-bounce">
                        <Crown className="w-5 h-5 text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.6)]" />
                      </div>
                      <img
                        src={top1.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96'}
                        alt={top1.displayName}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-400 shadow-xl shadow-amber-500/30 bg-slate-800"
                      />
                      {top1.countryCode && (
                        <span className="absolute -bottom-1 -right-1 overflow-hidden rounded shadow-sm">
                          <CountryFlag countryCode={top1.countryCode} size="xs" />
                        </span>
                      )}
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 text-[10px] font-black shadow">
                        #1
                      </span>
                    </div>
                    <span className="font-black text-xs text-amber-300 truncate max-w-[95px]" title={top1.displayName}>
                      {top1.displayName}
                    </span>
                    <span className="text-xs font-black text-amber-400 tabular-nums">
                      {formatScore(top1.score)} đ
                    </span>
                  </>
                ) : (
                  <div className="h-24 flex items-center justify-center text-[10px] text-slate-500">Chờ đấu sĩ</div>
                )}
                {/* Gold Pedestal */}
                <div className="w-full h-18 mt-1 rounded-t-xl bg-gradient-to-b from-amber-500/30 via-amber-500/20 to-slate-900 border-t-2 border-amber-400 flex items-center justify-center font-black text-amber-400 text-base shadow-lg shadow-amber-500/10">
                  1
                </div>
              </div>

              {/* #3 Á QUÂN 2 (BRONZE) */}
              <div className="flex flex-col items-center">
                {top3 ? (
                  <>
                    <div className="relative mb-1.5">
                      <img
                        src={top3.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96'}
                        alt={top3.displayName}
                        className="w-11 h-11 rounded-2xl object-cover border-2 border-amber-700 shadow-md bg-slate-800"
                      />
                      {top3.countryCode && (
                        <span className="absolute -bottom-1 -right-1 overflow-hidden rounded shadow-sm">
                          <CountryFlag countryCode={top3.countryCode} size="xs" />
                        </span>
                      )}
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-amber-700 text-white text-[9px] font-black shadow">
                        #3
                      </span>
                    </div>
                    <span className="font-bold text-[11px] text-slate-200 truncate max-w-[80px]" title={top3.displayName}>
                      {top3.displayName}
                    </span>
                    <span className="text-[11px] font-black text-amber-600 tabular-nums">
                      {formatScore(top3.score)}
                    </span>
                  </>
                ) : (
                  <div className="h-16 flex items-center justify-center text-[10px] text-slate-500">Chờ đấu sĩ</div>
                )}
                {/* Bronze Pedestal */}
                <div className="w-full h-8 mt-1 rounded-t-xl bg-gradient-to-b from-amber-700/20 to-slate-800/40 border-t border-amber-700/40 flex items-center justify-center font-black text-amber-600 text-sm">
                  3
                </div>
              </div>
            </div>
          </div>

          {/* 2.2 PERSONAL COMBATANT CARD (VỊ TRÍ CỦA BẠN) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/25 shadow-xl backdrop-blur-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>Thành Tích Cá Nhân</span>
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {userOverview ? `CEFR ${userOverview.englishLevel || 'B1'}` : 'Học Viên'}
                </span>
              </div>

              {/* Profile summary row */}
              <div className="flex items-center gap-3 py-3">
                <div className="relative shrink-0">
                  <img
                    src={user?.avatar || userOverview?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96'}
                    alt={user?.displayName || 'Learner'}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500/50 shadow bg-slate-800"
                  />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] shadow">
                    #{myRank?.rank || userOverview?.arenaRank || '–'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-sm text-white truncate">
                    {user?.displayName || 'Đấu Sĩ Khách'}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Thứ hạng: <b className="text-amber-400 font-black">#{myRank?.rank || userOverview?.arenaRank || 'Chưa xếp'}</b></span>
                    <span>·</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <ArrowUp className="w-3 h-3" />
                      <span>{myRank ? `${formatScore(myRank.score)} XP` : '0 XP'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Stat Grid */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[10px] font-bold text-slate-400 block">Tích Lũy</span>
                  <span className="font-black text-amber-400 text-sm tabular-nums">
                    {formatScore(userOverview?.lifetimePoints ?? myRank?.score ?? 0)} XP
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[10px] font-bold text-slate-400 block">Điểm Tuần</span>
                  <span className="font-black text-indigo-400 text-sm tabular-nums">
                    {formatScore(userOverview?.weeklyPoints ?? 0)} XP
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[10px] font-bold text-slate-400 block">Chuỗi Học</span>
                  <span className="font-black text-rose-400 text-sm flex items-center justify-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-rose-400" />
                    <span>{userOverview?.currentStreak ?? 0} ngày</span>
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/40">
                  <span className="text-[10px] font-bold text-slate-400 block">Trận Đã Đấu</span>
                  <span className="font-black text-emerald-400 text-sm tabular-nums">
                    {userOverview?.matchesPlayed ?? 0} trận
                  </span>
                </div>
              </div>

              {/* Badges preview */}
              {userOverview?.badges && userOverview.badges.length > 0 && (
                <div className="pt-2.5 flex flex-wrap items-center gap-1.5">
                  {userOverview.badges.slice(0, 3).map((bKey: string) => {
                    const badge = BADGE_MAP[bKey] || { label: bKey, icon: Star, color: 'bg-slate-800 text-slate-300' };
                    const IconC = badge.icon;
                    return (
                      <span
                        key={bKey}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                      >
                        <IconC className="w-2.5 h-2.5" />
                        <span>{badge.label}</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent Match Collapsible */}
            {userOverview?.recentMatches && userOverview.recentMatches.length > 0 && (
              <div className="pt-2 mt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 hover:text-white transition"
                >
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3 text-indigo-400" />
                    <span>Lịch sử 5 trận gần nhất</span>
                  </span>
                  {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showHistory && (
                  <div className="mt-2 space-y-1.5 max-h-28 overflow-y-auto pr-1">
                    {userOverview.recentMatches.slice(0, 5).map((m: any, idx: number) => (
                      <div
                        key={m.id || idx}
                        className="p-1.5 rounded-lg bg-slate-800/40 border border-slate-700/30 flex items-center justify-between text-[10px]"
                      >
                        <span className="font-semibold text-slate-300 truncate">{m.gameMode}</span>
                        <span className="font-black text-amber-400 tabular-nums">+{m.score} XP</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* ==================================================== */}
        {/* RIGHT PANE: FULL ESPORTS TABLE (SCROLLABLE INSIDE)   */}
        {/* ==================================================== */}
        <main
          className={`lg:col-span-7 xl:col-span-8 flex flex-col min-h-0 bg-slate-900/80 rounded-2xl sm:rounded-3xl border border-indigo-500/20 backdrop-blur-xl shadow-2xl overflow-hidden ${
            mobileViewTab === 'podium' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Table Header Row */}
          <div className="flex-none px-3 sm:px-5 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="w-7 text-center">Hạng</span>
              <span>Đấu Sĩ / Người Học</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <span className="hidden sm:inline">Cấp độ</span>
              <span className="hidden sm:inline">Chuỗi</span>
              <span className="text-right">Điểm số</span>
            </div>
          </div>

          {/* Table Body - Dedicated Smooth Scroll Container */}
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-slate-800/40 custom-scrollbar pr-0.5">
            {loading ? (
              <div className="p-8 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-800/50 animate-pulse" />
                ))}
              </div>
            ) : items.length > 0 ? (
              items.map((item) => {
                const isMe = item.userId === user?.id;
                return (
                  <div
                    key={item.userId + item.rank}
                    className={`px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between transition-colors ${
                      isMe
                        ? 'bg-indigo-950/40 border-l-4 border-indigo-500 shadow-sm'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Left: Rank + Avatar + Name */}
                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1 pr-2">
                      <span
                        className={`w-7 text-center font-black text-xs sm:text-sm shrink-0 ${
                          item.rank === 1
                            ? 'text-amber-400'
                            : item.rank === 2
                            ? 'text-slate-300'
                            : item.rank === 3
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}
                      >
                        #{item.rank}
                      </span>

                      <div className="relative shrink-0">
                        <img
                          src={item.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=96'}
                          alt={item.displayName}
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover bg-slate-800 border border-slate-700"
                        />
                        {item.countryCode && (
                          <span className="absolute -bottom-1 -right-1 overflow-hidden rounded shadow-sm">
                            <CountryFlag countryCode={item.countryCode} size="xs" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[120px] sm:max-w-xs">
                            {item.displayName}
                          </h4>
                          {isMe && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-indigo-500 text-white shrink-0">
                              BẠN
                            </span>
                          )}
                          {item.isFairPlayVerified && (
                            <span title="Fair-Play Verified" className="inline-flex items-center">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium truncate block">
                          CEFR {item.englishLevel || 'B1'} {item.gameMode ? `• ${item.gameMode}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Right: Streak + Score */}
                    <div className="flex items-center gap-3 sm:gap-6 shrink-0 text-right">
                      <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {item.englishLevel || 'B1'}
                      </span>

                      {(item.bestStreak !== undefined || item.currentStreak !== undefined) && (
                        <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-rose-400 tabular-nums">
                          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>{item.bestStreak ?? item.currentStreak}d</span>
                        </span>
                      )}

                      <span className="font-black text-xs sm:text-base text-amber-400 tabular-nums whitespace-nowrap">
                        {formatScore(item.score)} <small className="text-[10px] text-slate-400">XP</small>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center text-sm text-slate-400 space-y-2">
                <Trophy className="w-8 h-8 mx-auto text-slate-500 opacity-50" />
                <p>Chưa có dữ liệu thi đấu trong khung thời gian này.</p>
                <Link to="/games" className="text-indigo-400 font-bold hover:underline inline-block pt-1">
                  Hãy là người đầu tiên tham gia đấu trường!
                </Link>
              </div>
            )}
          </div>

          {/* Sticky Rank Footer if current user is not in top visible rows */}
          {myRank && (
            <div className="flex-none p-2.5 px-4 bg-indigo-950/80 border-t border-indigo-500/30 flex items-center justify-between text-xs backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-xs">
                  #{myRank.rank || '–'}
                </span>
                <span className="font-bold text-slate-200">
                  {user?.displayName || 'Bạn'}
                </span>
                <span className="text-slate-400 hidden sm:inline">· Thứ hạng hiện tại</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-black text-amber-400">{formatScore(myRank.score)} XP</span>
                <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[11px]">
                  <ArrowUp className="w-3 h-3" />
                  <span className="hidden sm:inline">Đang thăng hạng</span>
                </span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default LeaderboardPage;
