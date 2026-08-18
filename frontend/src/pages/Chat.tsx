import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatApi } from '../api/chat';
import { useStreamingChat } from '../hooks/useSSE';
import type { Conversation, Message, SourceCitation } from '../types';

export default function Chat() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sources, setSources] = useState<SourceCitation[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery(['conversations'], chatApi.listConversations);
  const { data: conversation } = useQuery(
    ['conversation', selectedId], 
    () => selectedId ? chatApi.getConversation(selectedId) : Promise.resolve(null),
    { enabled: !!selectedId }
  );

  const { stream, abort } = useStreamingChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setIsStreaming(true);
    setStreamingContent('');
    setSources([]);

    // Optimistically update UI if we want, but letting SSE drive is easier for simplified version
    await stream(
      { message: text, conversation_id: selectedId },
      (token) => setStreamingContent(prev => prev + token),
      (srcs) => setSources(srcs as SourceCitation[]),
      () => {
        setIsStreaming(false);
        if (selectedId) queryClient.invalidateQueries(['conversation', selectedId]);
        queryClient.invalidateQueries(['conversations']);
      },
      (err) => {
        setIsStreaming(false);
        console.error(err);
      }
    );
  };

  const messages = conversation?.messages || [];

  return (
    <div className="flex h-full overflow-hidden bg-[#0b1326]">
      {/* LEFT SIDEBAR */}
      <div className="w-[240px] bg-[#111827] border-r border-[#424754] flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-[#424754]">
          <h3 className="text-xs font-bold text-[#8e919f] uppercase tracking-wider">Conversations</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {conversations?.map((conv) => (
            <div 
              key={conv.id}
              onClick={() => setSelectedId(conv.id)}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedId === conv.id 
                  ? 'bg-[#c0c1ff]/20 border border-[#c0c1ff]/20 text-[#dae2fd]' 
                  : 'hover:bg-[#293042]/50 text-[#c2c6d6]'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span className="truncate text-sm font-medium flex-1">{conv.title || 'New Chat'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CENTER CHAT */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[56px] border-b border-[#424754] flex items-center justify-between px-6 bg-[#1a2133]/40 backdrop-blur-xl">
          <h2 className="font-bold text-[#dae2fd]">{conversation?.title || 'New Conversation'}</h2>
          <select className="bg-[#131b2e] border border-[#424754] text-[#c2c6d6] text-xs rounded-lg px-2 py-1 outline-none">
            <option>Nexus-1 (Default)</option>
            <option>Nexus-Fast</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
          {messages.length === 0 && !isStreaming ? (
            <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#adc6ff]/20 to-[#c0c1ff]/10 flex items-center justify-center border border-[#adc6ff]/20 mb-6 shadow-[0_0_30px_rgba(173,198,255,0.1)]">
                <span className="material-symbols-outlined text-[32px] text-[#adc6ff]">forum</span>
              </div>
              <h2 className="text-2xl font-bold text-[#dae2fd] mb-3 font-geist">How can I help you today?</h2>
              <p className="text-[#8e919f] mb-8">Ask a question about your documents, or pick a suggestion below to get started.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {[
                  "Summarize the latest document I uploaded",
                  "What are the key takeaways from the Q3 report?",
                  "Find references to 'machine learning' in my files",
                  "Explain the architecture diagram in simple terms"
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    onClick={() => { setInput(suggestion); handleSend(); }}
                    className="p-4 rounded-xl border border-[#424754] bg-[#1a2133]/40 text-left hover:border-[#adc6ff]/50 hover:bg-[#adc6ff]/5 transition-all group"
                  >
                    <p className="text-[#c2c6d6] text-sm group-hover:text-[#dae2fd]">{suggestion}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id || i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl p-4 relative group ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-br from-[#adc6ff]/20 to-[#adc6ff]/10 border border-[#adc6ff]/20 text-[#dae2fd] rounded-tr-sm' 
                    : 'bg-[#1a2133]/60 backdrop-blur-md border border-white/5 text-[#dae2fd] rounded-tl-sm shadow-lg'
                }`}>
                  {msg.role === 'assistant' && (
                    <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center border-2 border-[#0b1326]">
                      <span className="material-symbols-outlined text-[16px] text-[#0b1326]">smart_toy</span>
                    </div>
                  )}
                  <div className="prose prose-invert prose-sm max-w-none font-inter text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}

          {isStreaming && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl p-4 relative bg-[#1a2133]/60 backdrop-blur-md border border-white/5 text-[#dae2fd] rounded-tl-sm shadow-lg">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center border-2 border-[#0b1326]">
                  <span className="material-symbols-outlined text-[16px] text-[#0b1326]">smart_toy</span>
                </div>
                {!streamingContent ? (
                  <div className="flex items-center gap-2 text-[#8e919f] text-sm">
                    <span className="w-2 h-2 rounded-full bg-[#89ceff] pulse-dot inline-block" />
                    Generating Response...
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none font-inter text-sm leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 pt-0 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1326] to-transparent pointer-events-none z-0" />
          <div className="relative z-10 bg-[#1a2133]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_0_30px_rgba(173,198,255,0.05)] focus-within:border-[#adc6ff]/50 focus-within:shadow-[0_0_30px_rgba(173,198,255,0.15)] transition-all">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask a question about your documents..."
              className="w-full bg-transparent text-[#dae2fd] placeholder-[#8e919f] p-4 outline-none resize-none min-h-[60px] max-h-[200px] text-sm custom-scrollbar"
              rows={1}
            />
            <div className="flex items-center justify-between p-2 pt-0">
              <div className="flex gap-1">
                <button className="p-2 text-[#8e919f] hover:text-[#dae2fd] rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">attach_file</span>
                </button>
                <button className="p-2 text-[#8e919f] hover:text-[#dae2fd] rounded-lg hover:bg-white/5 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">tune</span>
                </button>
              </div>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 shadow-[0_0_15px_rgba(173,198,255,0.3)]"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
              </button>
            </div>
          </div>
          <p className="text-center text-[10px] text-[#8e919f] mt-3 font-geist z-10 relative">
            Nexus RAG Engine v1.2 • AI responses may be inaccurate.
          </p>
        </div>
      </div>

      {/* RIGHT INSPECTOR */}
      <div className="w-[360px] bg-[#1a2133]/40 backdrop-blur-xl border-l border-[#424754] flex flex-col hidden xl:flex">
        <div className="h-[56px] border-b border-[#424754] flex items-center justify-between px-4">
          <div className="flex items-center gap-2 text-[#89ceff]">
            <span className="material-symbols-outlined text-[20px]">policy</span>
            <span className="font-bold text-sm tracking-wide">Inspector</span>
          </div>
          <button className="p-1.5 text-[#8e919f] hover:text-[#dae2fd] rounded-lg hover:bg-white/10 transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="flex border-b border-[#424754]">
          <button className="flex-1 py-3 text-sm font-medium text-[#89ceff] border-b-2 border-[#89ceff]">Details</button>
          <button className="flex-1 py-3 text-sm font-medium text-[#8e919f] hover:text-[#c2c6d6]">Meta</button>
          <button className="flex-1 py-3 text-sm font-medium text-[#8e919f] hover:text-[#c2c6d6]">Graph</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <h4 className="text-[11px] font-bold text-[#8e919f] uppercase tracking-wider mb-2">RAG Sources</h4>
          {sources.length === 0 ? (
            <div className="text-center text-[#8e919f] text-sm py-8">No sources loaded.</div>
          ) : (
            sources.map((src, i) => (
              <div key={i} className="bg-[#131b2e] rounded-lg border border-[#424754] p-4 relative group hover:border-[#89ceff]/50 transition-colors">
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-[#89ceff]/10 text-[#89ceff] border border-[#89ceff]/20">
                  {(src.score || 0).toFixed(2)}
                </div>
                <div className="flex items-center gap-2 mb-3 pr-10">
                  <span className="material-symbols-outlined text-[16px] text-[#adc6ff]">description</span>
                  <span className="text-sm font-semibold text-[#dae2fd] truncate">{src.document_name}</span>
                </div>
                <p className="text-[11px] text-[#8e919f] mb-2">Pg. {src.page || 1} • Chunk {i+1}</p>
                <div className="bg-[#0b1326] rounded p-2 border border-white/5">
                  <p className="text-[12px] font-mono text-[#c2c6d6] line-clamp-4 leading-relaxed">
                    {src.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-[#424754] bg-[#131b2e] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-[#c2c6d6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#adc6ff] pulse-dot" />
            Index Connected
          </div>
          <span className="text-[#8e919f]">84ms</span>
        </div>
      </div>
    </div>
  );
}
