import React from 'react';

export interface VocabFlowLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showContainer?: boolean;
}

export const VocabFlowLogo: React.FC<VocabFlowLogoProps> = ({
  className = '',
  size = 'md',
  showContainer = false,
}) => {
  const iconSizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-12 h-12',
  };

  const containerSizeClasses = {
    xs: 'w-6 h-6 rounded-lg',
    sm: 'w-8 h-8 rounded-xl',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-14 h-14 rounded-2xl',
    xl: 'w-16 h-16 rounded-2xl',
  };

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`lucide lucide-sparkles text-indigo-600 dark:text-indigo-400 shrink-0 ${iconSizeClasses[size]} ${className}`}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );

  if (!showContainer) {
    return svg;
  }

  return (
    <div
      className={`${containerSizeClasses[size]} bg-gradient-to-tr from-indigo-500/15 to-purple-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0 shadow-sm`}
    >
      {svg}
    </div>
  );
};
