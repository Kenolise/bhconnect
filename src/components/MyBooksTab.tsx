import { useCallback, useEffect, useState } from 'react';
import { BookMarked, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNow } from '../hooks/useNow';
import { type ActiveRequest } from '../lib/loans';
import { MyBookCard } from './MyBookCard';

export function MyBooksTab() {
  const now = useNow();
  const [items, setItems] = useState<ActiveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('my_active_requests');
    if (rpcError || !Array.isArray(data)) {
      console.error('Failed to load my books:', rpcError);
      setError('We could not load your books. Please try again.');
    } else {
      setItems(data as ActiveRequest[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const onLoan = items.filter((i) => i.request_status === 'borrowed');
  const readyForPickup = items.filter((i) => i.request_status === 'ready');
  const waiting = items
    .filter((i) => i.request_status === 'pending')
    .sort((a, b) => (a.queue_position ?? 0) - (b.queue_position ?? 0));

  const sections = [
    { key: 'ready', title: 'Ready for pickup', items: readyForPickup },
    { key: 'borrowed', title: 'On loan', items: onLoan },
    { key: 'pending', title: 'Waiting list', items: waiting },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
            <BookMarked size={22} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">My Books</h1>
            <p className="text-[13px] text-ink-400">
              {items.length > 0
                ? `${items.length} active ${items.length === 1 ? 'request' : 'requests'}`
                : 'Books you borrow will appear here'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchItems}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-ink-400 transition hover:bg-ink-700 hover:text-white disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {error && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="shrink-0 text-red-400" />
          <p className="text-[13px] text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-gold-400/60" />
          <p className="mt-3 text-sm text-ink-400">Loading your books...</p>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={36} className="text-ink-600" strokeWidth={1.5} />
          <p className="mt-4 text-[15px] font-medium text-ink-300">No books right now</p>
          <p className="mt-1 text-[13px] text-ink-500">Request a book from the Library to see it here.</p>
        </div>
      )}

      {!loading &&
        !error &&
        sections.map((section) => (
          <section key={section.key} className="mb-6">
            <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-ink-500">
              {section.title} · {section.items.length}
            </h2>
            <div className="space-y-3">
              {section.items.map((item) => (
                <MyBookCard key={item.request_id} item={item} now={now} />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
