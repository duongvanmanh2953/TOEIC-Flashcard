import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Compass, CheckCircle, ArrowRight, Award, AlertCircle } from 'lucide-react';

export const PlacementTestPage: React.FC = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/placement-test/questions').then((res: any) => {
      if (res?.success) setQuestions(res.data);
      setLoading(false);
    });
  }, []);

  const handleNext = async () => {
    if (!selectedOption) return;

    const currentQ = questions[currentIndex];
    const newAnswers = [
      ...answers,
      {
        questionId: currentQ.id,
        cefrLevel: currentQ.cefrLevel,
        selectedOption,
        correctAnswer: currentQ.correctAnswer,
        category: currentQ.category,
      },
    ];
    setAnswers(newAnswers);
    setSelectedOption('');

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Submit Placement Test
      setSubmitting(true);
      try {
        const res: any = await api.post('/placement-test/submit', { answers: newAnswers });
        if (res?.success) {
          setResult(res.data);
        }
      } catch (err) {
        console.error('Failed to submit test', err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  // Result Evaluation Screen (Section 6)
  if (result) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-fade-in">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Kết Quả Đánh Giá Năng Lực</h2>
            <p className="text-sm text-slate-500 mt-1">
              Thuật toán VocabFlow AI đã phân tích hồ sơ phản xạ của bạn
            </p>
          </div>

          {/* Key Stat Badges */}
          <div className="grid grid-cols-2 gap-4 py-3">
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900 text-left">
              <span className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400">
                Estimated CEFR Level
              </span>
              <p className="text-3xl font-black text-brand-700 dark:text-brand-300 mt-1">
                {result.estimatedLevel}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-left">
              <span className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">
                Vocabulary Size
              </span>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300 mt-1">
                ~{result.estimatedVocabSize} <span className="text-sm font-semibold">từ</span>
              </p>
            </div>
          </div>

          {/* Strong / Weak Breakdown */}
          <div className="text-left space-y-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
              <strong>Vùng thế mạnh:</strong> {result.strongAreas?.join(', ') || 'Nắm vững từ vựng cơ bản'}
            </div>
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300">
              <strong>Vùng cần cải thiện:</strong> {result.weakAreas?.join(', ') || 'Collocations & Phrasal Verbs'}
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
              <strong>Khuyến nghị lộ trình:</strong> Học {result.recommendedDailyGoal} từ/ngày. Lộ trình học thông minh đã được tích hợp vào Dashboard của bạn.
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-lg shadow-brand-500/20 transition flex items-center justify-center gap-2"
          >
            <span>Vào Dashboard Học Tập Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-brand-600" />
          <span>Placement Test: Câu {currentIndex + 1} / {questions.length}</span>
        </div>
        <span>{progress}%</span>
      </div>

      <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900">
            {currentQ.category} • CEFR {currentQ.cefrLevel}
          </span>
          <h3 className="text-xl font-bold mt-3 leading-snug">{currentQ.question}</h3>
        </div>

        <div className="space-y-3">
          {currentQ.options.map((opt: string, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(opt)}
              className={`w-full p-4 rounded-2xl border text-left font-semibold text-sm transition flex items-center justify-between ${selectedOption === opt
                  ? 'border-brand-600 bg-brand-50/20 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <span>{opt}</span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === opt
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-700'
                  }`}
              >
                {selectedOption === opt && <CheckCircle className="w-3.5 h-3.5" />}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedOption || submitting}
          className="w-full py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          {submitting ? (
            <span>Đang tính toán kết quả CEFR...</span>
          ) : (
            <>
              <span>{currentIndex + 1 === questions.length ? 'Hoàn thành bài kiểm tra' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
