import { useCallback, useEffect, useState } from 'react';
import { BookMarked, Loader2, AlertCircle, ListOrdered, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type ActiveRequest, formatLoanDate, getStatusDisplay } from '../lib/loans';
import { useNow } from '../hooks/useNow';
import { StatusPill } from './StatusPill';

interface BorrowPanelProps {
  bookId: string;
  isAvailable: boolean;
}

export function BorrowPanel({ bookId, isAvailable }: BorrowPanelProps) {
  const now = useNow();
  const [active, setActive] = useState<ActiveRequest | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActive = useCallback(async () => {
    setLoadingActive(true);
    const { data, error: rpcError } = await supabase.rpc('my_active_requests');
    if (rpcError || !Array.isArray(data)) {
      console.error('Failed to load request status:', rpcError);
      setError('We could not check the status of this book. Please try again.');
    } else {
      const match = (data as ActiveRequest[]).find((r) => r.book_id === bookId) ?? null;
      setActive(match);
    }
    setLoadingActive(false);
  }, [bookId]);

  useEffect(() => {
    setError(null);
    loadActive();
  }, [loadActive]);

  const handleRequest = async () => {
    setSubmitting(true);
    setError(null);
    const { error: insertError } = await supabase.from('borrow_requests').insert({ book_id: bookId });
    if (insertError && insertError.code !== '23505') {
      console.error('Borrow request failed:', insertError);
      setError('Something went wrong. Please try again.');
    }
    await loadActive();
    setSubmitting(false);
  };

  if (loadingActive) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 size={24} className="animate-spin text-gold-400" />
        <p className="text-[13px] text-ink-400">Checking your book status...</p>
      </div>
    );
  }

  if (active) {
    const display = getStatusDisplay(
      { status: active.request_status, dueAt: active.due_at, queuePosition: active.queue_position },
      now,
    );
    return (
      <div className="space-y-3 rounded-2xl border border-gold-400/20 bg-gold-400/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-white">
            <BookMarked size={16} className="text-gold-400/80" />
            Your request
          </div>
          <StatusPill display={display} />
        </div>
        <p className="text-[13px] leading-relaxed text-ink-300">
          {active.request_status === 'pending' && (
            <>
              <ListOrdered size={13} className="mr-1 inline text-amber-300" />
              You are number {active.queue_position} on the waiting list. We will email you as soon as a copy is free.
            </>
          )}
          {active.request_status === 'ready' && active.pickup_deadline &&
            `This book is ready for you. Please collect it by ${formatLoanDate(active.pickup_deadline)}.`}
          {active.request_status === 'borrowed' && active.due_at &&
            `You have this book on loan. It is due back on ${formatLoanDate(active.due_at)}.`}
        </p>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 size={24} className="animate-spin text-gold-400" />
        <p className="text-[13px] text-ink-400">Sending your request...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
          <AlertCircle size={15} className="shrink-0" />
          {error}
        </div>
      )}
      <div className="flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850 p-3.5">
        <BookOpen size={16} className="mt-0.5 shrink-0 text-gold-400/70" />
        <p className="text-[13px] text-ink-300">
          {isAvailable
            ? 'A copy is free. Request it and the library team will prepare it for you.'
            : 'All copies are on loan. Join the waiting list and we will email you when a copy is ready.'}
        </p>
      </div>
      <button
        onClick={handleRequest}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-3.5 text-sm font-bold text-black transition hover:from-gold-300 hover:to-gold-400"
      >
        <BookMarked size={16} />
        {isAvailable ? 'Request to Borrow' : 'Join the Waiting List'}
      </button>
    </div>
  );
}
