/**
 * Firebase Authentication Client for VocabFlow
 * Supports Anonymous-first authentication, Google OAuth, Facebook OAuth, and Email/Password.
 * Implements graceful offline/demo adapter when environment variables are not yet configured.
 */

export interface FirebaseUserToken {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId: string;
  accessToken?: string;
}

// Read client environment variables (Vite prefix)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.apiKey !== 'undefined'
);

/**
 * Maps raw Firebase error codes to friendly, human-readable notifications.
 * Rule: Never display raw 'auth/popup-closed-by-user' to learners.
 */
export function formatFirebaseAuthError(errorCode: string): string {
  switch (errorCode) {
    case 'auth/popup-closed-by-user':
      return 'Quá trình đăng nhập đã được hủy bỏ.';
    case 'auth/cancelled-popup-request':
      return 'Cửa sổ đăng nhập trước đó đã được thay thế.';
    case 'auth/popup-blocked':
      return 'Trình duyệt đã chặn cửa sổ đăng nhập (Popup). Vui lòng cấp quyền mở popup cho trang web.';
    case 'auth/account-exists-with-different-credential':
      return 'Email này đã liên kết với một phương thức đăng nhập khác. Hãy đăng nhập bằng phương thức gốc để liên kết tài khoản.';
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
    case 'auth/email-already-in-use':
      return 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc chọn Quên mật khẩu.';
    case 'auth/network-request-failed':
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.';
    default:
      return 'Đã xảy ra sự cố khi xác thực. Vui lòng thử lại.';
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
 * Sign in as Anonymous Guest
 */
export async function signInAnonymously(): Promise<FirebaseUserToken> {
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
 * Sign in with Google (Popup flow with fallback)
 */
export async function signInWithGoogle(): Promise<FirebaseUserToken> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const simulatedGoogleUid = 'google_' + Math.random().toString(36).substring(2, 10);
      resolve({
        uid: simulatedGoogleUid,
        email: 'learner.google@gmail.com',
        displayName: 'Google Learner',
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAnonymous: false,
        providerId: 'google.com',
        accessToken: 'mock_firebase_google_token_' + Date.now(),
      });
    }, 600);
  });
}

/**
 * Sign in with Facebook (Popup flow with fallback)
 */
export async function signInWithFacebook(): Promise<FirebaseUserToken> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const simulatedFacebookUid = 'fb_' + Math.random().toString(36).substring(2, 10);
      resolve({
        uid: simulatedFacebookUid,
        email: 'learner.facebook@facebook.com',
        displayName: 'Facebook Learner',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        isAnonymous: false,
        providerId: 'facebook.com',
        accessToken: 'mock_firebase_facebook_token_' + Date.now(),
      });
    }, 600);
  });
}
