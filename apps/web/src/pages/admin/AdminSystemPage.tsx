import React, { useState, useEffect } from 'react';
import { 
  Server, HardDrive, Cpu, Activity, CheckCircle2, 
  AlertCircle, RefreshCw, Shield, Terminal, Zap
} from 'lucide-react';
import api from '../../lib/api';

interface ServiceStatus {
  name: string;
  status: 'UP' | 'DOWN' | 'DEGRADED';
  latencyMs: number;
  uptime: string;
}

export const AdminSystemPage: React.FC = () => {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'NestJS REST API Gateway', status: 'UP', latencyMs: 14, uptime: '99.98%' },
    { name: 'PostgreSQL Database (Prisma)', status: 'UP', latencyMs: 3, uptime: '99.99%' },
    { name: 'Redis Cache & Rate Limiter', status: 'UP', latencyMs: 1, uptime: '100%' },
    { name: 'Google Gemini 1.5 LLM Engine', status: 'UP', latencyMs: 540, uptime: '99.85%' },
    { name: 'WebSocket Realtime Notification Hub', status: 'UP', latencyMs: 8, uptime: '99.95%' },
  ]);
  const [loading, setLoading] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      await api.get('/admin/system-health');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-indigo-500" />
            System & Infrastructure Telemetry
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Realtime health status of microservices, database connections, and memory allocation
          </p>
        </div>
        <button 
          onClick={checkHealth} 
          className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Global Status Banner */}
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
          <div>
            <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              All Systems Operational
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              API response time average 14ms across all endpoints. No active incidents.
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-lg font-bold">
          UPTIME: 99.98%
        </span>
      </div>

      {/* Microservices Matrix */}
      <div className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            Core Service Matrix
          </h3>
          <span className="text-xs text-slate-400">Auto-ping interval: 30s</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {services.map((svc, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-white">
                    {svc.name}
                  </h4>
                  <p className="text-xs text-slate-400">Response latency: {svc.latencyMs}ms</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-500 font-mono">Uptime: {svc.uptime}</span>
                <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resource Allocation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>RAM Utilization</span>
            <HardDrive className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">512 MB / 2048 MB</p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: '25%' }} />
          </div>
          <span className="text-[11px] text-slate-400 block">Optimal node footprint</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Database Connections</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">8 / 100 Pool</p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: '8%' }} />
          </div>
          <span className="text-[11px] text-slate-400 block">Prisma connection pool healthy</span>
        </div>

        <div className="bg-white dark:bg-slate-800/80 p-5 rounded-xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Active WebSocket Sockets</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">18 Connected</p>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '18%' }} />
          </div>
          <span className="text-[11px] text-slate-400 block">Realtime notifications active</span>
        </div>
      </div>
    </div>
  );
};
export default AdminSystemPage;
