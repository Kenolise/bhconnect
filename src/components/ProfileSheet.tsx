import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Mail, Loader2, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProfileSheetProps {
  onClose: () => void;
}

export function ProfileSheet({ onClose }: ProfileSheetProps) {
  const { profile, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.full_name ?? '');
  }, [profile]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ full_name: name.trim() })
      .eq('id', profile.id);
    if (updateError) {
      console.error('Failed to update name:', updateError);
      setError('We could not save your name. Please try again.');
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-scale-in rounded-t-3xl border border-ink-700 bg-ink-900 sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-4">
          <h2 className="text-[16px] font-bold text-white">Your profile</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 transition hover:bg-ink-800 hover:text-white"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="flex flex-col items-center py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-400/15 text-2xl font-bold text-gold-300 ring-1 ring-gold-400/30">
              {(profile?.full_name || profile?.email || '?').charAt(0).toUpperCase()}
            </div>
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-300">
              <User size={13} className="text-ink-500" />
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-xl border border-ink-700 bg-ink-850 px-4 py-3 text-[15px] text-white placeholder-ink-500 outline-none transition focus:border-gold-400/50 focus:ring-1 focus:ring-gold-400/30"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-ink-300">
              <Mail size={13} className="text-ink-500" />
              Email
            </label>
            <div className="flex items-center rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-3">
              <span className="truncate text-[15px] text-ink-400">{profile?.email}</span>
            </div>
            <p className="mt-1.5 text-[12px] text-ink-500">
              Your email is tied to your sign-in and cannot be changed here.
            </p>
          </div>

          {error && (
            <p className="text-[13px] text-red-400">{error}</p>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-3.5 text-[15px] font-bold text-black transition hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : saved ? (
              <>
                <Check size={18} />
                Saved
              </>
            ) : (
              'Save changes'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
