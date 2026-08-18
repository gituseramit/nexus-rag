import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyticsApi } from '../api/analytics';

export default function Analytics() {
  const { data: summary } = useQuery(['analytics'], analyticsApi.getSummary, { refetchInterval: 60000 });
  const { data: users } = useQuery(['users'], analyticsApi.getUsers);

  const tokenData = [
    { day: 'Mon', tokens: 4000 },
    { day: 'Tue', tokens: 3000 },
    { day: 'Wed', tokens: 2000 },
    { day: 'Thu', tokens: 2780 },
    { day: 'Fri', tokens: 1890 },
    { day: 'Sat', tokens: 2390 },
    { day: 'Sun', tokens: 3490 },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto custom-scrollbar flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold font-geist text-[#dae2fd]">System Analytics</h2>
          <p className="text-sm text-[#c2c6d6] mt-1">Resource utilization and performance metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[#adc6ff]">memory</span>
            <span className="text-[11px] font-medium text-[#c2c6d6] uppercase tracking-wider">LLM Tokens (30d)</span>
          </div>
          <h3 className="text-3xl font-bold text-[#dae2fd] mb-2">2.4M</h3>
          <div className="w-full bg-[#293042] rounded-full h-1.5 mb-1 overflow-hidden">
            <div className="bg-gradient-to-r from-[#adc6ff] to-[#8b5cf6] h-full" style={{ width: '45%' }}></div>
          </div>
          <p className="text-[10px] text-[#8e919f] text-right">45% of quota</p>
        </div>

        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[#c0c1ff]">dataset</span>
            <span className="text-[11px] font-medium text-[#c2c6d6] uppercase tracking-wider">PgVector Index</span>
          </div>
          <h3 className="text-3xl font-bold text-[#dae2fd] mb-1">14.2 GB</h3>
          <p className="text-xs text-[#89ceff] flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px]">arrow_upward</span> +0.4 GB this week
          </p>
        </div>

        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[#89ceff]">speed</span>
            <span className="text-[11px] font-medium text-[#c2c6d6] uppercase tracking-wider">P95 Retrieval</span>
          </div>
          <h3 className="text-3xl font-bold text-[#dae2fd] mb-1 flex items-center gap-3">
            184ms
            <span className="w-2 h-2 rounded-full bg-[#adc6ff] shadow-[0_0_8px_rgba(173,198,255,0.8)] inline-block" />
          </h3>
          <p className="text-xs text-[#8e919f]">Optimal performance</p>
        </div>

        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <span className="material-symbols-outlined text-[#ffb4ab]">warning</span>
            <span className="text-[11px] font-medium text-[#c2c6d6] uppercase tracking-wider">System Errors</span>
          </div>
          <h3 className="text-3xl font-bold text-[#dae2fd] mb-1">12</h3>
          <p className="text-xs text-[#adc6ff] flex items-center gap-1 font-medium">
            <span className="material-symbols-outlined text-[14px]">trending_down</span> -4 from last week
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
        <div className="lg:col-span-2 bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-5 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#dae2fd]">Token Consumption</h3>
            <div className="flex bg-[#131b2e] rounded-lg p-1 border border-[#424754]">
              <button className="px-3 py-1 text-[11px] font-medium rounded-md bg-[#293042] text-[#dae2fd]">7D</button>
              <button className="px-3 py-1 text-[11px] font-medium rounded-md text-[#8e919f] hover:text-[#dae2fd]">30D</button>
              <button className="px-3 py-1 text-[11px] font-medium rounded-md text-[#8e919f] hover:text-[#dae2fd]">90D</button>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tokenData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#293042" vertical={false} />
                <XAxis dataKey="day" stroke="#8e919f" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8e919f" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#293042' }} contentStyle={{ backgroundColor: '#1a2133', borderColor: '#424754', borderRadius: '8px' }} />
                <Bar dataKey="tokens" fill="url(#colorTokens)" radius={[4, 4, 0, 0]} />
                <defs>
                  <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#adc6ff" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl flex flex-col shadow-lg overflow-hidden">
          <div className="p-4 border-b border-[#424754] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#89ceff] pulse-dot inline-block" />
            <h3 className="text-sm font-bold text-[#dae2fd]">Live API Stream</h3>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#0b1326] p-4 font-mono text-[11px] space-y-2">
            <div className="flex gap-4 items-start text-[#c2c6d6]">
              <span className="text-[#8e919f] shrink-0">10:42:01</span>
              <span className="text-[#89ceff] shrink-0">POST /api/chat</span>
              <span className="truncate flex-1">User(admin)</span>
              <span className="text-[#adc6ff] shrink-0">200 OK</span>
              <span className="text-[#8e919f] shrink-0">842ms</span>
            </div>
            <div className="flex gap-4 items-start text-[#c2c6d6]">
              <span className="text-[#8e919f] shrink-0">10:41:15</span>
              <span className="text-[#8b5cf6] shrink-0">POST /api/docs</span>
              <span className="truncate flex-1">User(jsmith)</span>
              <span className="text-[#adc6ff] shrink-0">200 OK</span>
              <span className="text-[#8e919f] shrink-0">1.2s</span>
            </div>
            <div className="flex gap-4 items-start text-[#c2c6d6]">
              <span className="text-[#8e919f] shrink-0">10:40:05</span>
              <span className="text-[#89ceff] shrink-0">GET /api/user</span>
              <span className="truncate flex-1">User(anon)</span>
              <span className="text-[#ffb4ab] shrink-0">401 ERR</span>
              <span className="text-[#8e919f] shrink-0">12ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl shadow-lg flex-1 overflow-hidden flex flex-col min-h-[300px]">
        <div className="p-5 border-b border-[#424754] flex justify-between items-center">
          <h3 className="text-sm font-bold text-[#dae2fd]">User Access Management</h3>
          <div className="flex gap-3">
            <select className="bg-[#131b2e] border border-[#424754] text-[#c2c6d6] text-sm rounded-lg px-3 py-1.5 outline-none focus:border-[#adc6ff]">
              <option>All Roles</option>
              <option>Admin</option>
              <option>User</option>
            </select>
            <button className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] text-sm font-bold shadow-[0_0_10px_rgba(173,198,255,0.2)]">
              Invite User
            </button>
          </div>
        </div>
        <div className="overflow-x-auto w-full flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#131b2e] text-[#8e919f] font-medium text-[11px] uppercase tracking-wider sticky top-0">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 w-48">Storage Quota</th>
                <th className="px-5 py-3">Last Active</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#424754]">
              {/* Mock data for visuals */}
              <tr className="hover:bg-[#293042]/50 transition-colors">
                <td className="px-5 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center text-[#0b1326] font-bold text-xs">
                    A
                  </div>
                  <div>
                    <p className="text-[#dae2fd] font-medium">Admin User</p>
                    <p className="text-[11px] text-[#8e919f]">admin@nexus.io</p>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-1 rounded-full bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] text-[11px] font-medium">Admin</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 text-[#c2c6d6] text-xs">
                    <span className="w-2 h-2 rounded-full bg-[#adc6ff]" /> Active
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="w-full bg-[#293042] rounded-full h-1.5 mb-1 overflow-hidden">
                    <div className="bg-[#adc6ff] h-full" style={{ width: '12%' }}></div>
                  </div>
                  <p className="text-[10px] text-[#8e919f]">1.2 GB / 10 GB</p>
                </td>
                <td className="px-5 py-4 text-[#c2c6d6] text-xs">Just now</td>
                <td className="px-5 py-4 text-right">
                  <button className="p-1.5 text-[#8e919f] hover:text-[#dae2fd] rounded-md hover:bg-[#293042] transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
