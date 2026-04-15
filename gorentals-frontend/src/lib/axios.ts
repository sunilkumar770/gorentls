import axios, { AxiosError } from 'axios';

const TOKEN_KEY = 'gr_token';  // matches your existing localStorage key

const api = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api',
  withCredentials: true,
  timeout:         15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request: attach JWT ───────────────────────────────────────
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ── Response: handle 401 globally ────────────────────────────
api.interceptors.response.use(
  response => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_KEY };
