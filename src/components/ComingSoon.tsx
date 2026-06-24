import { Sparkles } from 'lucide-react';
import type { TabDef } from '../tabs';

interface ComingSoonProps {
  tab: TabDef;
}

export function ComingSoon({ tab }: ComingSoonProps) {
  const Icon = tab.icon;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8 pb-28 pt-20">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-gold-400/20 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold-400/30 bg-gradient-to-br from-ink-800 to-ink-900">
          <Icon size={40} strokeWidth={1.5} className="text-gold-400" />
        </div>
      </div>

      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5">
        <Sparkles size={14} className="text-gold-300" />
        <span className="text-xs font-semibold uppercase tracking-widest text-gold-300">
          Coming Soon
        </span>
      </div>

      <h1 className="mb-3 text-center text-3xl font-bold tracking-tight text-white">
        {tab.label}
      </h1>

      <p className="max-w-xs text-center text-[15px] leading-relaxed text-ink-400">
        {tab.description}
      </p>

      <div className="mt-8 h-1 w-12 rounded-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
    </div>
  );
}
