import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

export type LogStatus = 'success' | 'processing' | 'error';
export type LogType = 'log' | 'error' | 'milestone';

export interface ConsoleEntry {
  id: string;
  time: string;
  message: string;
  type: LogType;
  status?: LogStatus;
}

const MAX_ENTRIES = 500;

interface SystemConsoleContextValue {
  entries: ConsoleEntry[];
  systemLog: (message: string, type?: LogType, status?: LogStatus) => void;
  clear: () => void;
}

const SystemConsoleContext = createContext<SystemConsoleContextValue | null>(null);

export function SystemConsoleProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<ConsoleEntry[]>([]);
  const nextId = useRef(0);

  const systemLog = useCallback((message: string, type: LogType = 'log', status?: LogStatus) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    setEntries((prev) => {
      const next = [...prev, { id: `log-${++nextId.current}`, time, message, type, status }];
      return next.slice(-MAX_ENTRIES);
    });
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args: unknown[]) => {
      const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      systemLog(message, 'log');
      originalLog.apply(console, args);
    };
    console.error = (...args: unknown[]) => {
      const message = args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
      systemLog(message, 'error', 'error');
      originalError.apply(console, args);
    };
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, [systemLog]);

  const value: SystemConsoleContextValue = { entries, systemLog, clear };
  return (
    <SystemConsoleContext.Provider value={value}>
      {children}
    </SystemConsoleContext.Provider>
  );
}

export function useSystemConsole() {
  const ctx = useContext(SystemConsoleContext);
  if (!ctx) throw new Error('useSystemConsole must be used within SystemConsoleProvider');
  return ctx;
}
