import React from 'react';
import { Star } from 'lucide-react';

interface RewardCountProps {
  stars: number;
  xp?: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showStarLabel?: boolean;
}

/**
 * Reusable RewardCount Component
 * Clearly separates stars/points from title text to prevent cramping.
 * Child-friendly, high-contrast, tactile golden styling with SVG Star.
 */
export const RewardCount: React.FC<RewardCountProps> = ({
  stars,
  xp,
  className = '',
  size = 'md',
  showStarLabel = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2.5 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-3 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-4 py-1.5 gap-2',
  }[size];

  const starSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  return (
    <div className={`inline-flex items-center rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 font-black shadow-xs select-none ${sizeClasses} ${className}`}>
      <Star className={`${starSize} fill-amber-400 text-amber-500 shrink-0 filter drop-shadow-xs`} />
      <span className="tracking-tight">{stars}{showStarLabel ? ' Sao Vàng' : ''}</span>
      {typeof xp === 'number' && (
        <>
          <span className="text-amber-300 font-bold">•</span>
          <span className="text-amber-800 text-[11px] font-extrabold">+{xp} XP</span>
        </>
      )}
    </div>
  );
};

export default RewardCount;
