import { BookOpen, CalendarClock, ListOrdered } from 'lucide-react';
import {
  type ActiveRequest,
  LOAN_PERIOD_DAYS,
  daysUntil,
  formatLoanDate,
  getStatusDisplay,
  isOverdue,
} from '../lib/loans';
import { StatusPill } from './StatusPill';

interface MyBookCardProps {
  item: ActiveRequest;
  now: number;
}

export function MyBookCard({ item, now }: MyBookCardProps) {
  const display = getStatusDisplay(
    { status: item.request_status, dueAt: item.due_at, queuePosition: item.queue_position },
    now,
  );

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-850 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/10">
          <BookOpen size={18} className="text-gold-400/80" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-white">{item.book_title}</p>
          {item.book_author && <p className="truncate text-[12px] text-ink-400">{item.book_author}</p>}
        </div>
        <StatusPill display={display} />
      </div>

      {item.request_status === 'borrowed' && item.collected_at && item.due_at && (
        <LoanProgress collectedAt={item.collected_at} dueAt={item.due_at} now={now} />
      )}

      {item.request_status === 'ready' && item.pickup_deadline && (
        <div className="flex items-center gap-2 rounded-xl bg-ink-900/60 px-3 py-2.5 text-[13px] text-ink-300">
          <CalendarClock size={14} className="shrink-0 text-sky-300" />
          Please collect by {formatLoanDate(item.pickup_deadline)} ({daysUntil(item.pickup_deadline, now)} days left)
        </div>
      )}

      {item.request_status === 'pending' && (
        <div className="flex items-center gap-2 rounded-xl bg-ink-900/60 px-3 py-2.5 text-[13px] text-ink-300">
          <ListOrdered size={14} className="shrink-0 text-amber-300" />
          You are number {item.queue_position} in line. We will email you as soon as a copy is free.
        </div>
      )}
    </div>
  );
}

function LoanProgress({ collectedAt, dueAt, now }: { collectedAt: string; dueAt: string; now: number }) {
  const daysLeft = daysUntil(dueAt, now);
  const daysUsed = Math.min(LOAN_PERIOD_DAYS, Math.max(0, LOAN_PERIOD_DAYS - daysLeft));
  const overdue = isOverdue('borrowed', dueAt, now);
  const percent = overdue ? 100 : (daysUsed / LOAN_PERIOD_DAYS) * 100;

  return (
    <div className="space-y-2.5">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700">
        <div
          className={`h-full rounded-full transition-all duration-700 ${overdue ? 'bg-red-400' : 'bg-gold-400'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[12px] text-ink-400">
        <span>Collected {formatLoanDate(collectedAt)}</span>
        <span className={overdue ? 'text-red-400' : ''}>Due back {formatLoanDate(dueAt)}</span>
      </div>
      {overdue && (
        <p className="text-[12px] text-red-400">Please return this book to the library as soon as possible.</p>
      )}
    </div>
  );
}
