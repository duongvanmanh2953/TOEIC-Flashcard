import React from 'react';

export interface LetStuNLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
  alt?: string;
  theme?: 'light' | 'dark' | 'auto';
  onClick?: () => void;
}

export const LetStuNLogo: React.FC<LetStuNLogoProps> = ({
  className = '',
  size = 'md',
  showContainer = false,
  alt = 'LetStuN — Learn today, remember tomorrow',
  theme = 'auto',
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
  const hasCustomRounded = /\brounded-/.test(className);
  const defaultRounded = hasCustomRounded ? '' : size === 'xs' || size === 'sm' ? 'rounded-lg' : 'rounded-2xl';

  const baseImgClass = `shrink-0 object-contain select-none p-0 m-0 border-0 ${defaultRounded} ${sizeClass} ${className}`.trim();

  if (theme === 'light') {
    return (
      <img
        src="/letstun-logo-light-256.png"
        alt={alt}
        onClick={onClick}
        className={baseImgClass}
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/letstun-logo-light.png';
        }}
      />
    );
  }

  if (theme === 'dark') {
    return (
      <img
        src="/letstun-logo-dark-256.png"
        alt={alt}
        onClick={onClick}
        className={baseImgClass}
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/letstun-logo-dark.png';
        }}
      />
    );
  }

  // Auto theme: adapt automatically to light / dark HTML class
  return (
    <span className={`inline-flex shrink-0 items-center justify-center p-0 m-0 ${sizeClass}`.trim()} onClick={onClick}>
      <img
        src="/letstun-logo-light-256.png"
        alt={alt}
        className={`dark:hidden ${baseImgClass}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/letstun-logo-light.png';
        }}
      />
      <img
        src="/letstun-logo-dark-256.png"
        alt={alt}
        className={`hidden dark:inline-block ${baseImgClass}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/letstun-logo-dark.png';
        }}
      />
    </span>
  );
};

export default LetStuNLogo;
