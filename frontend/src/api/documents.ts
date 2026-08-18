import apiClient from './client';
import type { Document, DocumentListResponse } from '../types';

export const documentsApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    file_type?: string;
  }): Promise<DocumentListResponse> => {
    const res = await apiClient.get<DocumentListResponse>('/documents', { params });
    return res.data;
  },

  upload: async (
    file: File,
    onProgress?: (pct: number) => void
  ): Promise<Document> => {
    const form = new FormData();
    form.append('file', file);
    const res = await apiClient.post<Document>('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
    return res.data;
  },

  get: async (id: string): Promise<Document> => {
    const res = await apiClient.get<Document>(`/documents/${id}`);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/documents/${id}`);
  },
};
