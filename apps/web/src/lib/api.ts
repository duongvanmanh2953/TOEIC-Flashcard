import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vocabflow_access_token') || localStorage.getItem('leximind_access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Auto Refresh Token on 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
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

export default api;
