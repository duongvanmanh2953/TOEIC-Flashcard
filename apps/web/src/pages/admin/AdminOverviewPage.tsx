import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { GlassCard } from '../../components/common/GlassCard';
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
} from 'lucide-react';

export const AdminOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/admin/dashboard/overview');
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
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1 border border-indigo-500/20">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Mission Control Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tổng Quan Hệ Thống (Ultra Overview)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dữ liệu vận hành thời gian thực từ toàn bộ dịch vụ VocabFlow AI.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 self-start sm:self-auto shadow-xs border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* PRIORITY CENTER: NEEDS ATTENTION BANNER */}
      {needsAttention.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Trung Tâm Ưu Tiên (Needs Attention)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {needsAttention.map((item: any, idx: number) => (
              <div
                key={idx}
                onClick={() => navigate(item.route)}
                className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-amber-500/20 cursor-pointer transition flex items-center justify-between group shadow-xs"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 group-hover:text-amber-400 transition truncate block">
                    {item.title}
                  </span>
                  <span className="text-[10px] text-slate-400">Bấm để xử lý ngay</span>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12 ULTRA KPI METRIC CARDS — 4 Group Identities (Indigo, Emerald, Violet, Amber) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          // USER GROWTH GROUP (Indigo)
          { label: 'Tổng Học Viên', val: kpis.totalUsers?.value ?? 0, change: kpis.totalUsers?.change, icon: Users, color: 'text-indigo-400', cardBg: 'bg-indigo-950/25 border-indigo-800/40 hover:border-indigo-700/60', route: '/admin/users' },
          { label: 'Hoạt Động Hôm Nay', val: kpis.activeToday?.value ?? 0, change: kpis.activeToday?.change, icon: Flame, color: 'text-indigo-400', cardBg: 'bg-indigo-950/25 border-indigo-800/40 hover:border-indigo-700/60', route: '/admin/users' },
          { label: 'Hoạt Động 7 Ngày', val: kpis.active7d?.value ?? 0, change: kpis.active7d?.change, icon: TrendingUp, color: 'text-indigo-400', cardBg: 'bg-indigo-950/25 border-indigo-800/40 hover:border-indigo-700/60', route: '/admin/learning' },

          // REVENUE & BUSINESS GROUP (Emerald)
          { label: 'Tỷ Lệ Chuyển Đổi', val: kpis.conversionRate?.value ?? '0%', change: kpis.conversionRate?.change, icon: Sparkles, color: 'text-emerald-400', cardBg: 'bg-emerald-950/25 border-emerald-800/40 hover:border-emerald-700/60', route: '/admin/billing' },
          { label: 'Học Viên VIP Pro', val: kpis.premiumUsers?.value ?? 0, change: kpis.premiumUsers?.change, icon: CreditCard, color: 'text-emerald-400', cardBg: 'bg-emerald-950/25 border-emerald-800/40 hover:border-emerald-700/60', route: '/admin/billing' },
          { label: 'Doanh Thu (MRR)', val: kpis.mrr?.value ?? '0 đ', change: kpis.mrr?.change, icon: CreditCard, color: 'text-emerald-400', cardBg: 'bg-emerald-950/25 border-emerald-800/40 hover:border-emerald-700/60', route: '/admin/finance' },

          // LEARNING & ACADEMIC GROUP (Violet)
          { label: 'Lượt Ôn Tập SRS', val: kpis.totalReviews?.value ?? 0, change: kpis.totalReviews?.change, icon: BookOpen, color: 'text-violet-400', cardBg: 'bg-violet-950/25 border-violet-800/40 hover:border-violet-700/60', route: '/admin/learning' },
          { label: 'Độ Chính Xác', val: kpis.accuracyRate?.value ?? '0%', change: kpis.accuracyRate?.change, icon: CheckCircle2, color: 'text-violet-400', cardBg: 'bg-violet-950/25 border-violet-800/40 hover:border-violet-700/60', route: '/admin/learning' },
          { label: 'Kho Từ Chuẩn', val: kpis.totalVocab?.value ?? 0, change: '600+ TOEIC', icon: BookOpen, color: 'text-violet-400', cardBg: 'bg-violet-950/25 border-violet-800/40 hover:border-violet-700/60', route: '/admin/vocabulary' },

          // AI USAGE & OPS GROUP (Amber)
          { label: 'Lượt Gọi AI Tutor', val: kpis.aiRequests?.value ?? 0, change: kpis.aiRequests?.change, icon: Cpu, color: 'text-amber-400', cardBg: 'bg-amber-950/25 border-amber-800/40 hover:border-amber-700/60', route: '/admin/ai' },
          { label: 'Yêu Cầu CSKH Chờ', val: kpis.openSupport?.value ?? 0, change: kpis.openSupport?.change, icon: Headphones, color: 'text-sky-400', cardBg: 'bg-sky-950/25 border-sky-800/40 hover:border-sky-700/60', route: '/admin/support' },
          { label: 'Góp Ý Chờ Xử Lý', val: kpis.unreadFeedback?.value ?? 0, change: kpis.unreadFeedback?.change, icon: AlertTriangle, color: 'text-amber-400', cardBg: 'bg-amber-950/25 border-amber-800/40 hover:border-amber-700/60', route: '/admin/feedback' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(kpi.route)}
              className={`p-3.5 rounded-2xl ${kpi.cardBg} border cursor-pointer transition space-y-1.5 shadow-sm group hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 truncate">{kpi.label}</span>
                <Icon className={`w-3.5 h-3.5 ${kpi.color} shrink-0`} />
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-white tracking-tight">{kpi.val}</span>
                {kpi.change && (
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-2.5 h-2.5" />
                    {kpi.change}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* TWO COLUMN GRID: Live Activity Stream & Domain Drilldown Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Quick Navigation Panels */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">
            Phân Hệ Quản Trị Chuyên Sâu
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: 'Quản Lý Gói Cước & Feature Matrix',
                desc: 'Thiết lập biểu phí theo tháng/năm, quota AI và ma trận quyền.',
                route: '/admin/plans',
                icon: CreditCard,
                badge: 'Mới nâng cấp',
                color: 'text-indigo-400',
              },
              {
                title: 'Kho Tài Nguyên & Kịch Bản AI',
                desc: 'Quản lý bài giảng, bài đọc, từ vựng theo khung CEFR quốc tế.',
                route: '/admin/resources',
                icon: BookOpen,
                badge: 'Content Hub',
                color: 'text-violet-400',
              },
              {
                title: 'Hộp Thư Hỗ Trợ CSKH',
                desc: 'Inbox 2 cột, trả lời thời gian thực & ghi chú nội bộ.',
                route: '/admin/support',
                icon: Headphones,
                badge: `${kpis.openSupport?.value || 0} đang chờ`,
                color: 'text-sky-400',
              },
              {
                title: 'Ban Quản Lý Góp Ý & Roadmap',
                desc: 'Bảng Kanban chuyển trạng thái, phản hồi công khai.',
                route: '/admin/feedback',
                icon: Sparkles,
                badge: `${kpis.unreadFeedback?.value || 0} ý kiến`,
                color: 'text-amber-400',
              },
              {
                title: 'Trung Tâm Phát Sóng Broadcast',
                desc: 'Soạn và gửi thông báo chọn lọc theo tệp học viên.',
                route: '/admin/notifications',
                icon: Radio,
                badge: 'Tức thì',
                color: 'text-indigo-400',
              },
              {
                title: 'Giám Sát AI & Băng Thông',
                desc: 'Theo dõi token, độ trễ mô hình và chi phí API.',
                route: '/admin/ai',
                icon: Cpu,
                badge: '99.3% OK',
                color: 'text-purple-400',
              },
            ].map((panel, idx) => {
              const Icon = panel.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(panel.route)}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer transition space-y-2 group shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
                      {panel.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition">
                    {panel.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{panel.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Live Activity Stream */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dòng Sự Kiện Trực Tiếp (Live Stream)</span>
            </h3>
            <span className="text-[10px] text-slate-500">Tự động làm mới</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 max-h-[460px] overflow-y-auto">
            {liveEvents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">Chưa có sự kiện nào gần đây.</p>
            ) : (
              liveEvents.map((evt: any) => (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5 text-xs"
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
                      <strong className="text-slate-200 truncate">{evt.title}</strong>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{evt.description}</p>
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
