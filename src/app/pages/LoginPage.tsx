import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

const DEMO_EMAILS = 'admin@pocketfm.com, userA@producer.com, userB@producer.com';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (user) {
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
    navigate(from, { replace: true });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Enter your email');
      return;
    }
    if (login(trimmed)) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/';
      navigate(from, { replace: true });
    } else {
      setError('Email not recognized. Use one of: ' + DEMO_EMAILS);
    }
  };

  return (
    <div className="dark min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-xl border border-[var(--qc-panel-border)] bg-[var(--qc-panel)] p-8 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[var(--qc-success-bg)]">
            <LogIn className="w-6 h-6 text-[var(--qc-success)]" />
          </div>
          <h1 className="text-lg font-semibold text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            QC Dashboard
          </h1>
        </div>
        <p className="text-xs text-white/60 mb-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Sign in with your email
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-white/50 mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@pocketfm.com"
              className="w-full px-4 py-3 rounded-lg border border-white/20 bg-black/30 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--qc-success)] focus:border-transparent"
              style={{ fontFamily: 'IBM Plex Mono, monospace' }}
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="text-sm text-[var(--qc-fail)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 rounded-lg bg-[var(--qc-success)] hover:bg-[var(--qc-success)]/90 text-white font-medium transition-colors"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            Sign in
          </button>
        </form>
        <p className="text-xs text-white/40 mt-4" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Demo: {DEMO_EMAILS}
        </p>
      </div>
    </div>
  );
}
