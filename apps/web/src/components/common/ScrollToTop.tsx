import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop
 * Ensures consistent reset to top: 0 whenever the user navigates to a new page or route.
 * Targets window, document element, body, and any active scrollable layout containers.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // 1. Standard window scroll reset
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant' as ScrollBehavior,
      });
    } catch {
      window.scrollTo(0, 0);
    }

    // 2. Direct DOM scroll reset
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // 3. Reset internal page containers
    const containers = document.querySelectorAll(
      'main, [data-scroll-container="true"], .overflow-y-auto'
    );
    containers.forEach((el) => {
      // Don't reset fixed aside navigation drawers or their scrollable children
      if (!el.closest('aside')) {
        el.scrollTop = 0;
      }
    });
  }, [pathname, search]);

  return null;
};
