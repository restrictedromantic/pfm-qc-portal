import React from 'react';
import { Link } from 'react-router';
import { Info, Music } from 'lucide-react';

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
            FILE INFORMATION
          </div>
        </div>
        
        <div className="flex-1 grid grid-cols-3 gap-8">
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              SHOW NAME
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {showName || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              EP NUMBER
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {episodeNumber || '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-white/40 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              EPISODE TITLE
            </div>
            <div className="text-sm text-white" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {showTitle || '—'}
            </div>
          </div>
        </div>

        <Link
          to="/audio-analysis"
          className="flex items-center gap-2 px-3 py-2 rounded text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          style={{ fontFamily: 'IBM Plex Mono, monospace' }}
        >
          <Music className="w-4 h-4" />
          Audio Analysis
        </Link>
      </div>
    </div>
  );
}
