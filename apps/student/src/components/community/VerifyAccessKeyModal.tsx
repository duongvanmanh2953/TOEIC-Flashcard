import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import api from '../../lib/api';

interface VerifyAccessKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankType: 'VOCABULARY' | 'EXAM';
  bankId: string;
  bankTitle: string;
  bankOwnerName?: string;
  onSuccess: () => void;
  onContactOwner?: () => void;
}

export const VerifyAccessKeyModal: React.FC<VerifyAccessKeyModalProps> = ({
  isOpen,
  onClose,
  bankType,
  bankId,
  bankTitle,
  bankOwnerName,
  onSuccess,
  onContactOwner,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setErrorMessage('Vui lòng nhập mã Access Key của bạn');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const res: any = await api.post('/community/access-keys/verify', {
        bankType,
        bankId,
        accessKey: accessKey.trim(),
      });

      if (res?.data?.unlocked) {
        // Save unlock grant locally in session storage for frictionless browsing
        sessionStorage.setItem(`vf_unlocked_${bankType}_${bankId}`, 'true');
        onSuccess();
        onClose();
      } else {
        setErrorMessage('Mã Access Key không hợp lệ hoặc đã hết hạn');
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err?.message || 'Mã truy cập không hợp lệ',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Yêu cầu quyền truy cập</h2>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">
                {bankType === 'VOCABULARY' ? '📚' : '📝'} {bankTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Kho này được bảo vệ. Vui lòng nhập mã Access Key riêng được cấp bởi chủ kho{' '}
            <strong className="text-indigo-400">{bankOwnerName || 'sở hữu'}</strong> để mở khóa.
          </p>

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Mã Access Key của bạn:
            </label>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => setAccessKey(e.target.value)}
              placeholder="VD: VF-VCB-XXXX-XXXXXXXXXXXXXXXX"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl font-mono text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading || !accessKey.trim()}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Xác thực & Mở khóa kho
            </button>

            {onContactOwner && (
              <button
                type="button"
                onClick={() => {
                  onContactOwner();
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-700/60 transition flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Liên hệ chủ kho xin cấp quyền
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
