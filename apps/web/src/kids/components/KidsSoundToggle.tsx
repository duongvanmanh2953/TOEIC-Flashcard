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
      label: 'Bật tất cả âm thanh',
      style: 'bg-emerald-100 text-emerald-950 border-emerald-300 hover:bg-emerald-200',
      iconColor: 'text-emerald-700',
    },
    voice_only: {
      icon: Mic,
      label: 'Chỉ phát giọng đọc',
      style: 'bg-amber-100 text-amber-950 border-amber-300 hover:bg-amber-200',
      iconColor: 'text-amber-700',
    },
    muted: {
      icon: VolumeX,
      label: 'Đã tắt âm thanh',
      style: 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200',
      iconColor: 'text-slate-500',
    },
  }[soundMode];

  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={handleCycle}
      title={`Âm thanh: ${config.label} (Chạm để chuyển: Bật tất cả → Chỉ giọng đọc → Tắt âm)`}
      className={`h-[33.6px] w-[33.6px] min-w-[33.6px] rounded-2xl border-2 flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-xs select-none shrink-0 ${config.style} ${className}`}
      aria-label={`Chế độ âm thanh: ${config.label}`}
    >
      <Icon className={`w-4 h-4 ${config.iconColor}`} />
    </button>
  );
};
