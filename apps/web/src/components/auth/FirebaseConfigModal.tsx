import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
  Lightbulb,
  Clipboard,
  Edit3,
  Zap,
  Loader2,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  isFirebaseConfigured,
  saveFirebaseConfig,
  clearFirebaseConfig,
  testFirebaseConnection,
  FirebaseClientConfig,
  FirebaseConnectionTestResult,
} from '../../lib/firebase';
import { confirmModal } from '../common/ConfirmDialog';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'smart' | 'manual'>('smart');
  const [pasteSnippet, setPasteSnippet] = useState('');
  const [config, setConfig] = useState<FirebaseClientConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<FirebaseConnectionTestResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const current = getActiveFirebaseConfig();
      setConfig(current);
      setIsReady(isFirebaseConfigured());
      setStatusMsg(null);
      setTestResult(null);
      setPasteSnippet('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Smart Parser for pasting Firebase snippet
  const handleParseSnippet = (text: string) => {
    setPasteSnippet(text);
    setStatusMsg(null);
    setTestResult(null);

    const extract = (key: string): string => {
      const regex = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"]([^'"]+)['"]`, 'i');
      const match = text.match(regex);
      return match ? match[1] : '';
    };

    const apiKey = extract('apiKey');
    const authDomain = extract('authDomain');
    const projectId = extract('projectId');
    const storageBucket = extract('storageBucket');
    const messagingSenderId = extract('messagingSenderId');
    const appId = extract('appId');

    if (apiKey || projectId) {
      setConfig((prev) => ({
        ...prev,
        apiKey: apiKey || prev.apiKey,
        authDomain: authDomain || prev.authDomain,
        projectId: projectId || prev.projectId,
        storageBucket: storageBucket || prev.storageBucket,
        messagingSenderId: messagingSenderId || prev.messagingSenderId,
        appId: appId || prev.appId,
      }));
      setStatusMsg({
        type: 'success',
        text: 'Đã tự động trích xuất các thông số Firebase! Bấm "Kiểm Tra Kết Nối" để xác thực với Google.',
      });
    }
  };

  const handleTestConnection = async () => {
    setStatusMsg(null);
    setTestResult(null);

    if (!config.apiKey || !config.projectId) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng cung cấp đầy đủ API Key và Project ID trước khi kiểm tra!',
      });
      return;
    }

    setTesting(true);
    try {
      const res = await testFirebaseConnection(config);
      setTestResult(res);
      setStatusMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!config.apiKey || !config.projectId) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng cung cấp tối thiểu apiKey và projectId từ Firebase Console!',
      });
      return;
    }

    setSaving(true);
    try {
      // Real test before saving!
      const test = await testFirebaseConnection(config);
      setTestResult(test);

      if (!test.success) {
        setStatusMsg({
          type: 'error',
          text: `Kiểm tra thất bại: ${test.message}. Không thể kích hoạt cấu hình chưa được kiểm chứng.`,
        });
        return;
      }

      await saveFirebaseConfig(config);
      setIsReady(true);
      setStatusMsg({
        type: 'success',
        text: `Kiểm tra kết nối thành công (${test.latencyMs}ms)! Đã kích hoạt Firebase OAuth.`,
      });
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err?.message || 'Không thể lưu cấu hình Firebase.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const ok = await confirmModal({
      title: 'Xóa cấu hình Firebase',
      message: 'Bạn có chắc chắn muốn xóa cấu hình Firebase đã lưu trên trình duyệt?',
      type: 'danger',
      confirmText: 'Xóa cấu hình',
      cancelText: 'Hủy bỏ',
    });
    if (ok) {
      await clearFirebaseConfig();
      setConfig({
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
      });
      setIsReady(false);
      setStatusMsg({
        type: 'success',
        text: 'Đã xóa cấu hình Firebase cục bộ.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 space-y-5 text-slate-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-extrabold text-white">Cấu hình Firebase OAuth</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    isReady
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isReady ? 'Đang hoạt động' : 'Chưa kết nối'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kích hoạt Google OAuth & Facebook OAuth thực tế trên trình duyệt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice banner */}
        <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            Bạn có thể lấy cấu hình này tại:
            <a
              href="https://console.firebase.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-cyan-400 hover:underline font-semibold inline-flex items-center gap-1"
            >
              Firebase Console <ExternalLink className="w-3 h-3" />
            </a>
            {' '}&rarr; Project Settings &rarr; Your apps &rarr; Web app. Dán vào đây là hệ thống tự kết nối ngay lập tức mà không cần build lại Docker!
          </div>
        </div>

        {/* Tabs: Smart Paste vs Manual Fields */}
        <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-800/80 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('smart')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'smart'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>Dán nhanh đoạn mã Firebase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Nhập từng thông số</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5">
          {activeTab === 'smart' ? (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Dán toàn bộ đoạn mã cấu hình từ Firebase Console:
              </label>
              <textarea
                rows={5}
                value={pasteSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "vocabflow.firebaseapp.com",\n  projectId: "vocabflow",\n  appId: "1:..."\n};`}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700/80 tabular-nums text-xs text-cyan-300 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Hệ thống sẽ tự động quét và điền các trường `apiKey`, `projectId`, `authDomain`...</span>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  API Key *
                </label>
                <input
                  type="text"
                  required
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 tabular-nums text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Project ID *
                </label>
                <input
                  type="text"
                  required
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value.trim() })}
                  placeholder="my-vocab-project"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 tabular-nums text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value.trim() })}
                  placeholder="my-project.firebaseapp.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 tabular-nums text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                  App ID
                </label>
                <input
                  type="text"
                  value={config.appId || ''}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value.trim() })}
                  placeholder="1:123456:web:..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 tabular-nums text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          )}

          {/* Quick Preview of Parsed State */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Trạng thái thiết lập:
            </div>
            <div className="flex items-center justify-between">
              <span>API Key:</span>
              <span className="tabular-nums text-cyan-400">
                {config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'Chưa có'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Project ID:</span>
              <span className="tabular-nums text-cyan-400">{config.projectId || 'Chưa có'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Auth Domain:</span>
              <span className="tabular-nums text-cyan-400">{config.authDomain || 'Chưa có'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 gap-3">
            {isReady ? (
              <button
                type="button"
                onClick={handleClear}
                className="py-2.5 px-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa cấu hình</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                disabled={testing || saving || !config.apiKey}
                onClick={handleTestConnection}
                className="py-2.5 px-3.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{testing ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                Đóng
              </button>

              <button
                type="submit"
                disabled={saving || testing}
                className="py-2.5 px-4 rounded-2xl btn-glass-primary text-white text-xs font-extrabold shadow-lg shadow-cyan-500/25 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang kiểm tra & lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu & Kích Hoạt OAuth</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
