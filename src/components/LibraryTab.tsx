import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Library as LibraryIcon,
  RefreshCw,
  AlertCircle,
  Upload,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CHRISTIAN_TOPICS, type ChristianTopic, type Resource, type ResourceInput } from '../types';
import { ResourceCard } from './ResourceCard';
import { ResourceSheet } from './ResourceSheet';
import { ResourceForm } from './ResourceForm';
import { ISBNImport } from './ISBNImport';

type SortOption = 'newest' | 'title_asc' | 'author_asc';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  title_asc: 'A–Z by title',
  author_asc: 'A–Z by author',
};

export function LibraryTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activeTopic, setActiveTopic] = useState<ChristianTopic | 'All'>('All');
  const [sort, setSort] = useState<SortOption>('newest');
  const [topicDropdownOpen, setTopicDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const topicRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('library_resources')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else if (data) {
      setResources(data as Resource[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleAdd = () => {
    setEditingResource(null);
    setFormOpen(true);
  };

  const handleEdit = (resource: Resource) => {
    setSelectedResource(null);
    setEditingResource(resource);
    setFormOpen(true);
  };

  const handleSubmit = async (data: ResourceInput): Promise<void> => {
    if (editingResource) {
      const { error } = await supabase
        .from('library_resources')
        .update(data)
        .eq('id', editingResource.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('library_resources').insert(data);
      if (error) throw error;
    }
    await fetchResources();
  };

  const handleDelete = async (resource: Resource) => {
    const { error } = await supabase
      .from('library_resources')
      .delete()
      .eq('id', resource.id);
    if (error) {
      setError(error.message);
      return;
    }
    setSelectedResource(null);
    await fetchResources();
  };

  const topicCounts = resources.reduce<Record<string, number>>((acc, r) => {
    acc[r.christian_topic] = (acc[r.christian_topic] ?? 0) + 1;
    return acc;
  }, {});

  const topicsWithBooks = CHRISTIAN_TOPICS.filter((t) => topicCounts[t] > 0);

  const filtered = resources
    .filter((r) => {
      const matchesTopic = activeTopic === 'All' || r.christian_topic === activeTopic;
      const q = query.toLowerCase().trim();
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.author?.toLowerCase().includes(q) ?? false) ||
        (r.description?.toLowerCase().includes(q) ?? false) ||
        (r.isbn?.includes(q) ?? false) ||
        r.christian_topic.toLowerCase().includes(q);
      return matchesTopic && matchesQuery;
    })
    .sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title);
      if (sort === 'author_asc') return (a.author ?? '').localeCompare(b.author ?? '');
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const topicLabel =
    activeTopic === 'All'
      ? `All Topics (${resources.length})`
      : `${activeTopic} (${topicCounts[activeTopic] ?? 0})`;

  return (
    <div className="px-4 pb-28 pt-4">
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
            <LibraryIcon size={22} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Library</h1>
            <p className="text-[13px] text-ink-400">{resources.length} books available</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setImportOpen(true)}
            className="flex h-11 items-center gap-1.5 rounded-xl border border-gold-400/30 bg-gold-400/10 px-3 text-[13px] font-semibold text-gold-300 transition hover:bg-gold-400/20"
            aria-label="Import books"
          >
            <Upload size={15} />
            Import
          </button>
          <button
            onClick={handleAdd}
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold-400 to-gold-500 text-black shadow-lg shadow-gold-500/20 transition hover:scale-105 active:scale-95"
            aria-label="Add book"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative mb-3">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, author, topic, ISBN..."
          className="w-full rounded-xl border border-ink-700 bg-ink-850 py-3 pl-11 pr-4 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
        />
      </div>

      {/* Filter row: topic dropdown + sort dropdown */}
      <div className="mb-4 flex gap-2">
        {/* Topic dropdown */}
        <div ref={topicRef} className="relative flex-1">
          <button
            onClick={() => {
              setTopicDropdownOpen((v) => !v);
              setSortDropdownOpen(false);
            }}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-ink-700 bg-ink-850 px-4 py-2.5 text-[14px] font-medium text-white transition hover:border-gold-400/40 hover:bg-ink-800"
          >
            <span className="truncate text-left text-[13px]">{topicLabel}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-ink-400 transition-transform duration-200 ${topicDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {topicDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setTopicDropdownOpen(false)}
              />
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-72 overflow-y-auto rounded-2xl border border-ink-600 bg-ink-850 shadow-2xl shadow-black/60">
                <button
                  onClick={() => {
                    setActiveTopic('All');
                    setTopicDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] transition hover:bg-ink-800 ${
                    activeTopic === 'All' ? 'text-gold-300' : 'text-white'
                  }`}
                >
                  <span>All Topics</span>
                  <span className="text-[12px] text-ink-500">{resources.length}</span>
                </button>
                <div className="mx-4 border-t border-ink-700" />
                {topicsWithBooks.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setActiveTopic(topic);
                      setTopicDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-[14px] transition hover:bg-ink-800 ${
                      activeTopic === topic ? 'text-gold-300' : 'text-ink-200'
                    }`}
                  >
                    <span>{topic}</span>
                    <span className="text-[12px] text-ink-500">{topicCounts[topic]}</span>
                  </button>
                ))}
                {CHRISTIAN_TOPICS.filter((t) => !topicCounts[t]).map((topic) => (
                  <button
                    key={topic}
                    disabled
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-[14px] text-ink-600 opacity-50"
                  >
                    <span>{topic}</span>
                    <span className="text-[12px]">0</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <button
            onClick={() => {
              setSortDropdownOpen((v) => !v);
              setTopicDropdownOpen(false);
            }}
            className="flex h-full items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-850 px-3 py-2.5 text-[13px] font-medium text-ink-300 transition hover:border-gold-400/40 hover:bg-ink-800 hover:text-white"
            aria-label="Sort"
          >
            <SlidersHorizontal size={15} />
          </button>

          {sortDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setSortDropdownOpen(false)}
              />
              <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-48 overflow-hidden rounded-2xl border border-ink-600 bg-ink-850 shadow-2xl shadow-black/60">
                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSort(key);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-[14px] transition hover:bg-ink-800 ${
                      sort === key ? 'text-gold-300' : 'text-ink-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Active filter summary */}
      {(activeTopic !== 'All' || query) && (
        <div className="mb-3 flex items-center justify-between text-[12px]">
          <span className="text-ink-500">
            {filtered.length} book{filtered.length !== 1 ? 's' : ''} found
            {activeTopic !== 'All' && (
              <> in <span className="text-gold-400">{activeTopic}</span></>
            )}
          </span>
          <button
            onClick={() => {
              setActiveTopic('All');
              setQuery('');
            }}
            className="text-ink-500 underline underline-offset-2 transition hover:text-ink-300"
          >
            Clear
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-gold-400/60" />
          <p className="mt-3 text-sm text-ink-400">Loading library...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle size={32} className="text-red-400" />
          <p className="mt-3 text-sm font-medium text-red-400">Something went wrong</p>
          <p className="mt-1 max-w-xs text-xs text-ink-500">{error}</p>
          <button
            onClick={fetchResources}
            className="mt-4 rounded-xl bg-ink-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ink-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <LibraryIcon size={36} className="text-ink-600" strokeWidth={1.5} />
          <p className="mt-4 text-[15px] font-medium text-ink-300">
            {query || activeTopic !== 'All' ? 'No books match your search' : 'No books yet'}
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {query || activeTopic !== 'All'
              ? 'Try a different filter or search term.'
              : 'Import a CSV or tap + to add your first book.'}
          </p>
          {!query && activeTopic === 'All' && (
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-5 py-2.5 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/20"
              >
                <Upload size={15} />
                Import CSV
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-black transition hover:scale-105"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Book
              </button>
            </div>
          )}
        </div>
      )}

      {/* Book grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onOpen={setSelectedResource} />
          ))}
        </div>
      )}

      {/* Detail sheet */}
      <ResourceSheet
        resource={selectedResource}
        onClose={() => setSelectedResource(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Add/Edit form */}
      {formOpen && (
        <ResourceForm
          resource={editingResource}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {/* ISBN import wizard */}
      {importOpen && (
        <ISBNImport
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setImportOpen(false);
            fetchResources();
          }}
        />
      )}
    </div>
  );
}
