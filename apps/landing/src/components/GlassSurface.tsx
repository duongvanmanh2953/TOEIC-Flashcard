import React from 'react';

export interface GlassSurfaceProps {
  children?: React.ReactNode;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: 'R' | 'G' | 'B';
  yChannel?: 'R' | 'G' | 'B';
  mixBlendMode?: string;
  interactiveGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

/**
 * Performance-First High-Efficiency Glass Surface Component
 * Eliminates CPU-heavy SVG displacement filters, infinite RAF loops, and per-pixel mouse listener state.
 * Uses hardware-accelerated CSS composite layers (transform, opacity) and subtle borders.
 */
export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width,
  height,
  borderRadius = 24,
  className = '',
  style = {},
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative group overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.995]' : ''
      } ${className}`}
      style={{
        width: width !== undefined ? width : undefined,
        height: height !== undefined ? height : undefined,
        borderRadius: `${borderRadius}px`,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transform: 'translateZ(0)', // Force GPU layer
        willChange: 'transform, border-color',
        ...style,
      }}
    >
      {/* Subtle top specular highlight border */}
      <div
        className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none opacity-80"
      />

      {/* Subtle hover specular shimmer */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
