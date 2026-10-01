import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <>
      {/* 1. Ambient Dynamic Liquid Canvas Background (Exact tokens from original prod/v2) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#060913]">
        {/* Base Atmospheric Luminous Gradient Canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/90 via-[#080d1e]/85 to-[#04060c]/95 backdrop-blur-[2px]" />

        {/* Top-Center Ambient Soft Uplight for Brightness & Clean Contrast */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full bg-gradient-to-b from-indigo-500/20 via-purple-600/12 to-transparent blur-[110px]" />

        {/* Top-Left Luminous Indigo / Violet Spreading Pool */}
        <div className="absolute -top-32 -left-28 w-[640px] h-[640px] rounded-full bg-gradient-to-br from-indigo-500/35 via-purple-600/28 to-transparent blur-[120px] animate-pulse-slow" />

        {/* Top-Right Radiant Azure / Cyan Spot */}
        <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-sky-500/30 via-cyan-500/22 to-transparent blur-[120px]" />

        {/* Center Floating Rose / Fuchsia Nebula Spot */}
        <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] rounded-full bg-gradient-to-tl from-rose-500/25 via-fuchsia-600/20 to-transparent blur-[125px]" />

        {/* Center-Left Electric Blue Depth Pool */}
        <div className="absolute top-1/2 -left-24 w-[480px] h-[480px] rounded-full bg-gradient-to-tr from-blue-600/25 via-indigo-500/18 to-transparent blur-[120px]" />

        {/* Bottom-Left Fresh Emerald / Teal Radiant Pool */}
        <div className="absolute -bottom-24 -left-24 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-teal-500/30 via-emerald-500/22 to-transparent blur-[125px] animate-pulse-slow" />

        {/* Bottom-Right Warm Amber / Gold Pool */}
        <div className="absolute -bottom-24 -right-24 w-[560px] h-[560px] rounded-full bg-gradient-to-tl from-amber-500/25 via-orange-500/18 to-transparent blur-[120px]" />
      </div>

      {/* 2. Extra Atmospheric Glow Spotlights for Hero Depth */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-pink-500/15 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-bl from-teal-500/15 via-sky-500/10 to-transparent rounded-full blur-[130px] pointer-events-none -z-10" />
    </>
  );
};

export default LiquidBackground;
