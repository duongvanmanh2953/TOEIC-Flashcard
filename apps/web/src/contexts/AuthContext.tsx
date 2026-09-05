import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: string;
  profile?: {
    englishLevel: string;
    targetLevel: string;
    dailyGoal: number;
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
  xp?: {
    totalXP: number;
    currentLevel: number;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem('leximind_theme') as 'light' | 'dark') || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('leximind_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const refreshProfile = async () => {
    try {
      const res: any = await api.get('/auth/me');
      if (res?.success) {
        setUser(res.data);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('leximind_access_token');
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res: any = await api.post('/auth/login', credentials);
    if (res?.success) {
      localStorage.setItem('leximind_access_token', res.data.accessToken);
      localStorage.setItem('leximind_refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const register = async (data: { email: string; password: string; displayName: string }) => {
    const res: any = await api.post('/auth/register', data);
    if (res?.success) {
      localStorage.setItem('leximind_access_token', res.data.accessToken);
      localStorage.setItem('leximind_refresh_token', res.data.refreshToken);
      setUser(res.data.user);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem('leximind_access_token');
      localStorage.removeItem('leximind_refresh_token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        theme,
        toggleTheme,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
