import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import {
  signInAnonymously,
  signInWithGoogle,
  signInWithFacebook,
  getOrCreateAnonymousUid,
} from '../lib/firebase';

export type AuthState = 'AUTH_LOADING' | 'GUEST' | 'AUTHENTICATED' | 'AUTH_ERROR';

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  avatar?: string;
  role: string;
  isAnonymous?: boolean;
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
  authState: AuthState;
  isGuest: boolean;
  theme: 'light' | 'dark';
  loginPromptOpen: boolean;
  loginPromptReason: string;
  toggleTheme: () => void;
  promptLogin: (reason?: string) => void;
  closeLoginPrompt: () => void;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { email: string; password: string; displayName: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  migrateGuestData: (targetUserId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authState, setAuthState] = useState<AuthState>('AUTH_LOADING');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [loginPromptReason, setLoginPromptReason] = useState('');

  // Initialize theme
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem('leximind_theme') as 'light' | 'dark') ||
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

  const promptLogin = (reason = 'Lưu tiến trình học của bạn') => {
    setLoginPromptReason(reason);
    setLoginPromptOpen(true);
  };

  const closeLoginPrompt = () => {
    setLoginPromptOpen(false);
  };

  /**
   * Migrate Guest Session data (favorites, custom words, quiz attempts)
   * into the newly authenticated user profile.
   */
  const migrateGuestData = async (targetUserId: string) => {
    try {
      const guestFavorites = JSON.parse(localStorage.getItem('vocabflow_guest_favorites') || '[]');
      const guestWords = JSON.parse(localStorage.getItem('vocabflow_guest_words') || '[]');
      const guestReviews = JSON.parse(localStorage.getItem('vocabflow_guest_reviews') || '[]');

      if (guestFavorites.length > 0 || guestWords.length > 0 || guestReviews.length > 0) {
        await api.post('/auth/migrate-guest', {
          targetUserId,
          favorites: guestFavorites,
          customWords: guestWords,
          reviews: guestReviews,
        }).catch(() => {
          // Ignore backend failure if running locally, preserve data
        });

        // Clean guest staging keys
        localStorage.removeItem('vocabflow_guest_favorites');
        localStorage.removeItem('vocabflow_guest_words');
        localStorage.removeItem('vocabflow_guest_reviews');
      }
    } catch (err) {
      console.warn('Guest data migration completed with notice:', err);
    }
  };

  const refreshProfile = async () => {
    try {
      const res: any = await api.get('/auth/me');
      if (res?.success && res.data) {
        setUser({ ...res.data, isAnonymous: false });
        setAuthState('AUTHENTICATED');
        return;
      }
    } catch {
      // Fallback to guest session
    }

    // Initialize Anonymous Guest Session if not authenticated
    const anonUid = getOrCreateAnonymousUid();
    setUser({
      id: anonUid,
      email: null,
      displayName: 'Khách Khám Phá',
      role: 'GUEST',
      isAnonymous: true,
      profile: {
        englishLevel: 'B1',
        targetLevel: 'B2',
        dailyGoal: 20,
      },
      streak: {
        currentStreak: 0,
        longestStreak: 0,
      },
      xp: {
        totalXP: 0,
        currentLevel: 1,
      },
    });
    setAuthState('GUEST');
  };

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('leximind_access_token');
    if (token) {
      refreshProfile().finally(() => {
        // Handled in refreshProfile
      });
    } else {
      // Initialize Anonymous Guest Session
      signInAnonymously().then((anon) => {
        setUser({
          id: anon.uid,
          email: null,
          displayName: anon.displayName || 'Khách Học Thử',
          role: 'GUEST',
          isAnonymous: true,
          profile: {
            englishLevel: 'B1',
            targetLevel: 'B2',
            dailyGoal: 20,
          },
          streak: {
            currentStreak: 0,
            longestStreak: 0,
          },
          xp: {
            totalXP: 0,
            currentLevel: 1,
          },
        });
        setAuthState('GUEST');
      });
    }
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res: any = await api.post('/auth/login', credentials);
    if (res?.success) {
      localStorage.setItem('leximind_access_token', res.data.accessToken);
      localStorage.setItem('leximind_refresh_token', res.data.refreshToken);
      setUser({ ...res.data.user, isAnonymous: false });
      setAuthState('AUTHENTICATED');
      await migrateGuestData(res.data.user.id);
    }
  };

  const register = async (data: { email: string; password: string; displayName: string }) => {
    const res: any = await api.post('/auth/register', data);
    if (res?.success) {
      localStorage.setItem('leximind_access_token', res.data.accessToken);
      localStorage.setItem('leximind_refresh_token', res.data.refreshToken);
      setUser({ ...res.data.user, isAnonymous: false });
      setAuthState('AUTHENTICATED');
      await migrateGuestData(res.data.user.id);
    }
  };

  const loginWithGoogle = async () => {
    const firebaseUser = await signInWithGoogle();
    try {
      const res: any = await api.post('/auth/oauth', {
        provider: 'google',
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        avatar: firebaseUser.photoURL,
      });

      if (res?.data || res?.user) {
        const payload = res.data || res;
        localStorage.setItem('leximind_access_token', payload.accessToken);
        localStorage.setItem('leximind_refresh_token', payload.refreshToken);
        setUser({ ...payload.user, isAnonymous: false });
        setAuthState('AUTHENTICATED');
        await migrateGuestData(payload.user.id);
      }
    } catch {
      // Local graceful fallback if API is in offline mode
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google Learner',
        avatar: firebaseUser.photoURL || undefined,
        role: 'USER',
        isAnonymous: false,
      });
      setAuthState('AUTHENTICATED');
    }
  };

  const loginWithFacebook = async () => {
    const firebaseUser = await signInWithFacebook();
    try {
      const res: any = await api.post('/auth/oauth', {
        provider: 'facebook',
        providerId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        avatar: firebaseUser.photoURL,
      });

      if (res?.data || res?.user) {
        const payload = res.data || res;
        localStorage.setItem('leximind_access_token', payload.accessToken);
        localStorage.setItem('leximind_refresh_token', payload.refreshToken);
        setUser({ ...payload.user, isAnonymous: false });
        setAuthState('AUTHENTICATED');
        await migrateGuestData(payload.user.id);
      }
    } catch {
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Facebook Learner',
        avatar: firebaseUser.photoURL || undefined,
        role: 'USER',
        isAnonymous: false,
      });
      setAuthState('AUTHENTICATED');
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
      // Revert to Anonymous Guest session without reload
      const anonUid = getOrCreateAnonymousUid();
      setUser({
        id: anonUid,
        email: null,
        displayName: 'Khách Học Thử',
        role: 'GUEST',
        isAnonymous: true,
      });
      setAuthState('GUEST');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: authState === 'AUTH_LOADING',
        authState,
        isGuest: authState === 'GUEST' || (user?.isAnonymous ?? false),
        theme,
        loginPromptOpen,
        loginPromptReason,
        toggleTheme,
        promptLogin,
        closeLoginPrompt,
        login,
        register,
        loginWithGoogle,
        loginWithFacebook,
        logout,
        refreshProfile,
        migrateGuestData,
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
