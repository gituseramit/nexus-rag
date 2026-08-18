import apiClient from './client';
import type { User } from '../types';

interface LoginRequest { email: string; password: string; }
interface RegisterRequest { email: string; password: string; full_name?: string; }
interface TokenResponse { access_token: string; token_type: string; user: User; }

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/register', data);
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },
};
