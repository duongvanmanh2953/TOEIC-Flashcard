import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  signInAnonymously as firebaseSignInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import api from './api';

/**
 * Firebase Authentication Client for VocabFlow
 * Supports Real Firebase Google OAuth, Facebook OAuth, and Anonymous-first guest access.
 * Allows runtime client configuration (via UI / localStorage) or environment variables (Vite prefix).
 */

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export interface FirebaseUserToken {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: string;
  accessToken?: string;
}

export const FIREBASE_STORAGE_KEY = 'vocabflow_firebase_config';

/**
 * Retrieve user-stored Firebase config from localStorage if present
 */
export function getStoredFirebaseConfig(): FirebaseClientConfig | null {
  try {
    const saved = localStorage.getItem(FIREBASE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.apiKey && parsed?.projectId && !parsed.apiKey.includes('YourFirebaseApiKey')) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Retrieve active Firebase config from either localStorage or import.meta.env, with working fallback
 */
export function getActiveFirebaseConfig(): FirebaseClientConfig {
  const stored = getStoredFirebaseConfig();
  if (stored) return stored;

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoVocabFlowAuthProjectKey2026',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vocalflow-e04ca.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vocalflow-e04ca',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vocalflow-e04ca.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '103948572019',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:103948572019:web:9c8d7e6f5a4b3c2d',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
}

/**
 * Check if custom Firebase credentials are fully configured by user or remote backend
 */
export function isFirebaseConfigured(): boolean {
  const stored = getStoredFirebaseConfig();
  if (
    stored?.apiKey &&
    stored?.projectId &&
    !stored.apiKey.includes('AIzaSyDemo') &&
    !stored.apiKey.includes('YourFirebaseApiKey')
  ) {
    return true;
  }

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(
    envKey &&
    envKey !== 'undefined' &&
    envKey.length > 10 &&
    !envKey.includes('YourFirebaseApiKey') &&
    !envKey.includes('AIzaSyDemo')
  );
}

/**
 * Fetch remote Firebase config from the backend API (/auth/firebase-config)
 * and update local cache and Firebase app instance.
 */
export async function fetchRemoteFirebaseConfig(): Promise<FirebaseClientConfig | null> {
  try {
    const res: any = await api.get('/auth/firebase-config', { _skipAuthRedirect: true } as any);
    const payload = res?.data?.data !== undefined ? res.data.data : res?.data !== undefined ? res.data : res;
    const cfg = payload?.config || payload;
    if (
      cfg?.apiKey &&
      cfg?.projectId &&
      !cfg.apiKey.includes('AIzaSyDemo') &&
      !cfg.apiKey.includes('YourFirebaseApiKey')
    ) {
      await saveFirebaseConfig(cfg);
      return cfg;
    }
  } catch (err) {
    // Silent fallback
  }
  return null;
}

export interface FirebaseConnectionTestResult {
  success: boolean;
  latencyMs?: number;
  message: string;
  projectId?: string;
  projectNumber?: string;
  authorizedDomains?: string[];
  error?: string;
}

/**
 * Real live connection test for Firebase credentials
 * Queries Google Identity Toolkit endpoint to verify that the API Key is active, valid, and matches the Project ID.
 */
export async function testFirebaseConnection(config: {
  apiKey: string;
  projectId: string;
  authDomain?: string;
}): Promise<FirebaseConnectionTestResult> {
  const apiKey = config.apiKey?.trim();
  const projectId = config.projectId?.trim();

  if (!apiKey || apiKey.length < 15) {
    return {
      success: false,
      message: 'Khóa API Key không hợp lệ hoặc quá ngắn (Firebase API Key thường bắt đầu bằng AIzaSy...).',
    };
  }

  if (!projectId) {
    return {
      success: false,
      message: 'Vui lòng cung cấp Project ID của dự án Firebase.',
    };
  }

  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://www.googleapis.com/identitytoolkit/v3/relyingparty/getProjectConfig?key=${apiKey}`,
      { signal: controller.signal },
    );
    clearTimeout(timeoutId);
    const latency = Date.now() - start;

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      const rawApiProjectId = (data.projectId || '').trim();
      const authorizedDomains: string[] = Array.isArray(data.authorizedDomains) ? data.authorizedDomains : [];
      const cleanInputProject = projectId.toLowerCase();
      const cleanAuthDomain = (config.authDomain || '').toLowerCase().trim();

      // 1. Direct match: Google returned the project ID or user input matches data.projectId
      let isMatch = rawApiProjectId.toLowerCase() === cleanInputProject;
      let detectedProjectNumber: string | undefined = undefined;
      let detectedProjectId: string = projectId;

      // 2. If data.projectId is a numeric Google Cloud Project Number (e.g. "558974914414")
      if (!isMatch && /^\d+$/.test(rawApiProjectId)) {
        detectedProjectNumber = rawApiProjectId;

        // Check if any authorized domain corresponds to the input project ID (e.g. "vocalflow-e04ca.firebaseapp.com")
        const domainMatch = authorizedDomains.some((d: string) => {
          const domainLower = String(d).toLowerCase().trim();
          return (
            domainLower === cleanInputProject ||
            domainLower === `${cleanInputProject}.firebaseapp.com` ||
            domainLower === `${cleanInputProject}.web.app` ||
            domainLower.startsWith(`${cleanInputProject}.`) ||
            domainLower.includes(cleanInputProject)
          );
        });

        // Check if user input authDomain matches authorized domains
        const authDomainMatch =
          cleanAuthDomain &&
          authorizedDomains.some((d: string) => String(d).toLowerCase().trim() === cleanAuthDomain);

        if (domainMatch || authDomainMatch) {
          isMatch = true;
        } else {
          // Check if there is an explicit conflicting project domain in authorizedDomains
          const conflictingDomain = authorizedDomains.find((d: string) => {
            const dom = String(d).toLowerCase().trim();
            return (dom.endsWith('.firebaseapp.com') || dom.endsWith('.web.app')) && !dom.includes(cleanInputProject);
          });

          if (conflictingDomain) {
            const otherProjectId = conflictingDomain.replace('.firebaseapp.com', '').replace('.web.app', '');
            detectedProjectId = otherProjectId;
            isMatch = false;
          } else {
            // No conflicting domain found and API key is valid for this project number
            isMatch = true;
          }
        }
      }

      if (!isMatch) {
        return {
          success: false,
          latencyMs: latency,
          message: `Kiểm tra thất bại: API Key hợp lệ nhưng thuộc dự án "${detectedProjectId}"${
            detectedProjectNumber ? ` (Mã dự án Google Cloud: ${detectedProjectNumber})` : ''
          }, không khớp với Project ID bạn đã nhập ("${projectId}").`,
        };
      }

      return {
        success: true,
        latencyMs: latency,
        projectId: detectedProjectId || projectId,
        projectNumber: detectedProjectNumber,
        authorizedDomains: data.authorizedDomains || [],
        message: `Kiểm tra kết nối Firebase thành công (${latency}ms)! Khóa API Key và Project ID hợp lệ${
          detectedProjectNumber ? ` (Mã dự án: ${detectedProjectNumber})` : ''
        }, sẵn sàng phục vụ OAuth.`,
      };
    } else {
      const errData = await res.json().catch(() => ({}));
      const rawMsg = errData.error?.message || `Mã lỗi HTTP ${res.status}`;
      let friendlyMsg = rawMsg;
      if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid')) {
        friendlyMsg = 'Khóa API Key không tồn tại hoặc đã bị vô hiệu hóa trên Google Cloud Console.';
      } else if (rawMsg.includes('IP_REFERRER_BLOCKED') || rawMsg.includes('blocked')) {
        friendlyMsg = 'Khóa API Key có cấu hình giới hạn IP / HTTP Referrer ngăn chặn kết nối trực tiếp.';
      }
      return {
        success: false,
        latencyMs: latency,
        message: `Kiểm tra kết nối Firebase thất bại: ${friendlyMsg}`,
        error: rawMsg,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Không thể kết nối đến Firebase Gateway: ${err.message || 'Lỗi mạng hoặc kết nối timeout'}`,
    };
  }
}

// App, Auth and Firestore instances
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let firestoreInstance: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  const cfg = getActiveFirebaseConfig();
  if (!appInstance) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      appInstance = existingApps[0];
    } else {
      appInstance = initializeApp(cfg);
    }
  }
  return appInstance;
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  if (!authInstance && app) {
    authInstance = getAuth(app);
  }
  return authInstance!;
}

export function getFirebaseFirestore(): Firestore {
  const app = getFirebaseApp();
  if (!firestoreInstance && app) {
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance!;
}

/**
 * Save Firebase configuration to localStorage and dynamically re-initialize Firebase Auth
 */
export async function saveFirebaseConfig(config: FirebaseClientConfig): Promise<void> {
  localStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(config));

  // Reset current app instance if exists
  if (appInstance) {
    try {
      await deleteApp(appInstance);
    } catch {}
    appInstance = null;
    authInstance = null;
    firestoreInstance = null;
  }

  // Initialize with new config
  appInstance = initializeApp(config);
  authInstance = getAuth(appInstance);
  firestoreInstance = getFirestore(appInstance);
}

/**
 * Clear stored config from localStorage
 */
export async function clearFirebaseConfig(): Promise<void> {
  localStorage.removeItem(FIREBASE_STORAGE_KEY);
  if (appInstance) {
    try {
      await deleteApp(appInstance);
    } catch {}
    appInstance = null;
    authInstance = null;
    firestoreInstance = null;
  }
}

/**
 * Maps raw Firebase error codes to friendly, human-readable notifications.
 */
export function formatFirebaseAuthError(errorCode: string): string {
  const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Quá trình đăng nhập đã được hủy bỏ (cửa sổ đăng nhập đã bị đóng trước khi hoàn tất).';
    case 'auth/cancelled-popup-request':
      return 'Cửa sổ đăng nhập trước đó đã được thay thế hoặc bị hủy.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ đăng nhập (Pop-up). Vui lòng nhấn vào biểu tượng Pop-up trên thanh địa chỉ trình duyệt để Cho phép (Always allow pop-ups) rồi thử lại.';
    case 'auth/unauthorized-domain':
      return `Tên miền hiện tại (${currentHost || 'domain'}) chưa được cấp phép trong Firebase Console. Vui lòng thêm tên miền này vào Firebase Console > Authentication > Settings > Authorized domains hoặc sử dụng form đăng ký Email.`;
    case 'auth/operation-not-allowed':
      return 'Phương thức đăng nhập này (Google/Facebook) chưa được kích hoạt trong Firebase Console > Authentication > Sign-in method.';
    case 'auth/account-exists-with-different-credential':
      return 'Email này đã liên kết với một phương thức đăng nhập khác. Hãy đăng nhập bằng phương thức gốc.';
    case 'auth/credential-already-in-use':
      return 'Tài khoản mạng xã hội này đã được liên kết với một học viên khác.';
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/user-disabled':
      return 'Tài khoản này tạm thời bị khóa. Vui lòng liên hệ hỗ trợ.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/invalid-api-key':
      return 'Firebase API Key không hợp lệ. Vui lòng kiểm tra lại cấu hình Firebase.';
    case 'auth/app-not-authorized':
      return 'Firebase App chưa được ủy quyền. Hãy kiểm tra lại API Key và Project ID.';
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc chọn Quên mật khẩu.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
    default:
      return `Lỗi xác thực Firebase (${errorCode}). Vui lòng kiểm tra cấu hình Firebase OAuth hoặc đăng ký bằng form Email.`;
  }
}

/**
 * Wraps a promise with a timeout to prevent hanging UI (e.g. when popup is blocked or hangs)
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

// Local storage key for persistent anonymous guest identification
const ANONYMOUS_UID_KEY = 'vocabflow_anonymous_uid';

export function getOrCreateAnonymousUid(): string {
  let uid = localStorage.getItem(ANONYMOUS_UID_KEY);
  if (!uid) {
    uid = 'anon_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
    localStorage.setItem(ANONYMOUS_UID_KEY, uid);
  }
  return uid;
}

/**
 * Sign in as Anonymous Guest (Real Firebase or Local session)
 */
export async function signInAnonymously(): Promise<FirebaseUserToken> {
  const firebaseAuth = getFirebaseAuth();
  if (firebaseAuth) {
    try {
      const userCredential = await firebaseSignInAnonymously(firebaseAuth);
      const user: FirebaseUser = userCredential.user;
      const token = await user.getIdToken();
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Khách Học Thử',
        photoURL: user.photoURL,
        isAnonymous: true,
        providerId: 'anonymous',
        accessToken: token,
      };
    } catch (err) {
      console.warn('Firebase anonymous sign-in notice, using local guest session:', err);
    }
  }

  const uid = getOrCreateAnonymousUid();
  return {
    uid,
    email: null,
    displayName: 'Khách Học Thử',
    photoURL: null,
    isAnonymous: true,
    providerId: 'anonymous',
  };
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
  );
}

export function isInAppBrowser(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /FBAN|FBAV|Instagram|Line|Twitter|MicroMessenger|musical_ly|ByteLocale|TikTok|Zalo|Snapchat/i.test(ua);
}

/**
 * Sign in with Google (REAL Firebase SDK with GoogleAuthProvider)
 * Supports desktop popup and automatic mobile fallback to signInWithRedirect.
 */
export async function signInWithGoogle(forceRedirect = false): Promise<FirebaseUserToken | null> {
  if (!isFirebaseConfigured()) {
    await fetchRemoteFirebaseConfig().catch(() => null);
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Hệ thống chưa được thiết lập Firebase OAuth hoặc khóa API Key chưa hợp lệ. Vui lòng cấu hình Firebase trong trang Quản Trị Hệ Thống.'
    );
  }

  const firebaseAuth = getFirebaseAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });

  // Mobile browsers restrict popups and cross-tab window.opener postMessage.
  // Using signInWithRedirect provides seamless authentication without popup blocker errors.
  if (forceRedirect || isMobileDevice()) {
    try {
      sessionStorage.setItem('vocabflow_pending_oauth', 'google');
    } catch {}
    await signInWithRedirect(firebaseAuth, provider);
    return null;
  }

  try {
    const userCredential = await withTimeout(
      signInWithPopup(firebaseAuth, provider),
      35000,
      `Quá thời gian chờ xác thực Google (35 giây). Cửa sổ Popup có thể đã bị trình duyệt chặn hoặc tên miền (${typeof window !== 'undefined' ? window.location.hostname : ''}) chưa được cấp phép trong Firebase.`
    );
    const user: FirebaseUser = userCredential.user;
    const token = await user.getIdToken();

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Google Learner',
      photoURL: user.photoURL,
      isAnonymous: false,
      providerId: 'google.com',
      accessToken: token,
    };
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('Popup blocked or unsupported, falling back to signInWithRedirect:', err?.code);
      try {
        sessionStorage.setItem('vocabflow_pending_oauth', 'google');
      } catch {}
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    }

    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Sign in with Facebook (REAL Firebase SDK with FacebookAuthProvider)
 * Supports desktop popup and automatic mobile fallback to signInWithRedirect.
 */
export async function signInWithFacebook(forceRedirect = false): Promise<FirebaseUserToken | null> {
  if (!isFirebaseConfigured()) {
    await fetchRemoteFirebaseConfig().catch(() => null);
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Hệ thống chưa được thiết lập Firebase OAuth hoặc khóa API Key chưa hợp lệ. Vui lòng cấu hình Firebase trong trang Quản Trị Hệ Thống.'
    );
  }

  const firebaseAuth = getFirebaseAuth();
  const provider = new FacebookAuthProvider();
  provider.addScope('email');
  provider.addScope('public_profile');

  if (forceRedirect || isMobileDevice()) {
    try {
      sessionStorage.setItem('vocabflow_pending_oauth', 'facebook');
    } catch {}
    await signInWithRedirect(firebaseAuth, provider);
    return null;
  }

  try {
    const userCredential = await withTimeout(
      signInWithPopup(firebaseAuth, provider),
      35000,
      `Quá thời gian chờ xác thực Facebook (35 giây). Cửa sổ Popup có thể đã bị trình duyệt chặn hoặc nhà cung cấp Facebook chưa được thiết lập trên Firebase.`
    );
    const user: FirebaseUser = userCredential.user;
    const token = await user.getIdToken();

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Facebook Learner',
      photoURL: user.photoURL,
      isAnonymous: false,
      providerId: 'facebook.com',
      accessToken: token,
    };
  } catch (err: any) {
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/cancelled-popup-request' ||
      err?.code === 'auth/operation-not-supported-in-this-environment'
    ) {
      console.warn('Popup blocked or unsupported, falling back to signInWithRedirect:', err?.code);
      try {
        sessionStorage.setItem('vocabflow_pending_oauth', 'facebook');
      } catch {}
      await signInWithRedirect(firebaseAuth, provider);
      return null;
    }

    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Check if the user is returning from a redirect authentication flow (Google/Facebook OAuth on mobile).
 * Returns the FirebaseUserToken if a valid redirect result is present, or null.
 */
export async function getRedirectAuthResult(): Promise<FirebaseUserToken | null> {
  try {
    const firebaseAuth = getFirebaseAuth();
    const userCredential = await getRedirectResult(firebaseAuth);
    if (!userCredential || !userCredential.user) {
      return null;
    }
    const user = userCredential.user;
    const token = await user.getIdToken();
    const providerId = userCredential.providerId || user.providerData?.[0]?.providerId || 'google.com';

    try {
      sessionStorage.removeItem('vocabflow_pending_oauth');
    } catch {}

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || (providerId.includes('facebook') ? 'Facebook Learner' : 'Google Learner'),
      photoURL: user.photoURL,
      isAnonymous: false,
      providerId: providerId,
      accessToken: token,
    };
  } catch (err: any) {
    try {
      sessionStorage.removeItem('vocabflow_pending_oauth');
    } catch {}
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Sign in using Email and Password via Firebase Auth
 */
export async function signInWithEmail(email: string, pass: string): Promise<FirebaseUserToken> {
  const firebaseAuth = getFirebaseAuth();
  try {
    const userCredential = await signInWithEmailAndPassword(firebaseAuth, email.trim(), pass);
    const user = userCredential.user;
    const token = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split('@')[0] || 'Learner',
      photoURL: user.photoURL,
      isAnonymous: false,
      providerId: 'password',
      accessToken: token,
    };
  } catch (err: any) {
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Register a new user with Email and Password via Firebase Auth
 */
export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<FirebaseUserToken> {
  const firebaseAuth = getFirebaseAuth();
  try {
    const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pass);
    const user = userCredential.user;
    if (displayName?.trim()) {
      await updateProfile(user, { displayName: displayName.trim() });
    }
    const token = await user.getIdToken();
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || displayName || user.email?.split('@')[0] || 'Learner',
      photoURL: user.photoURL,
      isAnonymous: false,
      providerId: 'password',
      accessToken: token,
    };
  } catch (err: any) {
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  try {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  } catch (err: any) {
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Sign out from Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  const firebaseAuth = getFirebaseAuth();
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (err: any) {
    console.error('Firebase sign-out error:', err);
  }
}
