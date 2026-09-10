import React, { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Save,
  Trash2,
  ExternalLink,
  Sparkles,
  Shield,
  Key,
  Database,
  Globe,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import {
  getActiveFirebaseConfig,
  isFirebaseConfigured,
  saveFirebaseConfig,
  clearFirebaseConfig,
  FirebaseClientConfig,
} from '../../lib/firebase';

export const AdminFirebasePage: React.FC = () => {
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const current = getActiveFirebaseConfig();
    setConfig(current);
    setIsReady(isFirebaseConfigured());
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // Smart Parser for pasting Firebase snippet
  const handleParseSnippet = (text: string) => {
    setPasteSnippet(text);
    setStatusMsg(null);

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
        text: 'Đã tự động trích xuất các thông số Firebase từ đoạn mã bạn vừa dán!',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config.apiKey || !config.projectId) {
      setStatusMsg({
        type: 'error',
        text: 'Vui lòng cung cấp tối thiểu apiKey và projectId từ Firebase Console!',
      });
      return;
    }

    setSaving(true);
    try {
      await saveFirebaseConfig(config);
      setIsReady(true);
      setStatusMsg({
        type: 'success',
        text: 'Cấu hình Firebase đã được lưu thành công! Google OAuth & Facebook OAuth sẵn sàng hoạt động.',
      });
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
    if (window.confirm('Bạn có chắc chắn muốn xóa cấu hình Firebase đã lưu trên hệ thống?')) {
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
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Flame className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Cấu Hình Firebase & Social OAuth
              </h2>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                  isReady
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                }`}
              >
                {isReady ? '● Đang hoạt động' : '○ Chưa kết nối'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Quản lý API Key, Project ID và thông số kết nối Firebase phục vụ Google OAuth, Facebook OAuth và Cloud Services.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Integration Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Google OAuth</span>
            <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {isReady ? 'Sẵn sàng kích hoạt' : 'Cần API Key'}
          </p>
          <span className="text-[11px] text-slate-400 block">Đăng nhập 1-click cho học viên</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Facebook OAuth</span>
            <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-400'}`} />
          </div>
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">
            {isReady ? 'Sẵn sàng kích hoạt' : 'Cần API Key'}
          </p>
          <span className="text-[11px] text-slate-400 block">Đăng nhập mạng xã hội</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Project ID</span>
            <Database className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">
            {config.projectId || 'Chưa thiết lập'}
          </p>
          <span className="text-[11px] text-slate-400 block">Dự án Firebase kết nối</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Auth Domain</span>
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
            {config.authDomain || 'Chưa thiết lập'}
          </p>
          <span className="text-[11px] text-slate-400 block">Miền xác thực OAuth</span>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <strong>Hướng dẫn lấy cấu hình từ Firebase:</strong> Truy cập{' '}
          <a
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 dark:text-indigo-400 font-bold underline"
          >
            Firebase Console
          </a>{' '}
          &rarr; Chọn Project của bạn &rarr; <strong>Project Settings (Cài đặt dự án)</strong> &rarr; Mục <strong>Your apps</strong> &rarr; Chọn ứng dụng Web &rarr; Sao chép đoạn mã <code>const firebaseConfig = ...</code> và dán vào tab bên dưới. Cấu hình sẽ có hiệu lực ngay lập tức mà không cần build lại hệ thống!
        </div>
      </div>

      {/* Status Feedback Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between font-bold animate-in fade-in ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="underline text-[11px]">
            Đóng
          </button>
        </div>
      )}

      {/* Configuration Form Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-5">
        {/* Method Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('smart')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'smart'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>📋 Dán nhanh đoạn mã Firebase</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>✏️ Nhập từng thông số</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {activeTab === 'smart' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Dán toàn bộ đoạn mã cấu hình từ Firebase Console:
              </label>
              <textarea
                rows={6}
                value={pasteSnippet}
                onChange={(e) => handleParseSnippet(e.target.value)}
                placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "vocabflow.firebaseapp.com",\n  projectId: "vocabflow-prod",\n  storageBucket: "vocabflow-prod.appspot.com",\n  messagingSenderId: "123456789",\n  appId: "1:123456789:web:abcdef"\n};`}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-indigo-600 dark:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                💡 Hệ thống tự động phân tích và trích xuất các khóa <code>apiKey</code>, <code>projectId</code>, <code>authDomain</code>, <code>storageBucket</code>...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  API Key *
                </label>
                <input
                  type="text"
                  required
                  value={config.apiKey}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value.trim() })}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Project ID *
                </label>
                <input
                  type="text"
                  required
                  value={config.projectId}
                  onChange={(e) => setConfig({ ...config, projectId: e.target.value.trim() })}
                  placeholder="my-vocabflow-project"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Auth Domain
                </label>
                <input
                  type="text"
                  value={config.authDomain}
                  onChange={(e) => setConfig({ ...config, authDomain: e.target.value.trim() })}
                  placeholder="my-project.firebaseapp.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Storage Bucket
                </label>
                <input
                  type="text"
                  value={config.storageBucket || ''}
                  onChange={(e) => setConfig({ ...config, storageBucket: e.target.value.trim() })}
                  placeholder="my-project.appspot.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Messaging Sender ID
                </label>
                <input
                  type="text"
                  value={config.messagingSenderId || ''}
                  onChange={(e) => setConfig({ ...config, messagingSenderId: e.target.value.trim() })}
                  placeholder="1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  App ID
                </label>
                <input
                  type="text"
                  value={config.appId || ''}
                  onChange={(e) => setConfig({ ...config, appId: e.target.value.trim() })}
                  placeholder="1:1234567890:web:abcdef..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Current Extracted Parameters Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
            <span className="font-extrabold uppercase tracking-wider text-[10px] text-slate-400 block">
              Bản xem trước tham số đang nạp:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">apiKey:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[120px]">
                  {config.apiKey ? `${config.apiKey.slice(0, 10)}...` : '(trống)'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">projectId:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[120px]">
                  {config.projectId || '(trống)'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">authDomain:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate max-w-[120px]">
                  {config.authDomain || '(trống)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            {isReady ? (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa Cấu Hình</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl btn-glass-primary text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu & Kích Hoạt Firebase OAuth'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
