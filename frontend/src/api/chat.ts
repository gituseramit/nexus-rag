import apiClient from './client';
import type { Conversation, ConversationDetail, ChatRequest } from '../types';

export const chatApi = {
  listConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get<Conversation[]>('/conversations');
    return res.data;
  },

  createConversation: async (title?: string): Promise<Conversation> => {
    const res = await apiClient.post<Conversation>('/conversations', { title });
    return res.data;
  },

  getConversation: async (id: string): Promise<ConversationDetail> => {
    const res = await apiClient.get<ConversationDetail>(`/conversations/${id}`);
    return res.data;
  },

  deleteConversation: async (id: string): Promise<void> => {
    await apiClient.delete(`/conversations/${id}`);
  },

  renameConversation: async (id: string, title: string): Promise<Conversation> => {
    const res = await apiClient.patch<Conversation>(`/conversations/${id}`, { title });
    return res.data;
  },

  // Returns a ReadableStream of SSE events
  chat: async (data: ChatRequest): Promise<Response> => {
    const token = localStorage.getItem('nexus_token');
    const apiBase = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : '/api';
    return fetch(`${apiBase}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });
  },
};
