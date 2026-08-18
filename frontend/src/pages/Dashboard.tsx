import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../api/analytics';
import { documentsApi } from '../api/documents';
import MetricCard from '../components/ui/MetricCard';

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatNumber(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toString();
}

function formatRelativeTime(dateStr: string) {
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return rtf.format(-hrs, 'hour');
  return rtf.format(-Math.floor(hrs / 24), 'day');
}

export default function Dashboard() {
  const { data: summary } = useQuery(['analytics'], analyticsApi.getSummary, { refetchInterval: 30000 });
  const { data: activity } = useQuery(['activity'], analyticsApi.getActivity, { refetchInterval: 30000 });
  const { data: activeDocs } = useQuery(['documents', 'processing'], () => documentsApi.list({ status: 'processing' }), { refetchInterval: 5000 });

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold font-geist text-[#dae2fd]">System Overview</h2>
          <p className="text-sm text-[#c2c6d6]">Real-time metrics and RAG pipeline status.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-lg bg-[#293042] text-[#dae2fd] text-sm font-medium hover:bg-[#343b4f] transition-colors">
            Last 7 Days
          </button>
          <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] text-sm font-bold shadow-[0_0_10px_rgba(173,198,255,0.2)] hover:scale-105 transition-transform">
            Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          icon="description"
          iconBg="bg-[#adc6ff]/10"
          iconColor="text-[#adc6ff]"
          label="Total Documents"
          value={formatNumber(summary?.total_documents || 0)}
          trend="12%" trendUp={true}
        />
        <MetricCard
          icon="forum"
          iconBg="bg-[#c0c1ff]/10"
          iconColor="text-[#c0c1ff]"
          label="Conversations"
          value={formatNumber(summary?.total_conversations || 0)}
          trend="5%" trendUp={true}
        />
        <MetricCard
          icon="help_center"
          iconBg="bg-[#89ceff]/10"
          iconColor="text-[#89ceff]"
          label="Total Questions"
          value={formatNumber(summary?.total_queries || 0)}
          trend="2%" trendUp={false}
        />
        <MetricCard
          icon="storage"
          iconBg="bg-[#8b5cf6]/10"
          iconColor="text-[#8b5cf6]"
          label="Storage Used"
          value={formatBytes(summary?.storage_used_bytes || 0)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg flex flex-col min-h-[300px]">
          <h3 className="text-sm font-bold text-[#dae2fd] mb-4">Query Volume (7 Days)</h3>
          <div className="flex-1 w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.query_volume_7d || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#293042" vertical={false} />
                <XAxis dataKey="day" stroke="#8e919f" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8e919f" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#293042' }} contentStyle={{ backgroundColor: '#1a2133', borderColor: '#424754', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="rgba(77, 142, 255, 0.8)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg flex flex-col h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#dae2fd] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6] pulse-dot inline-block" />
              Active Ingestion
            </h3>
            <span className="text-[11px] font-medium bg-[#131b2e] px-2 py-1 rounded-full text-[#c2c6d6]">
              {activeDocs?.length || 0} Tasks
            </span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
            {activeDocs && activeDocs.length > 0 ? (
              activeDocs.map(doc => (
                <div key={doc.id} className="bg-[#131b2e] rounded-lg p-3 border border-[#424754]">
                  <p className="text-sm text-[#dae2fd] font-medium truncate mb-2">{doc.filename}</p>
                  <div className="flex items-center justify-between text-[11px] text-[#c2c6d6] mb-1">
                    <span className="capitalize">{doc.status}</span>
                    <span>100%</span>
                  </div>
                  <div className="w-full bg-[#293042] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#adc6ff] to-[#8b5cf6] h-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex items-center justify-center text-sm text-[#8e919f]">No active tasks</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-lg overflow-hidden">
        <div className="p-5 border-b border-[#424754]">
          <h3 className="text-sm font-bold text-[#dae2fd]">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#131b2e] text-[#8e919f] font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Event / Query</th>
                <th className="px-5 py-3">Source Context</th>
                <th className="px-5 py-3">Status / Model</th>
                <th className="px-5 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#424754]">
              {activity?.map((act, i) => (
                <tr key={i} className="hover:bg-[#293042]/50 transition-colors">
                  <td className="px-5 py-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] text-[#c0c1ff]">
                      {act.type === 'query' ? 'chat' : 'upload'}
                    </span>
                    <span className="text-[#dae2fd] truncate max-w-[200px]">{act.description}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-2 py-1 bg-[#293042] text-[#c2c6d6] rounded-full text-[11px]">
                      {act.context || 'System'}
                    </span>
                  </td>
                  <td className="px-5 py-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#adc6ff] pulse-dot inline-block" />
                    <span className="text-[#c2c6d6]">{act.model || 'Nexus-1'}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-[#8e919f] text-[11px]">
                    {formatRelativeTime(act.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
