import React from 'react';

/**
 * Performance-First Ambient Background
 * Uses static radial-gradients instead of multiple large blur filter blobs and infinite pulse animations.
 * Eliminates GPU overdraw and composite layer thrashing while keeping rich modern depth.
 */
export const LiquidBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#060813]"
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.18) 0%, transparent 50%),
          radial-gradient(circle at 85% 15%, rgba(56, 189, 248, 0.12) 0%, transparent 40%),
          radial-gradient(circle at 15% 25%, rgba(236, 72, 153, 0.10) 0%, transparent 45%),
          radial-gradient(circle at 50% 85%, rgba(79, 70, 229, 0.12) 0%, transparent 55%)
        `,
      }}
    >
      {/* Subtle Spatial Dot Grid */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
    </div>
  );
};

export default LiquidBackground;
