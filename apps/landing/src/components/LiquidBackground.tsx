import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#070919]">
      {/* 1. Subtle Modern Grid Pattern for spatial perspective */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* 2. SÁNG RỰC RỠ: Vùng phát sáng vòm trên đỉnh Hero (Top Radiant Aurora) */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] rounded-full bg-gradient-to-b from-indigo-500/50 via-purple-500/40 to-transparent blur-[100px] pointer-events-none" />

      {/* 3. VÙNG SÁNG MÀU CYAN ĐIỆN TỬ (Top-Right Electric Cyan / Sky Glow) */}
      <div className="absolute -top-10 -right-20 w-[650px] h-[650px] rounded-full bg-gradient-to-bl from-cyan-400/50 via-sky-500/40 to-transparent blur-[100px] pointer-events-none" />

      {/* 4. VÙNG SÁNG MÀU MAGENTA / ROSE (Top-Left Vivid Rose / Fuchsia Pool) */}
      <div className="absolute top-10 -left-20 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-rose-500/50 via-pink-600/40 to-transparent blur-[110px] pointer-events-none" />

      {/* 5. VÙNG SÁNG TRỰC TIẾP SAU THẺ FLASHCARD & DÃY STATS CARDS (Hero Center Spotlight) */}
      {/* Đây là vùng sáng cốt lõi giúp các thẻ Glass Surface khúc xạ ánh sáng và nổi bật hiệu ứng kính lỏng */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] rounded-full bg-gradient-to-r from-blue-500/45 via-indigo-500/40 to-cyan-400/45 blur-[95px] pointer-events-none animate-pulse-slow" />

      {/* 6. VÙNG SÁNG VÀNG CAM NẮNG ẤM (Center Right Warm Amber / Sunlight Glow) */}
      <div className="absolute top-[48%] -right-16 w-[580px] h-[580px] rounded-full bg-gradient-to-tl from-amber-400/45 via-orange-500/35 to-transparent blur-[110px] pointer-events-none" />

      {/* 7. VÙNG SÁNG XANH NGỌC MINT / EMERALD (Center Left Emerald Neon Glow) */}
      <div className="absolute top-[55%] -left-16 w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-emerald-400/45 via-teal-500/35 to-transparent blur-[105px] pointer-events-none" />

      {/* 8. VÙNG SÁNG VIOLET / PURPLE ĐẬM (Lower Center Nebula) */}
      <div className="absolute top-[75%] left-1/3 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gradient-to-r from-violet-600/45 via-purple-600/40 to-transparent blur-[110px] pointer-events-none" />

      {/* 9. VÙNG SÁNG DƯỚI ĐÁY TRANG (Footer Radiant Luminous Arc) */}
      <div className="absolute -bottom-24 right-0 w-[650px] h-[650px] rounded-full bg-gradient-to-tl from-cyan-400/40 via-indigo-600/45 to-transparent blur-[115px] pointer-events-none" />
    </div>
  );
};

export default LiquidBackground;
