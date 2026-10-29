import type { RequestStatus } from '../types';

export const LOAN_PERIOD_DAYS = 21;
export const PICKUP_WINDOW_DAYS = 7;

const DAY_MS = 86_400_000;

export interface ActiveRequest {
  request_id: string;
  book_id: string;
  request_status: 'pending' | 'ready' | 'borrowed';
  requested_at: string;
  pickup_deadline: string | null;
  collected_at: string | null;
  due_at: string | null;
  queue_position: number | null;
  book_title: string;
  book_author: string | null;
}

export type LoanTone = 'gold' | 'green' | 'amber' | 'red' | 'sky' | 'neutral';

export interface StatusDisplay {
  label: string;
  tone: LoanTone;
}

export type LoanState =
  | { kind: 'overdue'; daysOverdue: number }
  | { kind: 'due_today' }
  | { kind: 'days_left'; daysLeft: number };

export function daysUntil(iso: string, now: number): number {
  return Math.ceil((new Date(iso).getTime() - now) / DAY_MS);
}

export function getLoanState(dueAt: string, now: number): LoanState {
  const days = daysUntil(dueAt, now);
  if (days < 0) return { kind: 'overdue', daysOverdue: -days };
  if (days === 0) return { kind: 'due_today' };
  return { kind: 'days_left', daysLeft: days };
}

export function isOverdue(status: RequestStatus, dueAt: string | null, now: number): boolean {
  return status === 'borrowed' && dueAt !== null && daysUntil(dueAt, now) < 0;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function getStatusDisplay(
  input: { status: RequestStatus; dueAt: string | null; queuePosition?: number | null },
  now: number,
): StatusDisplay {
  switch (input.status) {
    case 'pending':
      return {
        label: input.queuePosition ? `Waiting list #${input.queuePosition}` : 'Waiting list',
        tone: 'amber',
      };
    case 'ready':
      return { label: 'Ready for pickup', tone: 'sky' };
    case 'borrowed': {
      if (!input.dueAt) return { label: 'On loan', tone: 'green' };
      const state = getLoanState(input.dueAt, now);
      if (state.kind === 'overdue') {
        return { label: `Overdue by ${plural(state.daysOverdue, 'day')}`, tone: 'red' };
      }
      if (state.kind === 'due_today') return { label: 'Due today', tone: 'amber' };
      return {
        label: `${plural(state.daysLeft, 'day')} left`,
        tone: state.daysLeft <= 3 ? 'amber' : 'green',
      };
    }
    case 'returned':
      return { label: 'Returned', tone: 'neutral' };
    case 'rejected':
      return { label: 'Declined', tone: 'red' };
    case 'expired':
      return { label: 'Pickup missed', tone: 'red' };
  }
}

export function formatLoanDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}
