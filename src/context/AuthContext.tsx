import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'bh_connect_user';

const ADMIN_EMAILS = new Set(['admin@believershouse.church', 'pastor@believershouse.church']);

interface AuthUser {
  email: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.email === 'string') return parsed as AuthUser;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const signIn = useCallback(async (email: string, _password: string) => {
    const normalized = email.trim().toLowerCase();
    const newUser: AuthUser = { email: normalized, isAdmin: ADMIN_EMAILS.has(normalized) };
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const isAdmin = user?.isAdmin ?? false;

  return (
    <AuthContext.Provider value={{ user, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
