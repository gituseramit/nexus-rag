// TypeScript interfaces matching backend schemas

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: 'user' | 'admin';
  storage_used_bytes: number;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Documents
export type DocumentStatus =
  | 'uploading'
  | 'processing'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'ready'
  | 'failed';

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  status: DocumentStatus;
  error_message: string | null;
  total_chunks: number;
  doc_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  documents: Document[];
  total: number;
  page: number;
  page_size: number;
}

export interface DocumentStatusUpdate {
  status: DocumentStatus;
  progress: number | null;
  message: string | null;
}

// Chat
export interface SourceCitation {
  chunk_id: string;
  document_id: string;
  document_name: string;
  page_number: number | null;
  chunk_index: number;
  content: string;
  relevance_score: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: SourceCitation[];
  tokens_used: number | null;
  model_used: string | null;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface ChatRequest {
  conversation_id?: string;
  question: string;
  top_k?: number;
  document_ids?: string[];
}

// Streaming SSE events
export type SSEEvent =
  | { type: 'token'; content: string }
  | { type: 'sources'; sources: SourceCitation[] }
  | { type: 'done'; tokens_used?: number }
  | { type: 'error'; message: string };

// Analytics
export interface DailyQueryStat {
  date: string;
  query_count: number;
}

export interface AnalyticsSummary {
  total_documents: number;
  total_conversations: number;
  total_questions: number;
  storage_used_bytes: number;
  storage_limit_bytes: number;
  token_usage_30d: number;
  retrieval_latency_p95_ms: number;
  error_rate: number;
  query_volume_7d: DailyQueryStat[];
}

export interface ActivityItem {
  id: string;
  event_type: 'query' | 'upload' | 'error';
  description: string;
  sources: string[];
  status: string;
  model: string | null;
  created_at: string;
}

export interface ApiLogEntry {
  timestamp: string;
  endpoint: string;
  user_id: string;
  status_code: number;
  latency_ms: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  storage_used_bytes: number;
  is_active: boolean;
  created_at: string;
  last_active?: string;
  storage_quota_bytes: number;
}
