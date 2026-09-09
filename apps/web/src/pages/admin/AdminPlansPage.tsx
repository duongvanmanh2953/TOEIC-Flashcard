import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Archive,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  X,
  Layers,
  Zap,
  Shield,
  HelpCircle,
  TrendingUp,
  CreditCard,
  Users,
  Settings,
  Sliders,
  DollarSign,
  ArrowRight,
  Info,
} from 'lucide-react';
import api from '../../lib/api';
import { useI18n } from '../../i18n';
import { NumberInput } from '../../components/common/NumberInput';
import { CustomSelect } from '../../components/ui/CustomSelect';

interface Plan {
  id: string;
  tier: string;
  name: string;
  slug: string;
  description?: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  billingCycle: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  displayOrder: number;
  aiDailyQuota: number;
  maxCustomDecks: number;
  unlimitedReviews: boolean;
  features: string[];
  limits?: Record<string, number>;
  permissions?: Record<string, boolean>;
  activeUsersCount?: number;
  totalPaidOrders?: number;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PERMISSIONS = {
  aiChat: true,
  voiceAi: false,
  personalMemory: false,
  pronunciationCoach: false,
  speakingAnalysis: false,
  roleplay: false,
  personalizedLearning: true,
  spacedRepetition: true,
  advancedAnalytics: false,
  englishTwin: false,
};

const DEFAULT_LIMITS = {
  aiChat: 10,
  voiceAiMinutes: 0,
  pronunciation: 5,
  textToVocab: 3,
  storyGen: 0,
};

const FEATURE_DEFINITIONS = [
  { key: 'aiChat', label: 'AI Tutor Chatbot', desc: 'Hội thoại và tra cứu với gia sư AI' },
  { key: 'voiceAi', label: 'Voice AI Speaking Mode', desc: 'Giao tiếp đàm thoại bằng giọng nói thực tế' },
  { key: 'personalMemory', label: 'Personal Memory & Error Tracking', desc: 'Ghi nhớ lỗ hổng kiến thức và từ yếu' },
  { key: 'pronunciationCoach', label: 'AI Pronunciation Coach', desc: 'Chấm điểm phát âm chi tiết từng âm vị' },
  { key: 'speakingAnalysis', label: 'Fluency & Grammar Scoring', desc: 'Đánh giá độ trôi chảy và ngữ pháp hội thoại' },
  { key: 'roleplay', label: 'Workplace & Scenario Roleplay', desc: 'Tình huống giao tiếp thực chiến đa ngữ cảnh' },
  { key: 'personalizedLearning', label: 'Smart Adaptive Learning Path', desc: 'AI tự đề xuất bài học tiếp theo' },
  { key: 'spacedRepetition', label: 'FSRS Spaced Repetition Engine', desc: 'Thuật toán lặp lại ngắt quãng thông minh' },
  { key: 'advancedAnalytics', label: 'CEFR Diagnostic Radar', desc: 'Biểu đồ phân tích chuẩn khung CEFR A1-C2' },
  { key: 'englishTwin', label: 'English Twin Clone', desc: 'Bản sao AI phản ánh trình độ tiếng Anh' },
];

const LIMIT_DEFINITIONS = [
  { key: 'aiChat', label: 'AI Interaction Quota / Day', unit: 'requests/day', hint: '-1 for unlimited' },
  { key: 'voiceAiMinutes', label: 'Voice AI Conversation Quota', unit: 'min/day', hint: '-1 for unlimited' },
  { key: 'pronunciation', label: 'Pronunciation Checks / Day', unit: 'tests/day', hint: '-1 for unlimited' },
  { key: 'textToVocab', label: 'Text-to-Vocab Extractions', unit: 'runs/day', hint: '-1 for unlimited' },
  { key: 'storyGen', label: 'AI Story Generators / Day', unit: 'stories/day', hint: '-1 for unlimited' },
];

export const AdminPlansPage: React.FC = () => {
  const { t } = useI18n();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cards' | 'matrix'>('cards');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'general' | 'pricing' | 'features' | 'limits' | 'bullets'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Data
  const [formData, setFormData] = useState({
    tier: 'PRO',
    name: '',
    slug: '',
    description: '',
    priceMonthly: 199000,
    priceYearly: 1548000,
    currency: 'VND',
    billingCycle: 'MONTHLY',
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'ARCHIVED',
    displayOrder: 1,
    aiDailyQuota: 200,
    maxCustomDecks: 20,
    unlimitedReviews: true,
    features: [''] as string[],
    limits: { ...DEFAULT_LIMITS },
    permissions: { ...DEFAULT_PERMISSIONS },
  });

  // Archive Recommendation Modal (when delete is blocked)
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [blockedPlan, setBlockedPlan] = useState<{ plan: Plan; message: string } | null>(null);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/admin/plans');
      const data = res.data?.data || res.data || res;
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (err: any) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      tier: 'PLUS',
      name: '',
      slug: '',
      description: '',
      priceMonthly: 99000,
      priceYearly: 890000,
      currency: 'VND',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      displayOrder: plans.length + 1,
      aiDailyQuota: 50,
      maxCustomDecks: 10,
      unlimitedReviews: true,
      features: ['Truy cập toàn bộ kho từ vựng và bài tập', 'Hỗ trợ FSRS Spaced Repetition'],
      limits: { ...DEFAULT_LIMITS, aiChat: 50, voiceAiMinutes: 15 },
      permissions: { ...DEFAULT_PERMISSIONS, pronunciationCoach: true, roleplay: true },
    });
    setFormError(null);
    setActiveModalTab('general');
    setModalOpen(true);
  };

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      tier: plan.tier,
      name: plan.name,
      slug: plan.slug || '',
      description: plan.description || '',
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly || 0,
      currency: plan.currency || 'VND',
      billingCycle: plan.billingCycle || 'MONTHLY',
      status: plan.status || 'ACTIVE',
      displayOrder: plan.displayOrder || 0,
      aiDailyQuota: plan.aiDailyQuota || 10,
      maxCustomDecks: plan.maxCustomDecks || 5,
      unlimitedReviews: plan.unlimitedReviews ?? true,
      features: Array.isArray(plan.features) && plan.features.length > 0 ? [...plan.features] : [''],
      limits: { ...DEFAULT_LIMITS, ...(plan.limits || {}) },
      permissions: { ...DEFAULT_PERMISSIONS, ...(plan.permissions || {}) },
    });
    setFormError(null);
    setActiveModalTab('general');
    setModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...formData,
        priceMonthly: Number(formData.priceMonthly),
        priceYearly: Number(formData.priceYearly),
        displayOrder: Number(formData.displayOrder),
        aiDailyQuota: Number(formData.aiDailyQuota),
        maxCustomDecks: Number(formData.maxCustomDecks),
        features: formData.features.filter((f) => f.trim() !== ''),
      };

      if (editingPlan) {
        await api.patch(`/admin/plans/${editingPlan.id}`, payload);
      } else {
        await api.post('/admin/plans', payload);
      }

      setModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Lỗi khi lưu thông tin gói cước');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!window.confirm(`Bạn có chắc muốn xóa gói cước "${plan.name}"?`)) return;

    try {
      await api.delete(`/admin/plans/${plan.id}`);
      fetchPlans();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      if (err.response?.status === 400 && msg.includes('Archive')) {
        setBlockedPlan({ plan, message: msg });
        setArchiveModalOpen(true);
      } else {
        alert(msg || 'Lỗi khi xóa gói cước');
      }
    }
  };

  const handleArchivePlan = async (planId: string) => {
    try {
      await api.patch(`/admin/plans/${planId}/archive`, {});
      setArchiveModalOpen(false);
      setBlockedPlan(null);
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi lưu trữ gói');
    }
  };

  const handleToggleStatus = async (plan: Plan) => {
    const nextStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/admin/plans/${plan.id}`, { status: nextStatus });
      fetchPlans();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể cập nhật trạng thái');
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.tier.toLowerCase().includes(q) ||
        (p.slug && p.slug.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activePlansCount = plans.filter((p) => p.status === 'ACTIVE').length;
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.activeUsersCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Subscription Plans & Feature Matrix
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Admin Control
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý biểu phí cước, thiết lập đặc quyền tính năng và phân bổ hạn ngạch AI cho từng gói
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 transition-colors"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="btn-glass-primary !shadow-none flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Gói Mới</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400">
              Tổng số gói
            </span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {plans.length}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activePlansCount} gói đang kích hoạt công khai
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
              Học viên kích hoạt
            </span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {totalSubscribers}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Active subscribers đang sử dụng
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200/60 dark:border-violet-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-violet-600 dark:text-violet-400">
              Chế độ hiển thị
            </span>
            <Sliders className="w-4 h-4 text-violet-500" />
          </div>
          <div className="flex gap-1.5 mt-2.5">
            <button
              onClick={() => setActiveTab('cards')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'cards'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              Thẻ Gói Cước
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400'
              }`}
            >
              Ma Trận Quyền
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
              Chính sách an toàn
            </span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-2">
            Safe Archive Protection
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gói có học viên không thể xóa cứng, tự động gợi ý lưu trữ.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên gói, tier..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['ALL', 'ACTIVE', 'INACTIVE', 'ARCHIVED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'Tất cả' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-500" />
          <p className="text-sm">Đang tải cấu hình biểu phí gói cước...</p>
        </div>
      ) : activeTab === 'cards' ? (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan) => {
            const yearlyMonthly = Math.round((plan.priceYearly || 0) / 12);
            const savingsPercent =
              plan.priceMonthly > 0 && plan.priceYearly > 0
                ? Math.round((1 - plan.priceYearly / (plan.priceMonthly * 12)) * 100)
                : 0;

            const isFree = plan.tier === 'FREE';

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-3xl transition-all duration-200 ${
                  plan.tier === 'PRO'
                    ? 'bg-gradient-to-b from-indigo-500/5 via-white to-white dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 border-2 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                    : 'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Header Badge */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                        plan.tier === 'PRO'
                          ? 'bg-indigo-600 text-white'
                          : plan.tier === 'PLUS'
                          ? 'bg-sky-500 text-white'
                          : plan.tier === 'ENTERPRISE'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {plan.tier}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(plan)}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors ${
                        plan.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : plan.status === 'ARCHIVED'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                      title="Nhấn để đổi trạng thái"
                    >
                      {plan.status}
                    </button>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Slug: <span className="tabular-nums">{plan.slug || 'n/a'}</span> | Order: {plan.displayOrder}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2 min-h-[32px]">
                    {plan.description || 'Không có mô tả chi tiết'}
                  </p>

                  {/* Pricing Box */}
                  <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                        {plan.priceMonthly === 0
                          ? 'Miễn phí'
                          : `${plan.priceMonthly.toLocaleString()} đ`}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-xs text-slate-500">/tháng</span>
                      )}
                    </div>

                    {plan.priceYearly > 0 && (
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                        <span>
                          Gói năm: <strong>{plan.priceYearly.toLocaleString()} đ</strong> ({yearlyMonthly.toLocaleString()} đ/tháng)
                        </span>
                        {savingsPercent > 0 && (
                          <span className="px-1.5 py-0.5 rounded font-black text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Tiết kiệm {savingsPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Limits Summary */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        AI Quota / Ngày
                      </span>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {plan.aiDailyQuota} lượt
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Voice AI Đàm thoại
                      </span>
                      <span className="font-black text-slate-800 dark:text-slate-200">
                        {plan.limits?.voiceAiMinutes === -1
                          ? 'Không giới hạn'
                          : `${plan.limits?.voiceAiMinutes || 0} phút/ngày`}
                      </span>
                    </div>
                  </div>

                  {/* Key Features Bullet List */}
                  <div className="mt-4 space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Đặc quyền tiêu biểu
                    </span>
                    {plan.features?.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{f}</span>
                      </div>
                    ))}
                    {(plan.features?.length || 0) > 4 && (
                      <p className="text-[11px] text-slate-400 italic pl-5">
                        + {(plan.features?.length || 0) - 4} tính năng khác...
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      <strong>{plan.activeUsersCount || 0}</strong> học viên
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                      title="Chỉnh sửa cấu hình gói"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {!isFree && (
                      <>
                        <button
                          onClick={() => handleArchivePlan(plan.id)}
                          className="p-2 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 transition-colors"
                          title="Lưu trữ (Archive)"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan)}
                          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition-colors"
                          title="Xóa gói"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* FEATURE MATRIX VIEW */
        <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                <th className="p-4 font-black text-slate-800 dark:text-slate-200 w-64">
                  Ma trận đặc quyền & Quota AI
                </th>
                {plans.map((p) => (
                  <th key={p.id} className="p-4 text-center min-w-[160px]">
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      {p.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                      {p.priceMonthly === 0 ? 'Free' : `${p.priceMonthly.toLocaleString()} đ/th`}
                    </div>
                    <div className="mt-2 flex justify-center">
                      <button
                        onClick={() => openEditModal(p)}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                      >
                        Sửa gói
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {/* SECTION: Quota Limits */}
              <tr className="bg-slate-100/50 dark:bg-slate-800/70">
                <td colSpan={plans.length + 1} className="p-2.5 font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Phân bổ Quota Hàng Ngày
                </td>
              </tr>
              {LIMIT_DEFINITIONS.map((lim) => (
                <tr key={lim.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-3 pl-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{lim.label}</div>
                    <div className="text-[10px] text-slate-400">{lim.unit}</div>
                  </td>
                  {plans.map((p) => {
                    const val = p.limits?.[lim.key] ?? (lim.key === 'aiChat' ? p.aiDailyQuota : 0);
                    return (
                      <td key={p.id} className="p-3 text-center font-bold">
                        {val === -1 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Unlimited</span>
                        ) : val === 0 ? (
                          <span className="text-slate-400">-</span>
                        ) : (
                          <span className="text-slate-800 dark:text-slate-200">{val}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* SECTION: Feature Permissions Toggles */}
              <tr className="bg-slate-100/50 dark:bg-slate-800/70">
                <td colSpan={plans.length + 1} className="p-2.5 font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                  Bật / Tắt Tính Năng Quyền Lợi
                </td>
              </tr>
              {FEATURE_DEFINITIONS.map((feat) => (
                <tr key={feat.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="p-3 pl-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{feat.label}</div>
                    <div className="text-[10px] text-slate-400">{feat.desc}</div>
                  </td>
                  {plans.map((p) => {
                    const enabled = Boolean(p.permissions?.[feat.key]);
                    return (
                      <td key={p.id} className="p-3 text-center">
                        {enabled ? (
                          <div className="inline-flex p-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                            <X className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  {editingPlan ? `Chỉnh sửa gói: ${editingPlan.name}` : 'Tạo Gói Cước Mới'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thiết lập giá, hạn mức AI và đặc quyền trong hệ thống VocabFlow
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 mt-4 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-x-auto">
              {[
                { id: 'general', label: 'Thông Tin Cơ Bản' },
                { id: 'pricing', label: 'Giá & Chu Kỳ' },
                { id: 'features', label: 'Quyền Tính Năng' },
                { id: 'limits', label: 'Quota Hạn Mức' },
                { id: 'bullets', label: 'Danh Sách Bullet Point' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveModalTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    activeModalTab === t.id
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSavePlan} className="mt-4 overflow-y-auto pr-1 flex-1 space-y-4">
              {/* TAB 1: General */}
              {activeModalTab === 'general' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <CustomSelect
                        label="Mã Gói (Tier) *"
                        value={formData.tier}
                        disabled={Boolean(editingPlan)}
                        onChange={(val) => setFormData({ ...formData, tier: String(val) })}
                        options={[
                          { value: 'FREE', label: 'FREE' },
                          { value: 'PLUS', label: 'PLUS' },
                          { value: 'PRO', label: 'PRO' },
                          { value: 'ENTERPRISE', label: 'ENTERPRISE' },
                          { value: 'CUSTOM', label: 'CUSTOM' },
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Tên Hiển Thị (Name) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="VD: VocabFlow Plus, Pro English AI..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Slug (URL identifier)
                      </label>
                      <input
                        type="text"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="pro, plus, enterprise..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <CustomSelect
                        label="Trạng Thái Hoạt Động"
                        value={formData.status}
                        onChange={(val) => setFormData({ ...formData, status: val as any })}
                        options={[
                          { value: 'ACTIVE', label: 'ACTIVE (Kích hoạt công khai)' },
                          { value: 'INACTIVE', label: 'INACTIVE (Ẩn khỏi trang mua)' },
                          { value: 'ARCHIVED', label: 'ARCHIVED (Lưu trữ không bán mới)' },
                        ]}
                        size="sm"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Thứ Tự Hiển Thị (Display Order)
                      </label>
                      <NumberInput
                        value={formData.displayOrder}
                        onChange={(val) => setFormData({ ...formData, displayOrder: val })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Mô Tả Gói (Description)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Mô tả giá trị người học nhận được..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: Pricing */}
              {activeModalTab === 'pricing' && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Giá Theo Tháng (VND)
                      </label>
                      <NumberInput
                        value={formData.priceMonthly}
                        onChange={(val) => setFormData({ ...formData, priceMonthly: val })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        suffix="₫"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        = {Number(formData.priceMonthly).toLocaleString()} VNĐ / tháng
                      </span>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Giá Theo Năm (VND)
                      </label>
                      <NumberInput
                        value={formData.priceYearly}
                        onChange={(val) => setFormData({ ...formData, priceYearly: val })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                        suffix="₫"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        = {Number(formData.priceYearly).toLocaleString()} VNĐ / năm (Tương đương{' '}
                        {Math.round(Number(formData.priceYearly) / 12).toLocaleString()} VNĐ/tháng)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Đơn Vị Tiền Tệ
                      </label>
                      <input
                        type="text"
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                      />
                    </div>
                    <div>
                      <CustomSelect
                        label="Chu Kỳ Mặc Định"
                        value={formData.billingCycle}
                        onChange={(val) => setFormData({ ...formData, billingCycle: String(val) })}
                        options={[
                          { value: 'MONTHLY', label: 'Hàng tháng (Monthly)' },
                          { value: 'YEARLY', label: 'Hàng năm (Yearly)' },
                        ]}
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Feature Permissions Toggles */}
              {activeModalTab === 'features' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Bật hoặc tắt quyền truy cập các tính năng cốt lõi cho học viên khi sở hữu gói này:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {FEATURE_DEFINITIONS.map((f) => {
                      const enabled = Boolean(formData.permissions?.[f.key as keyof typeof DEFAULT_PERMISSIONS]);
                      return (
                        <div
                          key={f.key}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              permissions: {
                                ...formData.permissions,
                                [f.key]: !enabled,
                              },
                            })
                          }
                          className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                            enabled
                              ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                              : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 opacity-60'
                          }`}
                        >
                          <div>
                            <span className="font-black text-slate-800 dark:text-slate-200 block">
                              {f.label}
                            </span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{f.desc}</span>
                          </div>

                          <div
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center p-0.5 ${
                              enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: Quota Limits */}
              {activeModalTab === 'limits' && (
                <div className="space-y-3 text-xs">
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Cấu hình số lượt sử dụng tối đa hàng ngày (Nhập -1 nếu muốn Không Giới Hạn):
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {LIMIT_DEFINITIONS.map((l) => (
                      <div key={l.key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <label className="font-bold text-slate-800 dark:text-slate-200 block">
                          {l.label}
                        </label>
                        <span className="text-[10px] text-slate-400 block mb-1.5">{l.hint}</span>
                        <NumberInput
                          allowNegative={true}
                          value={formData.limits?.[l.key as keyof typeof DEFAULT_LIMITS] ?? 0}
                          onChange={(val) =>
                            setFormData({
                              ...formData,
                              limits: {
                                ...formData.limits,
                                [l.key]: val,
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="0"
                        />
                      </div>
                    ))}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <label className="font-bold text-slate-800 dark:text-slate-200 block">
                        Số Lượng Custom Deck Tối Đa
                      </label>
                      <span className="text-[10px] text-slate-400 block mb-1.5">Bộ từ vựng tự tạo</span>
                      <NumberInput
                        allowNegative={true}
                        value={formData.maxCustomDecks}
                        onChange={(val) => setFormData({ ...formData, maxCustomDecks: val })}
                        className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: Marketing Bullets */}
              {activeModalTab === 'bullets' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                      Danh sách các điểm nổi bật hiển thị trên bảng giá Nâng cấp:
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, features: [...formData.features, ''] })}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-100"
                    >
                      + Thêm gạch đầu dòng
                    </button>
                  </div>

                  <div className="space-y-2">
                    {formData.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const newFeatures = [...formData.features];
                            newFeatures[idx] = e.target.value;
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          placeholder={`Đặc quyền #${idx + 1}...`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFeatures = formData.features.filter((_, i) => i !== idx);
                            setFormData({ ...formData, features: newFeatures });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-glass-primary !shadow-none flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPlan ? 'Cập Nhật Gói' : 'Tạo Gói Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAFE ARCHIVE PROMPT MODAL */}
      {archiveModalOpen && blockedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <div>
                <h4 className="font-black text-base text-slate-900 dark:text-white">
                  Không thể xóa cứng gói cước!
                </h4>
                <p className="text-xs text-slate-500">Bảo vệ học viên đang đăng ký</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl">
              {blockedPlan.message}
            </p>

            <p className="text-xs text-slate-500">
              Khi lưu trữ (Archive), học viên hiện tại vẫn giữ nguyên quyền lợi cho đến hết kỳ hạn, nhưng gói sẽ không hiển thị cho người dùng mới mua.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setArchiveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Đóng
              </button>
              <button
                onClick={() => handleArchivePlan(blockedPlan.plan.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md"
              >
                <Archive className="w-4 h-4" />
                <span>Chuyển sang Archive Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
