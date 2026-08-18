import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { to: '/', icon: 'dashboard', label: 'Dashboard', end: true },
  { to: '/documents', icon: 'description', label: 'Documents', end: false },
  { to: '/chat', icon: 'chat', label: 'Chat', end: false },
  { to: '/analytics', icon: 'analytics', label: 'Analytics', end: false },
  { to: '/admin', icon: 'settings', label: 'Admin', end: false },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="hidden md:flex flex-col w-[280px] sticky top-0 h-screen bg-[#131b2e] border-r border-[#424754]">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30">
            <span className="material-symbols-outlined text-primary text-xl">hub</span>
          </div>
          <div>
            <h1 className="text-lg font-bold font-geist text-[#dae2fd]">Nexus RAG</h1>
            <p className="text-[11px] text-tertiary uppercase tracking-wider font-semibold">Enterprise Engine</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/chat')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] font-semibold transition-transform hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(173,198,255,0.2)]"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          New Chat
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'text-[#adc6ff] font-bold border-r-2 border-[#adc6ff] bg-white/10'
                  : 'text-[#c2c6d6] hover:bg-white/5 hover:text-[#dae2fd]'
              }`
            }
          >
            <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto border-t border-[#424754]">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center text-[#0b1326] font-bold">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#dae2fd] truncate">{user?.name || 'User'}</p>
            <p className="text-[11px] text-[#c2c6d6] truncate">{user?.email || 'user@nexus.io'}</p>
          </div>
          <button onClick={handleLogout} className="p-2 text-[#c2c6d6] hover:text-[#ffb4ab] hover:bg-[#93000a]/20 rounded-lg transition-colors">
            <span className="material-symbols-outlined text-[20px]">logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}
