import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { SignInPage } from './pages/SignInPage';
import { TABS } from './tabs';
import type { TabId } from './types';
import { BottomNav } from './components/BottomNav';
import { LibraryTab } from './components/LibraryTab';
import { RequestsTab } from './components/RequestsTab';
import { ComingSoon } from './components/ComingSoon';

type View = 'landing' | 'signin' | 'app';

function AppShell() {
  const { user, isAdmin, signOut } = useAuth();
  const [view, setView] = useState<View>(() => (user ? 'app' : 'landing'));
  const [activeTab, setActiveTab] = useState<TabId>('library');
  const [pendingRequestCount, setPendingRequestCount] = useState(0);

  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin);
  const activeDef = visibleTabs.find((t) => t.id === activeTab) ?? visibleTabs[0];

  const firstName = user?.email
    ? user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : '';

  const handleSignOut = () => {
    signOut();
    setView('landing');
    setActiveTab('library');
  };

  const handleTabChange = (tab: TabId) => {
    if (tab === 'requests' && !isAdmin) return;
    setActiveTab(tab);
  };

  if (view === 'landing') {
    return (
      <div key="landing" className="animate-fade-in">
        <LandingPage onSignIn={() => setView('signin')} />
      </div>
    );
  }

  if (view === 'signin') {
    return (
      <div key="signin" className="animate-fade-in">
        <SignInPage onBack={() => setView('landing')} onSuccess={() => setView('app')} />
      </div>
    );
  }

  return (
    <div key="app" className="animate-fade-in min-h-screen bg-ink-950">
      {/* App header */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-ink-700/60 bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3 pt-[calc(env(safe-area-inset-top)+12px)]">
          <div className="flex items-center gap-2.5">
            <svg width="28" height="28" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M256 90 L402 170 V312 C402 386 336 430 256 446 C176 430 110 386 110 312 V170 Z"
                stroke="#d4af37"
                strokeWidth="18"
                strokeLinejoin="round"
              />
              <path
                d="M220 310 V234 C220 212 236 196 256 196 C276 196 292 212 292 234 V310"
                stroke="#d4af37"
                strokeWidth="20"
                strokeLinecap="round"
              />
              <circle cx="256" cy="170" r="20" fill="#d4af37" />
            </svg>
            <div className="leading-none">
              <span className="font-display block text-[15px] font-bold text-white">BH Connect</span>
              {firstName && (
                <span className="block text-[11px] text-ink-400">Hi, {firstName}</span>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-[12px] font-medium text-ink-300 transition hover:bg-ink-700 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* Tab content */}
      <main key={activeTab} className="animate-fade-in mx-auto max-w-md pt-[calc(env(safe-area-inset-top)+64px)]">
        {activeTab === 'library' ? (
          <LibraryTab />
        ) : activeTab === 'requests' && isAdmin ? (
          <RequestsTab onPendingCountChange={setPendingRequestCount} />
        ) : (
          <ComingSoon tab={activeDef} />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={visibleTabs}
        badges={isAdmin ? { requests: pendingRequestCount } : undefined}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
