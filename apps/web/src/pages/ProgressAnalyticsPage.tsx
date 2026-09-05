import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Award, Flame, TrendingUp, CheckCircle, Brain, Target } from 'lucide-react';

export const ProgressAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then((res: any) => {
      if (res?.success) setData(res.data);
      setLoading(false);
    });
  }, []);

  const achievements = [
    { code: 'FIRST_WORD', name: 'Bước Đầu Tiên', desc: 'Học từ vựng đầu tiên', unlocked: true },
    { code: 'STREAK_3', name: 'Khởi Động Thói Quen', desc: 'Duy trì chuỗi 3 ngày', unlocked: (data?.streak || 0) >= 3 },
    { code: 'STREAK_7', name: 'Bậc Thầy Bền Bỉ', desc: 'Duy trì chuỗi 7 ngày', unlocked: (data?.streak || 0) >= 7 },
    { code: 'VOCAB_50', name: 'Xây Dựng Vốn Từ', desc: 'Thực hành 50 từ vựng', unlocked: (data?.stats?.totalTracked || 0) >= 50 },
    { code: 'MASTER_10', name: 'Ghi Nhớ Vĩnh Viễn', desc: 'Đạt 100% Mastery cho 10 từ', unlocked: (data?.stats?.mastered || 0) >= 10 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Tiến Độ & Phân Tích Khoa Học Trí Nhớ</h2>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi độ bền ghi nhớ, tốc độ mở rộng vốn từ và thành tựu đã đạt được
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Tổng từ đang theo dõi</span>
            <Brain className="w-4 h-4 text-brand-500" />
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">
            {data?.stats?.totalTracked || 0}
          </p>
          <div className="text-xs text-slate-400">
            {data?.stats?.mastered || 0} từ đã thuộc vĩnh viễn (Mastered)
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Độ nhớ trung bình (Retention)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {data?.mastery || 0}%
          </p>
          <div className="text-xs text-slate-400">Dựa trên xác suất gợi nhớ FSRS</div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
            <span>Chuỗi kỷ lục</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-500">{data?.longestStreak || 0} ngày</p>
          <div className="text-xs text-slate-400">Chuỗi hiện tại: {data?.streak || 0} ngày</div>
        </div>
      </div>

      {/* Achievements Section (Section 29) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-600" />
            <h3 className="font-bold text-lg">Danh Hiệu & Huy Chương (Achievements)</h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length} Mở khóa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.code}
              className={`p-4 rounded-2xl border transition flex items-center gap-3 ${ach.unlocked
                  ? 'bg-brand-50/20 dark:bg-brand-950/30 border-brand-200 dark:border-brand-800'
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-50'
                }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${ach.unlocked
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
              >
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">{ach.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{ach.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
