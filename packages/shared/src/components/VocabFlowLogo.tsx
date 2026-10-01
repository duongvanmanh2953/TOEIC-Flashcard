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
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const containerSizeClasses = {
    xs: 'w-6 h-6 rounded-lg p-0.5',
    sm: 'w-9 h-9 rounded-xl p-1',
    md: 'w-11 h-11 rounded-2xl p-1.5',
    lg: 'w-16 h-16 rounded-3xl p-2',
    xl: 'w-20 h-20 rounded-3xl p-2.5',
  };

  // Luôn dùng hình ảnh logo gốc (Original PNG) chuẩn nhận diện thương hiệu VocabFlow
  const imageElement = (
    <img
      src="/vocabflow-logo-256.png"
      alt={alt}
      onClick={onClick}
      className={`shrink-0 object-contain rounded-xl select-none ${iconSizeClasses[size]} ${className}`}
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

  if (!showContainer) {
    return imageElement;
  }

  return (
    <div
      onClick={onClick}
      className={`${containerSizeClasses[size]} bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs overflow-hidden ${className}`}
    >
      {imageElement}
    </div>
  );
};

export default VocabFlowLogo;
