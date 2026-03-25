import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useTheme } from '../lib/useTheme';

const THEME_OPTIONS = [
  { value: 'dark',   icon: '🌙', label: 'Dark'   },
  { value: 'light',  icon: '☀️',  label: 'Light'  },
  { value: 'system', icon: '💻', label: 'System' },
];

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, changeTheme } = useTheme();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const d = await res.json();
      if (res.ok) {
        router.push(d.role === 'admin' ? '/admin' : '/partner');
      } else {
        setError(d.error || 'Invalid password. Please try again.');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head><title>MixCall Dashboard — Login</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950 flex items-center justify-center p-4">

        {/* Theme switcher — top right */}
        <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-800/70 border border-slate-700/50 rounded-xl p-1">
          {THEME_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => changeTheme(opt.value)}
              title={opt.label}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                theme === opt.value
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <span>{opt.icon}</span>
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-violet-700 mb-4 shadow-2xl shadow-violet-500/40">
              <span className="text-4xl">📞</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">MixCall</h1>
            <p className="text-slate-400 mt-1 text-sm tracking-widest uppercase">Revenue Dashboard</p>
          </div>

          {/* Card */}
          <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-7 shadow-2xl border border-slate-700/50">
            <p className="text-slate-400 text-sm mb-5 text-center">Enter your password to continue</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 bg-slate-700/80 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-base"
                required
                autoFocus
              />
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading || !password}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-violet-500/20"
              >
                {loading ? 'Signing in…' : 'Enter Dashboard'}
              </button>
            </form>
            <p className="text-slate-600 text-xs text-center mt-5">Confidential • MixCall Rev Dashboard v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
