import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none transform-gpu translate-z-0"
      style={{ contain: 'strict' }}
      aria-hidden="true"
    >
      {/* 1. Base Atmospheric Luminous Gradient Canvas (GPU optimized, zero blur penalty) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-indigo-50/20 to-slate-100/70 dark:from-[#060913]/95 dark:via-[#080d1e]/90 dark:to-[#04060c]/98" />

      {/* 2. Top-Left Luminous Indigo / Violet Pool */}
      <div className="absolute -top-24 -left-20 w-[420px] sm:w-[560px] h-[420px] sm:h-[560px] rounded-full bg-gradient-to-br from-indigo-500/25 via-violet-600/18 to-transparent blur-3xl dark:from-indigo-500/25 dark:via-purple-600/20 dark:to-transparent transform-gpu" />

      {/* 4. Top-Right Radiant Azure / Cyan Spot */}
      <div className="absolute -top-16 -right-16 w-[380px] sm:w-[520px] h-[380px] sm:h-[520px] rounded-full bg-gradient-to-bl from-sky-400/25 via-cyan-400/18 to-transparent blur-3xl dark:from-sky-500/22 dark:via-cyan-500/16 dark:to-transparent transform-gpu" />

      {/* 5. Center Floating Rose / Fuchsia Spot (Desktop/Tablet only for max mobile framerate) */}
      <div className="hidden md:block absolute top-1/3 -right-20 w-[440px] h-[440px] rounded-full bg-gradient-to-tl from-rose-400/20 via-fuchsia-500/12 to-transparent blur-3xl dark:from-rose-500/18 dark:via-fuchsia-600/14 dark:to-transparent transform-gpu" />

      {/* 6. Center-Left Electric Blue Depth Pool (Desktop/Tablet only) */}
      <div className="hidden md:block absolute top-1/2 -left-20 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-500/20 via-indigo-400/14 to-transparent blur-3xl dark:from-blue-600/20 dark:via-indigo-500/14 dark:to-transparent transform-gpu" />

      {/* 7. Bottom-Left Fresh Emerald / Teal Radiant Pool */}
      <div className="absolute -bottom-20 -left-20 w-[400px] sm:w-[520px] h-[400px] sm:h-[520px] rounded-full bg-gradient-to-tr from-teal-400/20 via-emerald-400/14 to-transparent blur-3xl dark:from-teal-500/22 dark:via-emerald-500/16 dark:to-transparent transform-gpu" />

      {/* 8. Bottom-Right Warm Amber / Gold Pool (Desktop/Tablet only) */}
      <div className="hidden sm:block absolute -bottom-20 -right-20 w-[420px] h-[420px] rounded-full bg-gradient-to-tl from-amber-400/20 via-orange-400/12 to-transparent blur-3xl dark:from-amber-500/18 dark:via-orange-500/14 dark:to-transparent transform-gpu" />
    </div>
  );
};
