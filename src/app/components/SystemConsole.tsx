import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronDown, ChevronUp, Trash2, Copy } from 'lucide-react';
import { useSystemConsole } from '../context/SystemConsoleContext';
import type { ConsoleEntry, LogStatus } from '../context/SystemConsoleContext';

const STATUS_STYLES: Record<LogStatus, string> = {
  success: 'text-green-400',
  processing: 'text-amber-400',
  error: 'text-red-400',
};

function EntryRow({ entry }: { entry: ConsoleEntry }) {
  const statusClass = entry.status ? STATUS_STYLES[entry.status] : 'text-white/80';
  return (
    <div className="flex items-start gap-2 py-0.5 font-mono text-xs">
      <span className="text-white/50 shrink-0">{entry.time}</span>
      {entry.status && (
        <span className={`shrink-0 w-2 h-2 rounded-full ${
          entry.status === 'success' ? 'bg-green-500' :
          entry.status === 'processing' ? 'bg-amber-500' : 'bg-red-500'
        }`} title={entry.status} />
      )}
      <span className={entry.type === 'error' ? 'text-red-400' : statusClass}>
        {entry.message}
      </span>
    </div>
  );
}

export function SystemConsole() {
  const { entries, clear } = useSystemConsole();
  const [collapsed, setCollapsed] = React.useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsed && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [entries, collapsed]);

  return (
    <div className="border-t border-[var(--qc-panel-border)] bg-black/80 flex flex-col shrink-0">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 px-3 py-2 w-full text-left text-white/70 hover:text-white hover:bg-white/5 transition-colors"
        style={{ fontFamily: 'IBM Plex Mono, monospace' }}
      >
        <Terminal className="w-4 h-4 text-[var(--qc-success)]" />
        <span className="text-xs uppercase tracking-wider">Backend Status Console</span>
        <span className="text-white/50 text-xs">({entries.length})</span>
        <span className="ml-auto">
          {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      {!collapsed && (
        <>
          <div className="flex items-center justify-end gap-2 px-3 py-1 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                const text = entries.map((e) => `[${e.time}] ${e.message}`).join('\n');
                void navigator.clipboard.writeText(text || 'No logs');
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white rounded"
              title="Copy all logs to clipboard"
            >
              <Copy className="w-3 h-3" />
              Copy All
            </button>
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white/60 hover:text-white rounded"
            >
              <Trash2 className="w-3 h-3" />
              Clear
            </button>
          </div>
          <div
            ref={scrollRef}
            className="overflow-y-auto max-h-48 min-h-24 p-3 space-y-0"
            style={{ fontFamily: 'IBM Plex Mono, monospace' }}
          >
            {entries.length === 0 ? (
              <div className="text-white/40 text-xs py-4">No messages yet. Upload a file or interact to see logs.</div>
            ) : (
              entries.map((entry) => <EntryRow key={entry.id} entry={entry} />)
            )}
          </div>
        </>
      )}
    </div>
  );
}
