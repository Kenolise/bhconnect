import { Library, Users, Mic, MessageSquare, HeartHandshake, ChevronRight, MapPin, ExternalLink } from 'lucide-react';

interface LandingPageProps {
  onSignIn: () => void;
}

const MODULES = [
  {
    icon: Library,
    label: 'Library',
    desc: 'Browse and borrow church resources, books, and study materials.',
    live: true,
  },
  {
    icon: Users,
    label: 'Members',
    desc: 'A directory of our church family and small groups.',
    live: false,
  },
  {
    icon: Mic,
    label: 'Sermons',
    desc: 'Watch and listen to past messages and series.',
    live: false,
  },
  {
    icon: MessageSquare,
    label: 'Comms',
    desc: 'Announcements, events, newsletters, and the weekly bulletin.',
    live: false,
  },
  {
    icon: HeartHandshake,
    label: 'Pastoral',
    desc: 'Prayer requests, pastoral care, and confidential support.',
    live: false,
  },
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-ink-950 pb-16 text-white">
      {/* Hero */}
      <section className="relative flex min-h-[92svh] flex-col items-center justify-center overflow-hidden px-6 pt-16 text-center">
        {/* Background glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gold-400/6 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-teal-600/8 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-gold-500/5 blur-[100px]" />
        </div>

        {/* Logo mark */}
        <div className="relative mb-7">
          <div className="absolute inset-0 animate-pulse rounded-3xl bg-gold-400/20 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold-400/25 bg-gradient-to-br from-ink-800 to-ink-900 shadow-2xl shadow-black/40">
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
        <div className="mb-2 flex items-center gap-2.5">
          <span className="font-display text-4xl font-bold tracking-tight text-white">
            BH Connect
          </span>
        </div>
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.2em] text-gold-400">
          Believers House · Halifax, NS
        </p>

        {/* Divider */}
        <div className="my-5 flex items-center gap-4">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-gold-400/40" />
          <div className="h-1 w-1 rounded-full bg-gold-400/60" />
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-gold-400/40" />
        </div>

        {/* Tagline */}
        <h1 className="font-display mb-4 max-w-xs text-3xl font-bold leading-tight text-white">
          Your church,<br />
          <span className="text-gold-400">closer than ever.</span>
        </h1>
        <p className="mb-10 max-w-[280px] text-[15px] leading-relaxed text-ink-400">
          For the members and leadership of Believers House — everything you need, in one place.
        </p>

        {/* CTA */}
        <button
          onClick={onSignIn}
          className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-gold-400 to-gold-500 px-8 py-4 text-[16px] font-bold text-black shadow-xl shadow-gold-500/25 transition-all duration-200 hover:scale-105 hover:shadow-gold-400/30 active:scale-95"
        >
          Sign In to BH Connect
          <ChevronRight size={20} strokeWidth={2.5} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>

        {/* Scroll nudge */}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-ink-600 pt-1.5">
            <div className="h-1.5 w-0.5 animate-bounce rounded-full bg-ink-500" />
          </div>
        </div>
      </section>

      {/* Mission banner */}
      <section className="border-y border-ink-700/60 bg-ink-900/60 px-6 py-10 text-center backdrop-blur-sm">
        <p className="font-display mx-auto max-w-sm text-[18px] font-semibold italic leading-relaxed text-ink-200">
          "Lead people to Jesus. Make them more like Him. See them lead others to Him."
        </p>
        <p className="mt-3 text-[12px] uppercase tracking-widest text-ink-500">
          Our Mission
        </p>
      </section>

      {/* Modules */}
      <section className="px-5 py-12">
        <div className="mb-8 text-center">
          <span className="mb-2 inline-block text-[11px] font-semibold uppercase tracking-widest text-gold-400">
            What's inside
          </span>
          <h2 className="font-display text-2xl font-bold text-white">Five sections.<br />One community.</h2>
        </div>

        <div className="space-y-3">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.label}
                className="flex items-center gap-4 rounded-2xl border border-ink-700/60 bg-ink-900/80 px-4 py-4"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${
                    mod.live
                      ? 'border-gold-400/30 bg-gold-400/10 text-gold-400'
                      : 'border-ink-600 bg-ink-800 text-ink-400'
                  }`}
                >
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[15px] font-semibold ${mod.live ? 'text-white' : 'text-ink-300'}`}
                    >
                      {mod.label}
                    </span>
                    {mod.live && (
                      <span className="rounded-full border border-teal-500/40 bg-teal-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-400">
                        Live
                      </span>
                    )}
                    {!mod.live && (
                      <span className="rounded-full border border-ink-600 bg-ink-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                        Soon
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-500">{mod.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
        <p className="text-[12px] text-ink-600">
          This app is for Believers House members &amp; leadership only.
        </p>
      </div>
    </div>
  );
}
