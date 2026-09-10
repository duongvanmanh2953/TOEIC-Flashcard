import React, { useState, useEffect } from 'react';
import {
  Server,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Zap,
  KeyRound,
  ShieldCheck,
  Radio,
  Cpu,
  Mail,
  Sparkles,
  Bot,
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';

interface ServiceItem {
  name: string;
  category?: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNCONFIGURED' | 'DOWN';
  configured: boolean;
  latencyMs: number;
  message?: string;
  details?: Record<string, any>;
}

interface SystemHealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'CONFIGURATION_REQUIRED' | 'CRITICAL';
  timestamp: string;
  uptimeSeconds: number;
  apiLatencyMs: number;
  activeAiProvider?: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  servicesList: ServiceItem[];
  summary?: {
    aiReady: boolean;
    emailReady: boolean;
    databaseReady: boolean;
  };
}

export const AdminSystemPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [aiProvider, setAiProvider] = useState<string>('auto');
  const [updatingProvider, setUpdatingProvider] = useState(false);
  const [providerNotice, setProviderNotice] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/health');
      const healthData = res?.data || res;
      setData(healthData);
      if (healthData?.activeAiProvider) {
        setAiProvider(healthData.activeAiProvider);
      }
      setLastCheck(new Date());
    } catch (err) {
      console.error('Failed to query system health:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (newProvider: string) => {
    setUpdatingProvider(true);
    setProviderNotice('');
    try {
      await api.post('/health/ai-provider', { provider: newProvider });
      setAiProvider(newProvider);
      setProviderNotice(`Đã chuyển AI Provider sang: ${newProvider.toUpperCase()}`);
      fetchHealth();
    } catch (err) {
      console.error('Failed to change AI provider:', err);
    } finally {
      setUpdatingProvider(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const timer = setInterval(fetchHealth, 15000); // 15s auto-check
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const getStatusBadge = (status: ServiceItem['status']) => {
    switch (status) {
      case 'HEALTHY':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            HOẠT ĐỘNG TỐT
          </span>
        );
      case 'UNCONFIGURED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <KeyRound className="w-3 h-3 text-amber-500" />
            CHƯA CẤU HÌNH KEY
          </span>
        );
      case 'DEGRADED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border border-yellow-500/30 flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            CẢNH BÁO / DỰ PHÒNG
          </span>
        );
      case 'DOWN':
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <XCircle className="w-3 h-3 text-rose-500" />
            OFFLINE / DOWN
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Server className="w-7 h-7 text-indigo-500" />
            <span>Giám Sát Hạ Tầng & Dịch Vụ Bên Thứ 3</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            Kiểm tra trạng thái thời gian thực của OpenAI, Google Gemini, Nodemailer SMTP, Cổng thanh toán và Database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Lần kiểm tra cuối: {lastCheck.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="btn-glass-secondary px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border shadow-sm"
            title="Làm mới"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Kiểm Tra Ping Key Ngay</span>
          </button>
        </div>
      </div>

      {/* AI Provider Switcher & Failover Control Plane */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase">
              <Bot className="w-3.5 h-3.5" />
              <span>Cấu Hình Động AI Provider</span>
            </div>
            <h2 className="text-xl font-black">
              Chế Độ Vận Hành Gia Sư AI: <span className="text-amber-400 uppercase">{aiProvider}</span>
            </h2>
            <p className="text-xs text-slate-300">
              Nếu OpenAI không có Key hoặc hết hạn ngạch (Quota limit), hệ thống sẽ tự động chuyển đổi mượt mà sang Google Gemini AI.
            </p>
          </div>

          {providerNotice && (
            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold animate-fade-in">
              {providerNotice}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Option 1: Auto Failover */}
          <button
            type="button"
            disabled={updatingProvider}
            onClick={() => handleProviderChange('auto')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              aiProvider === 'auto'
                ? 'bg-indigo-600/40 border-indigo-400 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              {aiProvider === 'auto' && (
                <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Đang Kích Hoạt
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-white">Auto Failover (Khuyến Nghị)</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Thử OpenAI trước; nếu hết quota/lỗi key sẽ tự động chuyển sang Google Gemini AI.
            </p>
          </button>

          {/* Option 2: Gemini Direct */}
          <button
            type="button"
            disabled={updatingProvider}
            onClick={() => handleProviderChange('gemini')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              aiProvider === 'gemini'
                ? 'bg-purple-600/40 border-purple-400 shadow-lg shadow-purple-500/20 ring-2 ring-purple-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Cpu className="w-5 h-5 text-purple-400" />
              {aiProvider === 'gemini' && (
                <span className="text-[10px] font-black uppercase bg-purple-500 text-white px-2 py-0.5 rounded-full">
                  Đang Kích Hoạt
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-white">Chỉ Dùng Google Gemini AI</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Sử dụng trực tiếp Google Gemini 1.5 Flash (Key trong .env đã hoạt động 100%).
            </p>
          </button>

          {/* Option 3: OpenAI Direct */}
          <button
            type="button"
            disabled={updatingProvider}
            onClick={() => handleProviderChange('openai')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              aiProvider === 'openai'
                ? 'bg-emerald-600/40 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              {aiProvider === 'openai' && (
                <span className="text-[10px] font-black uppercase bg-emerald-500 text-white px-2 py-0.5 rounded-full">
                  Đang Kích Hoạt
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-white">Chỉ Dùng OpenAI</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Ưu tiên OpenAI GPT-4o-mini khi có API Key khả dụng.
            </p>
          </button>

          {/* Option 4: Local Knowledge */}
          <button
            type="button"
            disabled={updatingProvider}
            onClick={() => handleProviderChange('local')}
            className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
              aiProvider === 'local'
                ? 'bg-slate-700/60 border-slate-400 shadow-lg ring-2 ring-slate-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-5 h-5 text-slate-400" />
              {aiProvider === 'local' && (
                <span className="text-[10px] font-black uppercase bg-slate-600 text-white px-2 py-0.5 rounded-full">
                  Đang Kích Hoạt
                </span>
              )}
            </div>
            <h4 className="font-extrabold text-sm text-white">Offline Engine (Từ Điển)</h4>
            <p className="text-[11px] text-slate-300 mt-1">
              Chỉ dùng kho kiến thức 613 từ TOEIC nội bộ, không gọi API ngoại vi.
            </p>
          </button>
        </div>
      </div>

      {/* Core 3rd-Party & Infrastructure Services Matrix */}
      <div className="bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>Báo Cáo Trạng Thái & Độ Trễ Các Dịch Vụ Bên Thứ 3</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Tự động kiểm tra định kỳ
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data?.servicesList && data.servicesList.length > 0 ? (
            data.servicesList.map((svc, i) => (
              <div
                key={i}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      {svc.name}
                    </h4>
                    {getStatusBadge(svc.status)}
                  </div>
                  {svc.message && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                      {svc.message}
                    </p>
                  )}
                  {svc.details?.keyPrefix && (
                    <span className="text-[11px] font-mono text-slate-400 block">
                      Key hiện tại: {svc.details.keyPrefix}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs self-start sm:self-auto tabular-nums">
                  {svc.latencyMs > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                      {svc.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              Đang tải kết quả ping kiểm tra các API Key bên thứ 3...
            </div>
          )}
        </div>
      </div>

      {/* System Hardware & Storage Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>Bộ Nhớ RAM Node.js</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.memory?.heapUsedMb || 0} MB <span className="text-sm font-normal text-slate-500">/ {data?.memory?.rssMb || 0} MB RSS</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Uptime: {data ? formatUptime(data.uptimeSeconds) : '...'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>PostgreSQL Database</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            READY <span className="text-sm font-normal text-emerald-500">613 từ vựng TOEIC</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Chỉ lưu 2 tài khoản cố định (Admin & Pro)
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>WebSocket Realtime Gateway</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Port 4000 <span className="text-sm font-normal text-emerald-600">ONLINE</span>
          </p>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Đấu trường & Mini Games mở 24/7
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemPage;
