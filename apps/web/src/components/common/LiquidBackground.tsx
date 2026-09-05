import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Base Atmospheric Luminous Gradient Canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/90 via-indigo-50/30 to-slate-100/80 dark:from-[#080d1a] dark:via-[#0a0f22] dark:to-[#05070e]"></div>

      {/* 2. Top-Center Ambient Soft Uplight for Brightness & Clean Contrast */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[450px] rounded-full bg-gradient-to-b from-white/80 via-indigo-100/30 to-transparent dark:from-indigo-500/15 dark:via-purple-600/10 dark:to-transparent blur-[120px]"></div>

      {/* 3. Top-Left Luminous Indigo / Violet Spreading Pool (Đốm loang tím) */}
      <div className="absolute -top-28 -left-28 w-[580px] h-[580px] rounded-full bg-gradient-to-br from-indigo-500/28 via-violet-600/20 to-transparent blur-[130px] dark:from-indigo-500/30 dark:via-purple-600/22 dark:to-transparent animate-pulse duration-10000"></div>

      {/* 4. Top-Right Radiant Azure / Cyan Spot (Đốm loang lam ngọc) */}
      <div className="absolute -top-20 -right-20 w-[540px] h-[540px] rounded-full bg-gradient-to-bl from-sky-400/28 via-cyan-500/18 to-transparent blur-[125px] dark:from-sky-500/25 dark:via-cyan-600/18 dark:to-transparent"></div>

      {/* 5. Center-Right Floating Rose / Pink Nebula Spot (Đốm loang hồng phấn) */}
      <div className="absolute top-1/3 -right-24 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-rose-400/20 via-fuchsia-500/14 to-transparent blur-[130px] dark:from-rose-500/20 dark:via-fuchsia-600/15 dark:to-transparent"></div>

      {/* 6. Bottom-Left Fresh Emerald / Teal Radiant Pool (Đốm loang ngọc bích) */}
      <div className="absolute -bottom-28 -left-24 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-teal-400/22 via-emerald-500/15 to-transparent blur-[130px] dark:from-teal-600/25 dark:via-emerald-600/18 dark:to-transparent animate-pulse duration-8000 delay-1000"></div>

      {/* 7. Bottom-Right Warm Amber / Gold Pool (Đốm loang hổ phách ấm) */}
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-amber-400/20 via-orange-400/12 to-transparent blur-[125px] dark:from-amber-500/20 dark:via-orange-600/14 dark:to-transparent"></div>
    </div>
  );
};
