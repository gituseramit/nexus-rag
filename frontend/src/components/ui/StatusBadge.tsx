import React from 'react';
import type { DocumentStatus } from '../../types';

const STATUS_CONFIG: Record<DocumentStatus, { label: string; dotClass: string; containerClass: string; textClass: string }> = {
  uploading: { label: 'Uploading', dotClass: 'bg-[#8b5cf6] pulse-dot', containerClass: 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30', textClass: 'text-[#8b5cf6]' },
  processing: { label: 'Processing', dotClass: 'bg-secondary animate-pulse', containerClass: 'bg-[#c0c1ff]/10 border-[#c0c1ff]/20', textClass: 'text-[#c0c1ff]' },
  extracting: { label: 'Extracting', dotClass: 'bg-secondary animate-pulse', containerClass: 'bg-[#c0c1ff]/10 border-[#c0c1ff]/20', textClass: 'text-[#c0c1ff]' },
  chunking: { label: 'Chunking', dotClass: 'bg-[#8b5cf6] pulse-dot', containerClass: 'bg-[#8b5cf6]/10 border-[#8b5cf6]/30', textClass: 'text-[#8b5cf6]' },
  embedding: { label: 'Embedding', dotClass: 'bg-tertiary animate-pulse', containerClass: 'bg-[#89ceff]/10 border-[#89ceff]/30', textClass: 'text-[#89ceff]' },
  ready: { label: 'Ready', dotClass: 'bg-primary shadow-[0_0_8px_rgba(173,198,255,0.6)]', containerClass: 'bg-[#adc6ff]/10 border-[#adc6ff]/20', textClass: 'text-[#adc6ff]' },
  failed: { label: 'Ingestion Error', dotClass: 'bg-[#ffb4ab]', containerClass: 'bg-[#93000a]/10 border-[#ffb4ab]/20', textClass: 'text-[#ffb4ab]' },
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.failed;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border font-medium text-[11px] ${cfg.containerClass} ${cfg.textClass}`}>
      <span className={`w-2 h-2 rounded-full inline-block ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}
