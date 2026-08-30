import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../store/authStore';
import { Bot, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState('operator@company.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#131B29] border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
            <Bot className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Welcome back to Agentflow_AI</h2>
          <p className="text-xs text-slate-400">Sign in to your operator console</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0B0F17] border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                placeholder="operator@company.com"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0B0F17] border border-slate-700 focus:border-indigo-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-200 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
