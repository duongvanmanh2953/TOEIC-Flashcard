import React, { useEffect, useState } from 'react';
import api from '../lib/api';
import { Award, Flame, TrendingUp, CheckCircle, Brain, Target, LineChart, Sparkles } from 'lucide-react';
import { FeatureLock } from '../components/common/FeatureLock';
import { useAuth } from '../contexts/AuthContext';
import { VocabularyXRay } from '../components/vocabflow/VocabularyXRay';
import { SmartQueueBar } from '../components/vocabflow/SmartQueueBar';
import { ConfusionPairsCard } from '../components/vocabflow/ConfusionPairsCard';
import { VocabularyCaptureModal } from '../components/vocabflow/VocabularyCaptureModal';
import { WordDiagnosticModal } from '../components/vocabflow/WordDiagnosticModal';

export const ProgressAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // VocabFlow Modals
  const [captureModalOpen, setCaptureModalOpen] = useState(false);
  const [inspectedWordId, setInspectedWordId] = useState<string | null>(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Tiến Độ & Phân Tích Khoa Học Trí Nhớ</h2>
          <p className="text-sm text-slate-500 mt-1">
            VocabFlow™ AI: Phân tách Biết từ (Passive) vs Dùng từ (Active), biểu đồ 5D và gợi ý ôn tập
          </p>
        </div>

        <button
          onClick={() => setCaptureModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Quét văn bản tiếng Anh thực tế</span>
        </button>
      </div>

      {/* Smart Review Queue Micro-learning Bar */}
      <SmartQueueBar />

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

      {/* Vocabulary X-Ray Cognitive 5D Engine */}
      <VocabularyXRay
        onInspectWord={(wordId) => setInspectedWordId(wordId)}
        onOpenCapture={() => setCaptureModalOpen(true)}
      />

      {/* Confusion Engine: Frequently Confused Pairs */}
      <ConfusionPairsCard />

      {/* Pro Feature: Deep CEFR Analytics & Ebbinghaus Retention Curve */}
      <FeatureLock
        featureTitle="Phân Tích Sâu CEFR & Đường Cong Quên Lãng (Ebbinghaus Retention Curve)"
        previewDescription="Theo dõi biểu đồ suy giảm trí nhớ thời gian thực, độ bền ghi nhớ dài hạn và chuẩn đoán cấp độ CEFR chuẩn quốc tế từ A2 đến C1 cho từng chủ đề từ vựng."
        variant="pro"
        previewContent={
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <LineChart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Độ bền trí nhớ dự đoán (Predicted Retrievability):</span>
              </span>
              <span className="font-black text-emerald-600 dark:text-emerald-400">88.4% (Tối ưu)</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-500 rounded-full w-[88%]" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">A2 Sơ Cấp</span>
                <span className="font-extrabold text-emerald-600">96% Mastery</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">B1 Trung Cấp</span>
                <span className="font-extrabold text-indigo-600">82% Mastery</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">B2 Nâng Cao</span>
                <span className="font-extrabold text-amber-600">65% Mastery</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">C1 Chuyên Sâu</span>
                <span className="font-extrabold text-purple-600">42% Mastery</span>
              </div>
            </div>
          </div>
        }
      />

      {/* Achievements Section */}
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
              className={`p-4 rounded-2xl border transition flex items-center gap-3 ${
                ach.unlocked
                  ? 'card-brand-effect bg-brand-500/[0.06] dark:bg-brand-500/[0.12] border border-brand-400/40 backdrop-blur-md'
                  : 'bg-transparent border border-slate-200/50 dark:border-slate-800/50 opacity-40'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  ach.unlocked
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

      {/* VocabFlow Modals */}
      <VocabularyCaptureModal
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
      />

      <WordDiagnosticModal
        vocabularyId={inspectedWordId}
        onClose={() => setInspectedWordId(null)}
      />
    </div>
  );
};

export default ProgressAnalyticsPage;
