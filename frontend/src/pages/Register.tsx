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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1326] p-4 text-[#dae2fd]">
      <div className="w-full max-w-md bg-[#1a2133]/40 backdrop-blur-xl border border-white/5 rounded-xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center border border-primary/30 mb-4">
            <span className="material-symbols-outlined text-[#adc6ff] text-3xl">hub</span>
          </div>
          <h1 className="text-2xl font-bold font-geist text-[#dae2fd]">Nexus RAG</h1>
          <p className="text-sm text-[#89ceff] uppercase tracking-wider font-semibold mt-1">Enterprise Engine</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#c2c6d6] mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#424754] rounded-lg px-4 py-2.5 text-[#dae2fd] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c2c6d6] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#424754] rounded-lg px-4 py-2.5 text-[#dae2fd] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c2c6d6] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#424754] rounded-lg px-4 py-2.5 text-[#dae2fd] focus:outline-none focus:border-[#adc6ff] focus:ring-1 focus:ring-[#adc6ff] transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-[#adc6ff] to-[#c0c1ff] text-[#0b1326] font-bold mt-6 hover:shadow-[0_0_20px_rgba(173,198,255,0.3)] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#c2c6d6]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#adc6ff] hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
