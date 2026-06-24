import { useEffect, useState } from 'react';
import { X, Loader2, Search, ArrowLeft } from 'lucide-react';
import { CHRISTIAN_TOPICS, type ChristianTopic, type Resource, type ResourceInput } from '../types';

interface ResourceFormProps {
  resource: Resource | null;
  onClose: () => void;
  onSubmit: (data: ResourceInput) => Promise<void>;
}

const PRESET_COLORS = ['#d4af37', '#e0c576', '#c0a06e', '#b08d57', '#a37d16', '#c39a1f'];

async function fetchByISBN(isbn: string): Promise<Partial<ResourceInput> | null> {
  const clean = isbn.replace(/[^0-9X]/gi, '');
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const book = json[`ISBN:${clean}`];
    if (!book) return null;
    return {
      title: book.title ?? '',
      author: book.authors?.map((a: { name: string }) => a.name).join(', ') ?? null,
      description:
        typeof book.notes === 'string'
          ? book.notes
          : typeof book.notes?.value === 'string'
          ? book.notes.value
          : null,
      publisher: book.publishers?.map((p: { name: string }) => p.name).join(', ') ?? null,
      publish_year: book.publish_date ?? null,
      cover_image_url: book.cover?.large ?? book.cover?.medium ?? book.cover?.small ?? null,
    };
  } catch {
    return null;
  }
}

export function ResourceForm({ resource, onClose, onSubmit }: ResourceFormProps) {
  const isEditing = !!resource;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [christianTopic, setChristianTopic] = useState<ChristianTopic>('Uncategorized');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [coverColor, setCoverColor] = useState(PRESET_COLORS[0]);
  const [isbn, setIsbn] = useState('');
  const [totalCopies, setTotalCopies] = useState(1);
  const [availableCopies, setAvailableCopies] = useState(1);
  const [publisher, setPublisher] = useState('');
  const [publishYear, setPublishYear] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title);
      setAuthor(resource.author ?? '');
      setChristianTopic(resource.christian_topic);
      setDescription(resource.description ?? '');
      setUrl(resource.url ?? '');
      setCoverColor(resource.cover_color);
      setIsbn(resource.isbn ?? '');
      setTotalCopies(resource.total_copies);
      setAvailableCopies(resource.available_copies);
      setPublisher(resource.publisher ?? '');
      setPublishYear(resource.publish_year ?? '');
      setCoverImageUrl(resource.cover_image_url ?? '');
    }
  }, [resource]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleISBNLookup = async () => {
    if (!isbn.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    const data = await fetchByISBN(isbn.trim());
    if (!data) {
      setLookupError('No book found for this ISBN. Fill in the details manually.');
    } else {
      if (data.title) setTitle(data.title);
      if (data.author) setAuthor(data.author);
      if (data.description) setDescription(data.description);
      if (data.publisher) setPublisher(data.publisher);
      if (data.publish_year) setPublishYear(data.publish_year);
      if (data.cover_image_url) setCoverImageUrl(data.cover_image_url);
    }
    setLookingUp(false);
  };

  const handleTotalCopiesChange = (val: number) => {
    const clamped = Math.max(1, val);
    setTotalCopies(clamped);
    setAvailableCopies((prev) => Math.min(prev, clamped));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        author: author.trim() || null,
        category: 'Book',
        description: description.trim() || null,
        url: url.trim() || null,
        cover_color: coverColor,
        isbn: isbn.trim() || null,
        christian_topic: christianTopic,
        total_copies: totalCopies,
        available_copies: availableCopies,
        publisher: publisher.trim() || null,
        publish_year: publishYear.trim() || null,
        cover_image_url: coverImageUrl.trim() || null,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-900 sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-ink-700 bg-ink-900/95 px-4 py-4 backdrop-blur-xl">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition hover:bg-ink-800 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft size={17} />
          </button>
          <h2 className="flex-1 text-lg font-bold text-white">
            {isEditing ? 'Edit Book' : 'Add Book'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition hover:bg-ink-800 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* ISBN lookup */}
          <Field label="ISBN">
            <div className="flex gap-2">
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 9780310337508"
                className="flex-1 rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
              />
              <button
                type="button"
                onClick={handleISBNLookup}
                disabled={!isbn.trim() || lookingUp}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold-400/20 text-gold-300 transition hover:bg-gold-400/30 disabled:opacity-40"
                aria-label="Look up ISBN"
              >
                {lookingUp ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
              </button>
            </div>
            {lookupError && (
              <p className="mt-1.5 text-[12px] text-amber-400">{lookupError}</p>
            )}
            <p className="mt-1.5 text-[11px] text-ink-600">
              Enter the barcode number and tap search to auto-fill details.
            </p>
          </Field>

          <Field label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g. The Purpose Driven Life"
              className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            />
          </Field>

          <Field label="Author">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g. Rick Warren"
              className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            />
          </Field>

          <Field label="Christian Topic">
            <select
              value={christianTopic}
              onChange={(e) => setChristianTopic(e.target.value as ChristianTopic)}
              className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            >
              {CHRISTIAN_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Copies">
              <input
                type="number"
                min={1}
                value={totalCopies}
                onChange={(e) => handleTotalCopiesChange(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
              />
            </Field>
            <Field label="Available Now">
              <input
                type="number"
                min={0}
                max={totalCopies}
                value={availableCopies}
                onChange={(e) =>
                  setAvailableCopies(Math.min(parseInt(e.target.value) || 0, totalCopies))
                }
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Publisher">
              <input
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="e.g. Zondervan"
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
              />
            </Field>
            <Field label="Publish Year">
              <input
                type="text"
                value={publishYear}
                onChange={(e) => setPublishYear(e.target.value)}
                placeholder="e.g. 2013"
                className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short summary of the book..."
              className="w-full resize-none rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            />
          </Field>

          <Field label="External Link (optional)">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            />
          </Field>

          <Field label="Cover accent color">
            <div className="flex flex-wrap gap-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setCoverColor(color)}
                  className={`h-9 w-9 rounded-full transition ${
                    coverColor === color
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-ink-900'
                      : 'ring-1 ring-white/10'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3.5 text-sm font-semibold text-ink-200 transition hover:bg-ink-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-3.5 text-sm font-bold text-black transition hover:from-gold-300 hover:to-gold-400 disabled:opacity-50"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {isEditing ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-ink-500">
        {label}
        {required && <span className="ml-1 text-gold-400">*</span>}
      </label>
      {children}
    </div>
  );
}
