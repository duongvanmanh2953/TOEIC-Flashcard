import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic } from 'lucide-react';
import { soundManager, KidsSoundMode } from '../services/sound/KidsSoundManager';

interface KidsSoundToggleProps {
  className?: string;
  variant?: 'pill' | 'compact' | 'floating';
}

export const KidsSoundToggle: React.FC<KidsSoundToggleProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const [soundMode, setSoundMode] = useState<KidsSoundMode>(() => soundManager.getSoundMode());

  useEffect(() => {
    const unsubscribe = soundManager.subscribe((mode) => {
      setSoundMode(mode);
    });
    return unsubscribe;
  }, []);

  const handleCycle = () => {
    soundManager.cycleSoundMode();
  };

  const config = {
    all: {
      icon: Volume2,
      label: 'Bật âm thanh',
      badge: 'BẬT',
      style: 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200',
      iconColor: 'text-emerald-700',
    },
    voice_only: {
      icon: Mic,
      label: 'Chỉ giọng đọc',
      badge: 'CHỈ ĐỌC',
      style: 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200',
      iconColor: 'text-amber-700',
    },
    muted: {
      icon: VolumeX,
      label: 'Tắt âm thanh',
      badge: 'TẮT',
      style: 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200',
      iconColor: 'text-slate-500',
    },
  }[soundMode];

  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleCycle}
        title={`Âm thanh: ${config.label} (Chạm để đổi)`}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs ${config.style} ${className}`}
        aria-label={`Chế độ âm thanh: ${config.label}`}
      >
        <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.iconColor}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCycle}
      title="Chạm để chuyển: Bật tất cả → Chỉ giọng đọc → Tắt âm"
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer shadow-xs select-none ${config.style} ${className}`}
      aria-label={`Chế độ âm thanh: ${config.label}`}
    >
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
      <span className="text-xs font-black hidden sm:inline">{config.label}</span>
      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-lg bg-white/70 border border-black/10">
        {config.badge}
      </span>
    </button>
  );
};
