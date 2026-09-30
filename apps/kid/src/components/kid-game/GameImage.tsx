// ============================================================================
// GAME IMAGE — OPTIMIZED ASSET RENDERER
// Async decoding • Zero layout shift • Shimmer skeleton • Automatic fallback
// ============================================================================

import React, { useState, memo } from 'react';
import { kidGameAsset, KidAssetCategory } from '../../services/assets/kidGameAsset';

interface GameImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  category?: KidAssetCategory;
  assetName?: string;
  src?: string;
  alt: string;
  className?: string;
  fallbackSrc?: string;
}

export const GameImage: React.FC<GameImageProps> = memo(({
  category = 'animals',
  assetName,
  src,
  alt,
  className = 'w-full h-full object-contain',
  fallbackSrc = '/assets/kid/mascot/vivi-wave.png',
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Determine actual image source
  const targetSrc = src || (assetName ? kidGameAsset(category, assetName) : fallbackSrc);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Subtle Shimmer Skeleton while image is loading */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-2 rounded-2xl bg-slate-200/50 dark:bg-white/10 animate-pulse" />
      )}

      <img
        src={hasError ? fallbackSrc : targetSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
        className={`${className} transition-opacity duration-200 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } select-none pointer-events-none filter drop-shadow-sm`}
        {...rest}
      />
    </div>
  );
});
