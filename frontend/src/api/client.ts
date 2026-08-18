import axios from 'axios';

// Always use /api — in development, Vite proxies to localhost:8000.
// In production, Vercel proxies /api/* → https://nexus-rag-backend-2lh3.onrender.com/api/*
// This means the browser NEVER talks to Render directly, so there's zero CORS.
export const API_BASE_URL = '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('nexus_token');
      localStorage.removeItem('nexus_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
