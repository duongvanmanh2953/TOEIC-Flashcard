import axios from 'axios';

function resolveApiBaseUrl(raw?: string): string {
  if (!raw) return '/api/v1';
  const clean = raw.replace(/\/+$/, '');
  if (clean.endsWith('/api/v1')) return clean;
  if (clean.endsWith('/api')) return `${clean}/v1`;
  return `${clean}/api/v1`;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
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
  notifyApiLoading(1, config);

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
    notifyApiLoading(-1, response.config);

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

    return response.data;
  },
  async (error) => {
    notifyApiLoading(-1, error.config);

    if (import.meta.env.DEV) {
      console.warn(`[HTTP ERR] ${error.response?.status || 'FAIL'} ${error.config?.url}`, error.response?.data || error.message);
    }

    // Auto-dispatch error toast for failed requests (except 401 which will be retried)
    const originalRequest = error.config;
    const is401 = error.response?.status === 401;

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
      const errMsg = error.response?.data?.message || '';
      if (
        typeof errMsg === 'string' &&
        (errMsg.includes('đổi mật khẩu') ||
          errMsg.includes('thu hồi') ||
          errMsg.includes('đăng xuất') ||
          errMsg.includes('hết hiệu lực'))
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
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error.response?.data?.error || error);
      }

      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('vocabflow_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('/api/v1/auth/refresh', { refreshToken });
          if (res.data?.success) {
            const { accessToken, refreshToken: newRefresh } = res.data.data;
            localStorage.setItem('vocabflow_access_token', accessToken);
            if (newRefresh) localStorage.setItem('vocabflow_refresh_token', newRefresh);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          }
        } catch {
          // Token expired, revoked, or device logged in elsewhere
          localStorage.removeItem('vocabflow_access_token');
          localStorage.removeItem('vocabflow_refresh_token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('VOCABFLOW_TOAST', {
                detail: {
                  type: 'warning',
                  title: 'Phiên đăng nhập kết thúc',
                  message: 'Phiên làm việc của bạn đã hết hạn hoặc bị thu hồi từ thiết bị khác. Vui lòng đăng nhập lại.',
                },
              }),
            );
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              setTimeout(() => {
                window.location.href = '/login';
              }, 400);
            }
          }
        }
      } else {
        // Stale or missing token
        localStorage.removeItem('vocabflow_access_token');
        localStorage.removeItem('vocabflow_refresh_token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 400);
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
