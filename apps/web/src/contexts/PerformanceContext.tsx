import React, { createContext, useContext, useState, useEffect } from 'react';

export type PerformanceMode = 'default' | 'ultra-efficient';

interface PerformanceContextType {
  mode: PerformanceMode;
  isUltraEfficient: boolean;
  setMode: (mode: PerformanceMode) => void;
  togglePerformanceMode: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

const STORAGE_KEY = 'vocabflow_global_perf_mode';

export const PerformanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<PerformanceMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'ultra-efficient' || saved === 'default') {
        return saved;
      }
    } catch {
      // LocalStorage not available
    }
    return 'default';
  });

  const applyModeClass = (currentMode: PerformanceMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (currentMode === 'ultra-efficient') {
      root.classList.add('ultra-efficient-mode');
    } else {
      root.classList.remove('ultra-efficient-mode');
    }
  };

  useEffect(() => {
    applyModeClass(mode);
  }, [mode]);

  const setMode = (newMode: PerformanceMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore
    }
    applyModeClass(newMode);
  };

  const togglePerformanceMode = () => {
    setMode(mode === 'default' ? 'ultra-efficient' : 'default');
  };

  return (
    <PerformanceContext.Provider
      value={{
        mode,
        isUltraEfficient: mode === 'ultra-efficient',
        setMode,
        togglePerformanceMode,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
};

export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    // Graceful fallback if outside provider
    return {
      mode: 'default',
      isUltraEfficient: false,
      setMode: () => {},
      togglePerformanceMode: () => {},
    };
  }
  return context;
};
