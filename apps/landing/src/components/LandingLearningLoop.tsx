import React from 'react';
import {
  Brain,
  BookOpen,
  Award,
  HelpCircle,
  MousePointerClick,
  FileText,
  TrendingUp,
  Check,
} from 'lucide-react';

interface LandingLearningLoopProps {
  activeLoopStep: number;
  onSelectStep: (step: number) => void;
}

const LOOP_STEPS = [
  { step: 1, title: 'Học', desc: 'Nắm từ vựng & cấu trúc ngữ pháp', icon: BookOpen, color: 'text-indigo-400', bg: 'bg-indigo-500/15' },
  { step: 2, title: 'Luyện', desc: 'Làm đề thi thử bấm giờ thực tế', icon: Award, color: 'text-sky-400', bg: 'bg-sky-500/15' },
  { step: 3, title: 'Phát hiện', desc: 'Nhận ra câu sai & cụm từ chưa hiểu', icon: HelpCircle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
  { step: 4, title: 'Bôi đen', desc: 'Chọn text ngay trên bài thi', icon: MousePointerClick, color: 'text-rose-400', bg: 'bg-rose-500/15' },
  { step: 5, title: 'Thêm note', desc: 'Lưu 1-click có gắn nguồn gốc đề', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/15' },
  { step: 6, title: 'Ôn lại', desc: 'SRS ngắt quãng khóa vào trí nhớ', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
];

export const LandingLearningLoop: React.FC<LandingLearningLoopProps> = React.memo(({
  activeLoopStep,
  onSelectStep,
}) => {
  return (
    <section id="learning-loop" className="py-14 px-4 sm:px-6 max-w-7xl mx-auto w-full border-t border-white/[0.06]">
      <div className="text-center max-w-2xl mx-auto space-y-3 mb-10" data-aos="fade-up">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/25 text-indigo-300 text-xs font-bold">
          <Brain className="w-3.5 h-3.5" />
          <span>Quy Trình Học Tập Khép Kín</span>
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Luồng Học Cốt Lõi Tại VocabFlow
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Không học vẹt rời rạc. Mỗi lỗ hổng kiến thức phát hiện khi làm bài đều được
          đưa ngay vào chu trình ghi nhớ dài hạn.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3" data-aos="fade-up">
        {LOOP_STEPS.map((item) => {
          const Icon = item.icon;
          const isActive = activeLoopStep === item.step;
          return (
            <div
              key={item.step}
              onClick={() => onSelectStep(item.step)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer card-hover-smooth flex flex-col justify-between ${
                isActive
                  ? 'bg-slate-800/90 border-indigo-400'
                  : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-500">
                    Bước {item.step}
                  </span>
                  <div className={`w-7 h-7 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>
              {isActive && (
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-1 text-[10px] font-bold text-indigo-300">
                  <Check className="w-3 h-3 text-indigo-400" />
                  <span>Đang xem</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
});

LandingLearningLoop.displayName = 'LandingLearningLoop';
