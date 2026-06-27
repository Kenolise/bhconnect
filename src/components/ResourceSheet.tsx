import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  Edit3,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
  Hash,
  Building2,
  Copy,
  ArrowLeft,
  BookMarked,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import type { Resource } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ResourceSheetProps {
  resource: Resource | null;
  onClose: () => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
  isAdmin: boolean;
}

type BorrowStep = 'idle' | 'form' | 'submitting' | 'success';

export function ResourceSheet({ resource, onClose, onEdit, onDelete, isAdmin }: ResourceSheetProps) {
  const { user } = useAuth();
  const [borrowStep, setBorrowStep] = useState<BorrowStep>('idle');
  const [borrowName, setBorrowName] = useState('');
  const [borrowError, setBorrowError] = useState<string | null>(null);
  const [alreadyPending, setAlreadyPending] = useState(false);

  useEffect(() => {
    if (!resource) return;
    document.body.style.overflow = 'hidden';
    // Reset borrow state when sheet opens for a new book
    setBorrowStep('idle');
    setBorrowName('');
    setBorrowError(null);
    setAlreadyPending(false);

    if (!isAdmin && user?.email) {
      supabase
        .from('borrow_requests')
        .select('id')
        .eq('book_id', resource.id)
        .eq('requester_email', user.email)
        .eq('status', 'pending')
        .maybeSingle()
        .then(({ data }) => {
          setAlreadyPending(!!data);
        });
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [resource, isAdmin, user?.email]);

  if (!resource) return null;

  const isAvailable = resource.available_copies > 0;

  const dateStr = new Date(resource.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleBorrowSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowName.trim() || !user?.email) return;
    setBorrowStep('submitting');
    setBorrowError(null);
    const { error } = await supabase.from('borrow_requests').insert({
      book_id: resource.id,
      requester_email: user.email,
      requester_name: borrowName.trim(),
    });
    if (error) {
      setBorrowError('Something went wrong. Please try again.');
      setBorrowStep('form');
    } else {
      setBorrowStep('success');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 flex w-full max-w-md flex-col rounded-t-3xl border border-ink-700 bg-ink-900 shadow-2xl shadow-black/60 animate-scale-in sm:rounded-3xl" style={{ maxHeight: '85vh' }}>

        {/* Drag handle */}
        <div className="flex flex-shrink-0 justify-center pt-3 pb-1 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-ink-600" />
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">

          {/* Cover image / colour block */}
          <div className="relative h-48 w-full flex-shrink-0 overflow-hidden">
            {resource.cover_image_url ? (
              <>
                <img
                  src={resource.cover_image_url}
                  alt={resource.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
              </>
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background: `linear-gradient(135deg, ${resource.cover_color}44 0%, ${resource.cover_color}10 50%, #0f0f11 100%)`,
                }}
              >
                <div
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25 blur-2xl"
                  style={{ backgroundColor: resource.cover_color }}
                />
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[13px] font-medium text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
              aria-label="Close"
            >
              <ArrowLeft size={15} />
              Back
            </button>

            {/* Availability badge */}
            <span
              className={`absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur-sm ${
                isAvailable
                  ? 'bg-green-500/25 text-green-300 ring-1 ring-green-400/30'
                  : 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/30'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-amber-400'}`} />
              {isAvailable
                ? `Available · ${resource.available_copies} of ${resource.total_copies}`
                : `On Loan · ${resource.available_copies} of ${resource.total_copies} left`}
            </span>
          </div>

          {/* Body */}
          <div className="p-5 pb-8">
            <span className="mb-3 inline-block rounded-full border border-gold-400/30 bg-gold-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              {resource.christian_topic}
            </span>

            <h2 className="text-2xl font-bold leading-tight text-white">{resource.title}</h2>

            <div className="mt-4 space-y-2.5">
              {resource.author && (
                <div className="flex items-center gap-2.5 text-sm text-ink-300">
                  <User size={15} className="shrink-0 text-gold-400/70" />
                  {resource.author}
                </div>
              )}
              {resource.publisher && (
                <div className="flex items-center gap-2.5 text-sm text-ink-300">
                  <Building2 size={15} className="shrink-0 text-gold-400/70" />
                  {resource.publisher}
                  {resource.publish_year && (
                    <span className="text-ink-500">· {resource.publish_year}</span>
                  )}
                </div>
              )}
              {resource.isbn && (
                <div className="flex items-center gap-2.5 text-sm text-ink-400">
                  <Hash size={15} className="shrink-0 text-gold-400/70" />
                  ISBN {resource.isbn}
                </div>
              )}
              {resource.total_copies > 0 && (
                <div className="flex items-center gap-2.5 text-sm text-ink-300">
                  <Copy size={15} className="shrink-0 text-gold-400/70" />
                  {resource.total_copies} cop{resource.total_copies !== 1 ? 'ies' : 'y'} in library
                </div>
              )}
              <div className="flex items-center gap-2.5 text-sm text-ink-400">
                <Calendar size={15} className="shrink-0 text-gold-400/70" />
                Added {dateStr}
              </div>
            </div>

            {resource.description && (
              <div className="mt-5">
                <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-ink-500">
                  About this book
                </h3>
                <p className="text-[14px] leading-relaxed text-ink-200">{resource.description}</p>
              </div>
            )}

            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/20"
              >
                <ExternalLink size={16} />
                Open Resource
              </a>
            )}

            {/* Admin actions */}
            {isAdmin && (
              <div className="mt-6 flex gap-3 border-t border-ink-700 pt-5">
                <button
                  onClick={() => onEdit(resource)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-ink-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-700"
                >
                  <Edit3 size={16} />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(resource)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            )}

            {/* Member borrow request */}
            {!isAdmin && (
              <div className="mt-6 border-t border-ink-700 pt-5">
                {borrowStep === 'success' ? (
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-green-500/30 bg-green-500/10 p-5 text-center">
                    <CheckCircle2 size={28} className="text-green-400" />
                    <p className="text-[15px] font-semibold text-green-300">Request sent!</p>
                    <p className="text-[13px] text-ink-400">
                      The library team will be in touch when your book is ready.
                    </p>
                  </div>
                ) : alreadyPending ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-gold-400/20 bg-gold-400/5 p-4">
                    <BookMarked size={18} className="shrink-0 text-gold-400/70" />
                    <p className="text-[13px] text-ink-300">
                      You already have a pending request for this book. The library team will contact you soon.
                    </p>
                  </div>
                ) : borrowStep === 'form' || borrowStep === 'submitting' ? (
                  <form onSubmit={handleBorrowSubmit} className="space-y-3">
                    <p className="text-[13px] text-ink-400">
                      Enter your name and we'll let the library team know you'd like to borrow this book.
                    </p>
                    <input
                      type="text"
                      value={borrowName}
                      onChange={(e) => setBorrowName(e.target.value)}
                      placeholder="Your full name"
                      required
                      autoFocus
                      className="w-full rounded-xl border border-ink-600 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
                    />
                    {borrowError && (
                      <p className="text-[12px] text-red-400">{borrowError}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBorrowStep('idle')}
                        disabled={borrowStep === 'submitting'}
                        className="flex-1 rounded-xl border border-ink-600 bg-ink-800 px-4 py-3 text-sm font-semibold text-ink-300 transition hover:bg-ink-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={!borrowName.trim() || borrowStep === 'submitting'}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-3 text-sm font-bold text-black transition hover:from-gold-300 hover:to-gold-400 disabled:opacity-50"
                      >
                        {borrowStep === 'submitting' && <Loader2 size={15} className="animate-spin" />}
                        Send Request
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {!resource.url && (
                      <div className="flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850 p-3.5">
                        <BookOpen size={16} className="mt-0.5 shrink-0 text-gold-400/70" />
                        <p className="text-[13px] text-ink-300">
                          {isAvailable
                            ? 'This book is available to borrow.'
                            : 'This book is currently on loan. You can still request it and we\'ll let you know when it\'s available.'}
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => setBorrowStep('form')}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-3.5 text-sm font-bold text-black transition hover:from-gold-300 hover:to-gold-400"
                    >
                      <BookMarked size={16} />
                      Request to Borrow
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
