import axios from 'axios';

// Create axios instance
const axiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  timeout: 60000,
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Track retry count per request
    config._retryCount = config._retryCount || 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Do not retry if:
    // - request was intentionally aborted (user cancelled / component unmounted)
    // - it's a 4xx client error (except 429 Too Many Requests which may be transient)
    // - max retries already reached
    const isAborted = error.code === 'ERR_CANCELED' || error.name === 'AbortError';
    const isClientError =
      error.response &&
      error.response.status >= 400 &&
      error.response.status < 500 &&
      error.response.status !== 429;
    const MAX_RETRIES = 2;

    if (!isAborted && !isClientError && config && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      // Exponential backoff: 1s, then 2s
      await new Promise(resolve => setTimeout(resolve, 1000 * config._retryCount));
      return axiosInstance(config);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;