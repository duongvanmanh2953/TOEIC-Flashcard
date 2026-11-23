import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Compass, CheckCircle, ArrowRight, Award, AlertCircle } from 'lucide-react';
import { playCorrectSound } from '@vocabflow/shared';
import { useLearning } from '../contexts/LearningContext';
import { CountryFlag } from '../components/language/CountryFlag';

export const PlacementTestPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeLanguage } = useLearning();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const langId = activeLanguage?.id || 'en';
    api.get(`/placement-test/questions?languageId=${langId}`).then((res: any) => {
      const qList = Array.isArray(res) ? res : res?.data || [];
      setQuestions(qList);
      setCurrentIndex(0);
      setAnswers([]);
      setSelectedOption('');
      setResult(null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [activeLanguage?.id]);

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
        const res: any = await api.post('/placement-test/submit', {
          answers: newAnswers,
          languageId: activeLanguage?.id || 'en',
        });
        if (res?.success) {
          setResult(res.data);
          playCorrectSound();
        } else if (res?.estimatedLevel) {
          setResult(res);
          playCorrectSound();
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
            <div className="card-brand-effect p-4 rounded-2xl bg-brand-500/[0.06] dark:bg-brand-500/[0.12] backdrop-blur-xl border border-brand-400/40 text-left">
              <span className="text-xs font-black uppercase text-brand-600 dark:text-brand-400">
                Estimated CEFR Level
              </span>
              <p className="text-3xl font-black text-brand-700 dark:text-brand-300 mt-1">
                {result.estimatedLevel}
              </p>
            </div>
            <div className="card-brand-effect p-4 rounded-2xl bg-cyan-500/[0.06] dark:bg-cyan-500/[0.12] backdrop-blur-xl border border-cyan-400/40 text-left">
              <span className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400">
                Vocabulary Size
              </span>
              <p className="text-3xl font-black text-cyan-700 dark:text-cyan-300 mt-1">
                ~{result.estimatedVocabSize} <span className="text-sm font-semibold">từ</span>
              </p>
            </div>
          </div>

          {/* Strong / Weak Breakdown */}
          <div className="text-left space-y-3 pt-2 text-xs">
            <div className="p-3.5 rounded-xl bg-emerald-500/[0.08] dark:bg-emerald-500/[0.12] border border-emerald-400/30 text-emerald-800 dark:text-emerald-300 backdrop-blur-md">
              <strong>Vùng thế mạnh:</strong> {result.strongAreas?.join(', ') || 'Nắm vững từ vựng cơ bản'}
            </div>
            <div className="p-3.5 rounded-xl bg-amber-500/[0.08] dark:bg-amber-500/[0.12] border border-amber-400/30 text-amber-800 dark:text-amber-300 backdrop-blur-md">
              <strong>Vùng cần cải thiện:</strong> {result.weakAreas?.join(', ') || 'Collocations & Phrasal Verbs'}
            </div>
          </div>

          {/* Goal & Daily Time Selection before Launching Journey */}
          <div className="text-left space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                1. Chọn mục tiêu học tập chính của bạn
              </label>
              <select
                id="learningGoalSelect"
                defaultValue="COMMUNICATION"
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                <option value="COMMUNICATION">Giao tiếp đời sống thực tế & Phản xạ tự nhiên</option>
                <option value="CAREER">Tiếng Anh công sở, đàm phán & Thăng tiến sự nghiệp</option>
                <option value="EXAM">Luyện thi chứng chỉ quốc tế (TOEIC / IELTS / HSK / JLPT)</option>
                <option value="TRAVEL">Du lịch & Giao lưu văn hóa toàn cầu</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1.5">
                2. Ngân sách học tập mỗi ngày
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[15, 20, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      (window as any)._selectedDailyMins = mins;
                      document.querySelectorAll('.daily-btn').forEach((b) => b.classList.remove('bg-[#2041F6]', 'text-white'));
                      const btn = document.getElementById(`daily-btn-${mins}`);
                      if (btn) btn.classList.add('bg-[#2041F6]', 'text-white');
                    }}
                    id={`daily-btn-${mins}`}
                    className={`daily-btn p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black transition ${
                      mins === 20 ? 'bg-[#2041F6] text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              const selectEl = document.getElementById('learningGoalSelect') as HTMLSelectElement;
              const goal = selectEl?.value || 'COMMUNICATION';
              const dailyMins = (window as any)._selectedDailyMins || 20;

              try {
                await api.post('/learning-journey/profile', {
                  languageId: activeLanguage?.id || 'en',
                  targetLevel: result.estimatedLevel === 'C1' ? 'C2' : result.estimatedLevel === 'B2' ? 'C1' : 'B1',
                  learningGoal: goal,
                  dailyStudyMinutes: dailyMins,
                  strengths: result.strongAreas,
                  weaknesses: result.weakAreas,
                });
              } catch (err) {
                console.error(err);
              }
              navigate('/journey');
            }}
            className="w-full py-4 rounded-2xl bg-[#2041F6] hover:bg-[#1a35cc] text-white font-black text-sm shadow-xl shadow-[#2041F6]/30 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Tạo & Khám Phá Lộ Trình (My Learning Journey)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;

  return (
    <div className="max-w-xl mx-auto py-8 px-4 animate-fade-in">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
            <CountryFlag languageId={activeLanguage?.id || 'en'} size="xs" />
            <span>Bài Thi: {activeLanguage?.name || 'Tiếng Anh'}</span>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500">
          Câu {currentIndex + 1} / {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden">
        <div
          className="h-full bg-brand-500 transition-all duration-300 rounded-full"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.05] dark:bg-slate-900/[0.3] backdrop-blur-2xl border border-slate-200/50 dark:border-slate-800 shadow-xl space-y-6">
        <div>
          <span className="inline-block overflow-hidden text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-md card-brand-effect bg-brand-500/[0.08] dark:bg-brand-500/[0.14] text-brand-600 dark:text-brand-300 border border-brand-400/35">
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
                  ? 'border-2 border-brand-500 bg-gradient-to-r from-brand-500/15 via-indigo-500/10 to-transparent dark:from-brand-500/25 dark:via-indigo-950/40 dark:to-transparent text-brand-700 dark:text-brand-200 shadow-md shadow-brand-500/10 ring-2 ring-brand-400/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
            >
              <span>{opt}</span>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedOption === opt
                    ? 'border-brand-600 bg-brand-600 text-white shadow-xs'
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
          className="btn-glass-primary w-full !py-3.5 !rounded-2xl disabled:opacity-40 text-white font-extrabold text-sm shadow-xl shadow-brand-500/20 transition flex items-center justify-center gap-2"
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
