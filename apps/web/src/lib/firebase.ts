import { initializeApp, getApps, getApp, FirebaseApp, deleteApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInAnonymously as firebaseSignInAnonymously,
  User as FirebaseUser,
} from 'firebase/auth';

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
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vocabflow-learning.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vocabflow-learning',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vocabflow-learning.appspot.com',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '103948572019',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:103948572019:web:9c8d7e6f5a4b3c2d',
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
}

/**
 * Check if custom Firebase credentials are fully configured by user
 */
export function isFirebaseConfigured(): boolean {
  const stored = getStoredFirebaseConfig();
  if (stored?.apiKey && stored?.projectId) return true;

  const envKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return Boolean(
    envKey &&
    envKey !== 'undefined' &&
    envKey.length > 10 &&
    !envKey.includes('YourFirebaseApiKey')
  );
}

// App and Auth instances
let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  const cfg = getActiveFirebaseConfig();
  if (!appInstance) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      appInstance = existingApps[0];
    } else {
      appInstance = initializeApp(cfg);
    }
  }

  if (!authInstance && appInstance) {
    authInstance = getAuth(appInstance);
  }

  return authInstance!;
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
  }

  // Initialize with new config
  appInstance = initializeApp(config);
  authInstance = getAuth(appInstance);
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
  }
}

/**
 * Maps raw Firebase error codes to friendly, human-readable notifications.
 */
export function formatFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Quá trình đăng nhập đã được hủy bỏ (Bạn đã đóng cửa sổ đăng nhập).';
    case 'auth/cancelled-popup-request':
      return 'Cửa sổ đăng nhập trước đó đã được thay thế.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ đăng nhập (Popup). Vui lòng cho phép popup cho VocabFlow.';
    case 'auth/unauthorized-domain':
      return 'Tên miền hiện tại chưa được cấp phép trong Firebase Console. Vui lòng thêm localhost/domain vào Firebase Authentication > Settings > Authorized domains.';
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
      return `Lỗi xác thực Firebase (${errorCode}). Vui lòng kiểm tra cấu hình Firebase OAuth.`;
  }
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

/**
 * Sign in with Google (REAL Firebase SDK with GoogleAuthProvider & signInWithPopup)
 * Throws error if Firebase has not been configured so caller can show configuration modal.
 */
export async function signInWithGoogle(): Promise<FirebaseUserToken> {
  const firebaseAuth = getFirebaseAuth();

  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({ prompt: 'select_account' });

    const userCredential = await signInWithPopup(firebaseAuth, provider);
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
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}

/**
 * Sign in with Facebook (REAL Firebase SDK with FacebookAuthProvider & signInWithPopup)
 */
export async function signInWithFacebook(): Promise<FirebaseUserToken> {
  const firebaseAuth = getFirebaseAuth();

  try {
    const provider = new FacebookAuthProvider();
    provider.addScope('email');
    provider.addScope('public_profile');

    const userCredential = await signInWithPopup(firebaseAuth, provider);
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
    if (err?.code) {
      throw new Error(formatFirebaseAuthError(err.code));
    }
    throw err;
  }
}
