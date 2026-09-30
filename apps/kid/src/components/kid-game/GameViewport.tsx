// ============================================================================
// GAME VIEWPORT — DEDICATED FULLSCREEN HARDWARE VIEWPORT
// 100vw x 100dvh • Safe area insets • Zero body scroll • Orientation lock helper
// ============================================================================

import React, { useEffect, memo } from 'react';

interface GameViewportProps {
  children: React.ReactNode;
  requiresLandscape?: boolean;
  className?: string;
}

export const GameViewport: React.FC<GameViewportProps> = memo(({
  children,
  requiresLandscape = false,
  className = '',
}) => {
  useEffect(() => {
    // Lock screen orientation to landscape if requested and supported
    if (requiresLandscape && typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
      try {
        const orientation = window.screen.orientation as any;
        if (orientation && orientation.lock) {
          orientation.lock('landscape').catch(() => {
            // Orientation lock may fail if user hasn't interacted or browser disallows
          });
        }
      } catch {}
    }

    // Prevent body bounce/scrolling while game viewport is mounted
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
        try {
          const orientation = window.screen.orientation as any;
          if (orientation && orientation.unlock) {
            orientation.unlock();
          }
        } catch {}
      }
    };
  }, [requiresLandscape]);

  return (
    <div
      className={`fixed inset-0 z-50 w-screen h-screen min-h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col select-none touch-manipulation bg-[#FAF8F5] ${className}`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      {children}
    </div>
  );
});

export default GameViewport;
