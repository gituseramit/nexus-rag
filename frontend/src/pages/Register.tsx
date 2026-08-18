import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((state) => state.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to register. Please try again.';
      setError(typeof msg === 'string' ? msg : 'Validation error. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0b1326] text-[#dae2fd] font-inter">
      {/* LEFT SIDE - Brand & Graphic (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-gradient-to-br from-[#060e20] to-[#131b2e] border-r border-[#424754]">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-[#adc6ff]/5 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-[#8b5cf6]/10 blur-[100px]" />
        </div>
        
        <div className="relative z-10 p-12 flex flex-col h-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center border-2 border-[#0b1326] shadow-[0_0_20px_rgba(173,198,255,0.3)]">
              <span className="material-symbols-outlined text-[#0b1326] text-3xl">hub</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold font-geist tracking-tight">Nexus RAG</h1>
              <p className="text-xs text-[#89ceff] uppercase tracking-widest font-bold">Enterprise Engine</p>
            </div>
          </div>
          
          <div className="mt-auto mb-20 max-w-lg">
            <h2 className="text-4xl font-geist font-bold mb-6 leading-tight">
              Start building with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#adc6ff] to-[#8b5cf6]">
                Enterprise RAG
              </span>
            </h2>
            <p className="text-[#c2c6d6] text-lg leading-relaxed mb-8">
              Index documents, set up hybrid vector search, and query your knowledge base in seconds with zero configuration.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-[#1a2133]/60 backdrop-blur border border-white/5 px-4 py-2 rounded-lg text-sm text-[#8e919f]">
                <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">verified_user</span>
                SOC2 Compliant Ready
              </div>
              <div className="flex items-center gap-2 bg-[#1a2133]/60 backdrop-blur border border-white/5 px-4 py-2 rounded-lg text-sm text-[#8e919f]">
                <span className="material-symbols-outlined text-[#adc6ff] text-[18px]">auto_awesome</span>
                Hybrid Reranking
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Register Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex flex-col items-center mb-10">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#adc6ff] to-[#89ceff] flex items-center justify-center border-2 border-[#0b1326] shadow-[0_0_20px_rgba(173,198,255,0.3)] mb-4">
              <span className="material-symbols-outlined text-[#0b1326] text-3xl">hub</span>
            </div>
            <h1 className="text-2xl font-bold font-geist">Nexus RAG</h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold font-geist mb-2">Create an account</h2>
            <p className="text-[#8e919f]">Get started with your intelligent RAG workspace.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-start gap-3">
              <span className="material-symbols-outlined text-[#ffb4ab] text-[20px]">error</span>
              <p className="text-[#ffb4ab] text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[#dae2fd] mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8e919f] text-[20px]">
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Mercer"
                  className="w-full bg-[#131b2e] border border-[#424754] rounded-xl pl-11 pr-4 py-3.5 text-[#dae2fd] placeholder-[#8e919f] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#dae2fd] mb-2">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8e919f] text-[20px]">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@nexus.io"
                  className="w-full bg-[#131b2e] border border-[#424754] rounded-xl pl-11 pr-4 py-3.5 text-[#dae2fd] placeholder-[#8e919f] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[#dae2fd] mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#8e919f] text-[20px]">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#131b2e] border border-[#424754] rounded-xl pl-11 pr-4 py-3.5 text-[#dae2fd] placeholder-[#8e919f] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] font-bold text-lg mt-8 hover:shadow-[0_0_25px_rgba(173,198,255,0.4)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 rounded-full border-2 border-[#0b1326]/30 border-t-[#0b1326] animate-spin" />
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-[#8e919f]">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-[#adc6ff] hover:text-[#89ceff] hover:underline font-bold transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}