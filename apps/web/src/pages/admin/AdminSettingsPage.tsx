import React, { useState } from 'react';
import {
  Settings,
  Database,
  Trash2,
  Cpu,
  CreditCard,
  Headphones,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Radio,
  Globe,
  Lock,
} from 'lucide-react';
import api from '../../lib/api';
import { useTranslation } from '../../i18n';

export const AdminSettingsPage: React.FC = () => {
  const { t, locale, setLocale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'retention' | 'general' | 'ai' | 'gateway'>('retention');

  // Purge state
  const [purging, setPurging] = useState(false);
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  const [purgingMock, setPurgingMock] = useState(false);
  const [purgeMockModalOpen, setPurgeMockModalOpen] = useState(false);

  // Form states
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [aiModel, setAiModel] = useState('gpt-4o');
  const [aiTemp, setAiTemp] = useState(0.7);
  const [aiDailyQuota, setAiDailyQuota] = useState(5);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoAssign, setAutoAssign] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  const handlePurgeMessages = async () => {
    setPurging(true);
    try {
      const res: any = await api.post('/support/admin/cleanup-old-messages', { days: 3 });
      setPurgeResult(res?.data?.data?.message || t('adminSettings.purgeSuccess', 'Đã dọn dẹp sạch tin nhắn cũ hơn 3 ngày thành công!'));
      setPurgeModalOpen(false);
    } catch (err) {
      console.error('Purge error:', err);
      setPurgeResult('Không thể thực hiện dọn dẹp tin nhắn lúc này.');
    } finally {
      setPurging(false);
    }
  };

  const handlePurgeMockData = async () => {
    setPurgingMock(true);
    try {
      const res: any = await api.post('/admin/purge-mock-data');
      const info = res?.data?.data || res?.data || res;
      setPurgeResult(info?.message || 'Đã dọn sạch toàn bộ dữ liệu mẫu thành công. Chỉ giữ lại tài khoản người dùng và kho từ vựng.');
      setPurgeMockModalOpen(false);
    } catch (err) {
      console.error('Purge mock data error:', err);
      setPurgeResult('Không thể thực hiện xóa dữ liệu mẫu lúc này.');
    } finally {
      setPurgingMock(false);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaveSuccess(t('adminSettings.savedSuccess', 'Đã cập nhật cài đặt thành công!'));
      setTimeout(() => setSaveSuccess(''), 3000);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-indigo-500" />
            {t('adminSettings.title', 'Cài Đặt Hệ Thống & Cấu Hình Quản Trị')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('adminSettings.subtitle', 'Quản lý chính sách lưu trữ DB, mô hình AI, cổng thanh toán và thông số vận hành VocabFlow.')}
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'retention'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t('adminSettings.tabRetention', 'Chính Sách Lưu Trữ & DB')}</span>
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'general'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{t('adminSettings.tabGeneral', 'Cấu Hình Nền Tảng')}</span>
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('adminSettings.tabAI', 'Mô Hình AI Tutor')}</span>
          </button>
          <button
            onClick={() => setActiveTab('gateway')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
              activeTab === 'gateway'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('adminSettings.tabGateway', 'CSKH & Thanh Toán')}</span>
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {purgeResult && (
        <div className="p-3.5 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 rounded-xl flex items-center justify-between text-xs font-bold animate-in fade-in">
          <span>{purgeResult}</span>
          <button onClick={() => setPurgeResult(null)} className="underline">Đóng</button>
        </div>
      )}

      {/* TAB 1: RETENTION & DB OPTIMIZATION */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-500" />
                  {t('adminSettings.purgeMessagesTitle', 'Tối ưu hóa Database: Dọn dẹp tin nhắn CSKH')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
                  {t('adminSettings.purgeMessagesDesc', 'Xóa toàn bộ nội dung tin nhắn cũ hơn 3 ngày. Giữ nguyên 100% hồ sơ yêu cầu (ticket) của học viên để đối soát.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPurgeModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-sm transition shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('adminSettings.purgeMessagesBtn', 'Dọn dẹp sạch tin nhắn > 3 ngày')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Tin nhắn CSKH:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">Lưu trữ tối đa 3 ngày</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Hồ sơ Tickets & Feedback:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">Bảo lưu vĩnh viễn</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">Nhật ký Audit Logs:</span>
                <p className="font-bold text-slate-900 dark:text-white mt-1">Bảo lưu 90 ngày</p>
              </div>
            </div>
          </div>

          {/* Purge Mock Data Card */}
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-amber-500/30 dark:border-amber-500/20 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Chuyển sang Vận Hành Thực: Xóa Sạch Dữ Liệu Mẫu (Purge Mock Data)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xl">
                  Xóa sạch toàn bộ tin nhắn hỗ trợ mẫu, tickets mẫu, feedback mẫu, giao dịch giả lập và thông báo mẫu. <strong>Hệ thống chỉ bảo lưu duy nhất tài khoản người dùng thực và toàn bộ kho từ vựng.</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPurgeMockModalOpen(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1.5 shadow-sm transition shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Xóa sạch data mẫu</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
              💡 Thao tác này giúp bạn chuyển giao hệ thống sang trạng thái vận hành dữ liệu thực 100% mà không bị lẫn lộn bất kỳ dữ liệu test/mock nào.
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERAL SETTINGS */}
      {activeTab === 'general' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('adminSettings.maintenanceMode', 'Chế độ bảo trì hệ thống')}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t('adminSettings.maintenanceDesc', 'Khi bật, chỉ tài khoản Admin mới có thể đăng nhập vào ứng dụng.')}
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-700/50">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('adminSettings.userReg', 'Cho phép đăng ký học viên mới')}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Mở cổng tiếp nhận học viên đăng ký tài khoản tự do</p>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('adminSettings.defaultLang', 'Ngôn ngữ hệ thống')}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Chuyển đổi giao diện song ngữ Tiếng Việt / English</p>
              </div>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
              >
                <option value="vi">Tiếng Việt (VI)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{t('adminSettings.saveBtn', 'Lưu thay đổi cấu hình')}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: AI TUTOR ENGINE */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveSettings} className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                {t('adminSettings.aiModel', 'Mô hình AI mặc định')}
              </label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full sm:w-80 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold"
              >
                <option value="gpt-4o">OpenAI GPT-4o (Độ chính xác cao, giải thích sắc bén)</option>
                <option value="claude-3-5-sonnet">Anthropic Claude 3.5 Sonnet (Văn phong tự nhiên)</option>
                <option value="local-deepseek">DeepSeek TOEIC Specialist (Mô hình tối ưu chi phí)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 dark:text-white">
                  {t('adminSettings.aiTemp', 'Nhiệt độ sáng tạo (Temperature)')}: {aiTemp}
                </label>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={aiTemp}
                onChange={(e) => setAiTemp(parseFloat(e.target.value))}
                className="w-full sm:w-80 accent-indigo-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Mức 0.7 được khuyến nghị cho ngữ cảnh luyện thi TOEIC chuẩn học thuật.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-white mb-1">
                {t('adminSettings.aiQuota', 'Hạn mức câu hỏi AI miễn phí mỗi ngày')}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={aiDailyQuota}
                onChange={(e) => setAiDailyQuota(parseInt(e.target.value, 10))}
                className="w-32 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-700/50">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{t('adminSettings.saveBtn', 'Lưu thay đổi cấu hình')}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: GATEWAYS (SOCKET & BILLING) */}
      {activeTab === 'gateway' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Headphones className="w-4 h-4 text-indigo-500" />
              <span>Kênh CSKH & Socket.io Gateway</span>
            </h3>

            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">WebSocket Port :4000</span>
                  <p className="text-[11px] text-slate-400">Kết nối thời gian thực 2 chiều cho Widget CSKH & Admin Inbox</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  ĐANG HOẠT ĐỘNG
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Cổng Thanh Toán VietQR & PayOS</span>
                  <p className="text-[11px] text-slate-400">Ngân hàng Vietcombank (9353421340 - DUONG VAN MANH)</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                  TỰ ĐỘNG KHỚP LỆNH
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purge Modal */}
      {purgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{t('adminSettings.cleanModalTitle', 'Xác nhận dọn dẹp tin nhắn cũ')}</h3>
                <p className="text-xs text-slate-400">Chỉ Admin mới có quyền thực thi thao tác này</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t('adminSettings.cleanModalDesc', 'Thao tác này sẽ xóa sạch toàn bộ nội dung tin nhắn được tạo cũ hơn 3 ngày nhằm tối ưu dung lượng Database. Danh sách yêu cầu (tickets) vẫn được bảo lưu an toàn.')}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPurgeModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeMessages}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition flex items-center gap-1.5"
              >
                {purging && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận dọn dẹp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Mock Data Modal */}
      {purgeMockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Xác nhận xóa sạch dữ liệu mẫu</h3>
                <p className="text-xs text-slate-400">Chỉ Admin mới có quyền thực thi thao tác này</p>
              </div>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed space-y-2">
              <p>
                Thao tác này sẽ xóa vĩnh viễn toàn bộ dữ liệu mẫu (mock data) hiện có trong hệ thống:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
                <li>Xóa toàn bộ tin nhắn & yêu cầu hỗ trợ (tickets) mẫu</li>
                <li>Xóa toàn bộ ý kiến đóng góp (feedbacks) mẫu</li>
                <li>Xóa toàn bộ giao dịch & đơn hàng giả lập</li>
                <li>Xóa toàn bộ thông báo hệ thống mẫu</li>
              </ul>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                🛡️ BẢO LƯU AN TOÀN: Toàn bộ danh sách Người dùng (Users) và Kho từ vựng (Vocabulary).
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={purgingMock}
                onClick={() => setPurgeMockModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl bg-slate-800 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={purgingMock}
                onClick={handlePurgeMockData}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition flex items-center gap-1.5"
              >
                {purgingMock && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Xác nhận xóa sạch data mẫu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
