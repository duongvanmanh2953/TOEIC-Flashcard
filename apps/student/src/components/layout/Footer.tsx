import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  Mail,
  FileText,
  Clock,
  Sparkles,
  HelpCircle,
  CreditCard,
  RefreshCw,
  Scale,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { VocabFlowLogo } from '@vocabflow/shared';
import { useTranslation } from '../../i18n';
import { LEGAL_CONFIG, MANDATORY_POLICIES, isLegalPlaceholder } from '../../config/legalConfig';

interface FooterProps {
  className?: string;
  showFullDetails?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ className = '', showFullDetails = true }) => {
  const { t } = useTranslation();

  const isPhonePlaceholder = isLegalPlaceholder(LEGAL_CONFIG.ownerPhone);
  const isAddressPlaceholder = isLegalPlaceholder(LEGAL_CONFIG.ownerAddress);
  const isNamePlaceholder = isLegalPlaceholder(LEGAL_CONFIG.ownerName);
  const isTaxPlaceholder = isLegalPlaceholder(LEGAL_CONFIG.ownerTaxCode);

  return (
    <footer
      className={`border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl transition-colors ${className}`}
      id="main-footer"
      role="contentinfo"
      aria-label="Thông tin chủ sở hữu và chính sách website"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        {/* Main Grid Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-slate-200 dark:border-slate-800/80">
          {/* Column 1: Brand & Ministry of Industry and Trade Compliance Statement (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 group">
              <VocabFlowLogo size="sm" className="group-hover:scale-105 transition-transform" />
              <span className="text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                {LEGAL_CONFIG.platformName}
              </span>
            </Link>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {t('footer.tagline', 'Nền tảng học từ vựng tiếng Anh cá nhân hóa với Spaced Repetition (SRS) và Trợ lý AI Tutor thông minh.')}
            </p>

            {/* eCommerce Notice badge (Tuân thủ theo Nghị định 52/2013/NĐ-CP & Nghị định 85/2021/NĐ-CP) */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/40 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
                <span>Thông báo Website Thương Mại Điện Tử</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {t(
                  'footer.ecomNotificationNotice',
                  'Website thương mại điện tử cung cấp dịch vụ số trực tuyến, đang thực hiện thủ tục thông báo với Bộ Công Thương theo quy định của pháp luật Việt Nam.'
                )}
              </p>
            </div>
          </div>

          {/* Column 2: Thông tin chủ sở hữu (Bắt buộc theo Nghị định 52) (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('footer.ownerSectionTitle', 'Thông Tin Chủ Sở Hữu Website')}</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              {/* Tên chủ sở hữu / Đơn vị vận hành */}
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {t('footer.ownerLabel', 'Chủ sở hữu / Đơn vị vận hành')}:
                </span>
                <span
                  className={
                    isNamePlaceholder
                      ? 'text-amber-600 dark:text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded'
                      : 'text-slate-700 dark:text-slate-300'
                  }
                >
                  {LEGAL_CONFIG.ownerName}
                </span>
              </div>

              {/* Mã số thuế */}
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  {t('footer.taxCodeLabel', 'Mã số thuế')}:
                </span>
                <span
                  className={
                    isTaxPlaceholder
                      ? 'text-amber-600 dark:text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded'
                      : 'text-slate-700 dark:text-slate-300 font-medium'
                  }
                >
                  {LEGAL_CONFIG.ownerTaxCode}
                </span>
              </div>

              {/* Địa chỉ liên hệ */}
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span
                  className={
                    isAddressPlaceholder
                      ? 'text-amber-600 dark:text-amber-400 font-mono text-[11px] bg-amber-500/10 px-2 py-0.5 rounded block'
                      : 'text-slate-700 dark:text-slate-300'
                  }
                >
                  {LEGAL_CONFIG.ownerAddress}
                </span>
              </div>

              {/* Điện thoại & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  {isPhonePlaceholder ? (
                    <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px] bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {LEGAL_CONFIG.ownerPhone}
                    </span>
                  ) : (
                    <a
                      href={`tel:${LEGAL_CONFIG.ownerPhone.replace(/\s+/g, '')}`}
                      className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                    >
                      {LEGAL_CONFIG.ownerPhone}
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <a
                    href={`mailto:${LEGAL_CONFIG.ownerEmail}`}
                    className="text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors truncate"
                    title={LEGAL_CONFIG.ownerEmail}
                  >
                    {LEGAL_CONFIG.ownerEmail}
                  </a>
                </div>
              </div>

              {/* Khung giờ làm việc */}
              <div className="flex items-start gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {LEGAL_CONFIG.supportHours}
                </span>
              </div>
            </div>
          </div>

          {/* Column 3: Các trang chính sách bắt buộc (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('footer.policiesTitle', 'Chính Sách & Quy Định')}</span>
            </h3>

            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/terms-of-service"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.termsOfService', 'Điều khoản dịch vụ')}
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.privacyPolicy', 'Chính sách bảo mật')}
                </Link>
              </li>
              <li>
                <Link
                  to="/payment-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.paymentPolicy', 'Chính sách thanh toán')}
                </Link>
              </li>
              <li>
                <Link
                  to="/delivery-refund-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.deliveryRefund', 'Giao nhận & hoàn tiền')}
                </Link>
              </li>
              <li>
                <Link
                  to="/complaint-resolution"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.complaintResolution', 'Giải quyết khiếu nại')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Dịch vụ & Hỗ trợ (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('footer.servicesTitle', 'Dịch Vụ & Hỗ Trợ')}</span>
            </h3>

            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  to="/upgrade"
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline block py-0.5 flex items-center gap-1"
                >
                  <span>{t('footer.pricing', 'Bảng giá & Gói Pro')}</span>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 px-1 rounded font-bold">
                    HOT
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/vocabulary"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.wordBank', 'Thư viện từ vựng')}
                </Link>
              </li>
              <li>
                <Link
                  to="/exams"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.examBank', 'Luyện thi chuẩn hóa')}
                </Link>
              </li>
              <li>
                <Link
                  to="/feedback"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.feedbackPortal', 'Góp ý & Khiếu nại')}
                </Link>
              </li>
              <li>
                <Link
                  to="/kids"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block py-0.5"
                >
                  {t('footer.kidsApp', 'Góc học tập Trẻ em')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Compliance Statement */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>© {new Date().getFullYear()} {LEGAL_CONFIG.platformName}. {t('footer.allRightsReserved', 'Bảo lưu mọi quyền.')}</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Vận hành trên nền tảng web công nghệ cao Spaced Repetition (SRS)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <Link to="/terms-of-service" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Điều khoản
            </Link>
            <Link to="/privacy-policy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Bảo mật
            </Link>
            <Link to="/payment-policy" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Thanh toán
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;
