import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <>
      {/* 1. Ambient Dynamic Liquid Canvas Background (Depth with bright luminous pastel pools) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#050713]">
        {/* Subtle Modern Grid Overlay for depth perspective */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
            backgroundSize: '36px 36px'
          }}
        />

        {/* Base Atmospheric Luminous Gradient Canvas */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050713]/85 via-[#070b1c]/80 to-[#04060d]/95 backdrop-blur-[2px]" />

        {/* Top-Center Radiant Rose/Pink Uplight (Brighter luminous aura) */}
        <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[1100px] h-[550px] rounded-full bg-gradient-to-b from-rose-500/35 via-pink-500/25 to-transparent blur-[120px]" />

        {/* Top-Left Vibrant Luminous Indigo / Violet Pool */}
        <div className="absolute -top-28 -left-20 w-[680px] h-[680px] rounded-full bg-gradient-to-br from-indigo-500/45 via-violet-600/35 to-transparent blur-[130px] animate-pulse-slow" />

        {/* Top-Right Radiant Electric Cyan / Sky Blue Spot (Sáng & tươi) */}
        <div className="absolute -top-20 -right-20 w-[640px] h-[640px] rounded-full bg-gradient-to-bl from-cyan-400/45 via-sky-500/35 to-transparent blur-[125px]" />

        {/* Center Floating Luminous Purple / Fuchsia Nebula Spot */}
        <div className="absolute top-[35%] -right-24 w-[560px] h-[560px] rounded-full bg-gradient-to-tl from-purple-500/35 via-fuchsia-500/28 to-transparent blur-[130px]" />

        {/* Center-Left Electric Blue Depth Pool */}
        <div className="absolute top-[48%] -left-24 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-blue-500/35 via-indigo-500/28 to-transparent blur-[125px]" />

        {/* Bottom-Left Fresh Emerald / Mint Radiant Pool */}
        <div className="absolute -bottom-24 -left-20 w-[640px] h-[640px] rounded-full bg-gradient-to-tr from-emerald-400/35 via-teal-400/28 to-transparent blur-[130px] animate-pulse-slow" />

        {/* Bottom-Right Warm Amber / Glowing Gold Pool */}
        <div className="absolute -bottom-24 -right-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tl from-amber-400/35 via-orange-500/25 to-transparent blur-[125px]" />
      </div>

      {/* 2. Extra Atmospheric Hero Depth Spotlights (Tạo khối 3D cho các thẻ kính) */}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 w-[850px] h-[480px] bg-gradient-to-tr from-indigo-500/25 via-sky-400/20 to-purple-500/20 rounded-full blur-[140px] pointer-events-none -z-10 animate-pulse-slow" />
      <div className="fixed bottom-16 right-10 w-[550px] h-[550px] bg-gradient-to-bl from-teal-400/22 via-sky-400/18 to-transparent rounded-full blur-[135px] pointer-events-none -z-10" />
    </>
  );
};

export default LiquidBackground;
