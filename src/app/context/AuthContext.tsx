import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const HARDCODED_USERS = [
  { email: 'admin@pocketfm.com', isAdmin: true },
  { email: 'userA@producer.com', isAdmin: false },
  { email: 'userB@producer.com', isAdmin: false },
] as const;

export interface User {
  email: string;
  isAdmin: boolean;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'qc-dashboard-user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  // Restore session in useEffect to avoid setState during another component's render
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as User;
      const found = HARDCODED_USERS.find((u) => u.email === parsed.email);
      if (found) setUser({ email: found.email, isAdmin: found.isAdmin });
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback((email: string) => {
    const normalized = email.trim().toLowerCase();
    const found = HARDCODED_USERS.find((u) => u.email.toLowerCase() === normalized);
    if (!found) return false;
    const userData: User = { email: found.email, isAdmin: found.isAdmin };
    setUser(userData);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value: AuthContextValue = {
    user,
    login,
    logout,
    isAdmin: user?.isAdmin ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
