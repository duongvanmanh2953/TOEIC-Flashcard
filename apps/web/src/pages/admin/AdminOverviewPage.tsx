import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import {
  Users,
  TrendingUp,
  CreditCard,
  Headphones,
  Cpu,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Flame,
  Radio,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  RefreshCw,
  DollarSign,
  Gamepad2,
  Sliders,
  BarChart3,
  Activity,
  Layers,
  HelpCircle,
} from 'lucide-react';
import {
  AdminButton,
  AdminSelect,
} from '../../components/admin/ui';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchOverview();
  }, [timeRange]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/dashboard/overview', {
        params: { range: timeRange },
      });
      const payload = res?.data?.data || res?.data || res || {};
      setData(payload);
    } catch (err) {
      console.error('Failed to load admin overview', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpi || {};
  const needsAttention = data?.needsAttention || [];
  const liveEvents = data?.liveEvents || [];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header with Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Mission Control Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tổng Quan Hệ Thống (Command Center)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu vận hành thời gian thực từ toàn bộ dịch vụ VocabFlow AI và Đấu Trường Games.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="w-36">
            <AdminSelect
              options={[
                { value: 'today', label: 'Hôm nay' },
                { value: '7d', label: '7 ngày qua' },
                { value: '30d', label: '30 ngày qua' },
                { value: 'this_month', label: 'Tháng này' },
              ]}
              value={timeRange}
              onChange={setTimeRange}
              clearable={false}
              searchable={false}
              size="sm"
            />
          </div>

          <AdminButton
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchOverview}
          >
            Làm mới
          </AdminButton>

          <AdminButton
            variant="secondary"
            size="sm"
            icon={<AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
            onClick={() => {
              const key = window.prompt('Nhập mã bảo mật để reset toàn bộ hệ thống (dữ liệu người dùng, v.v):');
              if (key) {
                api.post('/admin/system/reset-all', { passkey: key })
                  .then(() => alert('Khôi phục hệ thống thành công!'))
                  .catch(err => alert('Lỗi: ' + (err.response?.data?.message || err.message)));
              }
            }}
          >
            <span className="text-rose-500 font-bold">Reset All</span>
          </AdminButton>
        </div>
      </div>

      {/* PRIORITY CENTER: NEEDS ATTENTION BANNER */}
      {needsAttention.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Trung Tâm Ưu Tiên Cần Xử Lý (Needs Attention)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {needsAttention.map((item: any, idx: number) => (
              <div
                key={idx}
                onClick={() => navigate(item.route)}
                className="p-3 rounded-xl bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 border border-amber-500/20 cursor-pointer transition flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition truncate block">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Bấm để xử lý ngay</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          EXECUTIVE MACRO KPI METRICS: Revenue, Profit, Cost, Cash Flow, Users, Occupancy
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        <div
          onClick={() => navigate('/admin/finance')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Doanh Thu (MRR) <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Tổng doanh thu định kỳ hàng tháng từ các gói đăng ký VIP" /></span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> +14.2% MoM
            </span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {kpis.mrr?.value ?? '128.5M ₫'}
            </span>
            <DollarSign className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-500 dark:text-emerald-400" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/pricing')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Lợi Nhuận Ròng <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Doanh thu trừ đi các chi phí vận hành, server, và nhân sự" /></span>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5 truncate">Margin: 45.4%</span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-indigo-600 dark:text-indigo-300 tabular-nums">
              58.4M ₫
            </span>
            <TrendingUp className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/reports')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Chi Phí Vận Hành <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Tổng chi phí trả cho AWS, OpenAI, TTS API và CDN" /></span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5 truncate">Kiểm soát định mức</span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-rose-600 dark:text-rose-300 tabular-nums">
              70.1M ₫
            </span>
            <Activity className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-rose-500 dark:text-rose-400" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/finance')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Dòng Tiền Thuần <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Tiền mặt thực tế thu về sau khi trừ các khoản giữ chỗ hoặc pending" /></span>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-medium block mt-0.5 truncate">Thực nhận ví PayOS</span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-cyan-600 dark:text-cyan-300 tabular-nums">
              66.9M ₫
            </span>
            <Layers className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-cyan-500 dark:text-cyan-400" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/users')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Tổng Học Viên <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Tổng số học viên đã đăng ký tài khoản trên hệ thống" /></span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 mt-0.5 truncate">
              <ArrowUpRight className="w-3 h-3" /> +120 tuần này
            </span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums">
              {kpis.totalUsers?.value ?? '1,540'}
            </span>
            <Users className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-indigo-500 dark:text-indigo-400" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/games')}
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/40 cursor-pointer transition flex items-center justify-between sm:flex-col sm:items-start gap-2 shadow-xs"
        >
          <div className="min-w-0">
            <span className="text-xs sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block truncate flex items-center gap-1">Lấp Đầy Phòng Đấu <HelpCircle className="w-3 h-3 text-slate-400 cursor-help" title="Tỷ lệ người chơi hoạt động trong các phòng thi đấu đối kháng" /></span>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5 truncate">Khung 20:00 - 22:00</span>
          </div>
          <div className="flex items-center gap-2 sm:w-full sm:justify-between shrink-0">
            <span className="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-300 tabular-nums">
              78.5%
            </span>
            <Gamepad2 className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500 dark:text-amber-400" />
          </div>
        </div>
      </div>

      {/* =====================================================================
          STRATEGIC CORE MODULE NAVIGATION
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Quick Navigation Panels */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider">
            Phân Hệ Quản Trị Trọng Tâm (Executive Modules)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Định Giá Thông Minh (Smart Pricing)',
                desc: 'Mô hình chi phí đa biến, giả lập độ co giãn giá và bộ tối ưu hóa lợi nhuận.',
                route: '/admin/pricing',
                icon: Sliders,
                badge: 'Smart Engine',
                color: 'text-indigo-400',
              },
              {
                title: 'Quản Trị Games & Phòng Thi Đấu',
                desc: 'Đấu trường 4 kỹ năng, quản lý sảnh chờ, phòng đấu realtime và đề thi.',
                route: '/admin/games',
                icon: Gamepad2,
                badge: 'Arena Hub',
                color: 'text-emerald-400',
              },
              {
                title: 'Doanh Thu & Dòng Tiền (BI Dashboard)',
                desc: 'Phân tích tài chính chuyên sâu, tỷ lệ chuyển đổi và xu hướng định kỳ.',
                route: '/admin/finance',
                icon: TrendingUp,
                badge: 'BI Analytics',
                color: 'text-violet-400',
              },
              {
                title: 'Báo Cáo Tài Chính (Financial Reports)',
                desc: 'Trích xuất báo cáo P&L, doanh thu, chi phí, cash flow và xuất file CSV/PDF.',
                route: '/admin/reports',
                icon: BarChart3,
                badge: 'Reporting Suite',
                color: 'text-cyan-400',
              },
              {
                title: 'Học Viên & Tiến Trình Học',
                desc: 'Theo dõi chỉ số gắn kết, tỷ lệ hoàn thành SRS và phân tích CEFR.',
                route: '/admin/users',
                icon: Users,
                badge: 'CRM Core',
                color: 'text-amber-400',
              },
              {
                title: 'Sức Khỏe Hệ Thống & AI Analytics',
                desc: 'Giám sát độ trễ LLM token, CPU, RAM và thời gian phản hồi máy chủ.',
                route: '/admin/system',
                icon: Cpu,
                badge: 'Telemetry',
                color: 'text-purple-400',
              },
            ].map((panel, idx) => {
              const Icon = panel.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(panel.route)}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 cursor-pointer transition space-y-2 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] tabular-nums text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                      {panel.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                    {panel.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{panel.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Live Activity Stream */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dòng Sự Kiện Vận Hành Trực Tiếp (Live Stream)</span>
            </h3>
            <span className="text-[10px] text-slate-500">Realtime sync</span>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3 max-h-[460px] overflow-y-auto custom-scrollbar shadow-xs">
            {liveEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có sự kiện nào gần đây.</p>
            ) : (
              liveEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800/80 flex items-start gap-2.5 text-xs"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      evt.severity === 'SUCCESS'
                        ? 'bg-emerald-400'
                        : evt.severity === 'WARNING'
                        ? 'bg-amber-400'
                        : 'bg-indigo-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <strong className="text-slate-900 dark:text-slate-200 truncate">{evt.title}</strong>
                      <span className="text-[10px] text-slate-500 shrink-0 tabular-nums">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{evt.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
