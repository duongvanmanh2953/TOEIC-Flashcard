import React from 'react';
import { useFocus } from '../../contexts/FocusContext';
import { Play, Pause, Maximize2, Coffee } from 'lucide-react';

interface MiniFocusWidgetProps {
  isMobile?: boolean;
}

export const MiniFocusWidget: React.FC<MiniFocusWidgetProps> = ({ isMobile = false }) => {
  const {
    isRunning,
    isPaused,
    secondsRemaining,
    mode,
    resumeSession,
    pauseSession,
    openFullscreen,
  } = useFocus();

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  if (!isRunning) {
    if (isMobile) {
      return (
        <button
          onClick={openFullscreen}
          title="Chế độ tập trung (Focus Mode)"
          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <Coffee className="w-4 h-4" />
        </button>
      );
    }

    return (
      <button
        onClick={openFullscreen}
        title="Bật Chế độ tập trung (Pomodoro Deep Focus)"
        className="h-8 px-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/60 dark:border-indigo-800/40 flex items-center gap-1.5 transition shadow-2xs group"
      >
        <Coffee className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
        <span className="hidden xl:inline">Tập trung</span>
      </button>
    );
  }

  const isBreak = mode !== 'FOCUS';

  if (isMobile) {
    return (
      <div
        onClick={openFullscreen}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-xl cursor-pointer select-none transition border shadow-xs ${
          isBreak
            ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
            : isPaused
            ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
            : 'bg-indigo-50 dark:bg-indigo-950/70 border-indigo-400/80 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 animate-pulse'
        }`}
        title="Đồng hồ tập trung đang đếm giây — Chạm để mở toàn màn hình"
      >
        <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-ping" />
        <span className="text-xs font-black tracking-tight font-mono">{timeFormatted}</span>
      </div>
    );
  }

  return (
    <div
      className={`h-8 px-2.5 rounded-xl border flex items-center gap-2 transition-all shadow-xs select-none ${
        isBreak
          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
          : isPaused
          ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300/80 dark:border-amber-800 text-amber-800 dark:text-amber-300'
          : 'bg-indigo-50/90 dark:bg-indigo-950/60 border-indigo-300/80 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200'
      }`}
      title={isPaused ? 'Phiên tập trung đang tạm dừng' : 'Đồng hồ tập trung đang đếm ngược'}
    >
      <div className="relative flex items-center justify-center">
        <span
          className={`w-2 h-2 rounded-full ${
            isBreak ? 'bg-emerald-500' : isPaused ? 'bg-amber-500' : 'bg-indigo-600 dark:bg-indigo-400'
          }`}
        />
        {!isPaused && (
          <span
            className={`absolute w-2 h-2 rounded-full animate-ping opacity-75 ${
              isBreak ? 'bg-emerald-400' : 'bg-indigo-400'
            }`}
          />
        )}
      </div>

      <button
        onClick={openFullscreen}
        className="font-mono font-black text-xs tracking-tight hover:underline flex items-center gap-1 cursor-pointer"
        title="Bấm để mở chế độ tập trung toàn màn hình"
      >
        <span>{timeFormatted}</span>
        {isBreak && <span className="text-[10px] uppercase font-bold opacity-75">(Nghỉ)</span>}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (isPaused) {
            resumeSession();
          } else {
            pauseSession();
          }
        }}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
        title={isPaused ? 'Tiếp tục đếm' : 'Tạm dừng đếm'}
      >
        {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          openFullscreen();
        }}
        className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-300"
        title="Mở toàn màn hình (Fullscreen Focus)"
      >
        <Maximize2 className="w-3 h-3" />
      </button>
    </div>
  );
};
