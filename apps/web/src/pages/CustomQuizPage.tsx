import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { GlassCard } from '../components/common/GlassCard';
import { SpeechButton } from '../components/common/SpeechButton';
import { CustomDropdown } from '../components/common/CustomDropdown';
import {
  FileCheck2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  RotateCcw,
} from 'lucide-react';

export const CustomQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isGuest, promptLogin } = useAuth();

  // Generator Setup State
  const [sourceFilter, setSourceFilter] = useState<'FAVORITES' | 'WEAK_WORDS' | 'CEFR'>('WEAK_WORDS');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [cefrLevel, setCefrLevel] = useState('B2');
  const [generating, setGenerating] = useState(false);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [result, setResult] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleStartQuiz = async () => {
    if ((sourceFilter === 'FAVORITES' || sourceFilter === 'WEAK_WORDS') && (isGuest || !user)) {
      promptLogin('Đăng nhập để tạo đề trắc nghiệm từ Kho từ vựng cá nhân và Từ yếu');
      return;
    }
    setGenerating(true);
    try {
      const res: any = await api.post('/quizzes/generate', {
        sourceFilter,
        questionCount,
        cefrLevel,
      });

      if (res?.success) {
        setActiveQuiz(res.data);
        setCurrentIndex(0);
        setAnswers({});
        setResult(null);
        setStartTime(Date.now());
      }
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo bài kiểm tra.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    setSubmitting(true);
    const responseTimeMs = Date.now() - startTime;
    try {
      const res: any = await api.post(`/quizzes/${activeQuiz.quizId}/submit`, {
        answers,
        responseTimeMs,
      });

      if (res?.success) {
        setResult(res.data);
      }
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi nộp bài.');
    } finally {
      setSubmitting(false);
    }
  };

  // Result Summary View
  if (result) {
    return (
      <div className="max-w-lg mx-auto py-12 px-4 text-center">
        <GlassCard className="p-8 space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black">Kết Quả Bài Kiểm Tra</h2>
            <p className="text-xs text-slate-500 mt-1">{activeQuiz.title}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 py-4 border-y border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Điểm số</span>
              <p className="text-2xl font-black text-brand-600 dark:text-brand-400">{result.accuracy}%</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">Đúng</span>
              <p className="text-2xl font-black text-emerald-600">
                {result.correctCount} / {result.totalCount}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase">XP Nhận</span>
              <p className="text-2xl font-black text-indigo-600">+{result.xpEarned}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveQuiz(null)}
              className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold text-xs transition"
            >
              Tạo đề khác
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-glass-primary flex-1 !py-3 !rounded-2xl text-white font-extrabold text-xs shadow-md transition"
            >
              Về Dashboard
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Taking Quiz View
  if (activeQuiz) {
    const currentQ = activeQuiz.questions[currentIndex];
    const totalQ = activeQuiz.questions.length;
    const progress = Math.round(((currentIndex + 1) / totalQ) * 100);

    return (
      <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <button onClick={() => setActiveQuiz(null)} className="hover:text-slate-600">
            ✕ Hủy bài thi
          </button>
          <span>
            Câu {currentIndex + 1} / {totalQ}
          </span>
        </div>

        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        <GlassCard className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/30">
              {activeQuiz.title}
            </span>
            <SpeechButton text={currentQ.word} />
          </div>

          <div className="text-center py-2 space-y-1">
            <h3 className="text-2xl sm:text-3xl font-black">{currentQ.word}</h3>
            {currentQ.phonetic && <p className="text-xs tabular-nums text-slate-400">{currentQ.phonetic}</p>}
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 pt-2">{currentQ.prompt}</p>
          </div>

          <div className="space-y-3">
            {currentQ.options?.map((opt: string, idx: number) => {
              const selected = answers[currentQ.id] === opt;
              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                  className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition flex items-center justify-between ${selected
                      ? 'border-2 border-brand-500 bg-brand-500/[0.08] dark:bg-brand-500/[0.16] text-brand-700 dark:text-brand-200'
                      : 'border-slate-200/60 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                >
                  <span>{opt}</span>
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs tabular-nums font-bold text-slate-400">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-30 text-xs font-bold"
            >
              Câu trước
            </button>

            {currentIndex + 1 < totalQ ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="btn-glass-primary !px-6 !py-2.5 !rounded-xl text-white font-extrabold text-xs shadow-md transition"
              >
                Câu tiếp theo
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md transition"
              >
                {submitting ? 'Đang chấm điểm...' : 'Nộp bài thi'}
              </button>
            )}
          </div>
        </GlassCard>
      </div>
    );
  }

  // Generator Setup View
  return (
    <div className="w-full space-y-8 animate-fade-in">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full card-brand-effect overflow-hidden bg-brand-500/[0.08] dark:bg-brand-500/[0.14] border border-brand-400/40 text-brand-600 dark:text-brand-300 text-xs font-bold mb-2">
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Auto Quiz Generator</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          Tạo Đề Kiểm Tra & Thi Thử Tự Động
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Hệ thống tự động biên soạn đề thi trắc nghiệm & điền từ tùy biến từ kho từ yếu, từ yêu thích hoặc theo cấp độ CEFR.
        </p>
      </div>

      <GlassCard className="p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              1. Chọn nguồn tạo đề thi
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: 'WEAK_WORDS', label: 'Từ hay quên (Weak Words)', desc: 'Củng cố các từ < 50% mastery' },
                { key: 'FAVORITES', label: 'Từ yêu thích (Favorites)', desc: 'Kiểm tra các từ bạn đã lưu' },
                { key: 'CEFR', label: 'Theo chuẩn CEFR', desc: 'Đánh giá vốn từ phân tầng' },
              ].map((src) => (
                <button
                  key={src.key}
                  type="button"
                  onClick={() => setSourceFilter(src.key as any)}
                  className={`p-4 rounded-2xl border text-left transition ${sourceFilter === src.key
                      ? 'card-brand-effect border-2 border-brand-500 bg-brand-500/[0.06] dark:bg-brand-500/[0.12]'
                      : 'border-slate-200/60 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-transparent'
                    }`}
                >
                  <p className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">
                    {src.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{src.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {sourceFilter === 'CEFR' && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
                2. Chọn cấp độ CEFR
              </label>
              <CustomDropdown
                value={cefrLevel}
                onChange={(val) => setCefrLevel(val)}
                options={[
                  { value: 'A2', label: 'A2 — Pre-intermediate', badge: 'A2' },
                  { value: 'B1', label: 'B1 — Intermediate', badge: 'B1' },
                  { value: 'B2', label: 'B2 — Upper Intermediate', badge: 'B2' },
                  { value: 'C1', label: 'C1 — Advanced', badge: 'C1' },
                ]}
                className="w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-2">
              3. Số lượng câu hỏi
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setQuestionCount(num)}
                  className={`py-3 rounded-2xl border font-bold text-sm transition ${questionCount === num
                      ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                >
                  {num} câu
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleStartQuiz}
          disabled={generating}
          className="w-full py-4 rounded-2xl btn-glass-primary !shadow-none disabled:opacity-50 text-white font-extrabold text-base flex items-center justify-center gap-2 transition hover:border-cyan-300"
        >
          {generating ? (
            <span>Đang tổng hợp đề thi thích ứng...</span>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Bắt Đầu Làm Bài Thi Ngay</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </GlassCard>
    </div>
  );
};
