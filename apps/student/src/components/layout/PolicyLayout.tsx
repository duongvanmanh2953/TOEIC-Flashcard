import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Calendar,
  Building2,
  ChevronRight,
  ArrowLeft,
  FileText,
  Mail,
  Phone,
  HelpCircle,
  Clock,
  ExternalLink,
  Lock,
  CreditCard,
  Truck,
  AlertCircle,
  Moon,
  Sun,
} from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';
import { Footer } from './Footer';
import { LEGAL_CONFIG, MANDATORY_POLICIES } from '../../config/legalConfig';
import { useTranslation } from '../../i18n';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSwitcher } from '../language/LanguageSwitcher';

export interface TocItem {
  id: string;
  title: string;
}

interface PolicyLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated?: string;
  effectiveDate?: string;
  currentPath: string;
  toc?: TocItem[];
  children: React.ReactNode;
}

export const PolicyLayout: React.FC<PolicyLayoutProps> = ({
  title,
  subtitle,
  lastUpdated = '15/10/2026',
  effectiveDate = '15/10/2026',
  currentPath,
  toc = [],
  children,
}) => {
  const { t, locale } = useTranslation();
  const { user, theme, toggleTheme } = useAuth();
  const location = useLocation();
  const homeTarget = user ? '/dashboard' : '/';

  // Scroll to anchor if URL has hash
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  const relatedPolicies = MANDATORY_POLICIES.filter((p) => p.path !== currentPath);

  const getPolicyIcon = (_path: string) => {
    return <VocabFlowLogo size="xs" showContainer={false} className="w-4 h-4 object-contain shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500/20 selection:text-indigo-600">
      {/* Top Header Navigation */}
      <header className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to={homeTarget} className="flex items-center gap-2.5 group min-w-0" title="VocabFlow Smart Adaptive English">
              <VocabFlowLogo size="sm" showContainer={false} className="group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <div className="flex flex-col text-left">
                <span className="font-extrabold text-base leading-tight tracking-tight text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  VocabFlow
                </span>
                <span className="text-[10px] text-slate-400 font-medium tracking-tight leading-none">
                  Multi-Language Learning
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400">
                Trung Tâm Pháp Lý & Chính Sách
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = homeTarget;
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors py-2 px-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Quay lại trang trước"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{user ? 'Trở về trang học' : t('policies.backToHome', 'Trang chủ')}</span>
            </button>

            <Link
              to="/upgrade"
              className="hidden sm:inline-flex text-xs font-bold px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
            >
              Bảng giá Pro
            </Link>

            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Theme"
              title="Đổi giao diện Sáng / Tối"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Header Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/70 via-white to-slate-50 dark:from-indigo-950/40 dark:via-slate-900/50 dark:to-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 py-10 sm:py-14">
        {/* Decorative backdrop elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4" aria-label="Breadcrumb">
            <Link to={homeTarget} className="hover:text-indigo-600 transition-colors">{user ? 'Bảng học tập' : 'Trang chủ'}</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Chính sách website</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-none">
              {title}
            </span>
          </nav>

          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 shadow-sm">
              <VocabFlowLogo size="xs" showContainer={false} className="w-4 h-4 object-contain shrink-0" />
              <span>{t('policies.badge', 'Văn Bản Chính Thức')}</span>
            </div>

            <div className="flex items-start sm:items-center gap-3 sm:gap-4">
              <div className="p-2 sm:p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-md shrink-0">
                <VocabFlowLogo size="md" showContainer={false} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h1>
            </div>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
              {subtitle}
            </p>

            {/* Metadata Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('policies.lastUpdated', 'Cập nhật')}: <strong>{lastUpdated}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>{t('policies.effectiveDate', 'Hiệu lực')}: <strong>{effectiveDate}</strong></span>
              </div>

              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>Đơn vị: <strong>{LEGAL_CONFIG.platformName}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout with Sticky Sidebar */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Sticky Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            {/* Table of Contents Box (if TOC items provided) */}
            {toc.length > 0 && (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <VocabFlowLogo size="xs" showContainer={false} className="w-4 h-4 object-contain shrink-0" />
                  <span>{t('policies.tableOfContents', 'Mục Lục Văn Bản')}</span>
                </h3>
                <nav className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1 text-xs">
                  {toc.map((item, idx) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block py-1.5 px-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors leading-snug"
                    >
                      <span className="font-semibold text-slate-400 dark:text-slate-500 mr-1.5">
                        {idx + 1}.
                      </span>
                      {item.title}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Other Mandatory Policies Quick Nav */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                <span>{t('policies.relatedPolicies', 'Hồ Sơ Chính Sách Bắt Buộc')}</span>
              </h3>

              <div className="space-y-2">
                {relatedPolicies.map((p) => (
                  <Link
                    key={p.path}
                    to={p.path}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all text-xs group"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:scale-110 transition-transform">
                      {getPolicyIcon(p.path)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                        {locale === 'en' ? p.titleEn : p.titleVi}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {locale === 'en' ? p.descriptionEn : p.descriptionVi}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Direct Support & Hotline Contact Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-200/70 dark:border-indigo-800/40 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                <VocabFlowLogo size="xs" showContainer={false} className="w-4 h-4 object-contain shrink-0" />
                <span>{t('policies.needAssistance', 'Cần Hỗ Trợ Trực Tiếp?')}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                Bộ phận tiếp nhận khiếu nại và hỗ trợ học viên của {LEGAL_CONFIG.platformName} luôn sẵn sàng đồng hành trong mọi tình huống.
              </p>

              <div className="space-y-2 pt-1 border-t border-indigo-100 dark:border-indigo-900/40">
                <a
                  href={`mailto:${LEGAL_CONFIG.ownerEmail}`}
                  className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{LEGAL_CONFIG.ownerEmail}</span>
                </a>

                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Phone className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
                  <span>{LEGAL_CONFIG.ownerPhone}</span>
                </div>
              </div>

              <Link
                to="/feedback"
                className="mt-2 block w-full text-center py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Gửi phản hồi / Khiếu nại
              </Link>
            </div>
          </aside>

          {/* Right Column: Policy Document Body (8 cols) */}
          <main className="lg:col-span-8 bg-white dark:bg-slate-900/90 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-sm space-y-8">
            <article className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-img:rounded-2xl">
              {children}
            </article>
          </main>
        </div>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};
export default PolicyLayout;
