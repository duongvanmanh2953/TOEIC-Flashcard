import axios from 'axios';
import { idbGetCache, idbSetCache } from './idb';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 35000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem('vocabflow_device_id') || localStorage.getItem('vocabflow_device_id');
  if (!deviceId) {
    deviceId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'dev_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('vocabflow_device_id', deviceId);
    localStorage.setItem('vocabflow_device_id', deviceId);
  }
  return deviceId;
}

export function isStrictProtectedRoute(pathname: string): boolean {
  if (!pathname) return false;
  const strictRoutes = [
    '/admin',
    '/settings',
    '/word-bank',
    '/notes',
    '/community-knowledge/new',
    '/community-knowledge/edit',
    '/community-knowledge/my-posts',
    '/community-knowledge/saved',
    '/exams/editor',
    '/exams/review-wrong',
  ];
  return strictRoutes.some((route) => pathname === route || pathname.startsWith(route + '/'));
}


// Fast In-Memory Cache (SWR) for instantaneous page transitions and zero-lag rendering
interface CacheEntry {
  data: any;
  timestamp: number;
}
const getMemoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 25000; // 25s TTL

function shouldCacheEndpoint(url?: string): boolean {
  if (!url) return false;
  // Cache read-only dashboards, languages, stats, quotas, and deck catalogs
  return (
    url.startsWith('/dashboard') ||
    url.startsWith('/subscriptions') ||
    url.startsWith('/languages') ||
    url.startsWith('/community/decks') ||
    url.startsWith('/profiles')
  );
}

export function clearApiMemoryCache() {
  getMemoryCache.clear();
}

let activeRequestsCount = 0;
let activeMutationsCount = 0;

function notifyApiLoading(delta: number, config?: any) {
  activeRequestsCount = Math.max(0, activeRequestsCount + delta);
  const method = config?.method?.toUpperCase() || '';
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  if (isMutation) {
    activeMutationsCount = Math.max(0, activeMutationsCount + delta);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('VOCABFLOW_API_LOADING', {
        detail: {
          isLoading: activeRequestsCount > 0,
          activeRequests: activeRequestsCount,
          activeMutations: activeMutationsCount,
          isMutationActive: activeMutationsCount > 0,
          url: config?.url,
          method: config?.method,
        },
      }),
    );
  }
}

