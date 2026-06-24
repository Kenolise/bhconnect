import { useEffect } from 'react';
import {
  X,
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
} from 'lucide-react';
import type { Resource } from '../types';

interface ResourceSheetProps {
  resource: Resource | null;
  onClose: () => void;
  onEdit: (resource: Resource) => void;
  onDelete: (resource: Resource) => void;
}

export function ResourceSheet({ resource, onClose, onEdit, onDelete }: ResourceSheetProps) {
  useEffect(() => {
    if (resource) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [resource]);

  if (!resource) return null;

  const isAvailable = resource.available_copies > 0;

  const dateStr = new Date(resource.created_at).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-md animate-scale-in overflow-y-auto rounded-t-3xl border border-ink-700 bg-ink-900 sm:rounded-3xl">

        {/* Cover header */}
        <div className="relative h-48 w-full overflow-hidden rounded-t-3xl">
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

          {/* Back button */}
          <button
            onClick={onClose}
            className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-[13px] font-medium text-white/80 backdrop-blur-sm transition hover:bg-black/70 hover:text-white"
            aria-label="Back"
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
            <span
              className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-amber-400'}`}
            />
            {isAvailable
              ? `Available · ${resource.available_copies} of ${resource.total_copies}`
              : `On Loan · ${resource.available_copies} of ${resource.total_copies} left`}
          </span>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Topic pill */}
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

          {resource.url ? (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gold-400/30 bg-gold-400/10 px-4 py-3 text-sm font-semibold text-gold-300 transition hover:bg-gold-400/20"
            >
              <ExternalLink size={16} />
              Open Resource
            </a>
          ) : (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850 p-3.5">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-gold-400/70" />
              <p className="text-[13px] text-ink-300">
                {isAvailable
                  ? 'This book is available to borrow. Ask a team member to check it out for you.'
                  : 'This book is currently on loan. Check back soon or ask a team member.'}
              </p>
            </div>
          )}

          {/* Actions */}
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
        </div>
      </div>
    </div>
  );
}
