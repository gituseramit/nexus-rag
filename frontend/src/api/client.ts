import axios from 'axios';

// In production, use VITE_API_URL or default to the deployed Render backend.
// In development, the Vite proxy forwards /api → localhost:8000.
const rawApiUrl = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://nexus-rag-backend-2lh3.onrender.com' : '');
export const API_BASE_URL = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, '')}/api`
  : '/api';

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
