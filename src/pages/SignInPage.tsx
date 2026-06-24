import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignInPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function SignInPage({ onBack, onSuccess }: SignInPageProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-ink-950 px-5 pb-10 pt-[env(safe-area-inset-top)]">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-gold-400/5 blur-[100px]" />
      </div>

      {/* Back button */}
      <div className="relative z-10 flex items-center pt-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-[14px] text-ink-400 transition hover:bg-ink-800 hover:text-white"
          aria-label="Back to home"
        >
          <ArrowLeft size={18} />
          Back
        </button>
      </div>

      {/* Main card */}
      <div className="relative z-10 mx-auto mt-8 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="absolute inset-0 rounded-2xl bg-gold-400/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-gold-400/25 bg-gradient-to-br from-ink-800 to-ink-900 shadow-xl shadow-black/40">
              <svg width="44" height="44" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M256 90 L402 170 V312 C402 386 336 430 256 446 C176 430 110 386 110 312 V170 Z"
                  stroke="#d4af37"
                  strokeWidth="14"
                  strokeLinejoin="round"
                />
                <path
                  d="M220 310 V234 C220 212 236 196 256 196 C276 196 292 212 292 234 V310"
                  stroke="#d4af37"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                <circle cx="256" cy="170" r="18" fill="#d4af37" />
              </svg>
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-[14px] text-ink-400">
            Sign in to your BH Connect account
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-ink-700/80 bg-ink-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="you@believershouse.church"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3.5 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3.5 pr-12 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-[15px] font-bold text-black shadow-lg shadow-gold-500/20 transition hover:from-gold-300 hover:to-gold-400 disabled:opacity-60"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-[12px] leading-relaxed text-ink-600">
          BH Connect is for Believers House members &amp; leadership only.
          <br />
          Visit{' '}
          <a
            href="https://www.believershouse.church"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-500 underline underline-offset-2 transition hover:text-ink-300"
          >
            believershouse.church
          </a>{' '}
          to learn more about us.
        </p>
      </div>
    </div>
  );
}
