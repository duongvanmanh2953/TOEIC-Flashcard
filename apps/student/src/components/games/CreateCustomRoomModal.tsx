import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  Lock,
  Globe,
  Sliders,
  Sparkles,
  HelpCircle,
  Zap,
  BookOpen,
  FileQuestion,
  GraduationCap,
  Layers,
  Clock,
  Users,
  Shield,
  CheckCircle2,
  Headphones,
  Flame,
  User,
  ExternalLink,
  UploadCloud,
  Radio,
  Video,
  Trophy,
} from 'lucide-react';
import api from '../../lib/api';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';
import { useLearning } from '../../contexts/LearningContext';
import { CountryFlag } from '../language/CountryFlag';
import { TikTokLogo } from '@vocabflow/shared';

interface CreateCustomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
  initialRoomType?: 'PVP' | 'TIKTOK_LIVE';
}

const GAME_MODES = [
  {
    id: 'CLASSIC_QUIZ',
    name: 'Đại Chiến Trắc Nghiệm (Classic Quiz)',
    icon: Sparkles,
    desc: 'Trắc nghiệm 4 lựa chọn phản xạ tốc độ cao, điểm cộng chuỗi và độ chính xác.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'SURVIVAL',
    name: 'Đấu Trường Sinh Tồn 3 Mạng (Survival)',
    icon: Flame,
    desc: 'Mỗi người chơi có 3 tim. Trả lời sai mất 1 tim, hết mạng bị loại thành khán giả.',
    color: 'from-rose-500 to-amber-600',
  },
  {
    id: 'DUEL',
    name: 'Song Đấu 1vs1 Đối Kháng (Duel)',
    icon: Zap,
    desc: 'Ghép cặp so tài trực diện từng câu hỏi với luật tie-breaker công bằng.',
    color: 'from-amber-500 to-rose-600',
  },
  {
    id: 'TEAM_BATTLE',
    name: 'Đại Chiến Bang Hội (Team Battle Red vs Blue)',
    icon: Users,
    desc: 'Chia 2 phe Đỏ / Xanh, điểm số chuẩn hóa theo tỷ lệ người chơi hợp lệ.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'WORD_RUSH',
    name: 'Word Rush — Giải Mã Ký Tự',
    icon: BookOpen,
    desc: 'Sắp xếp ký tự xáo trộn, gõ từ vựng nhanh và xử lý chuẩn hóa Unicode.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'BOSS_ROUND',
    name: 'Vòng Đấu Trùm (Boss Round x2 Điểm)',
    icon: Shield,
    desc: 'Bộ câu hỏi nâng cao, điểm thưởng x2, phân tích kiến thức chuyên sâu sau vòng.',
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'FINAL_SHOWDOWN',
    name: 'Chung Kết Quyết Đấu (Final Showdown x3 Điểm)',
    icon: Trophy,
    desc: '3 câu hỏi đỉnh cao quyết định ngôi vị Quán Quân với hệ số nhân x3 điểm.',
    color: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'TRANSLATION_RUSH',
    name: 'Dịch Nhanh Song Ngữ (Translation Battle)',
    icon: Zap,
    desc: 'Phản xạ dịch từ vựng song ngữ theo thời gian thực.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'LISTENING_RUSH',
    name: 'Luyện Nghe Bắt Âm (Listening Battle)',
    icon: Headphones,
    desc: 'Phát âm thanh từ vựng, người chơi nghe và chọn đáp án chính xác.',
    color: 'from-blue-500 to-cyan-600',
  },
];

