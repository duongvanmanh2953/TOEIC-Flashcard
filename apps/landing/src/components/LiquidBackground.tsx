import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#060813]">
      {/* Modern Subtle Grid Pattern Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top-Center Soft Rose/Pink Luminous Mesh */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[580px] rounded-full bg-gradient-to-b from-rose-500/40 via-pink-600/30 to-transparent blur-[120px]" />

      {/* Top-Left Soft Peach/Coral */}
      <div className="absolute -top-24 -left-20 w-[650px] h-[650px] rounded-full bg-gradient-to-br from-orange-500/30 via-amber-500/20 to-transparent blur-[140px] animate-float-slow" />

      {/* Top-Right Sky Blue / Mint */}
      <div className="absolute top-10 -right-24 w-[620px] h-[620px] rounded-full bg-gradient-to-bl from-sky-500/40 via-cyan-400/25 to-transparent blur-[135px]" />

      {/* Center Floating Lavender */}
      <div
        className="absolute top-[42%] -right-28 w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-purple-500/30 via-fuchsia-500/25 to-transparent blur-[140px] animate-float-slow"
        style={{ animationDelay: '-3s' }}
      />

      {/* Center-Left Mint / Emerald */}
      <div className="absolute top-[55%] -left-28 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-400/35 via-teal-400/25 to-transparent blur-[130px]" />

      {/* Bottom-Left Sky Blue Pool */}
      <div
        className="absolute -bottom-20 -left-20 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-500/40 via-indigo-500/25 to-transparent blur-[135px] animate-float-slow"
        style={{ animationDelay: '-6s' }}
      />

      {/* Bottom-Right Warm Yellow / Coral */}
      <div className="absolute -bottom-20 -right-20 w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-yellow-400/35 via-orange-400/25 to-transparent blur-[130px]" />
    </div>
  );
};

export default LiquidBackground;
