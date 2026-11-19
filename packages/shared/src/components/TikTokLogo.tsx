import React from 'react';

export interface TikTokLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * Authentic single-color TikTok logo
 */
export const TikTokLogo: React.FC<TikTokLogoProps> = ({ className = 'w-4 h-4', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.28 6.28 0 0 0 1.96-4.47V8.41a8.28 8.28 0 0 0 5.15 1.78V6.76c-.45-.02-.9-.05-1.34-.07z" />
  </svg>
);

/**
 * Authentic TikTok logo with cyan and red/pink 3D chromatic aberration effect
 */
export const TikTokColorLogo: React.FC<TikTokLogoProps> = ({ className = 'w-5 h-5', size }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={size ? { width: size, height: size } : undefined}
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Cyan Offset Layer */}
    <path
      d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.887 2.887 0 0 1-5.201 1.743 2.89 2.89 0 0 1 2.31-4.642c.298-.002.595.042.88.13V9.402a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.344 6.338 6.34 6.34 0 0 0 10.824 4.47c1.238-1.18 1.96-2.793 1.96-4.47V8.414a8.28 8.28 0 0 0 5.15 1.777V6.76c-.45-.02-.9-.05-1.364-.074z"
      fill="#25F4EE"
      transform="translate(-0.8, -0.6)"
    />
    {/* Red/Pink Offset Layer */}
    <path
      d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.887 2.887 0 0 1-5.201 1.743 2.89 2.89 0 0 1 2.31-4.642c.298-.002.595.042.88.13V9.402a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.344 6.338 6.34 6.34 0 0 0 10.824 4.47c1.238-1.18 1.96-2.793 1.96-4.47V8.414a8.28 8.28 0 0 0 5.15 1.777V6.76c-.45-.02-.9-.05-1.364-.074z"
      fill="#FE2C55"
      transform="translate(0.8, 0.6)"
    />
    {/* White Main Layer */}
    <path
      d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.67a2.887 2.887 0 0 1-5.201 1.743 2.89 2.89 0 0 1 2.31-4.642c.298-.002.595.042.88.13V9.402a6.33 6.33 0 0 0-1-.08 6.34 6.34 0 0 0-6.344 6.338 6.34 6.34 0 0 0 10.824 4.47c1.238-1.18 1.96-2.793 1.96-4.47V8.414a8.28 8.28 0 0 0 5.15 1.777V6.76c-.45-.02-.9-.05-1.364-.074z"
      fill="#FFFFFF"
    />
  </svg>
);
