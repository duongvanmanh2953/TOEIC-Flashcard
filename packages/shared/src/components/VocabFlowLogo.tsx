import React from 'react';

export interface VocabFlowLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
  useImage?: boolean;
  alt?: string;
  onClick?: () => void;
}

export const VocabFlowLogo: React.FC<VocabFlowLogoProps> = ({
  className = '',
  size = 'md',
  showContainer = false,
  useImage = false,
  alt = 'VocabFlow AI',
  onClick,
}) => {
  const iconSizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const containerSizeClasses = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-11 h-11 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl',
    xl: 'w-20 h-20 rounded-3xl',
  };

  const logoElement = useImage ? (
    <img
      src="/vocabflow-logo-256.png"
      alt={alt}
      onClick={onClick}
      className={`shrink-0 rounded-2xl object-contain ${iconSizeClasses[size]} ${className}`}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/vocabflow-logo.png';
      }}
    />
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      onClick={onClick}
      className={`shrink-0 rounded-2xl ${iconSizeClasses[size]} ${className}`}
    >
      <defs>
        <linearGradient id="vf-shared-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="35%" stopColor="#6366F1" />
          <stop offset="70%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="vf-shared-w1" x1="0%" y1="50%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#1E40AF" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id="vf-shared-w2" x1="0%" y1="70%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="128" fill="url(#vf-shared-bg)" />
      <path d="M 0 320 C 140 280, 240 380, 512 260 L 512 512 L 0 512 Z" fill="url(#vf-shared-w1)" />
      <path d="M 0 400 C 180 340, 320 460, 512 360 L 512 512 L 0 512 Z" fill="url(#vf-shared-w2)" />
      <path
        d="M 124 142 C 111 142, 100 153, 100 166 C 100 178, 107 189, 117 194 L 226 388 C 232 399, 243 406, 256 406 C 269 406, 280 399, 286 388 L 395 194 C 405 189, 412 178, 412 166 C 412 153, 401 142, 388 142 C 376 142, 366 149, 361 160 L 256 348 L 151 160 C 146 149, 136 142, 124 142 Z"
        fill="#FFFFFF"
      />
    </svg>
  );

  if (!showContainer) {
    return logoElement;
  }

  return (
    <div
      onClick={onClick}
      className={`${containerSizeClasses[size]} bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-xs overflow-hidden p-1 rounded-2xl ${className}`}
    >
      {logoElement}
    </div>
  );
};

export default VocabFlowLogo;
