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
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface RequestRow {
  id: string;
  book_id: string;
  requester_email: string;
  requester_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  library_resources: {
    id: string;
    title: string;
    author: string | null;
  } | null;
}

type FilterStatus = 'pending' | 'approved' | 'rejected' | 'all';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Declined',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30',
  approved: 'bg-green-500/15 text-green-300 ring-1 ring-green-400/30',
  rejected: 'bg-red-500/15 text-red-400 ring-1 ring-red-400/30',
};

interface RequestsTabProps {
  onPendingCountChange: (count: number) => void;
}

export function RequestsTab({ onPendingCountChange }: RequestsTabProps) {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('pending');
  const [actioning, setActioning] = useState<string | null>(null);

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
        library_resources (
          id,
          title,
          author
        )
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      const rows = data as RequestRow[];
      setRequests(rows);
      const pendingCount = rows.filter((r) => r.status === 'pending').length;
      onPendingCountChange(pendingCount);
    }
    setLoading(false);
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (request: RequestRow) => {
    setActioning(request.id);
    const { error: rpcError } = await supabase.rpc('approve_borrow_request', {
      request_id: request.id,
    });
    if (rpcError) {
      setError(rpcError.message);
    } else {
      await fetchRequests();
    }
    setActioning(null);
  };

  const handleReject = async (request: RequestRow) => {
    setActioning(request.id);
    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({ status: 'rejected' })
      .eq('id', request.id);
    if (updateError) {
      setError(updateError.message);
    } else {
      await fetchRequests();
    }
    setActioning(null);
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Declined' },
    { value: 'all', label: 'All' },
  ];

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
                ? `${pendingCount} pending request${pendingCount !== 1 ? 's' : ''}`
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
            {filter === 'pending' ? 'No pending requests' : `No ${filter === 'all' ? '' : filter} requests`}
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
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[req.status]}`}>
                    {STATUS_LABEL[req.status]}
                  </span>
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
                </div>

                {/* Actions — only for pending requests */}
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={isActioning}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500/15 px-4 py-2.5 text-[13px] font-semibold text-green-300 ring-1 ring-green-400/30 transition hover:bg-green-500/25 disabled:opacity-50"
                    >
                      <CheckCircle2 size={15} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(req)}
                      disabled={isActioning}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/10 px-4 py-2.5 text-[13px] font-semibold text-red-400 ring-1 ring-red-400/30 transition hover:bg-red-500/20 disabled:opacity-50"
                    >
                      <XCircle size={15} />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
