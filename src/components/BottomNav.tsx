import { useEffect, useRef } from 'react';
import { Library, Users, Mic, MessageSquare, HeartHandshake } from 'lucide-react';
import type { TabId } from '../types';

const ICONS: Record<TabId, typeof Library> = {
  library: Library,
  members: Users,
  sermons: Mic,
  comms: MessageSquare,
  pastoral: HeartHandshake,
};

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  tabs: { id: TabId; label: string }[];
}

export function BottomNav({ activeTab, onTabChange, tabs }: BottomNavProps) {
  const indicatorRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const el = indicatorRefs.current[activeTab];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-[calc(env(safe-area-inset-bottom)+8px)] pt-2">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-1 rounded-2xl border border-ink-700/80 bg-ink-900/90 px-2 py-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl">
          {tabs.map((tab) => {
            const Icon = ICONS[tab.id];
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  indicatorRefs.current[tab.id] = el;
                }}
                onClick={() => onTabChange(tab.id)}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-all duration-200"
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gold-400/15 text-gold-400 scale-110'
                      : 'text-ink-400 scale-100'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-gold-400' : 'text-ink-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
