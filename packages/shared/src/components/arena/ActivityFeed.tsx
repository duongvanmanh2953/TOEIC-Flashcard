import React from 'react';
import { ARENA_THEME } from '../../arena/arenaTheme';
import {
  ArenaIconFlame,
  ArenaIconCrown,
  ArenaIconSparkles,
  ArenaIconCheck,
  ArenaIconUsers,
} from './ArenaIcons';

export type ActivityEventType =
  | 'PLAYER_JOINED'
  | 'CORRECT_ANSWER'
  | 'WRONG_ANSWER'
  | 'NEW_STREAK'
  | 'RANK_UP'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'NEW_LEADER';

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  playerName: string;
  avatar?: string | null;
  detail?: string;
  timestamp: number;
}

export interface ActivityFeedProps {
  events: ActivityEvent[];
  maxVisible?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  events,
  maxVisible = 6,
  className = '',
}) => {
  const visibleEvents = events.slice(0, maxVisible);

  const getEventBadge = (type: ActivityEventType) => {
    switch (type) {
      case 'NEW_LEADER':
        return {
          icon: <ArenaIconCrown className="w-3.5 h-3.5 text-[#F6C453]" />,
          textClass: 'text-[#F6C453] font-black',
          bgClass: 'bg-[#F6C453]/15 border-[#F6C453]/30',
        };
      case 'NEW_STREAK':
        return {
          icon: <ArenaIconFlame className="w-3.5 h-3.5 text-orange-400" />,
          textClass: 'text-orange-300 font-bold',
          bgClass: 'bg-orange-500/15 border-orange-500/30',
        };
      case 'ACHIEVEMENT_UNLOCKED':
        return {
          icon: <ArenaIconSparkles className="w-3.5 h-3.5 text-purple-400" />,
          textClass: 'text-purple-300 font-bold',
          bgClass: 'bg-purple-500/15 border-purple-500/30',
        };
      case 'CORRECT_ANSWER':
        return {
          icon: <ArenaIconCheck className="w-3.5 h-3.5 text-[#25C98A]" />,
          textClass: 'text-[#25C98A] font-semibold',
          bgClass: 'bg-[#25C98A]/10 border-[#25C98A]/20',
        };
      case 'PLAYER_JOINED':
      default:
        return {
          icon: <ArenaIconUsers className="w-3.5 h-3.5 text-indigo-400" />,
          textClass: 'text-slate-300',
          bgClass: 'bg-[#19213A] border-[#232D4E]',
        };
    }
  };

  return (
    <div
      className={`w-full rounded-2xl bg-[#12182B] border border-[#232D4E] p-3 space-y-2 select-none ${className}`}
    >
      <div className="flex items-center justify-between border-b border-[#232D4E] pb-1.5 px-1">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
          HOẠT ĐỘNG TRẬN ĐẤU
        </span>
        <span className="w-2 h-2 rounded-full bg-[#25C98A] animate-ping" />
      </div>

      <div className="space-y-1.5 overflow-hidden">
        {visibleEvents.length === 0 ? (
          <div className="py-4 text-center text-[11px] text-slate-500 italic">
            Chưa có hoạt động mới
          </div>
        ) : (
          visibleEvents.map((evt) => {
            const badge = getEventBadge(evt.type);
            return (
              <div
                key={evt.id}
                className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all animate-fade-in ${badge.bgClass}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {badge.icon}
                  <span className="font-bold text-white truncate max-w-[110px] sm:max-w-[140px]">
                    {evt.playerName}
                  </span>
                  <span className={`text-[11px] truncate ${badge.textClass}`}>
                    {evt.detail || 'đã ghi điểm'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
