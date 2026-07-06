/**
 * axiosClient.js
 *
 * Pre-configured Axios instance.
 * - Base URL from environment variable (falls back to live Render API)
 * - Auto-attach JWT from localStorage
 * - Global error interceptor with 401 redirect
 */

import axios from 'axios';

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://emotion-delivery-platform.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 seconds
});

// ── Request Interceptor — attach JWT ──────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('edp_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 ────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response.data, 
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 401) {
      // Clear stale credentials and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('edp_token');
        localStorage.removeItem('edp_user');
        document.cookie = 'edp_token=; path=/; max-age=0';
        window.location.href = '/login';
      }
    }

    return Promise.reject(new Error(message));
  }
);

export default axiosClient;