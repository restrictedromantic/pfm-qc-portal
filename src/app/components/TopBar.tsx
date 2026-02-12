import React from 'react';
import { Info } from 'lucide-react';

interface TopBarProps {
  showName: string;
  episodeNumber: string;
  showTitle: string;
}

export function TopBar({ showName, episodeNumber, showTitle }: TopBarProps) {
  return (
    <div className="bg-black border-b border-[var(--qc-panel-border)] px-6 py-4">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-white/5">
            <Info className="w-5 h-5 text-white/70" />
          </div>
          <div className="text-xs uppercase tracking-wider text-white/50" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            File Information
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-3 gap-8">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Show Name
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {showName || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              EP Number
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {episodeNumber || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Episode Title
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {showTitle || '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
