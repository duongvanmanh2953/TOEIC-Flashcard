import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#050713]">
      {/* 1. Base Subtle Modern Grid Pattern Overlay for Depth */}
      <div
        className="absolute inset-0 opacity-40 dark:opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
          backgroundSize: '36px 36px'
        }}
      />

      {/* 2. Top-Center Ambient Soft Uplight for Brightness & Clean Contrast */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full bg-gradient-to-b from-rose-500/25 via-pink-600/15 to-transparent blur-[130px] pointer-events-none" />

      {/* 3. Top-Left Luminous Indigo / Violet Spreading Pool (Đốm loang tím sâu & sáng) */}
      <div className="absolute -top-32 -left-28 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-indigo-500/30 via-violet-600/20 to-transparent blur-[140px] pointer-events-none animate-pulse duration-10000" />

      {/* 4. Top-Right Radiant Azure / Cyan Spot (Đốm loang lam ngọc tươi) */}
      <div className="absolute -top-20 -right-20 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-sky-400/30 via-cyan-400/20 to-transparent blur-[130px] pointer-events-none" />

      {/* 5. Center Floating Lavender / Fuchsia Nebula Spot */}
      <div className="absolute top-[38%] -right-28 w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-purple-500/25 via-fuchsia-500/18 to-transparent blur-[140px] pointer-events-none" />

      {/* 6. Center-Left Electric Blue Depth Pool */}
      <div className="absolute top-[55%] -left-28 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-400/25 via-teal-400/18 to-transparent blur-[130px] pointer-events-none" />

      {/* 7. Bottom-Left Fresh Blue Pool */}
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-500/30 via-indigo-500/20 to-transparent blur-[135px] pointer-events-none" />

      {/* 8. Bottom-Right Warm Amber / Orange Gold Pool */}
      <div className="absolute -bottom-24 -right-24 w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-yellow-400/25 via-orange-400/18 to-transparent blur-[130px] pointer-events-none" />
    </div>
  );
};
