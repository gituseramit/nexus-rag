import apiClient from './client';
import type { AnalyticsSummary, ActivityItem, UserWithStats } from '../types';

export const analyticsApi = {
  getSummary: async (): Promise<AnalyticsSummary> => {
    const res = await apiClient.get<AnalyticsSummary>('/analytics');
    return res.data;
  },

  getActivity: async (): Promise<ActivityItem[]> => {
    const res = await apiClient.get<ActivityItem[]>('/analytics/activity');
    return res.data;
  },

  getUsers: async (): Promise<UserWithStats[]> => {
    const res = await apiClient.get<UserWithStats[]>('/analytics/users');
    return res.data;
  },
};