// Request interceptor: Attach JWT token, persistent deviceId & dev logging
api.interceptors.request.use((config) => {
  const isSilentBackground = config?.skipGlobalLoader || config?.url?.includes('/unread-count');
  if (!isSilentBackground) {
    notifyApiLoading(1, config);
  }

  const token = localStorage.getItem('vocabflow_access_token') || localStorage.getItem('vocabflow_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const deviceId = getOrCreateDeviceId();
  if (config.headers) {
    config.headers['x-device-id'] = deviceId;
  }

  if (import.meta.env.DEV) {
    console.debug(`[HTTP REQ] ${config.method?.toUpperCase()} ${config.baseURL || ''}${config.url || ''}`, {
      params: config.params,
      data: config.data ? '[payload]' : undefined,
    });
  }

  return config;
});

// Response interceptor: Auto Refresh Token on 401 & dev logging
api.interceptors.response.use(
  (response) => {
    const isSilentBackground = response.config?.skipGlobalLoader || response.config?.url?.includes('/unread-count');
    if (!isSilentBackground) {
      notifyApiLoading(-1, response.config);
    }

    if (import.meta.env.DEV) {
      console.debug(`[HTTP RES] ${response.status} ${response.config.url}`, response.data);
    }

    // Auto-dispatch success toast for mutation requests returning a message
    const method = response.config?.method?.toUpperCase();
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '');
    const serverMessage =
      (response.data as any)?.message ||
      (response.data as any)?.data?.message;

    if (
      isMutation &&
      serverMessage &&
      typeof serverMessage === 'string' &&
      !(response.config as any)?.skipGlobalToast
    ) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'success',
              title: 'Thành công',
              message: serverMessage,
            },
          }),
        );
      }
    }

    // Cache successful GET responses in IndexedDB for resilient offline learning
    if (response.config?.method?.toUpperCase() === 'GET' && response.config?.url) {
      const url = response.config.url;
      if (
        url.startsWith('/vocabulary') ||
        url.startsWith('/languages') ||
        url.startsWith('/community/my-decks') ||
        url.startsWith('/community/my-words') ||
        url.startsWith('/dashboard')
      ) {
        idbSetCache(url, response.data, 7 * 24 * 3600000).catch(() => {});
      }
    }

    return response.data;
  },
  async (error) => {
    const isSilentBackground = error.config?.skipGlobalLoader || error.config?.url?.includes('/unread-count');
    if (!isSilentBackground) {
      notifyApiLoading(-1, error.config);
    }

    if (import.meta.env.DEV) {
      console.warn(`[HTTP ERR] ${error.response?.status || 'FAIL'} ${error.config?.url}`, error.response?.data || error.message);
    }

    const originalRequest = error.config;
    const is401 = error.response?.status === 401;

    // Detect offline / network failure gracefully
    const isNetworkError =
      !error.response ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    if (isNetworkError) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('VOCABFLOW_NETWORK_OFFLINE_DETECTED'));
      }

      // If this was a GET request, attempt to serve from local IndexedDB cache!
      if (originalRequest?.method?.toUpperCase() === 'GET' && originalRequest?.url) {
        try {
          const cached = await idbGetCache(originalRequest.url, true);
          if (cached) {
            if (import.meta.env.DEV) {
              console.debug(`[HTTP OFFLINE FALLBACK] Served cached data for ${originalRequest.url}`);
            }
            return cached;
          }
        } catch {
          // Continue to graceful offline rejection
        }
      }

      // If this was an offline review submission, enqueue it silently
      if (
        originalRequest?.url?.includes('/reviews/batch') ||
        originalRequest?.url?.includes('/reviews/session')
      ) {
        try {
          const payloadData =
            typeof originalRequest.data === 'string'
              ? JSON.parse(originalRequest.data)
              : originalRequest.data;
          if (payloadData?.reviews && Array.isArray(payloadData.reviews)) {
            const { offlineSyncService } = await import('./offlineSyncService');
            await offlineSyncService.enqueueOfflineReviews(payloadData.reviews);
            return {
              data: {
                success: true,
                isOffline: true,
                xpAwarded: payloadData.reviews.length * 5,
                accuracy: 100,
                reviewedCount: payloadData.reviews.length,
                message: 'Đã lưu tiến trình ôn tập ngoại tuyến vào máy.',
              },
            };
          }
        } catch (queueErr) {
          console.warn('Failed to queue offline reviews:', queueErr);
        }
      }

      return Promise.reject({
        isOffline: true,
        message: 'Không có kết nối mạng',
        originalError: error,
      });
    }

    // Auto-dispatch error toast for failed requests (except 401 which will be retried)
    if (!is401 && !(error.config as any)?.skipGlobalToast) {
      const errMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Yêu cầu xử lý thất bại.';

      if (typeof errMsg === 'string' && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('VOCABFLOW_TOAST', {
            detail: {
              type: 'error',
              title: 'Lỗi thực thi',
              message: errMsg,
            },
          }),
        );
      }
    }

    if (is401 && !originalRequest?._retry) {
      if (
        (originalRequest as any)?._skipAuthRedirect ||
        originalRequest?.url?.includes('/auth/me') ||
        originalRequest?.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error.response?.data?.error || error);
      }

      const errMsg = error.response?.data?.message || '';
      if (
        typeof errMsg === 'string' &&
        (errMsg.includes('đổi mật khẩu') || errMsg.includes('đăng xuất'))
      ) {
        localStorage.removeItem('vocabflow_access_token');
        localStorage.removeItem('vocabflow_refresh_token');
        sessionStorage.clear();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('VOCABFLOW_TOAST', {
              detail: {
                type: 'warning',
                title: 'Phiên đăng nhập kết thúc',
                message: errMsg || 'Mật khẩu tài khoản đã thay đổi. Toàn bộ phiên làm việc đã bị hủy, vui lòng đăng nhập lại.',
              },
            }),
          );
          if (isStrictProtectedRoute(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error.response?.data?.error || error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('vocabflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await api.post('/auth/refresh', { refreshToken }, {
            _skipAuthRedirect: true,
          } as any);
          if (res.data?.success || res.data?.accessToken || res.data?.data?.accessToken) {
            const tokenData = res.data?.data || res.data;
            const accessToken = tokenData.accessToken;
            const newRefresh = tokenData.refreshToken;
            localStorage.setItem('vocabflow_access_token', accessToken);
            if (newRefresh) localStorage.setItem('vocabflow_refresh_token', newRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch {
          // Token expired, revoked, or invalid
          localStorage.removeItem('vocabflow_access_token');
          localStorage.removeItem('vocabflow_refresh_token');
          sessionStorage.clear();
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
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
              setTimeout(() => {
                window.location.href = `/login?expired=1`;
              }, 400);
            }
          }
        }
      } else {
        // Missing refresh token while accessing authenticated endpoint
        const hadToken = Boolean(localStorage.getItem('vocabflow_access_token'));
        localStorage.removeItem('vocabflow_access_token');
        localStorage.removeItem('vocabflow_refresh_token');
        sessionStorage.clear();
        if (typeof window !== 'undefined' && hadToken) {
          window.dispatchEvent(
            new CustomEvent('VOCABFLOW_TOAST', {
              detail: {
                type: 'warning',
                title: 'Phiên đăng nhập đã hết hạn',
                message: 'Phiên làm việc của bạn đã hết hạn. Vui lòng đăng nhập lại.',
              },
            }),
          );
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
            setTimeout(() => {
              window.location.href = `/login?expired=1`;
            }, 400);
          }
        }
      }
    }
    return Promise.reject(error.response?.data?.error || error);
  },
);

