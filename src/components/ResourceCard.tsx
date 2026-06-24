import type { Resource } from '../types';

interface ResourceCardProps {
  resource: Resource;
  onOpen: (resource: Resource) => void;
}

export function ResourceCard({ resource, onOpen }: ResourceCardProps) {
  const isAvailable = resource.available_copies > 0;

  return (
    <button
      onClick={() => onOpen(resource)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-ink-700/60 bg-ink-850 text-left transition-all duration-200 hover:border-gold-400/40 hover:bg-ink-800 active:scale-[0.98]"
    >
      {/* Cover */}
      <div className="relative h-36 w-full overflow-hidden">
        {resource.cover_image_url ? (
          <img
            src={resource.cover_image_url}
            alt={resource.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full"
            style={{
              background: `linear-gradient(135deg, ${resource.cover_color}33 0%, ${resource.cover_color}08 50%, #0f0f11 100%)`,
            }}
          >
            <div
              className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-xl"
              style={{ backgroundColor: resource.cover_color }}
            />
          </div>
        )}

        {/* Availability badge */}
        <span
          className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold backdrop-blur-sm ${
            isAvailable
              ? 'bg-green-500/20 text-green-300 ring-1 ring-green-400/30'
              : 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isAvailable ? 'bg-green-400' : 'bg-amber-400'}`} />
          {isAvailable ? 'Available' : 'On Loan'}
        </span>

        {/* Topic badge */}
        <span className="absolute bottom-2 left-2 rounded-full border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white/80 backdrop-blur-sm">
          {resource.christian_topic}
        </span>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-white">
          {resource.title}
        </h3>
        {resource.author && (
          <p className="truncate text-[12px] text-ink-400">{resource.author}</p>
        )}
        {resource.total_copies > 1 && (
          <p className="mt-1 text-[11px] text-ink-600">
            {resource.available_copies}/{resource.total_copies} copies
          </p>
        )}
      </div>
    </button>
  );
}
