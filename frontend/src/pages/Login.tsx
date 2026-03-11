import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart2, Eye, EyeOff, X } from 'lucide-react';
import { MascotSVG } from '../components/mascot/Mascot';

export default function Login() {
  const { login, isLoading, error, clearError } = useAuth();
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)' }}
    >
      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full opacity-10 bg-white" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        {/* Logo + mascot */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">StockSim</h1>
          <p className="text-white/60 mt-1 text-sm">Learn stock trading with virtual money</p>
          <div className="flex justify-center mt-4">
            <MascotSVG mood="happy" size={72} animate />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8 shadow-card-lg"
          style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)' }}
        >
          <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Welcome back</h2>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              <span className="flex-1">{error}</span>
              <button onClick={clearError}><X className="w-4 h-4 mt-0.5" /></button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" style={{ color: '#374151' }}>Email</label>
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all placeholder-gray-400"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="label" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all placeholder-gray-400"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-brand-gradient transition-all active:scale-98 disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            No account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-5">
          Educational platform only — no real money involved.
        </p>
      </div>
    </div>
  );
}
