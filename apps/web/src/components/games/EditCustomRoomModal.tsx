import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Globe,
  Zap,
  Clock,
  Users,
  Shield,
  Save,
  Loader2,
} from 'lucide-react';
import api from '../../lib/api';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { CustomSelect, SelectOption } from '../ui/CustomSelect';

interface EditCustomRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: any | null;
  onRoomUpdated: (updatedRoom: any) => void;
}

const GAME_MODES = [
  { id: 'CLASSIC_QUIZ', name: 'Đại Chiến Trắc Nghiệm (Classic Quiz)' },
  { id: 'SURVIVAL', name: 'Đấu Trường Sinh Tồn 3 Mạng (Survival)' },
  { id: 'DUEL', name: 'Song Đấu 1vs1 Đối Kháng (Duel)' },
  { id: 'TEAM_BATTLE', name: 'Đại Chiến Bang Hội (Team Battle Red vs Blue)' },
  { id: 'WORD_RUSH', name: 'Word Rush — Giải Mã Ký Tự' },
  { id: 'BOSS_ROUND', name: 'Vòng Đấu Trùm (Boss Round x2 Điểm)' },
  { id: 'FINAL_SHOWDOWN', name: 'Chung Kết Quyết Đấu (Final Showdown x3 Điểm)' },
  { id: 'TRANSLATION_RUSH', name: 'Dịch Nhanh Song Ngữ (Translation Battle)' },
  { id: 'LISTENING_RUSH', name: 'Luyện Nghe Bắt Âm (Listening Battle)' },
];

const DIFFICULTY_OPTIONS: SelectOption<string>[] = [
  { value: 'BEGINNER', label: 'Cơ bản (A1-A2)' },
  { value: 'INTERMEDIATE', label: 'Trung cấp (B1-B2)' },
  { value: 'ADVANCED', label: 'Nâng cao (C1)' },
];

const ROUND_DURATION_OPTIONS: SelectOption<number>[] = [
  { value: 5, label: '5s (Chớp nhoáng)' },
  { value: 8, label: '8s (Tốc độ cao)' },
  { value: 10, label: '10s (Chuẩn thi đấu)' },
  { value: 12, label: '12s (Cân bằng)' },
  { value: 15, label: '15s (Tối đa)' },
];

const MAX_PLAYERS_OPTIONS: SelectOption<number>[] = [
  { value: 2, label: '2 người (1v1)' },
  { value: 4, label: '4 người (Nhóm nhỏ)' },
  { value: 8, label: '8 người (Tiêu chuẩn)' },
  { value: 16, label: '16 người (Đại tiệc)' },
  { value: 32, label: '32 người (Giải đấu)' },
  { value: 50, label: '50 người (Sự kiện)' },
];

export const EditCustomRoomModal: React.FC<EditCustomRoomModalProps> = ({
  isOpen,
  onClose,
  room,
  onRoomUpdated,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [gameMode, setGameMode] = useState('CLASSIC_QUIZ');
  const [difficulty, setDifficulty] = useState('INTERMEDIATE');
  const [roundDurationSec, setRoundDurationSec] = useState(15);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [hasPassword, setHasPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [penaltyForWrong, setPenaltyForWrong] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [showAnswerAfterEach, setShowAnswerAfterEach] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (room && isOpen) {
      setTitle(room.title || '');
      setDescription(room.description || '');
      setGameMode(room.gameMode || 'CLASSIC_QUIZ');
      setDifficulty(room.difficulty || 'INTERMEDIATE');
      setRoundDurationSec(room.roundDurationSec || 15);
      setMaxPlayers(room.maxPlayers || 8);
      setVisibility(room.visibility || 'PUBLIC');
      setHasPassword(Boolean(room.hasPassword));
      setPassword('');
      setPenaltyForWrong(Boolean(room.penaltyForWrong));
      setShuffleQuestions(room.shuffleQuestions !== false);
      setShuffleOptions(room.shuffleOptions !== false);
      setShowAnswerAfterEach(room.showAnswerAfterEach !== false);
      setError(null);
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Tên phòng không được để trống.');
      return;
    }
    if (hasPassword && password && password.trim().length < 3) {
      setError('Mật khẩu phòng tối thiểu phải có 3 ký tự.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload: any = {
        title: title.trim(),
        description: description.trim() || undefined,
        gameMode,
        difficulty,
        roundDurationSec,
        maxPlayers,
        visibility,
        penaltyForWrong,
        shuffleQuestions,
        shuffleOptions,
        showAnswerAfterEach,
      };

      if (hasPassword) {
        if (password.trim()) {
          payload.password = password.trim();
        }
      } else {
        payload.password = '';
      }

      const res: any = await api.patch(`/games/rooms/${room.roomCode}`, payload);
      const updated = res?.data?.data || res?.data || res;
      onRoomUpdated(updated);
      onClose();
    } catch (err: any) {
      console.error('Failed to update room:', err);
      setError(err?.response?.data?.message || 'Không thể cập nhật phòng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Chỉnh sửa phòng #{room.roomCode}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cập nhật thông số và chế độ trước khi bắt đầu trận
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Tên phòng đấu *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="Nhập tên phòng..."
              maxLength={80}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Mô tả phòng (tùy chọn)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              placeholder="Mô tả ngắn về phòng..."
              maxLength={150}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Chế độ thi đấu
              </label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {GAME_MODES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Thời gian mỗi câu
              </label>
              <select
                value={roundDurationSec}
                onChange={(e) => setRoundDurationSec(Number(e.target.value))}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {ROUND_DURATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Độ khó
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {!room.isLiveMode && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Người chơi tối đa
                </label>
                <select
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  {MAX_PLAYERS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Privacy & Password */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                <span>Công khai phòng:</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visibility === 'PUBLIC'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Công khai
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('PRIVATE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    visibility === 'PRIVATE'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Riêng tư
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Đặt mật khẩu phòng:</span>
              </span>
              <ToggleSwitch
                checked={hasPassword}
                onChange={setHasPassword}
              />
            </div>

            {hasPassword && (
              <div className="pt-1">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={room.hasPassword ? 'Nhập mật khẩu mới (hoặc để trống nếu giữ nguyên)' : 'Nhập mật khẩu phòng (tối thiểu 3 ký tự)...'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Rules */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Trừ điểm khi trả lời sai (-20%)</span>
              <ToggleSwitch checked={penaltyForWrong} onChange={setPenaltyForWrong} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Xáo trộn thứ tự câu hỏi</span>
              <ToggleSwitch checked={shuffleQuestions} onChange={setShuffleQuestions} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-700 dark:text-slate-300">Xáo trộn các đáp án A/B/C/D</span>
              <ToggleSwitch checked={shuffleOptions} onChange={setShuffleOptions} />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thay đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
