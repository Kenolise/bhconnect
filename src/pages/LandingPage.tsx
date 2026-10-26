import { ChevronRight } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-950 text-white">
      {/* Hero */}
      <section className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gold-400/6 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-teal-600/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-gold-500/5 blur-[100px]" />
        </div>

        {/* Logo mark */}
        <div className="relative mb-5">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-gold-400/20 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-gold-400/25 bg-gradient-to-br from-ink-800 to-ink-900 shadow-2xl shadow-black/40">
            <svg width="52" height="52" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {/* Wordmark */}
        <div className="mb-2">
          <span className="font-display text-3xl font-bold tracking-tight text-white">
            BH Connect
          </span>
        </div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-gold-400">
          Believers House · Halifax, NS
        </p>

        {/* Divider */}
        <div className="my-4 flex items-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400/40" />
          <div className="h-1 w-1 rounded-full bg-gold-400/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400/40" />
        </div>

        {/* CTA */}
        <button
          onClick={onSignIn}
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 px-8 py-4 text-[16px] font-bold text-black shadow-xl shadow-gold-500/25 transition-all duration-200 hover:scale-105 hover:shadow-gold-400/30 active:scale-95"
        >
          Sign In to BH Connect
          <ChevronRight size={20} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </section>

      {/* Mission banner */}
      <section className="shrink-0 border-y border-ink-700/60 bg-ink-900/60 px-6 py-6 text-center backdrop-blur-sm">
        <p className="font-display mx-auto max-w-sm text-[18px] font-semibold italic leading-relaxed text-ink-200">
          "Lead people to Jesus. Make them more like Him. See them lead others to Him."
        </p>
        <p className="mt-3 text-[12px] uppercase tracking-widest text-ink-500">
          Our Mission
        </p>
      </section>

    </div>
  );
}
