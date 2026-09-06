import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      {/* 1. Base Atmospheric Luminous Gradient Canvas (Trong hơn, sáng hơn, mờ hơn) */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/70 via-indigo-50/20 to-slate-100/60 dark:from-[#060913]/90 dark:via-[#080d1e]/85 dark:to-[#04060c]/95 backdrop-blur-[2px]"></div>

      {/* 2. Top-Center Ambient Soft Uplight for Brightness & Clean Contrast */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full bg-gradient-to-b from-white/95 via-indigo-100/40 to-transparent dark:from-indigo-500/20 dark:via-purple-600/12 dark:to-transparent blur-[110px]"></div>

      {/* 3. Top-Left Luminous Indigo / Violet Spreading Pool (Đốm loang tím sâu & sáng) */}
      <div className="absolute -top-32 -left-28 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-indigo-500/35 via-violet-600/25 to-transparent blur-[120px] dark:from-indigo-500/35 dark:via-purple-600/28 dark:to-transparent animate-pulse duration-10000"></div>

      {/* 4. Top-Right Radiant Azure / Cyan Spot (Đốm loang lam ngọc tươi) */}
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-sky-400/35 via-cyan-400/25 to-transparent blur-[120px] dark:from-sky-500/30 dark:via-cyan-500/22 dark:to-transparent"></div>

      {/* 5. Center Floating Rose / Fuchsia Nebula Spot (Đốm loang hồng tím tạo chiều sâu) */}
      <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-rose-400/25 via-fuchsia-500/18 to-transparent blur-[125px] dark:from-rose-500/25 dark:via-fuchsia-600/20 dark:to-transparent"></div>

      {/* 6. Center-Left Electric Blue Depth Pool (Đốm xanh sapphire giữa trang) */}
      <div className="absolute top-1/2 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-blue-500/25 via-indigo-400/18 to-transparent blur-[120px] dark:from-blue-600/25 dark:via-indigo-500/18 dark:to-transparent"></div>

      {/* 7. Bottom-Left Fresh Emerald / Teal Radiant Pool (Đốm loang ngọc bích tươi sáng) */}
      <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-teal-400/28 via-emerald-400/20 to-transparent blur-[125px] dark:from-teal-500/30 dark:via-emerald-500/22 dark:to-transparent animate-pulse duration-8000 delay-1000"></div>

      {/* 8. Bottom-Right Warm Amber / Gold Pool (Đốm loang hổ phách ấm áp) */}
      <div className="absolute -bottom-24 -right-24 w-[560px] h-[560px] rounded-full bg-gradient-to-tl from-amber-400/28 via-orange-400/18 to-transparent blur-[120px] dark:from-amber-500/25 dark:via-orange-500/18 dark:to-transparent"></div>
    </div>
  );
};
