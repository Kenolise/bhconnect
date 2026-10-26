import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  RefreshCw,
  AlertCircle,
  Search,
  Shield,
  ShieldCheck,
  X,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface MemberRow {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

interface PendingAction {
  memberId: string;
  nextValue: boolean;
}

export function MembersTab() {
  const { user, refreshProfile } = useAuth();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, email, full_name, is_admin')
      .order('full_name', { ascending: true });

    if (fetchError) {
      console.error('Failed to load members:', fetchError);
      setError('We could not load the member list. Please try again.');
    } else if (data) {
      setMembers(data as MemberRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [members, query]);

  const adminCount = members.filter((m) => m.is_admin).length;

  const confirmAction = (member: MemberRow, nextValue: boolean) => {
    setPending({ memberId: member.id, nextValue });
  };

  const executeAction = async () => {
    if (!pending) return;
    setActioning(pending.memberId);
    setPending(null);
    const { error: rpcError } = await supabase.rpc('set_member_admin', {
      target: pending.memberId,
      value: pending.nextValue,
    });
    if (rpcError) {
      console.error('Failed to update member role:', rpcError);
      setError('We could not update this member. Please try again.');
    } else {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === pending.memberId ? { ...m, is_admin: pending.nextValue } : m
        )
      );
      if (pending.memberId === user?.id) {
        await refreshProfile();
      }
    }
    setActioning(null);
  };

  const pendingMember = pending
    ? members.find((m) => m.id === pending.memberId) ?? null
    : null;

  return (
    <div className="px-4 pb-28 pt-4">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold-400/30 bg-gold-400/10">
            <Users size={22} className="text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Members</h1>
            <p className="text-[13px] text-ink-400">
              {members.length} member{members.length !== 1 ? 's' : ''}
              {adminCount > 0 && ` · ${adminCount} admin${adminCount !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={fetchMembers}
          disabled={loading}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-ink-400 transition hover:bg-ink-700 hover:text-white disabled:opacity-40"
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      <div className="relative mb-4">
        <Search
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-xl border border-ink-700 bg-ink-850 py-3 pl-11 pr-4 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
        />
      </div>

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

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <RefreshCw size={28} className="animate-spin text-gold-400/60" />
          <p className="mt-3 text-sm text-ink-400">Loading members...</p>
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users size={36} className="text-ink-600" strokeWidth={1.5} />
          <p className="mt-4 text-[15px] font-medium text-ink-300">
            {query ? 'No members match your search' : 'No members yet'}
          </p>
          <p className="mt-1 text-[13px] text-ink-500">
            {query ? 'Try a different search term.' : 'New signups will appear here.'}
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-2.5">
          {filtered.map((member) => {
            const isSelf = member.id === user?.id;
            const isActioningThis = actioning === member.id;

            return (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-2xl border border-ink-700/60 bg-ink-850 p-3.5 transition hover:border-ink-600"
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${
                    member.is_admin
                      ? 'bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/30'
                      : 'bg-ink-700 text-ink-300'
                  }`}
                >
                  {(member.full_name || member.email)
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[14px] font-semibold text-white">
                      {member.full_name || 'Unnamed member'}
                    </p>
                    {isSelf && (
                      <span className="shrink-0 rounded-full bg-ink-700 px-2 py-0.5 text-[10px] font-medium text-ink-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="truncate text-[12px] text-ink-400">{member.email}</p>
                </div>

                {isActioningThis ? (
                  <Loader2 size={18} className="shrink-0 animate-spin text-gold-400" />
                ) : member.is_admin ? (
                  <button
                    onClick={() => confirmAction(member, false)}
                    disabled={isSelf}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gold-400/10 px-3 py-2 text-[12px] font-semibold text-gold-300 ring-1 ring-gold-400/30 transition hover:bg-gold-400/20 disabled:cursor-not-allowed disabled:opacity-40"
                    title={isSelf ? 'You cannot demote yourself' : 'Demote from admin'}
                  >
                    <ShieldCheck size={14} />
                    Admin
                  </button>
                ) : (
                  <button
                    onClick={() => confirmAction(member, true)}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-ink-700 bg-ink-800 px-3 py-2 text-[12px] font-semibold text-ink-300 transition hover:border-gold-400/40 hover:text-gold-300"
                  >
                    <Shield size={14} />
                    Make admin
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {pending && pendingMember && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setPending(null)}
          />
          <div className="relative z-10 w-full max-w-sm animate-scale-in rounded-3xl border border-ink-700 bg-ink-900 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-400/10">
              {pending.nextValue ? (
                <ShieldCheck size={26} className="text-gold-400" />
              ) : (
                <Shield size={26} className="text-amber-400" />
              )}
            </div>
            <h2 className="text-lg font-bold text-white">
              {pending.nextValue ? 'Promote to administrator' : 'Remove administrator'}
            </h2>
            <p className="mt-2 text-[14px] text-ink-400">
              {pending.nextValue
                ? `${pendingMember.full_name || pendingMember.email} will be able to manage books, view and approve borrow requests, and promote other members.`
                : `${pendingMember.full_name || pendingMember.email} will no longer have administrator access and will lose the management features.`}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl border border-ink-700 bg-ink-800 px-4 py-3 text-[14px] font-semibold text-ink-300 transition hover:bg-ink-700"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                className={`flex-1 rounded-xl px-4 py-3 text-[14px] font-bold transition ${
                  pending.nextValue
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-black hover:scale-105'
                    : 'bg-red-500/15 text-red-300 ring-1 ring-red-400/30 hover:bg-red-500/25'
                }`}
              >
                {pending.nextValue ? 'Promote' : 'Remove admin'}
              </button>
            </div>
            <button
              onClick={() => setPending(null)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-800 hover:text-white"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
