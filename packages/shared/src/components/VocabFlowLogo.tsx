import React from 'react';

export interface VocabFlowLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
  alt?: string;
  onClick?: () => void;
}

export const VocabFlowLogo: React.FC<VocabFlowLogoProps> = ({
  className = '',
  size = 'md',
  showContainer = false,
  alt = 'VocabFlow AI',
  onClick,
}) => {
  const iconSizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-7 h-7 sm:w-8 sm:h-8',
    md: 'w-8 h-8 sm:w-9 sm:h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const hasCustomDimension = /\b(w-|h-)/.test(className);
  const sizeClass = hasCustomDimension ? '' : iconSizeClasses[size] || iconSizeClasses.md;

  // Luôn trả về trực tiếp thẻ <img> của logo gốc với 0 padding, 0 margin, 0 viền
  return (
    <img
      src="/vocabflow-logo-256.png"
      alt={alt}
      onClick={onClick}
      className={`shrink-0 object-contain select-none p-0 m-0 border-0 ${sizeClass} ${className}`.trim()}
      loading="eager"
      decoding="async"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (!img.dataset.triedOriginal) {
          img.dataset.triedOriginal = 'true';
          img.src = '/vocabflow-logo.png';
        } else if (!img.dataset.triedAssets) {
          img.dataset.triedAssets = 'true';
          img.src = '/assets/vocabflow-logo.png';
        }
      }}
    />
  );
};

export default VocabFlowLogo;
