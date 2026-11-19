import React from 'react';
import { ArenaIconCheck, ArenaIconSparkles } from './ArenaIcons';

export interface DailyMissionItem {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  rewardXp: number;
  isCompleted: boolean;
}

export interface MissionCardProps {
  mission: DailyMissionItem;
  className?: string;
}

export const MissionCard: React.FC<MissionCardProps> = ({ mission, className = '' }) => {
  const percent = Math.min(100, Math.round((mission.current / mission.target) * 100));

  return (
    <div
      className={`p-4 rounded-2xl bg-[#12182B] border ${
        mission.isCompleted ? 'border-[#25C98A]/40 bg-[#25C98A]/5' : 'border-[#232D4E]'
      } space-y-2.5 select-none transition-all ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              mission.isCompleted ? 'bg-[#25C98A] text-slate-950' : 'bg-[#19213A] text-slate-400'
            }`}
          >
            {mission.isCompleted ? (
              <ArenaIconCheck className="w-4 h-4" />
            ) : (
              <ArenaIconSparkles className="w-3.5 h-3.5" />
            )}
          </div>
          <span className="text-xs font-bold text-white line-clamp-1">{mission.title}</span>
        </div>

        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#8B75FF]/20 text-[#8B75FF] font-mono">
          +{mission.rewardXp} XP
        </span>
      </div>

      <p className="text-[11px] text-slate-400 line-clamp-1">{mission.description}</p>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-400">
          <span>Tiến độ</span>
          <span>
            {mission.current} / {mission.target}
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#19213A] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              mission.isCompleted ? 'bg-[#25C98A]' : 'bg-[#2041F6]'
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
