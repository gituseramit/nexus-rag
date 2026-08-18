import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApi } from '../api/documents';
import StatusBadge from '../components/ui/StatusBadge';
import { useDocumentSSE } from '../hooks/useSSE';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

const FILE_ICONS: Record<string, { icon: string, color: string }> = {
  pdf: { icon: 'picture_as_pdf', color: 'text-[#adc6ff]' },
  docx: { icon: 'article', color: 'text-[#c0c1ff]' },
  txt: { icon: 'description', color: 'text-[#c2c6d6]' },
  md: { icon: 'description', color: 'text-[#c2c6d6]' },
  csv: { icon: 'table_chart', color: 'text-[#89ceff]' },
};

export default function Documents() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ type: '', status: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery(
    ['documents', page, filters], 
    () => documentsApi.list({ page, ...filters }), 
    { refetchInterval: 5000 }
  );

  const deleteMutation = useMutation((ids: string[]) => Promise.all(ids.map(id => documentsApi.delete(id))), {
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      setSelected([]);
    }
  });

  const uploadMutation = useMutation((file: File) => documentsApi.upload(file), {
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
    }
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files[0]);
    }
  }, [uploadMutation]);

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const docs = data?.items || [];

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-geist text-[#dae2fd]">Document Management</h1>
        <p className="text-sm text-[#c2c6d6] mt-1">Upload and manage knowledge base files for the RAG engine.</p>
      </div>

      <div 
        className="w-full border-dashed border-2 border-[#424754] hover:border-[#adc6ff] rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors mb-6 cursor-pointer bg-[#1a2133]/20"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-symbols-outlined text-4xl text-[#adc6ff] mb-3">cloud_upload</span>
        <p className="text-[#dae2fd] font-medium">Drag and drop files here</p>
        <p className="text-[#8e919f] text-sm mt-1 mb-4">Support for PDF, TXT, DOCX, CSV, MD. Max 50MB.</p>
        <button className="px-4 py-2 bg-[#293042] text-[#dae2fd] rounded-lg text-sm font-medium hover:bg-[#343b4f] transition-colors">
          Browse Files
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files[0])} 
        />
        {uploadMutation.isLoading && <p className="mt-4 text-[#adc6ff] text-sm animate-pulse">Uploading...</p>}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3">
          <select className="bg-[#131b2e] border border-[#424754] text-[#c2c6d6] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#adc6ff]">
            <option value="">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
          </select>
          <select className="bg-[#131b2e] border border-[#424754] text-[#c2c6d6] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#adc6ff]">
            <option value="">All Statuses</option>
            <option value="ready">Ready</option>
            <option value="processing">Processing</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-[#8e919f]">{selected.length} selected</span>
          <button 
            disabled={selected.length === 0}
            onClick={() => deleteMutation.mutate(selected)}
            className="px-3 py-1.5 rounded-lg bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/30 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Bulk Delete
          </button>
        </div>
      </div>

      <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-lg flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#131b2e] text-[#8e919f] font-medium text-[11px] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded bg-[#293042] border-[#424754] text-[#adc6ff]"
                    checked={selected.length > 0 && selected.length === docs.length}
                    onChange={(e) => setSelected(e.target.checked ? docs.map(d => d.id) : [])}
                  />
                </th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Size</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Date Uploaded</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#424754]">
              {docs.map((doc) => {
                const ext = doc.filename.split('.').pop()?.toLowerCase() || '';
                const iconCfg = FILE_ICONS[ext] || FILE_ICONS.txt;
                return (
                  <tr key={doc.id} className="hover:bg-[#293042]/50 transition-colors group">
                    <td className="px-5 py-4">
                      <input 
                        type="checkbox" 
                        className="rounded bg-[#293042] border-[#424754] text-[#adc6ff]"
                        checked={selected.includes(doc.id)}
                        onChange={() => toggleSelect(doc.id)}
                      />
                    </td>
                    <td className="px-5 py-4 flex items-center gap-3">
                      <span className={`material-symbols-outlined text-[20px] ${iconCfg.color}`}>{iconCfg.icon}</span>
                      <span className="text-[#dae2fd] font-medium truncate max-w-[250px]">{doc.filename}</span>
                    </td>
                    <td className="px-5 py-4 text-[#c2c6d6]">{formatBytes(doc.size_bytes)}</td>
                    <td className="px-5 py-4 text-[#c2c6d6] uppercase">{ext}</td>
                    <td className="px-5 py-4 text-[#c2c6d6]">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-[#c2c6d6] hover:text-[#adc6ff] rounded-md hover:bg-[#293042] transition-colors"><span className="material-symbols-outlined text-[18px]">download</span></button>
                        <button className="p-1.5 text-[#c2c6d6] hover:text-[#89ceff] rounded-md hover:bg-[#293042] transition-colors"><span className="material-symbols-outlined text-[18px]">info</span></button>
                        <button 
                          onClick={() => deleteMutation.mutate([doc.id])}
                          className="p-1.5 text-[#c2c6d6] hover:text-[#ffb4ab] rounded-md hover:bg-[#93000a]/20 transition-colors"
                        ><span className="material-symbols-outlined text-[18px]">delete</span></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-[#424754] flex items-center justify-between text-sm text-[#8e919f]">
          <span>Showing {docs.length} results</span>
          <div className="flex gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1 rounded hover:bg-[#293042] disabled:opacity-50"
            ><span className="material-symbols-outlined text-[20px]">chevron_left</span></button>
            <button 
              onClick={() => setPage(p => p + 1)}
              className="p-1 rounded hover:bg-[#293042]"
            ><span className="material-symbols-outlined text-[20px]">chevron_right</span></button>
          </div>
        </div>
      </div>
    </div>
  );
}