const QUESTION_SOURCES = [
  {
    id: 'SYSTEM_PRESET',
    title: 'Ngân Hàng Hệ Thống',
    desc: 'Bộ câu hỏi chuẩn kiểm duyệt của VocabFlow theo cấp độ CEFR',
    icon: Sparkles,
  },
  {
    id: 'COMMUNITY_MY_DECKS',
    title: 'Đề Của Tôi (Cộng Đồng)',
    desc: 'Bộ đề bạn đã tạo hoặc đẩy lên cộng đồng (cần Admin duyệt để public)',
    icon: User,
  },
  {
    id: 'COMMUNITY_PUBLIC_DECKS',
    title: 'Đề Cộng Đồng (Public)',
    desc: 'Bộ đề thi đấu được học viên đóng góp và Admin đã phê duyệt',
    icon: Globe,
  },
  {
    id: 'VOCABULARY_DECK',
    title: 'Chủ Đề Từ Vựng TOEIC',
    desc: 'Thi đấu trực tiếp trên các bộ từ vựng theo chủ đề TOEIC',
    icon: BookOpen,
  },
  {
    id: 'QUESTION_BANK',
    title: 'Bộ Đề Thi TOEIC/IELTS',
    desc: 'Lấy câu hỏi trắc nghiệm từ ngân hàng đề thi thực chiến',
    icon: GraduationCap,
  },
];

const DIFFICULTY_OPTIONS: SelectOption<string>[] = [
  { value: 'BEGINNER', label: 'Cơ bản (A1-A2)' },
  { value: 'INTERMEDIATE', label: 'Trung cấp (B1-B2)' },
  { value: 'ADVANCED', label: 'Nâng cao (C1)' },
];

const QUESTION_COUNT_OPTIONS: SelectOption<number>[] = [
  { value: 5, label: '5 câu' },
  { value: 10, label: '10 câu' },
  { value: 15, label: '15 câu' },
  { value: 20, label: '20 câu' },
  { value: 25, label: '25 câu' },
  { value: 30, label: '30 câu' },
];

const ROUND_DURATION_OPTIONS: SelectOption<number>[] = [
  { value: 5, label: '5s (Chớp nhoáng)' },
  { value: 8, label: '8s (Tốc độ cao)' },
  { value: 10, label: '10s (Chuẩn thi đấu)' },
  { value: 12, label: '12s (Cân bằng)' },
  { value: 15, label: '15s (Tối đa)' },
];

const MAX_PLAYERS_OPTIONS: SelectOption<number>[] = [
  { value: 1, label: '1 người (Solo)' },
  { value: 2, label: '2 người (1v1)' },
  { value: 4, label: '4 người (Nhóm nhỏ)' },
  { value: 8, label: '8 người (Tiêu chuẩn)' },
  { value: 16, label: '16 người (Đại tiệc)' },
  { value: 32, label: '32 người (Giải đấu)' },
  { value: 50, label: '50 người (Sự kiện)' },
  { value: 100, label: '100 người (Đại hội)' },
];

