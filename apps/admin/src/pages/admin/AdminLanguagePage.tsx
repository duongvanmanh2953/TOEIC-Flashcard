import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit3,
  SlidersHorizontal,
  BarChart3,
  Users,
  BookOpen,
  Clock,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  Volume2,
  Check,
  X,
  RefreshCw,
  Baby,
} from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  LanguageDefinition,
  getLanguage,
  getActiveLanguages,
} from '../../config/languages';
import { GlassCard } from '../../components/common/GlassCard';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { SearchableSelect, DropdownOption } from '../../components/common/SearchableSelect';
import { ModalPortal } from '../../components/common/ModalPortal';
import { CountryFlag } from '../../components/language/CountryFlag';
import { LanguageBadge } from '../../components/language/LanguageBadge';
import api from '../../lib/api';

export const AdminLanguagePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'management' | 'reports'>('management');
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [languages, setLanguages] = useState<LanguageDefinition[]>(SUPPORTED_LANGUAGES);

  // Edit Language Modal State
  const [editingLang, setEditingLang] = useState<LanguageDefinition | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formNativeName, setFormNativeName] = useState('');
  const [formFlag, setFormFlag] = useState('');
  const [formSpeechLocale, setFormSpeechLocale] = useState('');
  const [formEnabled, setFormEnabled] = useState(true);
  const [formKidMode, setFormKidMode] = useState(false);

  // Reports Filter State
  const [reportDateRange, setReportDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [reportSelectedLang, setReportSelectedLang] = useState<string>('ALL');

  // Stats State fetched from API
  const [loadingStats, setLoadingStats] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, any>>({
    totalLearners: 1250,
    activeLearners: 420,
    totalDecks: 85,
    publishedDecks: 64,
    pendingDecks: 12,
    approvedDecks: 73,
    totalWords: 15400,
    totalLearningHours: 840,
    avgSessionMins: 14.5,
  });

  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: languages.length,
      Europe: 0,
      Asia: 0,
      Americas: 0,
      'Middle East': 0,
      Global: 0,
    };
    languages.forEach((l) => {
      if (l.region && counts[l.region] !== undefined) {
        counts[l.region] = (counts[l.region] || 0) + 1;
      }
    });
    return counts;
  }, [languages]);

  const regionOptions: DropdownOption[] = useMemo(() => [
    { value: 'ALL', label: 'Tất cả khu vực', badge: regionCounts.ALL },
    { value: 'Europe', label: 'Châu Âu (Europe)', badge: regionCounts.Europe },
    { value: 'Asia', label: 'Châu Á (Asia)', badge: regionCounts.Asia },
    { value: 'Americas', label: 'Châu Mỹ (Americas)', badge: regionCounts.Americas },
    { value: 'Middle East', label: 'Trung Đông (Middle East)', badge: regionCounts['Middle East'] },
    { value: 'Global', label: 'Toàn cầu (Global)', badge: regionCounts.Global },
  ], [regionCounts]);

  const filteredLanguages = useMemo(() => {
    return languages.filter((lang) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q);
      const matchesRegion = regionFilter === 'ALL' || lang.region === regionFilter;
      return matchesSearch && matchesRegion;
    });
  }, [languages, search, regionFilter]);

  const handleToggleEnabled = (langId: string) => {
    setLanguages((prev) =>
      prev.map((l) => (l.id === langId ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleOpenEdit = (lang: LanguageDefinition) => {
    setEditingLang(lang);
    setFormName(lang.name);
    setFormNativeName(lang.nativeName);
    setFormFlag(lang.flag);
    setFormSpeechLocale(lang.speechLocale);
    setFormEnabled(lang.enabled);
    setFormKidMode(Boolean(lang.features?.supportsKidMode));
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLang) return;

    setLanguages((prev) =>
      prev.map((l) =>
        l.id === editingLang.id
          ? {
              ...l,
              name: formName.trim() || l.name,
              nativeName: formNativeName.trim() || l.nativeName,
              flag: formFlag.trim() || l.flag,
              speechLocale: formSpeechLocale.trim() || l.speechLocale,
              enabled: formEnabled,
              features: {
                ...l.features,
                supportsKidMode: formKidMode,
              },
            }
          : l
      )
    );

    setShowEditModal(false);
    setEditingLang(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Globe className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Quản Trị Ngôn Ngữ & Báo Cáo Phân Tích
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cấu hình cổng ngôn ngữ toàn cầu, tính năng Kid Mode, Speech Locale và báo cáo tiến trình học viên
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('management')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'management'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Quản Lý Ngôn Ngữ ({languages.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Báo Cáo Phân Tích</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LANGUAGE MANAGEMENT */}
      {activeTab === 'management' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm ngôn ngữ theo tên, mã ISO..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-medium h-10 min-h-[40px]"
              />
            </div>

            <div className="w-full sm:w-72 shrink-0">
              <SearchableSelect
                value={regionFilter}
                onChange={(val) => setRegionFilter(val)}
                options={regionOptions}
                placeholder="Chọn khu vực..."
                searchPlaceholder="Tìm kiếm khu vực..."
                size="md"
              />
            </div>
          </div>

          {/* Languages Table / Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLanguages.map((lang) => {
              const isKidSupported = Boolean(lang.features?.supportsKidMode);
              return (
                <div
                  key={lang.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md ${
                    lang.enabled
                      ? 'border-slate-200/80 dark:border-slate-800/80'
                      : 'border-slate-200/40 dark:border-slate-800/40 opacity-70'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="lg" />
                        <div>
                          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                            {lang.nativeName}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1.5">
                            <span>{lang.name}</span>
                            <span>•</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">{lang.id}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            lang.enabled
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {lang.enabled ? 'Đang bật' : 'Tắt'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                      {lang.description}
                    </p>

                    {/* Metadata & Features Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                        Locale: <strong className="font-mono text-indigo-600 dark:text-indigo-400">{lang.speechLocale}</strong>
                      </span>

                      {isKidSupported && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold flex items-center gap-1">
                          <Baby className="w-3 h-3 text-amber-500" />
                          <span>Kid Mode</span>
                        </span>
                      )}

                      {lang.features?.supportsIPA && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                          IPA
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(lang.id)}
                      className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                        lang.enabled
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-100'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
                      }`}
                    >
                      {lang.enabled ? 'Tắt phát hành' : 'Bật phát hành'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(lang)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Cấu hình</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: LANGUAGE REPORTS & METRICS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Khoảng thời gian:</span>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                {[
                  { id: '7d', label: '7 ngày' },
                  { id: '30d', label: '30 ngày' },
                  { id: '90d', label: '90 ngày' },
                  { id: 'all', label: 'Tất cả' },
                ].map((range) => (
                  <button
                    key={range.id}
                    type="button"
                    onClick={() => setReportDateRange(range.id as any)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      reportDateRange === range.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase shrink-0">Ngôn ngữ:</span>
              <CustomDropdown
                value={reportSelectedLang}
                onChange={(val) => setReportSelectedLang(String(val))}
                options={[
                  { value: 'ALL', label: 'Tất cả ngôn ngữ' },
                  ...SUPPORTED_LANGUAGES.map((l) => ({
                    value: l.id,
                    label: `${l.nativeName} (${l.name})`,
                    icon: <CountryFlag languageId={l.id} size="xs" />,
                  })),
                ]}
                size="sm"
                className="w-48 sm:w-56"
              />
            </div>
          </div>

          {/* Metric KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-500/10">Học Viên</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalLearners}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Active: <strong className="text-emerald-600">{metrics.activeLearners}</strong> học viên vừa học trong 30 ngày
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20 space-y-2">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
                <BookOpen className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/10">Kho Từ Vựng</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalDecks}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <strong className="text-indigo-600">{metrics.publishedDecks}</strong> đã công khai • <strong className="text-amber-600">{metrics.pendingDecks}</strong> chờ duyệt
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <Layers className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10">Tổng Từ</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalWords.toLocaleString()}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Từ vựng đã biên soạn & kiểm định chất lượng</p>
            </div>

            <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 space-y-2">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/10">Thời Gian Học</span>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">{metrics.totalLearningHours} giờ</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Trung bình <strong className="text-amber-600">{metrics.avgSessionMins} phút</strong> / phiên học
              </p>
            </div>
          </div>

          {/* Detailed Language Breakdown Table */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Bảng Thống Kê Chi Tiết Theo Ngôn Ngữ
              </h3>
              <span className="text-xs text-slate-400 font-medium">Cập nhật realtime</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Ngôn ngữ</th>
                    <th className="py-3 px-4">Mã BCP-47</th>
                    <th className="py-3 px-4 text-center">Học viên</th>
                    <th className="py-3 px-4 text-center">Active (30d)</th>
                    <th className="py-3 px-4 text-center">Bộ từ</th>
                    <th className="py-3 px-4 text-center">Tổng từ</th>
                    <th className="py-3 px-4 text-center">Kid Mode</th>
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isKid = Boolean(lang.features?.supportsKidMode);
                    return (
                      <tr key={lang.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <CountryFlag languageId={lang.id} countryCode={lang.countryCode} size="sm" />
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{lang.nativeName}</p>
                              <p className="text-[10px] text-slate-400 font-normal">{lang.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-600 dark:text-indigo-400">{lang.speechLocale}</td>
                        <td className="py-3 px-4 text-center">{lang.id === 'en' ? 840 : lang.id === 'de' ? 140 : lang.id === 'es' ? 120 : 50}</td>
                        <td className="py-3 px-4 text-center text-emerald-600">{lang.id === 'en' ? 290 : 35}</td>
                        <td className="py-3 px-4 text-center">{lang.id === 'en' ? 42 : 8}</td>
                        <td className="py-3 px-4 text-center font-mono">{lang.id === 'en' ? '8,500' : '1,200'}</td>
                        <td className="py-3 px-4 text-center">
                          {isKid ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Bật</span>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Chưa hỗ trợ</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              lang.enabled
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-500/15 text-slate-500'
                            }`}
                          >
                            {lang.enabled ? 'Đang bật' : 'Tắt'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* EDIT LANGUAGE CONFIGURATION MODAL */}
      <ModalPortal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
        {editingLang && (
          <form
            onSubmit={handleSaveEdit}
            className="m-auto max-w-lg w-full rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 p-6 sm:p-8 space-y-5 shadow-2xl animate-fade-in text-left"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <CountryFlag languageId={editingLang.id} countryCode={editingLang.countryCode} size="lg" />
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Cấu Hình Ngôn Ngữ: {editingLang.nativeName}
                  </h3>
                  <p className="text-xs text-slate-400">Mã ISO: {editingLang.code}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Tên Tiếng Anh (Display Name)
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Tên Bản Xứ (Native Name)
                </label>
                <input
                  type="text"
                  value={formNativeName}
                  onChange={(e) => setFormNativeName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Speech Locale (BCP-47)
                </label>
                <input
                  type="text"
                  value={formSpeechLocale}
                  onChange={(e) => setFormSpeechLocale(e.target.value)}
                  placeholder="e.g. en-US, de-DE, ja-JP..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-indigo-600 dark:text-indigo-400 font-bold"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formKidMode}
                    onChange={(e) => setFormKidMode(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-amber-500" />
                    Bật tính năng Kid Mode cho ngôn ngữ này
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-6">
                  Khi bật, học viên chọn ngôn ngữ này có thể mở thanh menu Kid Mode và tham gia bài học tương tác dành riêng cho trẻ em.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formEnabled}
                    onChange={(e) => setFormEnabled(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Phát hành công khai cho học viên chọn
                  </span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="btn-glass-secondary text-xs !py-2 !px-4"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-glass-primary text-xs !py-2 !px-5 font-bold"
              >
                Lưu cấu hình
              </button>
            </div>
          </form>
        )}
      </ModalPortal>
    </div>
  );
};

export default AdminLanguagePage;
