import React, { useState } from 'react';
import { Lock, X, ArrowRight, KeyRound } from 'lucide-react';
import api from '../../lib/api';

interface EnterRoomPasswordModalProps {
  isOpen: boolean;
  roomCode: string;
  roomTitle: string;
  onClose: () => void;
  onSuccess: (roomCode: string) => void;
}

export const EnterRoomPasswordModal: React.FC<EnterRoomPasswordModalProps> = ({
  isOpen,
  roomCode,
  roomTitle,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Vui lòng nhập mật khẩu phòng.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await api.post(`/games/rooms/${roomCode}/verify-password`, { password });
      onSuccess(roomCode);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Mật khẩu không chính xác. Vui lòng thử lại!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl text-white overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Phòng Được Khóa</h3>
              <p className="text-xs text-slate-400">#{roomCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
          <div className="text-[11px] font-bold text-slate-400">Tên phòng:</div>
          <div className="text-sm font-black text-white">{roomTitle}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Nhập Mật Khẩu Phòng
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu bí mật..."
                autoFocus
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Đang kiểm tra...</span>
              ) : (
                <>
                  <span>Xác Nhận Vào Phòng</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnterRoomPasswordModal;
