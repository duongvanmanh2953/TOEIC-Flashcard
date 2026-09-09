import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token & dev logging
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vocabflow_access_token') || localStorage.getItem('leximind_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
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
    if (import.meta.env.DEV) {
      console.debug(`[HTTP RES] ${response.status} ${response.config.url}`, response.data);
    }
    return response.data;
  },
  async (error) => {
    if (import.meta.env.DEV) {
      console.warn(`[HTTP ERR] ${error.response?.status || 'FAIL'} ${error.config?.url}`, error.response?.data || error.message);
    }
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('vocabflow_refresh_token') || localStorage.getItem('leximind_refresh_token');
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
          // Token expired or invalid
          localStorage.removeItem('vocabflow_access_token');
          localStorage.removeItem('vocabflow_refresh_token');
          localStorage.removeItem('leximind_access_token');
          localStorage.removeItem('leximind_refresh_token');
        }
      } else {
        // Stale or missing token
        localStorage.removeItem('vocabflow_access_token');
        localStorage.removeItem('leximind_access_token');
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
