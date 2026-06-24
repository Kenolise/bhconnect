import { useRef, useState } from 'react';
import {
  X,
  Upload,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CHRISTIAN_TOPICS, type ChristianTopic, type ResourceInput } from '../types';

interface ISBNImportProps {
  onClose: () => void;
  onImported: () => void;
}

interface ParsedRow {
  date: string;
  quantity: number;
  name: string;
  isbn: string;
}

interface LookupResult extends ParsedRow {
  status: 'pending' | 'found' | 'not_found' | 'error';
  title: string;
  author: string;
  description: string;
  publisher: string;
  publish_year: string;
  cover_image_url: string;
  christian_topic: ChristianTopic;
  skip: boolean;
}

type Step = 'upload' | 'lookup' | 'review' | 'done';

const PRESET_COLORS = ['#d4af37', '#e0c576', '#c0a06e', '#b08d57', '#a37d16', '#c39a1f'];

function randomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

async function lookupISBN(isbn: string): Promise<Partial<LookupResult>> {
  const clean = isbn.replace(/[^0-9X]/gi, '');
  try {
    const res = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${clean}&format=json&jscmd=data`
    );
    if (!res.ok) throw new Error('Network error');
    const json = await res.json();
    const key = `ISBN:${clean}`;
    const book = json[key];
    if (!book) return { status: 'not_found' };

    const author =
      book.authors?.map((a: { name: string }) => a.name).join(', ') ?? '';
    const publisher =
      book.publishers?.map((p: { name: string }) => p.name).join(', ') ?? '';
    const publish_year = book.publish_date ?? '';
    const description =
      typeof book.notes === 'string'
        ? book.notes
        : typeof book.notes?.value === 'string'
        ? book.notes.value
        : '';
    const cover_image_url =
      book.cover?.large ?? book.cover?.medium ?? book.cover?.small ?? '';

    return {
      status: 'found',
      title: book.title ?? '',
      author,
      description,
      publisher,
      publish_year,
      cover_image_url,
    };
  } catch {
    return { status: 'error' };
  }
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^"|"$/g, '').toUpperCase());
  const dateIdx = header.findIndex((h) => h === 'DATE');
  const qtyIdx = header.findIndex((h) => h === 'QUANTITY');
  const nameIdx = header.findIndex((h) => h === 'NAME');
  const codeIdx = header.findIndex(
    (h) => h.includes('CODECONTENT') || h === 'ISBN'
  );

  if (codeIdx === -1) return [];

  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCSVLine(lines[i]);
    const isbn = (cols[codeIdx] ?? '').replace(/^"|"$/g, '').trim();
    if (!isbn) continue;
    rows.push({
      date: dateIdx >= 0 ? (cols[dateIdx] ?? '').replace(/^"|"$/g, '').trim() : '',
      quantity: qtyIdx >= 0 ? parseInt(cols[qtyIdx] ?? '1', 10) || 1 : 1,
      name: nameIdx >= 0 ? (cols[nameIdx] ?? '').replace(/^"|"$/g, '').trim() : '',
      isbn,
    });
  }
  return rows;
}

function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

export function ISBNImport({ onClose, onImported }: ISBNImportProps) {
  const [step, setStep] = useState<Step>('upload');
  const [rows, setRows] = useState<LookupResult[]>([]);
  const [lookupProgress, setLookupProgress] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const handleFile = (file: File) => {
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setParseError(
          'Could not find any ISBN rows. Make sure the file has a CODECONTENT column with ISBN numbers.'
        );
        return;
      }
      const initial: LookupResult[] = parsed.map((r) => ({
        ...r,
        status: 'pending',
        title: r.name,
        author: '',
        description: '',
        publisher: '',
        publish_year: '',
        cover_image_url: '',
        christian_topic: 'Uncategorized',
        skip: false,
      }));
      setRows(initial);
      runLookups(initial);
    };
    reader.readAsText(file);
  };

  const runLookups = async (initial: LookupResult[]) => {
    setStep('lookup');
    setLookupProgress(0);
    const updated = [...initial];
    for (let i = 0; i < updated.length; i++) {
      const result = await lookupISBN(updated[i].isbn);
      updated[i] = { ...updated[i], ...result } as LookupResult;
      if (result.status === 'found' && !result.title) {
        updated[i].title = updated[i].name;
      }
      setRows([...updated]);
      setLookupProgress(Math.round(((i + 1) / updated.length) * 100));
    }
    // Scroll to top of body when review is ready
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
    setStep('review');
  };

  const handleImport = async () => {
    setImporting(true);
    setImportError(null);

    const toImport = rows.filter((r) => !r.skip);
    const isbns = toImport.map((r) => r.isbn);

    // Fetch which ISBNs already exist so we can skip them instead of using
    // upsert (which requires a full unique constraint, not a partial index).
    const { data: existing, error: fetchErr } = await supabase
      .from('library_resources')
      .select('isbn')
      .in('isbn', isbns);

    if (fetchErr) {
      setImportError(fetchErr.message);
      setImporting(false);
      return;
    }

    const existingSet = new Set((existing ?? []).map((r) => r.isbn));
    const newRecords: ResourceInput[] = toImport
      .filter((r) => !existingSet.has(r.isbn))
      .map((r) => ({
        title: r.title || r.name,
        author: r.author || null,
        category: 'Book',
        description: r.description || null,
        url: null,
        cover_color: randomColor(),
        isbn: r.isbn,
        christian_topic: r.christian_topic,
        total_copies: r.quantity,
        available_copies: r.quantity,
        publisher: r.publisher || null,
        publish_year: r.publish_year || null,
        cover_image_url: r.cover_image_url || null,
      }));

    const skippedCount = toImport.length - newRecords.length;

    if (newRecords.length > 0) {
      const { error: insertErr } = await supabase
        .from('library_resources')
        .insert(newRecords);

      if (insertErr) {
        setImportError(insertErr.message);
        setImporting(false);
        return;
      }
    }

    setImporting(false);
    setImportedCount(newRecords.length);
    setSkippedCount(skippedCount);
    setStep('done');
    onImported();
  };

  const updateRow = (idx: number, patch: Partial<LookupResult>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const toImportCount = rows.filter((r) => !r.skip).length;

  const stepIndex: Record<Step, number> = { upload: 0, lookup: 1, review: 2, done: 3 };

  // Back action per step
  const handleBack = () => {
    if (step === 'upload' || step === 'done') {
      onClose();
    } else if (step === 'lookup' || step === 'review') {
      setStep('upload');
      setRows([]);
      setLookupProgress(0);
      setParseError(null);
      setImportError(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-950">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-700 bg-ink-900 px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button
          onClick={handleBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition hover:bg-ink-800 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold text-white">Import Books</h2>
          <p className="truncate text-[11px] text-ink-400">
            {step === 'upload' && 'Upload your QRbot CSV file'}
            {step === 'lookup' && `Looking up ISBNs… ${lookupProgress}%`}
            {step === 'review' && `${toImportCount} of ${rows.length} books selected`}
            {step === 'done' && 'Import complete'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink-600 text-ink-300 transition hover:bg-ink-800 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      {/* Step indicators */}
      {step !== 'done' && (
        <div className="flex border-b border-ink-700 bg-ink-900">
          {(['upload', 'lookup', 'review'] as const).map((s, i) => {
            const currentIdx = stepIndex[step];
            const isDone = currentIdx > i;
            const isActive = step === s;
            return (
              <div
                key={s}
                className={`flex flex-1 flex-col items-center py-2.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                  isActive ? 'text-gold-300' : isDone ? 'text-ink-500' : 'text-ink-600'
                }`}
              >
                <span
                  className={`mb-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    isActive
                      ? 'bg-gold-400 text-black'
                      : isDone
                      ? 'bg-ink-700 text-ink-400'
                      : 'bg-ink-800 text-ink-600'
                  }`}
                >
                  {isDone ? <CheckCircle2 size={12} /> : i + 1}
                </span>
                {s === 'upload' ? 'Upload' : s === 'lookup' ? 'Lookup' : 'Review'}
              </div>
            );
          })}
        </div>
      )}

      {/* Scrollable body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto">

        {/* UPLOAD STEP */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center px-6 py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/10">
              <Upload size={28} className="text-gold-400" />
            </div>
            <h3 className="mb-2 text-[17px] font-bold text-white">Upload QRbot CSV</h3>
            <p className="mb-1 text-center text-[13px] text-ink-400">
              Export your scan list from QRbot and upload the CSV file here.
            </p>
            <p className="mb-8 text-center text-[12px] text-ink-500">
              Required columns:{' '}
              <span className="text-ink-300">DATE, QUANTITY, NAME, CODECONTENT</span>
            </p>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full max-w-xs rounded-2xl border-2 border-dashed border-ink-600 bg-ink-900 px-6 py-10 text-center transition hover:border-gold-400/40 hover:bg-ink-850 active:scale-[0.98]"
            >
              <Upload size={24} className="mx-auto mb-3 text-ink-500" />
              <p className="text-[14px] font-semibold text-ink-300">Tap to select file</p>
              <p className="mt-1 text-[12px] text-ink-500">.csv files accepted</p>
            </button>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />

            {parseError && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[13px] text-red-300">{parseError}</p>
              </div>
            )}

            <p className="mt-8 text-[12px] text-ink-600">
              No CSV? Use the + button in the library to add books one at a time.
            </p>
          </div>
        )}

        {/* LOOKUP STEP */}
        {step === 'lookup' && (
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold-400/30 bg-gold-400/10">
              <Search size={28} className="animate-pulse text-gold-400" />
            </div>
            <h3 className="mb-2 text-[17px] font-bold text-white">Looking up books…</h3>
            <p className="mb-6 text-[13px] text-ink-400">
              Fetching details from Open Library for {rows.length} ISBN
              {rows.length !== 1 ? 's' : ''}.
            </p>

            <div className="w-full max-w-xs">
              <div className="mb-2 flex justify-between text-[12px] text-ink-400">
                <span>{lookupProgress}% complete</span>
                <span>
                  {rows.filter((r) => r.status === 'found').length} found /{' '}
                  {rows.filter((r) => r.status === 'not_found' || r.status === 'error').length}{' '}
                  not found
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-500 transition-all duration-300"
                  style={{ width: `${lookupProgress}%` }}
                />
              </div>
            </div>

            <div className="mt-8 w-full max-w-xs space-y-2">
              {rows.slice(-4).map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-ink-850 px-3 py-2.5">
                  {r.status === 'pending' && (
                    <Loader2 size={14} className="shrink-0 animate-spin text-ink-500" />
                  )}
                  {r.status === 'found' && (
                    <CheckCircle2 size={14} className="shrink-0 text-green-400" />
                  )}
                  {(r.status === 'not_found' || r.status === 'error') && (
                    <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  )}
                  <p className="truncate text-[12px] text-ink-300">{r.isbn}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REVIEW STEP */}
        {step === 'review' && (
          <div className="px-4 pb-4 pt-4">
            {/* Stats bar */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-ink-850 px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold text-white">{rows.length}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Scanned
                </p>
              </div>
              <div className="rounded-xl bg-ink-850 px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold text-green-400">
                  {rows.filter((r) => r.status === 'found').length}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Found
                </p>
              </div>
              <div className="rounded-xl bg-ink-850 px-3 py-2.5 text-center">
                <p className="text-[20px] font-bold text-amber-400">
                  {rows.filter((r) => r.status !== 'found').length}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Not found
                </p>
              </div>
            </div>

            {/* Import CTA — shown here at top AND in sticky footer */}
            <button
              onClick={handleImport}
              disabled={importing || toImportCount === 0}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-[15px] font-bold text-black transition hover:from-gold-300 hover:to-gold-400 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <BookOpen size={18} />
                  Import {toImportCount} Book{toImportCount !== 1 ? 's' : ''}
                  <ChevronRight size={16} />
                </>
              )}
            </button>

            {importError && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                <p className="text-[13px] text-red-300">{importError}</p>
              </div>
            )}

            <p className="mb-3 text-[12px] text-ink-500">
              Tap a row to expand and edit details. Uncheck the box to skip a book.
            </p>

            <div className="space-y-3">
              {rows.map((row, idx) => (
                <ReviewRow key={idx} row={row} idx={idx} onChange={updateRow} />
              ))}
            </div>

            {/* Bottom import button so user doesn't have to scroll back up */}
            <button
              onClick={handleImport}
              disabled={importing || toImportCount === 0}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 py-4 text-[15px] font-bold text-black transition hover:from-gold-300 hover:to-gold-400 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <BookOpen size={18} />
                  Import {toImportCount} Book{toImportCount !== 1 ? 's' : ''}
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <div className="flex flex-col items-center justify-center px-6 py-16">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-green-400/30 bg-green-400/10">
              <CheckCircle2 size={28} className="text-green-400" />
            </div>
            <h3 className="mb-2 text-[17px] font-bold text-white">Import Complete!</h3>
            <p className="mb-2 text-center text-[13px] text-ink-400">
              {importedCount} book{importedCount !== 1 ? 's' : ''} added to your library.
            </p>
            {skippedCount > 0 && (
              <p className="mb-6 text-center text-[12px] text-ink-500">
                {skippedCount} book{skippedCount !== 1 ? 's were' : ' was'} skipped (already in library).
              </p>
            )}
            <button
              onClick={onClose}
              className="mt-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-8 py-3 text-sm font-bold text-black transition hover:from-gold-300 hover:to-gold-400"
            >
              View Library
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewRowProps {
  row: LookupResult;
  idx: number;
  onChange: (idx: number, patch: Partial<LookupResult>) => void;
}

function ReviewRow({ row, idx, onChange }: ReviewRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition ${
        row.skip ? 'border-ink-700/40 opacity-50' : 'border-ink-700'
      } bg-ink-850`}
    >
      {/* Collapsed header */}
      <div className="flex items-center gap-3 p-3">
        <div className="shrink-0">
          {row.status === 'found' ? (
            <CheckCircle2 size={16} className="text-green-400" />
          ) : (
            <AlertCircle size={16} className="text-amber-400" />
          )}
        </div>

        {row.cover_image_url ? (
          <img
            src={row.cover_image_url}
            alt=""
            className="h-12 w-9 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded-md bg-ink-800">
            <BookOpen size={14} className="text-ink-600" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight text-white">
            {row.title || row.name}
          </p>
          {row.author && (
            <p className="truncate text-[11px] text-ink-400">{row.author}</p>
          )}
          <p className="mt-0.5 text-[10px] text-ink-600">ISBN {row.isbn}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {/* Skip / include checkbox */}
          <button
            onClick={() => onChange(idx, { skip: !row.skip })}
            className={`flex h-6 w-6 items-center justify-center rounded border-2 transition ${
              row.skip
                ? 'border-ink-600 bg-ink-700'
                : 'border-gold-400 bg-gold-400/20'
            }`}
            aria-label={row.skip ? 'Include this book' : 'Skip this book'}
          >
            {!row.skip && <CheckCircle2 size={12} className="text-gold-400" />}
          </button>

          {/* Expand / collapse */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ink-400 transition hover:text-ink-200"
            aria-label="Expand row"
          >
            <ChevronRight
              size={16}
              className={`transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="space-y-3 border-t border-ink-700 p-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Title
            </label>
            <input
              type="text"
              value={row.title}
              onChange={(e) => onChange(idx, { title: e.target.value })}
              className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold-400/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Author
            </label>
            <input
              type="text"
              value={row.author}
              onChange={(e) => onChange(idx, { author: e.target.value })}
              className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold-400/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
              Christian Topic
            </label>
            <select
              value={row.christian_topic}
              onChange={(e) =>
                onChange(idx, { christian_topic: e.target.value as ChristianTopic })
              }
              className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold-400/50"
            >
              {CHRISTIAN_TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                Copies
              </label>
              <input
                type="number"
                min={1}
                value={row.quantity}
                onChange={(e) =>
                  onChange(idx, { quantity: parseInt(e.target.value) || 1 })
                }
                className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold-400/50"
              />
            </div>
            {row.publish_year !== undefined && (
              <div className="flex-1">
                <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                  Year
                </label>
                <input
                  type="text"
                  value={row.publish_year}
                  onChange={(e) => onChange(idx, { publish_year: e.target.value })}
                  className="w-full rounded-xl border border-ink-600 bg-ink-900 px-3 py-2.5 text-[13px] text-white outline-none focus:border-gold-400/50"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
