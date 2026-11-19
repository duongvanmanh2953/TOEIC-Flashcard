import React from 'react';
import { ArenaIconTrophy, ArenaIconCheck } from './ArenaIcons';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  iconName?: string;
  xpReward: number;
  unlockedAt?: string | null;
  isUnlocked: boolean;
}

export interface AchievementCardProps {
  achievement: AchievementItem;
  className?: string;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({ achievement, className = '' }) => {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#12182B] border ${
        achievement.isUnlocked
          ? 'border-[#F6C453]/40 bg-[#F6C453]/5 shadow-[0_0_15px_rgba(246,196,83,0.15)]'
          : 'border-[#232D4E] opacity-60'
      } flex items-center justify-between gap-3 select-none transition-all ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            achievement.isUnlocked ? 'bg-[#F6C453] text-slate-950' : 'bg-[#19213A] text-slate-500'
          }`}
        >
          {achievement.isUnlocked ? (
            <ArenaIconCheck className="w-5 h-5 font-black" />
          ) : (
            <ArenaIconTrophy className="w-5 h-5" />
          )}
        </div>

        <div className="min-w-0">
          <h4
            className={`text-xs sm:text-sm font-bold truncate ${
              achievement.isUnlocked ? 'text-[#F6C453]' : 'text-slate-300'
            }`}
          >
            {achievement.title}
          </h4>
          <p className="text-[11px] text-slate-400 line-clamp-1">{achievement.description}</p>
        </div>
      </div>

      <span className="text-xs font-mono font-black text-indigo-300 shrink-0">
        +{achievement.xpReward} XP
      </span>
    </div>
  );
};
