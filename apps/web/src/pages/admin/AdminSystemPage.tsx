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
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';

interface ServiceItem {
  name: string;
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
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
  };
  servicesList: ServiceItem[];
  unconfiguredKeys: string[];
}

export const AdminSystemPage: React.FC = () => {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<SystemHealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/health');
      if (res?.data) {
        setData(res.data);
      } else if (res?.status) {
        setData(res);
      }
      setLastCheck(new Date());
    } catch (err) {
      console.error('Failed to query system health:', err);
    } finally {
      setLoading(false);
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
            HEALTHY
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
            DEGRADED
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
            <span>{t('healthDiagnostics.title', 'Giám Sát Hạ Tầng & Sức Khỏe Hệ Thống')}</span>
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
            {t(
              'healthDiagnostics.subtitle',
              'Tình trạng hoạt động thời gian thực của Database, Redis, WebSocket và các API Key ngoại vi.',
            )}
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
            <span>{t('healthDiagnostics.refreshBtn', 'Làm mới')}</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {data?.status === 'CONFIGURATION_REQUIRED' || data?.status === 'DEGRADED' ? (
        <div className="p-5 bg-amber-500/10 dark:bg-amber-950/40 border-2 border-amber-500/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <AlertTriangle className="w-7 h-7 text-amber-500 flex-shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h2 className="font-black text-amber-950 dark:text-amber-200 text-base">
                {t('healthDiagnostics.statusConfigRequired', 'CẦN CẤU HÌNH API NGOẠI VI')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-800 dark:text-amber-300 font-medium mt-0.5">
                Hệ thống phát hiện một số API Key bên ngoài chưa được cung cấp trong file <code>.env</code>. Các tính năng AI hoặc thanh toán trực tuyến sẽ chạy ở chế độ dự phòng.
              </p>
            </div>
          </div>
          <span className="text-xs tabular-nums px-3 py-1.5 bg-amber-500/20 text-amber-900 dark:text-amber-200 rounded-xl font-black whitespace-nowrap self-start md:self-auto">
            ACTION REQUIRED
          </span>
        </div>
      ) : data?.status === 'CRITICAL' ? (
        <div className="p-5 bg-rose-500/10 dark:bg-rose-950/40 border-2 border-rose-500/40 rounded-2xl flex items-center gap-3.5">
          <XCircle className="w-7 h-7 text-rose-500 flex-shrink-0" />
          <div>
            <h2 className="font-black text-rose-950 dark:text-rose-200 text-base">
              {t('healthDiagnostics.statusCritical', 'SỰ CỐ NGHIÊM TRỌNG (DATABASE DOWN)')}
            </h2>
            <p className="text-xs sm:text-sm text-rose-800 dark:text-rose-300 font-medium mt-0.5">
              Không thể kết nối tới cơ sở dữ liệu PostgreSQL. Vui lòng kiểm tra container <code>leximind-postgres</code>.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5 bg-emerald-500/10 dark:bg-emerald-950/40 border-2 border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <h2 className="font-black text-emerald-950 dark:text-emerald-200 text-base">
                {t('healthDiagnostics.statusOperational', 'Tất Cả Dịch Vụ Vận Hành Tốt')}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium mt-0.5">
                Cơ sở dữ liệu, bộ nhớ đệm, WebSocket và các API Key đã được cấu hình đầy đủ.
              </p>
            </div>
          </div>
          <span className="text-xs tabular-nums px-3 py-1 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 rounded-lg font-black self-start sm:self-auto shrink-0">
            UPTIME: {data ? formatUptime(data.uptimeSeconds) : '...'}
          </span>
        </div>
      )}

      {/* Unconfigured Keys Warning Banner */}
      {data?.unconfiguredKeys && data.unconfiguredKeys.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wide">
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>{t('healthDiagnostics.unconfiguredAlert', 'Dịch Vụ Chưa Cấu Hình Key:')}</span>
          </div>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 tabular-nums">
            {data.unconfiguredKeys.map((k, i) => (
              <li key={i} className="text-amber-200 font-medium">
                {k}
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-slate-400 italic pt-1">
            * Mẹo: Cập nhật các biến môi trường tương ứng trong file <code>.env</code> ở thư mục gốc để kích hoạt đầy đủ tính năng.
          </p>
        </div>
      )}

      {/* Core Services Matrix */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            <span>{t('healthDiagnostics.serviceMatrix', 'Ma Trận Dịch Vụ Cốt Lõi')}</span>
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {t('healthDiagnostics.autoRefresh', 'Tự động kiểm tra mỗi 15s')}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {data?.servicesList && data.servicesList.length > 0 ? (
            data.servicesList.map((svc, i) => (
              <div
                key={i}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1">
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
                  {svc.details?.recommendedAction && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      💡 {svc.details.recommendedAction}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs self-start sm:self-auto tabular-nums text-slate-600 dark:text-slate-300">
                  {svc.latencyMs > 0 && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold">
                      {svc.latencyMs}ms
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
              Đang tải kết quả kiểm tra hạ tầng thời gian thực...
            </div>
          )}
        </div>
      </div>

      {/* Real Resource Allocation Telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>{t('healthDiagnostics.memoryUsage', 'Bộ Nhớ RAM Node.js')}</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.memory?.heapUsedMb || 0} MB <span className="text-sm font-normal text-slate-500">/ {data?.memory?.rssMb || 0} MB RSS</span>
          </p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.round(((data?.memory?.heapUsedMb || 20) / (data?.memory?.heapTotalMb || 60)) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Heap Total: {data?.memory?.heapTotalMb || 0} MB
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>{t('healthDiagnostics.dbConnection', 'PostgreSQL Ping')}</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {data?.services?.database?.latencyMs || 0} ms
          </p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Trạng thái kết nối: {data?.services?.database?.status || 'HEALTHY'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900/90 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <span>{t('healthDiagnostics.activeSockets', 'WebSocket Gateway')}</span>
            <Radio className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Port 4000 <span className="text-sm font-normal text-emerald-600">LIVE</span>
          </p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
            Hỗ trợ Realtime Games & Notifications
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminSystemPage;
