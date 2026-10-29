import { useCallback, useEffect, useState } from 'react';
import {
  ClipboardList,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  User,
  BookOpen,
  PackageCheck,
  Undo2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { RequestStatus } from '../types';
import { formatLoanDate, getStatusDisplay } from '../lib/loans';
import { useNow } from '../hooks/useNow';
import { StatusPill } from './StatusPill';

interface RequestRow {
  id: string;
  book_id: string;
  requester_email: string;
  requester_name: string;
  status: RequestStatus;
  created_at: string;
  pickup_deadline: string | null;
  collected_at: string | null;
  due_at: string | null;
  library_resources: {
    id: string;
    title: string;
    author: string | null;
  } | null;
}

type FilterStatus = 'pending' | 'ready' | 'borrowed' | 'returned' | 'rejected' | 'all';

const FILTER_LABEL: Record<FilterStatus, string> = {
  pending: 'Waiting',
  ready: 'Ready',
  borrowed: 'On loan',
  returned: 'Returned',
  rejected: 'Declined',
  all: 'All',
};

interface RequestsTabProps {
  onPendingCountChange: (count: number) => void;
}

type ActionResult = PromiseLike<{ error: unknown }>;

export function RequestsTab({ onPendingCountChange }: RequestsTabProps) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [actioning, setActioning] = useState<string | null>(null);
  const now = useNow();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('borrow_requests')
      .select(`
        id,
        book_id,
        requester_email,
        requester_name,
        status,
        created_at,
        pickup_deadline,
        collected_at,
        due_at,
        library_resources (
          id,
          title,
          author
        )
      `)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Failed to load borrow requests:', fetchError);
      setError('We could not load the requests. Please try again.');
    } else if (data) {
      const rows = data as unknown as RequestRow[];
      setRequests(rows);
      const pendingCount = rows.filter((r) => r.status === 'pending').length;
      onPendingCountChange(pendingCount);
    }
    setLoading(false);
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const performAction = async (requestId: string, run: () => ActionResult, failureMessage: string) => {
    setActioning(requestId);
    setError(null);
    const { error: actionError } = await run();
    if (actionError) {
      console.error(failureMessage, actionError);
      setError(failureMessage);
    } else {
      await fetchRequests();
    }
    setActioning(null);
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = (
    ['pending', 'ready', 'borrowed', 'returned', 'rejected', 'all'] as FilterStatus[]
  ).map((value) => ({
    value,
    label: value === 'pending' && pendingCount > 0 ? `${FILTER_LABEL[value]} (${pendingCount})` : FILTER_LABEL[value],
  }));

  return (
    <div className="px-4 pb-28 pt-4">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
            <ClipboardList size={22} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Requests</h1>
            <p className="text-[13px] text-ink-400">
              {pendingCount > 0
                ? `${pendingCount} waiting request${pendingCount !== 1 ? 's' : ''}`
                : 'Borrow requests from members'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-ink-400 transition hover:bg-ink-700 hover:text-white disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              filter === opt.value
                ? 'bg-gold-400/20 text-gold-300 ring-1 ring-gold-400/40'
                : 'bg-ink-800 text-ink-400 hover:bg-ink-700 hover:text-ink-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <p className="text-[13px] text-red-400">{error}</p>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-[12px] text-red-400/70 underline hover:text-red-400"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-gold-400/60" />
          <p className="mt-3 text-sm text-ink-400">Loading requests...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList size={36} className="text-ink-600" strokeWidth={1.5} />
          <p className="mt-4 text-[15px] font-medium text-ink-300">
            {filter === 'all' ? 'No requests yet' : `No ${FILTER_LABEL[filter].toLowerCase()} requests`}
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {filter === 'pending'
              ? 'All caught up! New member requests will appear here.'
              : 'Nothing to show for this filter.'}
          </p>
        </div>
      )}

      {/* Request list */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isActioning = actioning === req.id;
            const dateStr = new Date(req.created_at).toLocaleDateString('en-CA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const display = getStatusDisplay({ status: req.status, dueAt: req.due_at }, now);

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-ink-700 bg-ink-850 p-4"
              >
                {/* Book info */}
                <div className="mb-3 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-400/10">
                    <BookOpen size={18} className="text-gold-400/80" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">
                      {req.library_resources?.title ?? 'Unknown book'}
                    </p>
                    {req.library_resources?.author && (
                      <p className="truncate text-[12px] text-ink-400">
                        {req.library_resources.author}
                      </p>
                    )}
                  </div>
                  <StatusPill display={display} />
                </div>

                {/* Member info */}
                <div className="mb-3 space-y-1.5 rounded-xl bg-ink-900/60 px-3 py-2.5">
                  <div className="flex items-center gap-2 text-[13px] text-ink-300">
                    <User size={13} className="shrink-0 text-ink-500" />
                    {req.requester_name}
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-ink-400">
                    <Mail size={13} className="shrink-0 text-ink-500" />
                    {req.requester_email}
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-ink-500">
                    <Clock size={12} className="shrink-0" />
                    Requested {dateStr}
                  </div>
                  {req.status === 'ready' && req.pickup_deadline && (
                    <div className="flex items-center gap-2 text-[12px] text-sky-300/80">
                      <Clock size={12} className="shrink-0" />
                      Collect by {formatLoanDate(req.pickup_deadline)}
                    </div>
                  )}
                  {req.status === 'borrowed' && req.collected_at && req.due_at && (
                    <div className="flex items-center gap-2 text-[12px] text-ink-400">
                      <Clock size={12} className="shrink-0" />
                      Collected {formatLoanDate(req.collected_at)} · Due {formatLoanDate(req.due_at)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        performAction(
                          req.id,
                          () => supabase.rpc('approve_borrow_request', { request_id: req.id }),
                          'We could not approve this request. Check that a copy is free and try again.',
                        )
                      }
                      disabled={isActioning}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500/15 px-4 py-2.5 text-[13px] font-semibold text-green-300 ring-1 ring-green-400/30 transition hover:bg-green-500/25 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        performAction(
                          req.id,
                          () => supabase.from('borrow_requests').update({ status: 'rejected' }).eq('id', req.id),
                          'We could not decline this request. Please refresh and try again.',
                        )
                      }
                      disabled={isActioning}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-[13px] font-semibold text-red-400 ring-1 ring-red-400/30 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      Decline
                    </button>
                  </div>
                )}

                {req.status === 'ready' && (
                  <button
                    onClick={() =>
                      performAction(
                        req.id,
                        () => supabase.rpc('mark_borrow_collected', { request_id: req.id }),
                        'We could not mark this book as collected. Please refresh and try again.',
                      )
                    }
                    disabled={isActioning}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sky-500/15 px-4 py-2.5 text-[13px] font-semibold text-sky-300 ring-1 ring-sky-400/30 transition hover:bg-sky-500/25 disabled:opacity-50"
                  >
                    <PackageCheck size={15} />
                    Mark as collected
                  </button>
                )}

                {req.status === 'borrowed' && (
                  <button
                    onClick={() =>
                      performAction(
                        req.id,
                        () => supabase.rpc('mark_borrow_returned', { request_id: req.id }),
                        'We could not mark this book as returned. Please refresh and try again.',
                      )
                    }
                    disabled={isActioning}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-500/15 px-4 py-2.5 text-[13px] font-semibold text-green-300 ring-1 ring-green-400/30 transition hover:bg-green-500/25 disabled:opacity-50"
                  >
                    <Undo2 size={15} />
                    Mark as returned
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
