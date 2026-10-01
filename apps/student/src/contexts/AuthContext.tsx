import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import {
  signInAnonymously,
  signInWithGoogle,
  signInWithFacebook,
  getOrCreateAnonymousUid,
  isFirebaseConfigured as checkFirebaseConfigured,
} from '../lib/firebase';
import { FirebaseConfigModal } from '../components/auth/FirebaseConfigModal';
import { idbClearAllUserData } from '../lib/idb';

export type AuthState = 'AUTH_LOADING' | 'GUEST' | 'AUTHENTICATED' | 'AUTH_ERROR';

export interface User {
  id: string;
  email: string | null;
  displayName: string;
  avatar?: string;
  role: string;
  isAnonymous?: boolean;
  tier?: 'FREE' | 'PLUS' | 'PRO';
  subscription?: {
    id?: string;
    tier: 'FREE' | 'PLUS' | 'PRO';
    planName: string;
    currentPeriodEnd?: string | Date;
  } | null;
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

export function isProUser(u: User | null | undefined): boolean {
  if (!u) return false;
  return (
    u.role === 'PREMIUM_USER' ||
    u.role === 'ADMIN' ||
    u.role === 'SUPER_ADMIN' ||
    u.tier === 'PRO' ||
    u.subscription?.tier === 'PRO'
  );
}

export function normalizeUser(rawUser: any): User {
  if (!rawUser) return rawUser;
  const isPro =
    rawUser.role === 'PREMIUM_USER' ||
    rawUser.role === 'ADMIN' ||
    rawUser.role === 'SUPER_ADMIN' ||
    rawUser.tier === 'PRO' ||
    rawUser.subscription?.tier === 'PRO';

  const isPlus =
    !isPro && (rawUser.tier === 'PLUS' || rawUser.subscription?.tier === 'PLUS');

  const resolvedTier: 'FREE' | 'PLUS' | 'PRO' = isPro ? 'PRO' : isPlus ? 'PLUS' : 'FREE';

  return {
    ...rawUser,
    tier: resolvedTier,
    subscription: isPro
      ? {
          id: rawUser.subscription?.id || 'pro-active',
          tier: 'PRO',
          planName: rawUser.subscription?.planName || 'VocabFlow Pro (Unlimited)',
          currentPeriodEnd: rawUser.subscription?.currentPeriodEnd || '2099-12-31T23:59:59.000Z',
        }
      : isPlus
      ? {
          id: rawUser.subscription?.id || 'plus-active',
          tier: 'PLUS',
          planName: rawUser.subscription?.planName || 'VocabFlow Plus',
          currentPeriodEnd: rawUser.subscription?.currentPeriodEnd,
        }
      : rawUser.subscription || {
          tier: 'FREE',
          planName: 'Free',
        },
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
  firebaseConfigModalOpen: boolean;
  isFirebaseConfigured: boolean;
  openFirebaseConfigModal: () => void;
  closeFirebaseConfigModal: () => void;
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
  const [firebaseConfigModalOpen, setFirebaseConfigModalOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(() => checkFirebaseConfigured());

  const openFirebaseConfigModal = () => setFirebaseConfigModalOpen(true);
  const closeFirebaseConfigModal = () => {
    setFirebaseConfigModalOpen(false);
    setIsConfigured(checkFirebaseConfigured());
  };

  // Initialize theme
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem('vocabflow_theme') as 'light' | 'dark') ||
      (localStorage.getItem('vocabflow_theme') as 'light' | 'dark') ||
      'dark';
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('vocabflow_theme', nextTheme);
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
      const res: any = await api.get('/auth/me', { _skipAuthRedirect: true } as any);
      if (res?.success && res.data) {
        setUser(normalizeUser({ ...res.data, isAnonymous: false }));
        setAuthState('AUTHENTICATED');
        if (res.data?.accessToken) {
          localStorage.setItem('vocabflow_access_token', res.data.accessToken);
        }
        return;
      }
    } catch {
      // Fallback to guest session quietly without any forced redirect
    }

    // Initialize Anonymous Guest Session if not authenticated
    const anon = await signInAnonymously().catch(() => null);
    const anonUid = anon?.uid || getOrCreateAnonymousUid();
    setUser({
      id: anonUid,
      email: null,
      displayName: anon?.displayName || 'Khách Khám Phá',
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

  // Restore session on app load (supports localStorage and cross-subdomain cookie SSO)
  useEffect(() => {
    refreshProfile().catch(() => {});
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res: any = await api.post('/auth/login', credentials);
    if (res?.success) {
      localStorage.setItem('vocabflow_access_token', res.data.accessToken);
      localStorage.setItem('vocabflow_refresh_token', res.data.refreshToken);
      setUser(normalizeUser({ ...res.data.user, isAnonymous: false }));
      setAuthState('AUTHENTICATED');
      await migrateGuestData(res.data.user.id);
      refreshProfile().catch(() => {});
    }
  };

  const register = async (data: { email: string; password: string; displayName: string }) => {
    const res: any = await api.post('/auth/register', data);
    if (res?.success) {
      localStorage.setItem('vocabflow_access_token', res.data.accessToken);
      localStorage.setItem('vocabflow_refresh_token', res.data.refreshToken);
      setUser(normalizeUser({ ...res.data.user, isAnonymous: false }));
      setAuthState('AUTHENTICATED');
      await migrateGuestData(res.data.user.id);
      refreshProfile().catch(() => {});
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
        localStorage.setItem('vocabflow_access_token', payload.accessToken);
        localStorage.setItem('vocabflow_refresh_token', payload.refreshToken);
        setUser(normalizeUser({ ...payload.user, isAnonymous: false }));
        setAuthState('AUTHENTICATED');
        await migrateGuestData(payload.user.id);
        refreshProfile().catch(() => {});
      }
    } catch {
      // Local graceful fallback if API is in offline mode
      setUser(normalizeUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Google Learner',
        avatar: firebaseUser.photoURL || undefined,
        role: 'USER',
        isAnonymous: false,
      }));
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
        localStorage.setItem('vocabflow_access_token', payload.accessToken);
        localStorage.setItem('vocabflow_refresh_token', payload.refreshToken);
        setUser(normalizeUser({ ...payload.user, isAnonymous: false }));
        setAuthState('AUTHENTICATED');
        await migrateGuestData(payload.user.id);
        refreshProfile().catch(() => {});
      }
    } catch {
      setUser(normalizeUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Facebook Learner',
        avatar: firebaseUser.photoURL || undefined,
        role: 'USER',
        isAnonymous: false,
      }));
      setAuthState('AUTHENTICATED');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignored
    } finally {
      localStorage.removeItem('vocabflow_access_token');
      localStorage.removeItem('vocabflow_refresh_token');
      sessionStorage.clear();

      // Purge IndexedDB offline cache so switching accounts never leaks previous user's data
      await idbClearAllUserData().catch(() => {});

      setUser(null);
      setAuthState('GUEST');

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'info',
              title: 'Đã đăng xuất',
              message: 'Bạn đã đăng xuất an toàn. Toàn bộ phiên và token đã được xóa sạch.',
            },
          }),
        );
        window.location.href = '/login';
      }
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
        firebaseConfigModalOpen,
        isFirebaseConfigured: isConfigured,
        openFirebaseConfigModal,
        closeFirebaseConfigModal,
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
      <FirebaseConfigModal
        isOpen={firebaseConfigModalOpen}
        onClose={closeFirebaseConfigModal}
        onSuccess={closeFirebaseConfigModal}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
