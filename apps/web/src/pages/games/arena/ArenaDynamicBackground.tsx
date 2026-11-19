import React, { useMemo } from 'react';

export type ArenaBackgroundTheme = 'business' | 'science' | 'travel' | 'nature' | 'esports';

interface ArenaDynamicBackgroundProps {
  theme?: ArenaBackgroundTheme;
  category?: string;
  languageId?: string;
  difficulty?: string;
  gameState?: string;
  className?: string;
  showHoloGamepad?: boolean;
}

export const ArenaDynamicBackground: React.FC<ArenaDynamicBackgroundProps> = ({
  theme,
  category = '',
  languageId = '',
  gameState = 'IN_ROUND',
  className = '',
  showHoloGamepad = false,
}) => {
  // Auto-resolve theme if not explicitly forced
  const resolvedTheme: ArenaBackgroundTheme = useMemo(() => {
    if (theme) return theme;
    const cat = category.toLowerCase();
    if (cat.includes('business') || cat.includes('toeic') || cat.includes('work') || cat.includes('finance')) {
      return 'business';
    }
    if (cat.includes('science') || cat.includes('tech') || cat.includes('academic') || cat.includes('stem')) {
      return 'science';
    }
    if (cat.includes('travel') || cat.includes('culture') || cat.includes('world') || cat.includes('country')) {
      return 'travel';
    }
    if (cat.includes('nature') || cat.includes('animal') || cat.includes('environment') || cat.includes('life')) {
      return 'nature';
    }
    return 'esports';
  }, [theme, category]);

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 transition-colors duration-1000 bg-[#070A17] ${className}`}
    >
      {/* 0. Primary High-Res Cyberpunk Stadium Backdrop (Extracted from User Design) */}
      <img
        src="/game-assets/arena/arena-stage-cyberpunk.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-bottom opacity-55 mix-blend-screen scale-105 pointer-events-none filter contrast-125 brightness-100"
      />

      {/* 1. Volumetric Overhead Spotlights & Atmospheric Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[80vw] max-w-4xl h-72 bg-gradient-to-b from-indigo-500/25 via-cyan-500/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-0 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-[140px] pointer-events-none" />

      {/* Optional Central Holographic Gamepad Watermark (as seen in image 1) */}
      {showHoloGamepad && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15 pointer-events-none filter drop-shadow-[0_0_30px_rgba(148,122,255,0.4)]">
          <svg width="280" height="200" viewBox="0 0 24 24" fill="none" stroke="#947AFF" strokeWidth="1.5">
            <rect x="2" y="6" width="20" height="12" rx="6" />
            <path d="M6 12h4m-2-2v4m10-2h.01m-2-2h.01m2 4h.01" strokeWidth="2" strokeLinecap="round" />
            <polygon points="10 9 15 12 10 15" fill="#947AFF" opacity="0.6" />
          </svg>
        </div>
      )}

      {/* 2. Theme Specific Ambient Accents */}
      {resolvedTheme === 'business' && (
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2041F610_1px,transparent_1px),linear-gradient(to_bottom,#2041F610_1px,transparent_1px)] bg-[size:48px_48px] opacity-60" />
      )}

      {resolvedTheme === 'science' && (
        <div className="absolute inset-0 bg-[radial-gradient(#25C98A20_1px,transparent_1px)] bg-[size:32px_32px] opacity-60" />
      )}

      {/* 3. Glowing Floor Arena Ring (Concentric Stage Floor from Image 1 & 2) */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[120vw] max-w-5xl h-64 rounded-[100%] border-4 border-cyan-400/40 shadow-[0_0_60px_rgba(6,182,212,0.5),inset_0_0_60px_rgba(6,182,212,0.3)] bg-gradient-to-t from-indigo-950/60 via-purple-900/20 to-transparent pointer-events-none">
        <div className="absolute inset-4 rounded-[100%] border-2 border-indigo-500/50" />
        <div className="absolute inset-10 rounded-[100%] border border-cyan-300/30" />
      </div>

      {/* 4. Crowd Silhouette along bottom edge */}
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#060812] via-[#060812]/90 to-transparent pointer-events-none" />

      {/* 5. Vignette & Contrast Control */}
      <div className="absolute inset-0 bg-radial-vignette opacity-80 pointer-events-none" />
      <div className="absolute inset-0 bg-[#070A17]/30 backdrop-blur-[0.5px] pointer-events-none" />

      {/* 6. Dynamic flash feedback on round evaluation */}
      {gameState === 'ROUND_OVER' && (
        <div className="absolute inset-0 bg-emerald-500/10 transition-opacity duration-500 pointer-events-none" />
      )}
    </div>
  );
};
