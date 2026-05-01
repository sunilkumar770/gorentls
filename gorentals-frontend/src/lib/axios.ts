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

// ── Response: retry 5xx on GET, handle 401 globally ─────────────
api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as typeof error.config & { _retryCount?: number };
    const response = error.response;

    // Retry idempotent GET requests on 5xx or network failure (no response).
    // Never retry POST/PATCH/DELETE — those are not safe to replay.
    const isGet = config?.method?.toLowerCase() === 'get';
    const isRetryable = !response || response.status >= 500;
    const retryCount = config?._retryCount ?? 0;

    if (config && isGet && isRetryable && retryCount < 3) {
      config._retryCount = retryCount + 1;
      // Exponential back-off: 2 s, 4 s, 8 s
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(config);
    }

    // Handle CORS or Network errors (status code 0 or undefined response)
    if (!response || response.status === 0) {
      console.error('❌ CORS Error or Network Issue');
      console.error(`Failed to connect to: ${config?.baseURL}`);
      // Only throw if it's not a retry attempt
      if (!isGet || retryCount >= 3) {
        throw new Error('Cannot connect to API. Check CORS configuration and API URL.');
      }
    }

    // 401 → clear session and redirect to login
    if (
      response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem(TOKEN_KEY);
      const params = new URLSearchParams({
        reason: 'session_expired',
        redirect: window.location.pathname,
      });
      window.location.href = `/login?${params.toString()}`;
    }

    return Promise.reject(error);
  }
);

export default api;
export { TOKEN_KEY };
