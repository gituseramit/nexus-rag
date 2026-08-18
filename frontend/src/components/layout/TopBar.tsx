import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 h-[56px] bg-[#1a2133]/40 backdrop-blur-xl border-b border-[#424754] px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button className="md:hidden p-2 text-[#c2c6d6] hover:bg-white/20 rounded-full transition-all scale-95 active:scale-90">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h1 className="md:hidden text-lg font-bold font-geist text-[#dae2fd]">Nexus RAG</h1>
      </div>

      <div className="hidden md:flex flex-1 max-w-xl mx-4">
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#c2c6d6] text-[20px]">search</span>
          <input 
            type="text" 
            placeholder="Search documents, chats, metrics..." 
            className="w-full bg-[#293042] text-[#dae2fd] placeholder-[#8e919f] rounded-full py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#adc6ff]/50 border border-transparent focus:border-[#adc6ff]/30 transition-all text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button 
          onClick={() => navigate('/documents')}
          className="p-2 text-[#c2c6d6] hover:text-[#adc6ff] hover:bg-white/20 rounded-full transition-all scale-95 active:scale-90 relative"
          title="Upload Document"
        >
          <span className="material-symbols-outlined text-[22px]">upload</span>
        </button>
        <button 
          className="p-2 text-[#c2c6d6] hover:bg-white/20 rounded-full transition-all scale-95 active:scale-90 relative"
        >
          <span className="material-symbols-outlined text-[22px]">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#89ceff] rounded-full border border-[#1a2133]"></span>
        </button>
        <button 
          className="p-2 text-[#c2c6d6] hover:bg-white/20 rounded-full transition-all scale-95 active:scale-90"
        >
          <span className="material-symbols-outlined text-[24px]">account_circle</span>
        </button>
      </div>
    </header>
  );
}
