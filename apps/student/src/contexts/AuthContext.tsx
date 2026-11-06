import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import api from '../lib/api';
import {
  signInAnonymously,
  signInWithGoogle,
  signInWithFacebook,
  getOrCreateAnonymousUid,
  isFirebaseConfigured as checkFirebaseConfigured,
  fetchRemoteFirebaseConfig,
} from '../lib/firebase';
import { FirebaseConfigModal } from '../components/auth/FirebaseConfigModal';
import { idbClearAllUserData } from '../lib/idb';
import { ingestSsoTokens, broadcastAuthChange, subscribeAuthChange } from '../lib/sso';

export type AuthState = 'AUTH_LOADING' | 'GUEST' | 'AUTHENTICATED' | 'AUTH_ERROR' | 'UNAUTHENTICATED';

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
    const hadTokens = Boolean(
      localStorage.getItem('vocabflow_access_token') ||
      localStorage.getItem('vocabflow_refresh_token')
    );

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
      // Fallback to check refresh token before guest session
    }

    // Attempt token recovery via refresh token (from cross-app SSO handoff or cookie)
    const refreshToken = localStorage.getItem('vocabflow_refresh_token');
    if (refreshToken) {
      try {
        const refRes: any = await api.post('/auth/refresh', { refreshToken });
        const newAccess = refRes?.data?.accessToken || refRes?.accessToken;
        const newRefresh = refRes?.data?.refreshToken || refRes?.refreshToken;
        if (newAccess) {
          localStorage.setItem('vocabflow_access_token', newAccess);
          if (newRefresh) {
            localStorage.setItem('vocabflow_refresh_token', newRefresh);
          }
          const retryRes: any = await api.get('/auth/me', { _skipAuthRedirect: true } as any);
          if (retryRes?.success && retryRes.data) {
            setUser(normalizeUser({ ...retryRes.data, isAnonymous: false }));
            setAuthState('AUTHENTICATED');
            return;
          }
        }
      } catch {
        // Refresh failed
      }
    }

    // If user held tokens but session expired or is invalid, logout and push to login!
    if (hadTokens) {
      localStorage.removeItem('vocabflow_access_token');
      localStorage.removeItem('vocabflow_refresh_token');
      sessionStorage.clear();
      setUser(null);
      setAuthState('UNAUTHENTICATED');
      broadcastAuthChange({ type: 'LOGOUT' });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'warning',
              title: 'Phiên đăng nhập đã hết hạn',
              message: 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.',
            },
          }),
        );
        const path = window.location.pathname;
        if (!path.includes('/login') && !path.includes('/register')) {
          setTimeout(() => {
            window.location.href = `/login?expired=1`;
          }, 300);
        }
      }
      return;
    }

    // Initialize Anonymous Guest Session ONLY for first-time visitors with no tokens
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

  // Restore session on app load (supports cross-app SSO handoff, localStorage, and cookie SSO)
  useEffect(() => {
    // 0. Pre-fetch remote Firebase configuration from backend
    fetchRemoteFirebaseConfig().then((cfg) => {
      if (cfg) setIsConfigured(true);
    }).catch(() => {});

    // 1. Ingest SSO tokens from URL if arriving from another sub-app (Admin/Kid)
    ingestSsoTokens();

    // 2. Fetch authenticated profile
    refreshProfile().catch(() => {});

    // 3. Multi-tab synchronization
    const unsubscribe = subscribeAuthChange((payload) => {
      if (payload?.type === 'LOGOUT') {
        setUser(null);
        setAuthState('GUEST');
        localStorage.removeItem('vocabflow_access_token');
        localStorage.removeItem('vocabflow_refresh_token');
      } else if (payload?.type === 'LOGIN' || payload?.type === 'SSO_INGESTED') {
        refreshProfile().catch(() => {});
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res: any = await api.post('/auth/login', credentials);
    if (res?.success) {
      localStorage.setItem('vocabflow_access_token', res.data.accessToken);
      localStorage.setItem('vocabflow_refresh_token', res.data.refreshToken);
      setUser(normalizeUser({ ...res.data.user, isAnonymous: false }));
      setAuthState('AUTHENTICATED');
      broadcastAuthChange({ type: 'LOGIN', user: res.data.user });
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

  // Deep Link listener for Native Mobile OAuth callback (vn.vocabflow.student://auth-callback)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanupHandle: any = null;

    App.addListener('appUrlOpen', async (data: { url: string }) => {
      try {
        if (!data?.url) return;
        if (data.url.includes('auth-callback') || data.url.startsWith('vn.vocabflow.student://')) {
          await Browser.close().catch(() => {});

          const urlObj = new URL(data.url);
          const accessToken = urlObj.searchParams.get('access_token');
          const refreshToken = urlObj.searchParams.get('refresh_token');
          const rawUser = urlObj.searchParams.get('user');

          if (accessToken) {
            localStorage.setItem('vocabflow_access_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('vocabflow_refresh_token', refreshToken);
            }

            let parsedUser = null;
            if (rawUser) {
              try {
                parsedUser = JSON.parse(decodeURIComponent(rawUser));
              } catch {}
            }

            if (parsedUser) {
              setUser(normalizeUser({ ...parsedUser, isAnonymous: false }));
              setAuthState('AUTHENTICATED');
            } else {
              const meRes: any = await api.get('/auth/me');
              if (meRes?.success && meRes.data) {
                setUser(normalizeUser({ ...meRes.data, isAnonymous: false }));
                setAuthState('AUTHENTICATED');
              }
            }

            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('VOCABFLOW_TOAST', {
                  detail: {
                    type: 'success',
                    title: 'Đăng nhập thành công',
                    message: 'Chào mừng bạn đã kết nối tài khoản thành công!',
                  },
                }),
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to parse OAuth deep link:', err);
      }
    }).then((handle) => {
      cleanupHandle = handle;
    });

    return () => {
      if (cleanupHandle?.remove) {
        cleanupHandle.remove();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    if (Capacitor.isNativePlatform()) {
      const authUrl = 'https://app.vocalflow.site/login?mobile_auth=true&provider=google';
      await Browser.open({ url: authUrl, windowName: '_system' });
      return;
    }
    const firebaseUser = await signInWithGoogle();
    try {
      const res: any = await api.post('/auth/oauth', {
        provider: 'google',
        providerId: firebaseUser.uid,
        idToken: firebaseUser.accessToken,
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
    if (Capacitor.isNativePlatform()) {
      const authUrl = 'https://app.vocalflow.site/login?mobile_auth=true&provider=facebook';
      await Browser.open({ url: authUrl, windowName: '_system' });
      return;
    }
    const firebaseUser = await signInWithFacebook();
    try {
      const res: any = await api.post('/auth/oauth', {
        provider: 'facebook',
        providerId: firebaseUser.uid,
        idToken: firebaseUser.accessToken,
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
      broadcastAuthChange({ type: 'LOGOUT' });

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

  const contextValue = useMemo<AuthContextType>(
    () => ({
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
    }),
    [
      user,
      authState,
      theme,
      loginPromptOpen,
      loginPromptReason,
      firebaseConfigModalOpen,
      isConfigured,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
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
