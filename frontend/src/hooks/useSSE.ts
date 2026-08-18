import { useEffect, useRef, useCallback } from 'react';

export function useDocumentSSE(
  docId: string | null,
  onUpdate: (data: { status: string; progress: number; message?: string }) => void
) {
  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    if (!docId) return;
    const token = localStorage.getItem('nexus_token');
    const url = `/api/documents/${docId}/status${token ? `?token=${token}` : ''}`;
    const es = new EventSource(url);
    esRef.current = es;
    es.onmessage = (e) => {
      try { onUpdate(JSON.parse(e.data)); } catch {}
    };
    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, [docId]);
}

export function useStreamingChat() {
  const abortRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    requestBody: object,
    onToken: (token: string) => void,
    onSources: (sources: unknown[]) => void,
    onDone: (tokensUsed?: number) => void,
    onError: (err: string) => void
  ) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const token = localStorage.getItem('nexus_token');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(requestBody),
        signal: ctrl.signal,
      });
      if (!res.ok) { onError('Failed to connect'); return; }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const evt = JSON.parse(line.slice(6));
            if (evt.type === 'token') onToken(evt.content);
            else if (evt.type === 'sources') onSources(evt.sources);
            else if (evt.type === 'done') onDone(evt.tokens_used);
            else if (evt.type === 'error') onError(evt.message);
          } catch {}
        }
      }
    } catch (e: unknown) {
      if ((e as Error).name !== 'AbortError') onError('Stream interrupted');
    }
  }, []);

  const abort = useCallback(() => abortRef.current?.abort(), []);
  return { stream, abort };
}
