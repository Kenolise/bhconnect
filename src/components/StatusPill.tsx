import type { StatusDisplay, LoanTone } from '../lib/loans';

const TONE_CLASSES: Record<LoanTone, string> = {
  gold: 'bg-gold-400/15 text-gold-300 ring-gold-400/30',
  green: 'bg-green-500/15 text-green-300 ring-green-400/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  red: 'bg-red-500/15 text-red-400 ring-red-400/30',
  sky: 'bg-sky-500/15 text-sky-300 ring-sky-400/30',
  neutral: 'bg-ink-700/60 text-ink-300 ring-ink-600',
};

export function StatusPill({ display }: { display: StatusDisplay }) {
  return (
    <span
      className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${TONE_CLASSES[display.tone]}`}
    >
      {display.label}
    </span>
  );
}
