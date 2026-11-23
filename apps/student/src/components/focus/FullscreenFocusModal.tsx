import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFocus, AmbientSoundType } from '../../contexts/FocusContext';
import { playCorrectSound } from '@vocabflow/shared';
import {
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Coffee,
  CloudRain,
  Waves,
  Library,
  Sparkles,
  CheckCircle2,
  Plus,
  Trash2,
  Check,
  Flame,
} from 'lucide-react';

interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export const FullscreenFocusModal: React.FC = () => {
  const {
    isRunning,
    isPaused,
    secondsRemaining,
    targetMinutes,
    mode,
    activeTask,
    todayFocusMinutes,
    todayCompletedSessions,
    ambientSound,
    ambientVolume,
    isFullscreenOpen,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    setAmbientSound,
    setAmbientVolume,
    closeFullscreen,
  } = useFocus();

  const [themeMode, setThemeMode] = useState<'VOID' | 'AMBER' | 'FOREST'>('VOID');
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: '1', text: 'Ôn 20 từ vựng TOEIC cần kích hoạt lại (SRS)', completed: false },
    { id: '2', text: 'Hoàn thành 1 bài luyện nghe Active Listening', completed: false },
  ]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsBrowserFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalDuration = Math.max(1, targetMinutes * 60);
  const progressPercent = Math.max(0, Math.min(100, ((totalDuration - secondsRemaining) / totalDuration) * 100));

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks([...tasks, { id: Date.now().toString(), text: newTaskInput.trim(), completed: false }]);
    setNewTaskInput('');
  };

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === id) {
          if (!t.completed) playCorrectSound();
          return { ...t, completed: !t.completed };
        }
        return t;
      })
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  // Lock body scroll and prevent pull-to-refresh while fullscreen immersion is active
  useEffect(() => {
    if (!isFullscreenOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscroll;
    };
  }, [isFullscreenOpen]);

  if (!isFullscreenOpen || typeof document === 'undefined' || !document.body) return null;

  const getThemeBackground = () => {
    if (themeMode === 'AMBER') {
      return 'bg-gradient-to-br from-amber-950 via-stone-900 to-black text-amber-50';
    }
    if (themeMode === 'FOREST') {
      return 'bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 text-teal-50';
    }
    return 'bg-gradient-to-br from-slate-950 via-indigo-950 to-black text-white';
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[200] w-screen h-screen min-h-[100dvh] flex flex-col justify-between overflow-y-auto overscroll-none select-none p-4 sm:p-8 animate-fade-in ${getThemeBackground()}`}
    >
        <div className="flex items-center justify-between gap-4 w-full max-w-5xl mx-auto shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black tracking-wider uppercase">
                {mode === 'FOCUS' ? 'Deep Focus Immersion' : 'Giải Lao (Short Break)'}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl bg-white/10 border border-white/10 text-xs">
              <button
                onClick={() => setThemeMode('VOID')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  themeMode === 'VOID' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tối Giản
              </button>
              <button
                onClick={() => setThemeMode('AMBER')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  themeMode === 'AMBER' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Ấm Cúng
              </button>
              <button
                onClick={() => setThemeMode('FOREST')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  themeMode === 'FOREST' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rừng Mưa
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBrowserFullscreen}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-300 hover:text-white"
              title={isBrowserFullscreen ? 'Thoát toàn màn hình trình duyệt' : 'Toàn màn hình trình duyệt'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            <button
              onClick={closeFullscreen}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-bold transition flex items-center gap-1.5 shadow-sm text-white"
              title="Thu nhỏ về đồng hồ layout trên thanh điều hướng"
            >
              <Minimize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Thu nhỏ về thanh Layout</span>
            </button>
          </div>
        </div>

        <div className="my-auto py-6 flex flex-col items-center justify-center text-center space-y-8 w-full max-w-xl mx-auto">
          {(!isRunning || isPaused) && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { mins: 15, label: '15m Ôn Nhanh' },
                { mins: 25, label: '25m Pomodoro' },
                { mins: 50, label: '50m Tập Trung Sâu' },
                { mins: 5, label: '5m Nghỉ Ngắn' },
              ].map((p) => (
                <button
                  key={p.mins}
                  onClick={() => startSession(p.mins)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition border ${
                    targetMinutes === p.mins
                      ? 'bg-white text-slate-950 border-white shadow-lg shadow-white/10 scale-105'
                      : 'bg-white/10 hover:bg-white/20 border-white/10 text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="stroke-white/10"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="140"
                cy="140"
                r={radius}
                className={`transition-all duration-1000 ${
                  mode === 'SHORT_BREAK'
                    ? 'stroke-emerald-400'
                    : themeMode === 'AMBER'
                    ? 'stroke-amber-400'
                    : themeMode === 'FOREST'
                    ? 'stroke-teal-400'
                    : 'stroke-indigo-400'
                }`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2">
              <span className="font-mono text-6xl sm:text-7xl font-black tracking-tight text-white drop-shadow-md">
                {timeFormatted}
              </span>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isRunning && !isPaused ? 'bg-emerald-400 animate-ping' : 'bg-slate-400'}`} />
                <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300">
                  {isRunning ? (isPaused ? 'Đang tạm dừng' : 'Đang duy trì Flow State') : 'Sẵn sàng'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            {!isRunning ? (
              <button
                onClick={() => startSession(targetMinutes)}
                className="px-8 py-3.5 rounded-2xl bg-white text-slate-950 font-black text-sm shadow-xl hover:bg-slate-100 transition transform hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Bắt Đầu Tập Trung Ngay</span>
              </button>
            ) : isPaused ? (
              <>
                <button
                  onClick={resumeSession}
                  className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-xl transition transform hover:scale-105 flex items-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Tiếp tục đếm</span>
                </button>
                <button
                  onClick={() => stopSession(false)}
                  className="p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 font-bold transition"
                  title="Hủy phiên này"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={pauseSession}
                  className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm shadow-xl transition transform hover:scale-105 flex items-center gap-2"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Tạm Dừng</span>
                </button>
                <button
                  onClick={() => stopSession(true)}
                  className="px-4 py-3.5 rounded-2xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-black text-xs transition"
                  title="Hoàn thành sớm phiên học"
                >
                  Hoàn Thành
                </button>
              </>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-indigo-300" />
                <span>Âm thanh nền tăng tập trung (Binaural Ambience)</span>
              </span>
              <span className="text-[10px] uppercase font-mono">{ambientSound}</span>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {[
                { type: 'NONE', label: 'Tắt', icon: <VolumeX className="w-3.5 h-3.5" /> },
                { type: 'RAIN', label: 'Mưa', icon: <CloudRain className="w-3.5 h-3.5" /> },
                { type: 'CAFE', label: 'Cà Phê', icon: <Coffee className="w-3.5 h-3.5" /> },
                { type: 'WAVES', label: 'Sóng', icon: <Waves className="w-3.5 h-3.5" /> },
                { type: 'LIBRARY', label: 'Thư Viện', icon: <Library className="w-3.5 h-3.5" /> },
              ].map((s) => (
                <button
                  key={s.type}
                  onClick={() => setAmbientSound(s.type as AmbientSoundType)}
                  className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition ${
                    ambientSound === s.type
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white/5 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  {s.icon}
                  <span className="text-[10px]">{s.label}</span>
                </button>
              ))}
            </div>

            {ambientSound !== 'NONE' && (
              <div className="flex items-center gap-3 pt-1">
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-400 cursor-pointer h-1.5 bg-white/20 rounded-lg"
                />
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-4xl mx-auto pt-6 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6 items-start shrink-0">
          <div className="space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Mục Tiêu Phiên Học Này (Tasks)</span>
            </span>

            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="Thêm mục tiêu cần hoàn thành..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/50"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="space-y-1.5 max-h-32 overflow-y-auto overscroll-contain pr-1 custom-scrollbar">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold cursor-pointer transition ${
                    task.completed
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-200 line-through opacity-75'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30'
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3" />}
                    </div>
                    <span className="truncate">{task.text}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTask(task.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Tiến Trình Hôm Nay</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Thời gian tập trung</span>
                <p className="text-xl font-black text-amber-300 mt-0.5">
                  {todayFocusMinutes} <span className="text-xs font-normal">phút</span>
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Phiên hoàn thành</span>
                <p className="text-xl font-black text-indigo-300 mt-0.5">
                  {todayCompletedSessions} <span className="text-xs font-normal">phiên</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic text-center pt-1 font-medium">
              "Khả năng tập trung sâu là đòn bẩy lớn nhất giúp bạn ghi nhớ từ vựng vĩnh viễn."
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
};
