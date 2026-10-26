import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SignUpPageProps {
  onBack: () => void;
  onSuccess: () => void;
  onSignIn: () => void;
}

export function SignUpPage({ onBack, onSuccess, onSignIn }: SignUpPageProps) {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await signUp(email, password, fullName);
      // Fire welcome email in the background — don't block the success screen
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: email.trim().toLowerCase(), full_name: fullName.trim() }),
        });
      } catch {
        // Welcome email is best-effort — don't fail signup if it errors
      }
      setDone(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError(
          'We could not create an account with those details. If you already have one, try signing in instead.'
        );
      } else if (msg.includes('password')) {
        setError('Password is too weak. Please use at least 6 characters.');
      } else if (msg.includes('email')) {
        setError('Please enter a valid email address.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-ink-950 px-5 pb-10 pt-[env(safe-area-inset-top)]">
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-gold-400/5 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto mt-16 w-full max-w-sm animate-fade-in text-center">
          <div className="relative mb-6 inline-flex">
            <div className="absolute inset-0 rounded-2xl bg-green-400/20 blur-xl" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-green-400/25 bg-gradient-to-br from-ink-800 to-ink-900 shadow-xl shadow-black/40">
              <CheckCircle2 size={40} className="text-green-400" />
            </div>
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Account created</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-400">
            Welcome to the Believers House Halifax Library. Your account is ready —
            you can now sign in and start browsing.
          </p>
          <button
            onClick={onSuccess}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-[15px] font-bold text-black shadow-lg shadow-gold-500/20 transition hover:from-gold-300 hover:to-gold-400"
          >
            Continue to Sign In
          </button>
          <p className="mt-4 text-[12px] text-ink-600">
            We've sent a welcome email to your inbox.
          </p>
        </div>
      </div>
    );
  }

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
      <div className="relative z-10 mx-auto mt-6 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-6 flex flex-col items-center text-center">
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
          <h1 className="font-display text-3xl font-bold text-white">Join the library</h1>
          <p className="mt-2 text-[14px] text-ink-400">
            Create your BH Connect account to browse and borrow books
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-ink-700/80 bg-ink-900/80 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError('');
                }}
                placeholder="e.g. Sarah Thompson"
                autoComplete="name"
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3.5 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
              />
            </div>

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
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
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

            {/* Confirm password */}
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError('');
                }}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3.5 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/60 focus:ring-1 focus:ring-gold-400/30"
              />
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
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Switch to sign in */}
        <p className="mt-6 text-center text-[13px] text-ink-500">
          Already have an account?{' '}
          <button
            onClick={onSignIn}
            className="font-semibold text-gold-400 underline underline-offset-2 transition hover:text-gold-300"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