/**
 * Universal extractor for object responses:
 * Safely resolves { success: true, data: T }, { data: T }, or raw T.
 */
export function extractApiData<T = any>(res: any, fallback: T): T {
  if (res === null || res === undefined) return fallback;
  if (res?.data !== undefined) {
    if (res.data?.data !== undefined) return res.data.data as T;
    return res.data as T;
  }
  return res as T;
}

/**
 * Universal extractor for paginated / list responses:
 * Safely resolves { items: T[], total }, { data: { items: T[], total } }, or raw array T[].
 */
export function extractApiList<T = any>(res: any): { items: T[]; total: number; [key: string]: any } {
  if (!res) return { items: [], total: 0 };

  // Case 1: direct items array
  if (Array.isArray(res.items)) {
    return {
      items: res.items,
      total: typeof res.total === 'number' ? res.total : res.items.length,
      ...res,
    };
  }

  // Case 2: nested in data.items
  if (res.data && Array.isArray(res.data.items)) {
    return {
      items: res.data.items,
      total: typeof res.data.total === 'number' ? res.data.total : res.data.items.length,
      ...res.data,
    };
  }

  // Case 3: nested in data.data.items
  if (res.data?.data && Array.isArray(res.data.data.items)) {
    return {
      items: res.data.data.items,
      total: typeof res.data.data.total === 'number' ? res.data.data.total : res.data.data.items.length,
      ...res.data.data,
    };
  }

  // Case 4: direct array
  if (Array.isArray(res)) {
    return { items: res, total: res.length };
  }

  // Case 5: nested array in data
  if (Array.isArray(res.data)) {
    return { items: res.data, total: res.data.length };
  }

  // Case 6: nested array in data.data
  if (Array.isArray(res.data?.data)) {
    return { items: res.data.data, total: res.data.data.length };
  }

  return { items: [], total: 0 };
}

export default api;