const THEME_OPTIONS = [
  { id: 'cyan', name: 'Electric Cyan', hex: '#06B6D4', border: 'border-cyan-400', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' },
  { id: 'indigo', name: 'Astral Indigo', hex: '#6366F1', border: 'border-indigo-400', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40' },
  { id: 'rose', name: 'Crimson Survival', hex: '#F43F5E', border: 'border-rose-400', badge: 'bg-rose-500/20 text-rose-300 border-rose-400/40' },
  { id: 'amber', name: 'Golden Champion', hex: '#F59E0B', border: 'border-amber-400', badge: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  { id: 'emerald', name: 'Cyber Emerald', hex: '#10B981', border: 'border-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
  { id: 'violet', name: 'Galactic Violet', hex: '#8B5CF6', border: 'border-purple-400', badge: 'bg-purple-500/20 text-purple-300 border-purple-400/40' },
];

export const CreateCustomRoomModal: React.FC<CreateCustomRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
  initialRoomType = 'PVP',
}) => {
  const { activeLanguage } = useLearning();
  const languageId = activeLanguage.id;
  const roomType = initialRoomType;
  const [activeTab, setActiveTab] = useState<'mode' | 'questions' | 'rules'>('mode');
  const [themeColor, setThemeColor] = useState<string>('cyan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameMode, setGameMode] = useState('TRANSLATION_RUSH');
  const [sourceType, setSourceType] = useState('SYSTEM_PRESET');
  const [sourceId, setSourceId] = useState<string>('');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [questionCount, setQuestionCount] = useState(10);
  const [roundDurationSec, setRoundDurationSec] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);
  const [penaltyForWrong, setPenaltyForWrong] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswerAfterEach, setShowAnswerAfterEach] = useState(true);

  // Load saved room config
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vocabflow_live_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.gameMode) setGameMode(parsed.gameMode);
        if (parsed.difficulty) setDifficulty(parsed.difficulty);
        if (parsed.questionCount) setQuestionCount(parsed.questionCount);
        if (parsed.roundDurationSec) setRoundDurationSec(Math.min(15, Number(parsed.roundDurationSec)));
        if (parsed.sourceType) setSourceType(parsed.sourceType);
      }
    } catch (_) {}
  }, [initialRoomType, isOpen]);

  const [topics, setTopics] = useState<Array<{ id: string; name: string }>>([]);
  const [exams, setExams] = useState<Array<{ id: string; title: string }>>([]);
  const [myDecks, setMyDecks] = useState<Array<any>>([]);
  const [publicDecks, setPublicDecks] = useState<Array<any>>([]);
  const [loadingSources, setLoadingSources] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    setSourceId('');
    setTopics([]);
    setExams([]);
    setMyDecks([]);
    setPublicDecks([]);
    const fetchSourceData = async () => {
      try {
        setLoadingSources(true);
        const query = new URLSearchParams({ languageId });
        const options = { signal: controller.signal };
        const [topicsRes, examsRes, myDecksRes, publicDecksRes] = await Promise.allSettled([
          api.get(`/vocabulary/topics?${query}`, options),
          api.get(`/exams?${query}`, options),
          api.get(`/community/my-decks?${query}`, options),
          api.get('/community/decks', options),
        ]);

        if (controller.signal.aborted) return;

        if (topicsRes.status === 'fulfilled') {
          const list = (topicsRes.value as any)?.data?.data || (topicsRes.value as any)?.data || topicsRes.value;
          if (Array.isArray(list)) setTopics(list);
        }

        if (examsRes.status === 'fulfilled') {
          const list = (examsRes.value as any)?.data?.data || (examsRes.value as any)?.data || examsRes.value;
          if (Array.isArray(list)) setExams(list);
        }

        if (myDecksRes.status === 'fulfilled') {
          const list = (myDecksRes.value as any)?.data?.data || (myDecksRes.value as any)?.data || myDecksRes.value;
          if (Array.isArray(list)) setMyDecks(list);
        }

        if (publicDecksRes.status === 'fulfilled') {
          const list = (publicDecksRes.value as any)?.data?.data || (publicDecksRes.value as any)?.data || publicDecksRes.value;
          if (Array.isArray(list)) setPublicDecks(list.filter((deck) => deck.languageId === languageId));
        }
      } catch (e) {
        console.warn('Failed to prefetch room sources:', e);
      } finally {
        if (!controller.signal.aborted) setLoadingSources(false);
      }
    };

    fetchSourceData();
    return () => controller.abort();
  }, [isOpen, languageId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên phòng thi đấu.');
      return;
    }
    if (hasPassword && (!password || password.trim().length < 3)) {
      setError('Mật khẩu phòng tối thiểu phải có 3 ký tự.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Map community deck sources to VOCABULARY_DECK for database enum compatibility
      const effectiveSourceType =
        sourceType === 'COMMUNITY_MY_DECKS' || sourceType === 'COMMUNITY_PUBLIC_DECKS'
          ? 'VOCABULARY_DECK'
          : sourceType;

      const isLive = roomType === 'TIKTOK_LIVE';
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        languageId,
        isLiveMode: isLive,
        gameMode,
        sourceType: effectiveSourceType,
        sourceId: sourceId || undefined,
        difficulty,
        questionCount,
        roundDurationSec,
        maxPlayers: isLive ? 10000 : maxPlayers,
        allowLateJoin: isLive ? true : undefined,
        visibility,
        password: hasPassword ? password.trim() : undefined,
        penaltyForWrong,
        shuffleQuestions,
        shuffleOptions,
        showAnswerAfterEach,
      };

      if (isLive) {
        localStorage.setItem(
          'vocabflow_live_config',
          JSON.stringify({
            gameMode,
            difficulty,
            questionCount,
            roundDurationSec,
            sourceType: effectiveSourceType,
          }),
        );
      }

      const res: any = await api.post('/games/rooms', payload);
      const room = res?.data?.data || res?.data || res;
      onRoomCreated({ ...room, themeColor, gameMode });
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(
        err?.response?.data?.message || err?.message || 'Không thể tạo phòng đấu. Vui lòng thử lại!',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md animate-fade-in overscroll-contain">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl text-white my-auto max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{roomType === 'TIKTOK_LIVE' ? 'Tạo phòng Live' : 'Tạo Phòng Đấu Bạn Bè'}</h2>
              <p className="text-xs text-slate-400">
                Tùy chỉnh chế độ, ngân hàng đề thi và quy tắc đối kháng riêng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step / Category Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('mode')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'mode'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="truncate">1. Chế Độ & Màu Sắc</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'questions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate">2. Đề Thi & Độ Khó</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white bg-slate-800/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="truncate">3. Quy Tắc & Bảo Mật</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto overscroll-contain flex-1 custom-scrollbar">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Language inherited from the current learning space */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-300">
            <span>Ngôn ngữ câu hỏi</span>
            <CountryFlag languageId={activeLanguage.id} countryCode={activeLanguage.countryCode} size="xs" />
            <strong className="text-white">{activeLanguage.name}</strong>
          </div>

          {/* TAB 1: MODE & THEME */}
          {activeTab === 'mode' && (
            <div className="space-y-5 animate-fade-in">
              {/* 1. Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Tên Phòng Đấu *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Đại Chiến TOEIC B1 - Nhóm Bạn Thân"
                maxLength={60}
                required
                className="w-full px-4 py-3 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm font-semibold focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Mô tả (Tùy chọn)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú ngắn về luật thi hoặc nhóm mục tiêu..."
                maxLength={120}
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-semibold focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* 2. Game Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Chế Độ Thi Đấu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {GAME_MODES.map((mode) => {
                const Icon = mode.icon;
                const isSelected = gameMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setGameMode(mode.id)}
                    className={`p-3 rounded-2xl text-left border transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${mode.color} text-white flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white">{mode.name}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{mode.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Arena Theme Color Swatches */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Màu Sắc Viền & Đấu Trường (Theme Color)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {THEME_OPTIONS.map((th) => {
                const isSelected = themeColor === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setThemeColor(th.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? `border-white ring-2 ring-white/30 bg-slate-800 shadow-md`
                        : 'border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: th.hex }}
                    />
                    <span className="text-xs font-bold text-white truncate">{th.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chamfered Cut-Edge Arena HUD Live Preview */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Xem Trước Viền Đấu Trường & Màu Sắc (Chamfered HUD)
            </span>
            <div
              className="p-4 rounded-2xl bg-[#0B1228] border-2 relative overflow-hidden transition-all duration-300 shadow-xl"
              style={{
                borderColor: THEME_OPTIONS.find((t) => t.id === themeColor)?.hex || '#06B6D4',
                boxShadow: `0 0 24px ${THEME_OPTIONS.find((t) => t.id === themeColor)?.hex}33`,
              }}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full animate-ping"
                    style={{ backgroundColor: THEME_OPTIONS.find((t) => t.id === themeColor)?.hex || '#06B6D4' }}
                  />
                  <strong className="text-white font-black">{title || 'Đại Chiến Từ Vựng VocabFlow'}</strong>
                </div>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider"
                  style={{
                    color: THEME_OPTIONS.find((t) => t.id === themeColor)?.hex || '#06B6D4',
                    border: `1px solid ${THEME_OPTIONS.find((t) => t.id === themeColor)?.hex}66`,
                  }}
                >
                  {gameMode}
                </span>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 text-xs">
                <div
                  className="p-2 rounded-xl flex items-center gap-1.5 font-mono font-bold"
                  style={{
                    color: THEME_OPTIONS.find((t) => t.id === themeColor)?.hex || '#06B6D4',
                    background: `${THEME_OPTIONS.find((t) => t.id === themeColor)?.hex}15`,
                  }}
                >
                  <span>⏱️ {roundDurationSec}s / câu</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Các viền cắt vát góc và đồng hồ sẽ hiển thị chuẩn tone màu này
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTIONS & DIFFICULTY */}
      {activeTab === 'questions' && (
        <div className="space-y-5 animate-fade-in">
          {/* 3. Question Source */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Nguồn Đề Thi & Dữ Liệu
              </label>

              {/* Action Link to Community Decks for uploading/submitting decks */}
              <a
                href="/community"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition font-bold"
                title="Tạo bộ đề mới hoặc import từ Excel/Word để đẩy lên chờ Admin duyệt"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Sang Cộng Đồng Bộ Đề Đẩy Đề Mới</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUESTION_SOURCES.map((src) => {
                const Icon = src.icon;
                const isSelected = sourceType === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => {
                      setSourceType(src.id);
                      setSourceId('');
                    }}
                    className={`p-3 rounded-2xl text-left border transition flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-700/60 text-purple-300 flex items-center justify-center shrink-0 border border-slate-600/40">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white">{src.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">{src.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* A. My Decks from Community */}
            {sourceType === 'COMMUNITY_MY_DECKS' && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3 animate-fade-in">
                {myDecks.length > 0 ? (
                  <CustomSelect
                    label="Chọn Bộ Đề Của Bạn"
                    value={sourceId}
                    onChange={(val) => setSourceId(String(val))}
                    placeholder={loadingSources ? 'Đang tải bộ đề...' : 'Chọn một bộ đề của bạn...'}
                    searchable
                    searchPlaceholder="Tìm kiếm bộ đề của tôi..."
                    size="sm"
                    disabled={loadingSources}
                    options={[
                      { value: '', label: 'Tất cả các từ vựng của tôi (Ngẫu nhiên)', icon: BookOpen },
                      ...myDecks.map((d) => ({
                        value: d.id,
                        label: `${d.title} (${d._count?.words || d.words?.length || 0} từ)`,
                        badge: d.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ Admin duyệt',
                        badgeColor:
                          d.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                        icon: BookOpen,
                      })),
                    ]}
                    menuClassName="dark"
                    buttonClassName="bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-white font-medium text-xs"
                  />
                ) : (
                  <div className="text-center py-3 space-y-2">
                    <p className="text-xs text-slate-300">
                      Bạn chưa có bộ đề nào trong Cộng đồng bộ đề.
                    </p>
                    <a
                      href="/community"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Tạo & Đẩy Đề Lên Cộng Đồng Ngay</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* B. Public Community Decks */}
            {sourceType === 'COMMUNITY_PUBLIC_DECKS' && (
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 animate-fade-in">
                <CustomSelect
                  label="Chọn Bộ Đề Cộng Đồng Đã Duyệt"
                  value={sourceId}
                  onChange={(val) => setSourceId(String(val))}
                  placeholder={loadingSources ? 'Đang tải đề cộng đồng...' : 'Chọn một bộ đề cộng đồng...'}
                  searchable
                  searchPlaceholder="Tìm kiếm đề cộng đồng..."
                  size="sm"
                  disabled={loadingSources}
                  options={[
                    { value: '', label: 'Bộ đề cộng đồng nổi bật nhất', icon: Globe },
                    ...publicDecks.map((d) => ({
                      value: d.id,
                      label: `${d.title} (${d._count?.words || d.words?.length || 0} từ)`,
                      badge: d.category || 'General',
                      badgeColor: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
                      icon: Globe,
                    })),
                  ]}
                  menuClassName="dark"
                  buttonClassName="bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-white font-medium text-xs"
                />
              </div>
            )}

            {/* C. System Topic Decks */}
            {sourceType === 'VOCABULARY_DECK' && (
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5 animate-fade-in">
                <CustomSelect
                  label="Bộ từ, tiến độ hoặc chủ đề"
                  value={sourceId}
                  onChange={(val) => setSourceId(String(val))}
                  placeholder={loadingSources ? 'Đang tải chủ đề...' : 'Tất cả chủ đề từ vựng (Ngẫu nhiên)'}
                  searchable
                  searchPlaceholder="Tìm kiếm chủ đề từ vựng..."
                  size="sm"
                  disabled={loadingSources}
                  options={[
                    { value: '', label: 'Tất cả chủ đề từ vựng', icon: BookOpen },
                    { value: 'progress:learned', label: 'Từ đã học' },
                    { value: 'progress:favorites', label: 'Từ yêu thích' },
                    { value: 'progress:flagged', label: 'Từ đánh dấu khó' },
                    { value: 'progress:mistakes', label: 'Từ có lỗi đã ôn trong 30 ngày qua' },
                    { value: 'progress:weak', label: 'Từ chưa thành thạo' },
                    { value: 'progress:due', label: 'Từ đến hạn ôn' },
                    ...topics.map((t) => ({
                      value: t.id,
                      label: t.name,
                      icon: BookOpen,
                    })),
                  ]}
                  menuClassName="dark"
                  buttonClassName="bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-white font-medium text-xs"
                />
              </div>
            )}

            {sourceType === 'QUESTION_BANK' && (
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 animate-fade-in">
                <CustomSelect
                  label="Chọn Bộ Đề Thi TOEIC/IELTS"
                  value={sourceId}
                  onChange={(val) => setSourceId(String(val))}
                  placeholder={loadingSources ? 'Đang tải đề thi...' : 'Tất cả bộ đề thi (Ngẫu nhiên)'}
                  searchable
                  searchPlaceholder="Tìm kiếm đề thi..."
                  size="sm"
                  disabled={loadingSources}
                  options={[
                    { value: '', label: 'Tất cả bộ đề thi (Ngẫu nhiên)', icon: GraduationCap },
                    ...exams.map((ex) => ({
                      value: ex.id,
                      label: ex.title,
                      icon: GraduationCap,
                    })),
                  ]}
                  menuClassName="dark"
                  buttonClassName="bg-slate-800/95 hover:bg-slate-800 border-slate-700 text-white font-medium text-xs"
                />
              </div>
            )}
          </div>

          {/* 4. Match Parameters (Cohesive styled CustomSelect Dropdowns) */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Thông Số Trận Đấu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Difficulty */}
              <CustomSelect
                label="Cấp độ"
                value={difficulty}
                onChange={(val) => setDifficulty(String(val))}
                size="sm"
                options={DIFFICULTY_OPTIONS}
                menuClassName="dark"
                buttonClassName="bg-slate-800/90 hover:bg-slate-800 border-slate-700/90 text-white font-semibold text-xs"
              />

              {/* Question Count */}
              <CustomSelect
                label="Số câu hỏi"
                value={questionCount}
                onChange={(val) => setQuestionCount(Number(val))}
                size="sm"
                options={QUESTION_COUNT_OPTIONS}
                menuClassName="dark"
                buttonClassName="bg-slate-800/90 hover:bg-slate-800 border-slate-700/90 text-white font-semibold text-xs"
              />

              {/* Round Duration */}
              <CustomSelect
                label="Thời gian/câu"
                value={roundDurationSec}
                onChange={(val) => setRoundDurationSec(Number(val))}
                size="sm"
                options={ROUND_DURATION_OPTIONS}
                menuClassName="dark"
                buttonClassName="bg-slate-800/90 hover:bg-slate-800 border-slate-700/90 text-white font-semibold text-xs"
              />

              {/* Max Players */}
              {roomType === 'TIKTOK_LIVE' ? (
                <div className="flex flex-col justify-end">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Người chơi tối đa
                  </label>
                  <div className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                    <TikTokLogo className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Không giới hạn (TikTok Live)</span>
                  </div>
                </div>
              ) : (
                <CustomSelect
                  label="Người chơi tối đa"
                  value={maxPlayers}
                  onChange={(val) => setMaxPlayers(Number(val))}
                  size="sm"
                  options={MAX_PLAYERS_OPTIONS}
                  menuClassName="dark"
                  buttonClassName="bg-slate-800/90 hover:bg-slate-800 border-slate-700/90 text-white font-semibold text-xs"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RULES & SECURITY */}
      {activeTab === 'rules' && (
        <div className="space-y-5 animate-fade-in">
          {/* 5. Privacy & Security */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Quyền Xem Phòng:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    visibility === 'PUBLIC'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Công khai (Public)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    visibility === 'PRIVATE'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  Riêng tư (Mã mời)
                </button>
              </div>
            </div>

            {/* Password toggle switch */}
            <div className="pt-3 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Bảo vệ bằng mật khẩu phòng</span>
                  <span className="text-[11px] text-slate-400">Yêu cầu người chơi nhập mật mã khi tham gia</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ToggleSwitch
                  checked={hasPassword}
                  onChange={setHasPassword}
                  size="sm"
                />
                {hasPassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mật khẩu (tối thiểu 3 ký tự)..."
                    maxLength={20}
                    className="px-3 py-1.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-xs font-mono focus:outline-none focus:border-amber-400 animate-fade-in"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 6. Advanced Rules (All Checkboxes Converted to Modern Toggle Switches) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Quy Tắc Đối Kháng (Tùy Chọn)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Trộn thứ tự câu hỏi</span>
                  <span className="text-[11px] text-slate-400">Đảo ngẫu nhiên câu hỏi mỗi trận</span>
                </div>
                <ToggleSwitch
                  checked={shuffleQuestions}
                  onChange={setShuffleQuestions}
                  size="sm"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Trộn các phương án</span>
                  <span className="text-[11px] text-slate-400">Đổi vị trí A, B, C, D</span>
                </div>
                <ToggleSwitch
                  checked={shuffleOptions}
                  onChange={setShuffleOptions}
                  size="sm"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Trừ điểm nếu trả lời sai</span>
                  <span className="text-[11px] text-slate-400">Phạt điểm chống đoán bừa</span>
                </div>
                <ToggleSwitch
                  checked={penaltyForWrong}
                  onChange={setPenaltyForWrong}
                  size="sm"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Hiện giải thích chi tiết</span>
                  <span className="text-[11px] text-slate-400">Hiển thị đáp án sau mỗi vòng</span>
                </div>
                <ToggleSwitch
                  checked={showAnswerAfterEach}
                  onChange={setShowAnswerAfterEach}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation & Submit */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          Hủy
        </button>

        <div className="flex items-center gap-2">
          {activeTab !== 'mode' && (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'rules' ? 'questions' : 'mode')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
            >
              Quay lại
            </button>
          )}

          {activeTab !== 'rules' ? (
            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'mode' ? 'questions' : 'rules')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              Tiếp theo
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Đang khởi tạo...</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Khởi Tạo Phòng Ngay</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomRoomModal;
