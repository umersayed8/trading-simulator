import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart2, Eye, EyeOff, X } from 'lucide-react';
import { MascotSVG } from '../components/mascot/Mascot';

export default function Register() {
  const { register, isLoading, error, clearError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', username: '', age: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { setValidationError('Passwords do not match'); return; }
    if (form.password.length < 6) { setValidationError('Password must be at least 6 characters'); return; }
    const age = parseInt(form.age);
    if (age < 13 || age > 100) { setValidationError('Age must be 13–100'); return; }
    if (form.username.length < 3) { setValidationError('Username must be at least 3 characters'); return; }
    await register(form.email, form.password, form.username, age);
  };

  const displayError = validationError || error;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f172a 100%)' }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 bg-white" />
        <div className="absolute bottom-0 -left-20 w-64 h-64 rounded-full opacity-10 bg-white" />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-up">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
              <BarChart2 className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <h1 className="text-3xl font-display font-bold text-white">StockSim</h1>
          <p className="text-white/60 mt-1 text-sm">Start your trading journey today</p>
          <div className="flex justify-center mt-3">
            <MascotSVG mood="excited" size={60} animate />
          </div>
        </div>

        <div
          className="rounded-3xl p-8 shadow-card-lg"
          style={{ background: 'rgba(255,255,255,0.97)' }}
        >
          <h2 className="text-xl font-display font-bold text-gray-900 mb-5">Create Account</h2>

          {displayError && (
            <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              <span className="flex-1">{displayError}</span>
              <button onClick={() => { clearError(); setValidationError(''); }}>
                <X className="w-4 h-4 mt-0.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {[
              { label: 'Username', name: 'username', type: 'text',   placeholder: 'trader_john', pattern: '^[a-zA-Z0-9_]+$' },
              { label: 'Email',    name: 'email',    type: 'email',  placeholder: 'you@example.com' },
              { label: 'Age',      name: 'age',      type: 'number', placeholder: '16' },
            ].map(f => (
              <div key={f.name}>
                <label className="label" style={{ color: '#374151' }}>{f.label}</label>
                <input
                  type={f.type} name={f.name} value={(form as any)[f.name]}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all placeholder-gray-400"
                  placeholder={f.placeholder}
                  pattern={(f as any).pattern}
                  min={f.name === 'age' ? '13' : undefined}
                  max={f.name === 'age' ? '100' : undefined}
                  required
                />
              </div>
            ))}

            <div>
              <label className="label" style={{ color: '#374151' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} name="password"
                  value={form.password} onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all placeholder-gray-400"
                  placeholder="At least 6 characters" minLength={6} required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label" style={{ color: '#374151' }}>Confirm Password</label>
              <input
                type="password" name="confirmPassword" value={form.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all placeholder-gray-400"
                placeholder="Confirm password" required
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-brand-gradient transition-all active:scale-98 disabled:opacity-60 mt-1"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-white/40 text-xs mt-4">
          Educational platform only — no real money or financial risk.
        </p>
      </div>
    </div>
  );
}
