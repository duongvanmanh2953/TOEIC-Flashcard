import React, { useEffect, useRef, useState, useId } from 'react';

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
  mixBlendMode?:
    | 'normal'
    | 'multiply'
    | 'screen'
    | 'overlay'
    | 'darken'
    | 'lighten'
    | 'color-dodge'
    | 'color-burn'
    | 'hard-light'
    | 'soft-light'
    | 'difference'
    | 'exclusion'
    | 'hue'
    | 'saturation'
    | 'color'
    | 'luminosity'
    | 'plus-darker'
    | 'plus-lighter';
  interactiveGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export const GlassSurface: React.FC<GlassSurfaceProps> = ({
  children,
  width,
  height,
  borderRadius = 24,
  borderWidth = 0.08,
  brightness = 60,
  opacity = 0.92,
  blur = 12,
  displace = 0.5,
  backgroundOpacity = 0.08,
  saturation = 1.3,
  distortionScale = -120,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
  xChannel = 'R',
  yChannel = 'G',
  mixBlendMode = 'screen',
  interactiveGlow = true,
  className = '',
  style = {},
  onClick
}) => {
  const uniqueId = useId().replace(/:/g, '-');
  const filterId = `landing-glass-${uniqueId}`;
  const redGradId = `landing-red-grad-${uniqueId}`;
  const blueGradId = `landing-blue-grad-${uniqueId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false
  });

  const [svgSupported, setSvgSupported] = useState<boolean>(false);

  const generateDisplacementMap = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = Math.max(rect?.width || 360, 100);
    const actualHeight = Math.max(rect?.height || 220, 100);
    const edgeSize = Math.min(actualWidth, actualHeight) * (borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="#38bdf8"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="#818cf8"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="hsl(220 30% ${brightness}% / ${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  };

  const updateDisplacementMap = () => {
    if (feImageRef.current) {
      feImageRef.current.setAttribute('href', generateDisplacementMap());
    }
  };

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: redOffset },
      { ref: greenChannelRef, offset: greenOffset },
      { ref: blueChannelRef, offset: blueOffset }
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute('scale', (distortionScale + offset).toString());
        ref.current.setAttribute('xChannelSelector', xChannel);
        ref.current.setAttribute('yChannelSelector', yChannel);
      }
    });

    gaussianBlurRef.current?.setAttribute('stdDeviation', displace.toString());
  }, [
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isWebkit = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    setSvgSupported(!isWebkit);

    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => {
      updateDisplacementMap();
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactiveGlow || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setMousePos((prev) => ({ ...prev, active: false }));
  };

  const containerStyles: React.CSSProperties = {
    ...style,
    width: width !== undefined ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === 'number' ? `${height}px` : height) : undefined,
    borderRadius: `${borderRadius}px`,
    background: 'rgba(15, 23, 42, 0.38)',
    backdropFilter: svgSupported ? `blur(${blur}px) saturate(${saturation})` : 'blur(20px) saturate(1.4)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    boxShadow: 'none'
  };

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`group relative overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:-translate-y-1' : ''
      } ${className}`}
      style={containerStyles}
    >
      {/* Specular Edge Highlight & Interactive Radial Glare */}
      {interactiveGlow && (
        <div
          className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 rounded-[inherit]"
          style={{
            opacity: mousePos.active ? 1 : 0,
            background: `radial-gradient(420px circle at ${mousePos.x}% ${mousePos.y}%, rgba(56, 189, 248, 0.18), rgba(129, 140, 248, 0.08) 40%, transparent 80%)`
          }}
        />
      )}

      {/* SVG Chromatic Dispersion Filter Definition */}
      <svg
        className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
            <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
            <feDisplacementMap ref={redChannelRef} in="SourceGraphic" in2="map" id="redchannel" result="dispRed" />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap ref={greenChannelRef} in="SourceGraphic" in2="map" id="greenchannel" result="dispGreen" />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap ref={blueChannelRef} in="SourceGraphic" in2="map" id="bluechannel" result="dispBlue" />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation={displace} />
          </filter>
        </defs>
      </svg>

      {/* Top subtle light rim for 3D bevel look */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent z-10" />

      {/* Content wrapper */}
      <div className="relative z-10 w-full h-full flex flex-col">
        {children}
      </div>
    </div>
  );
};

export default GlassSurface;
