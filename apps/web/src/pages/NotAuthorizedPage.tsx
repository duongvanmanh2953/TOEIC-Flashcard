import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useI18n } from '../i18n';

export const NotAuthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white relative overflow-hidden">
      {/* Background glow ambient */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 text-center relative z-10 border border-rose-500/20 bg-slate-900/80 backdrop-blur-2xl rounded-3xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-6 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/25 mb-3">
          <Lock className="w-3 h-3" />
          HTTP 403 • FORBIDDEN
        </span>

        <h1 className="text-2xl font-black text-white tracking-tight mb-2">
          {t('admin.notAuthorizedTitle', 'Quyền Truy Cập Bị Từ Chối')}
        </h1>

        <p className="text-sm text-slate-400 mb-8 leading-relaxed">
          {t(
            'admin.notAuthorizedDesc',
            'Khu vực Quản trị Hệ thống (Admin Center) chỉ dành riêng cho Quản trị viên được ủy quyền. Tài khoản của bạn không có đặc quyền truy cập trang này.',
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition border border-slate-700/60"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay Lại</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 transition"
          >
            <Home className="w-4 h-4" />
            <span>Về Bảng Học Tập</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotAuthorizedPage;
