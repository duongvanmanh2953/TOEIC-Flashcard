import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * usePersistentScroll
 * Preserves and restores scroll position across navigations without causing layout shifts or remounting.
 * Debounces sessionStorage writes to guarantee 60fps smooth scrolling.
 * Complies with VOCALFLOW_SPECIFICATION Section 4 and Vercel React Best Practices.
 */
export function usePersistentScroll<T extends HTMLElement = HTMLDivElement>(
  storageKey: string,
  debounceMs: number = 100
) {
  const location = useLocation();
  const scrollRef = useRef<T | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restore scroll position on mount or route transition
  useEffect(() => {
    try {
      const savedScroll = sessionStorage.getItem(storageKey);
      if (savedScroll && scrollRef.current) {
        scrollRef.current.scrollTop = parseInt(savedScroll, 10);
      }
    } catch {
      // Ignore sessionStorage exceptions in private browsing mode
    }
  }, [location.pathname, storageKey]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Debounced scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<T>) => {
      const currentScrollTop = e.currentTarget.scrollTop;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(storageKey, String(currentScrollTop));
        } catch {
          // Ignore storage quota errors
        }
      }, debounceMs);
    },
    [storageKey, debounceMs]
  );

  return {
    scrollRef,
    handleScroll,
  };
}

export default usePersistentScroll;
