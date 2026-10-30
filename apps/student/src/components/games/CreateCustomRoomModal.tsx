import React, { useState } from 'react';
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
} from 'lucide-react';
import api from '../../lib/api';

interface CreateCustomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: any) => void;
}

const GAME_MODES = [
  {
    id: 'TRANSLATION_RUSH',
    name: 'Dịch Nhanh Song Ngữ',
    icon: Zap,
    desc: 'Phản xạ dịch Anh-Việt nhanh theo thời gian thực.',
    color: 'from-indigo-500 to-purple-600',
  },
  {
    id: 'WORD_BLITZ',
    name: 'Từ Vựng Cấp Tốc',
    icon: Sparkles,
    desc: 'Đấu trí tìm từ đồng nghĩa, từ trái nghĩa và định nghĩa.',
    color: 'from-amber-500 to-rose-600',
  },
  {
    id: 'SENTENCE_SPRINT',
    name: 'Ghép Câu Siêu Tốc',
    icon: BookOpen,
    desc: 'Hoàn thiện câu ngữ pháp hoàn chỉnh theo ngữ cảnh TOEIC.',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'MISSING_WORD',
    name: 'Điền Từ Khuyết',
    icon: FileQuestion,
    desc: 'Chọn từ chính xác điền vào chỗ trống trong đoạn văn.',
    color: 'from-sky-500 to-indigo-600',
  },
  {
    id: 'FOUR_SKILLS_ARENA',
    name: 'Đại Chiến 4 Kỹ Năng',
    icon: Layers,
    desc: 'Tổng hợp phản xạ: Nghe, Đọc hiểu, Dịch thuật, Ngữ pháp.',
    color: 'from-purple-500 to-pink-600',
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
    id: 'VOCABULARY_DECK',
    title: 'Bộ Thẻ Từ Cá Nhân',
    desc: 'Thi đấu trực tiếp trên các bộ từ vựng bạn đã lưu hoặc tạo',
    icon: BookOpen,
  },
  {
    id: 'QUESTION_BANK',
    title: 'Bộ Đề Thi TOEIC/IELTS',
    desc: 'Lấy câu hỏi trắc nghiệm từ ngân hàng đề thi thực chiến',
    icon: GraduationCap,
  },
  {
    id: 'GRAMMAR_EXERCISES',
    title: 'Chuyên Đề Ngữ Pháp',
    desc: 'Luyện câu hỏi các chủ điểm ngữ pháp và thì thông dụng',
    icon: Layers,
  },
];

export const CreateCustomRoomModal: React.FC<CreateCustomRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameMode, setGameMode] = useState('TRANSLATION_RUSH');
  const [sourceType, setSourceType] = useState('SYSTEM_PRESET');
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        gameMode,
        sourceType,
        difficulty,
        questionCount,
        roundDurationSec,
        maxPlayers,
        visibility,
        password: hasPassword ? password.trim() : undefined,
        penaltyForWrong,
        shuffleQuestions,
        shuffleOptions,
        showAnswerAfterEach,
      };

      const res: any = await api.post('/games/rooms', payload);
      const room = res?.data?.data || res?.data || res;
      onRoomCreated(room);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl shadow-2xl text-white my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Tạo Phòng Đấu Bạn Bè</h2>
              <p className="text-xs text-slate-400">
                Tùy chỉnh chế độ, ngân hàng đề thi và quy tắc đối kháng riêng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

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

          {/* 3. Question Source */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Nguồn Đề Thi & Dữ Liệu
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUESTION_SOURCES.map((src) => {
                const Icon = src.icon;
                const isSelected = sourceType === src.id;
                return (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSourceType(src.id)}
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
          </div>

          {/* 4. Match Parameters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            {/* Difficulty */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Cấp độ</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="BEGINNER">Cơ bản (A1-A2)</option>
                <option value="INTERMEDIATE">Trung cấp (B1-B2)</option>
                <option value="ADVANCED">Nâng cao (C1)</option>
              </select>
            </div>

            {/* Question Count */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Số câu hỏi</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={5}>5 câu</option>
                <option value={10}>10 câu</option>
                <option value={15}>15 câu</option>
                <option value={20}>20 câu</option>
              </select>
            </div>

            {/* Round Duration */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Thời gian/câu</label>
              <select
                value={roundDurationSec}
                onChange={(e) => setRoundDurationSec(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={10}>10 giây</option>
                <option value={15}>15 giây</option>
                <option value={20}>20 giây</option>
                <option value={30}>30 giây</option>
              </select>
            </div>

            {/* Max Players */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Người chơi tối đa</label>
              <select
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2 người (1v1)</option>
                <option value={4}>4 người</option>
                <option value={8}>8 người</option>
                <option value={16}>16 người</option>
              </select>
            </div>
          </div>

          {/* 5. Privacy & Security */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Quyền Xem Phòng:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    visibility === 'PUBLIC'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Công khai (Public)
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    visibility === 'PRIVATE'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  Riêng tư (Mã mời)
                </button>
              </div>
            </div>

            {/* Password toggle */}
            <div className="pt-2 border-t border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600 text-indigo-600 focus:ring-0"
                />
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Bảo vệ bằng mật khẩu phòng</span>
                </span>
              </label>

              {hasPassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  maxLength={20}
                  className="px-3 py-1.5 rounded-xl bg-slate-700 border border-slate-600 text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
              )}
            </div>
          </div>

          {/* 6. Advanced Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Trộn thứ tự câu hỏi</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <input
                type="checkbox"
                checked={shuffleOptions}
                onChange={(e) => setShuffleOptions(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Trộn các phương án A/B/C/D</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <input
                type="checkbox"
                checked={penaltyForWrong}
                onChange={(e) => setPenaltyForWrong(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Trừ điểm nếu trả lời sai</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <input
                type="checkbox"
                checked={showAnswerAfterEach}
                onChange={(e) => setShowAnswerAfterEach(e.target.checked)}
                className="rounded text-indigo-600"
              />
              <span>Hiện giải thích sau mỗi vòng</span>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCustomRoomModal;
