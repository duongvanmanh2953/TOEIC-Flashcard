import React, { useState } from 'react';
import { Flame, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Award, Sparkles, CheckCircle2 } from 'lucide-react';

interface StreakCalendarCardProps {
  currentStreak: number;
  longestStreak: number;
  lastStudyDate?: string | Date;
  className?: string;
}

export const StreakCalendarCard: React.FC<StreakCalendarCardProps> = ({
  currentStreak = 0,
  longestStreak = 0,
  lastStudyDate,
  className = '',
}) => {
  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Calendar calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDay = today.getDate();

  const activeDaysSet = new Set<number>();
  if (currentStreak > 0 && isCurrentMonth) {
    for (let i = 0; i < currentStreak; i++) {
      const d = todayDay - i;
      if (d > 0) activeDaysSet.add(d);
    }
  }

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const weekDayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  const days = [];
  for (let i = 0; i < startOffset; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const completedInMonthCount = activeDaysSet.size;
  const monthConsistencyPct = Math.round((completedInMonthCount / Math.max(1, todayDay)) * 100);

  return (
    <div className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 shadow-sm p-4 sm:p-5 relative overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Flame className="w-4 h-4 fill-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Lịch Chuỗi Học Tập</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/30">
                {currentStreak} ngày
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {monthNames[month]}, {year}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            aria-label="Tháng trước"
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Tháng sau"
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
        {weekDayHeaders.map((wd, idx) => (
          <div
            key={idx}
            className={`text-[10px] font-black uppercase py-1 ${idx >= 5 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {days.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-8 w-full" />;
          }

          const isToday = isCurrentMonth && day === todayDay;
          const isActive = activeDaysSet.has(day);
          const isFuture = isCurrentMonth && day > todayDay;

          return (
            <div
              key={`day-${day}`}
              className={`h-8 w-full rounded-xl flex flex-col items-center justify-center relative text-xs font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-xs shadow-amber-500/30 ring-1 ring-amber-400/50 scale-[1.03]'
                  : isToday
                  ? 'border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 font-extrabold'
                  : isFuture
                  ? 'text-slate-300 dark:text-slate-700'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{day}</span>
              {isActive && (
                <Flame className="w-2.5 h-2.5 fill-white text-white absolute -top-0.5 -right-0.5 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Streak Highlights Footer */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
          <Award className="w-3.5 h-3.5 text-indigo-500" />
          <span>Kỷ lục cao nhất:</span>
          <strong className="text-slate-900 dark:text-white font-extrabold">{longestStreak} ngày</strong>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
          <Sparkles className="w-3 h-3 fill-amber-500" />
          <span>{completedInMonthCount} ngày hoạt động ({monthConsistencyPct}%)</span>
        </div>
      </div>
    </div>
  );
};
