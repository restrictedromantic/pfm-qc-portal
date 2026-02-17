import React from 'react';
import { Database, CheckCircle, XCircle, Activity } from 'lucide-react';

export interface Metadata {
  fileSize?: string;
  duration?: string;
  format?: string;
  codec?: string;
  bitrate?: string;
  sampleRate?: string;
  channels?: string;
  voaStatus: 'pass' | 'fail' | 'pending';
}

interface TechnicalMetadataViewProps {
  metadata: Metadata | null;
}

export function TechnicalMetadataView({ metadata }: TechnicalMetadataViewProps) {
  if (!metadata) {
    return (
      <div className="p-4 text-center">
        <Database className="w-8 h-8 mx-auto text-white/40 mb-2" />
        <p className="text-xs text-white/50">Upload a file to view technical metadata.</p>
      </div>
    );
  }

  const getVOABadge = () => {
    if (metadata.voaStatus === 'pass') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--qc-success-bg)] border border-[var(--qc-success)]/50">
          <CheckCircle className="w-4 h-4 text-[var(--qc-success)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            PASS
          </span>
        </div>
      );
    } else if (metadata.voaStatus === 'fail') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--qc-fail-bg)] border border-[var(--qc-fail)]/50">
          <XCircle className="w-4 h-4 text-[var(--qc-fail)]" />
          <span className="text-xs uppercase tracking-wider text-[var(--qc-fail)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            FAIL
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-[var(--qc-panel-border)]">
        <Activity className="w-4 h-4 text-white/50" />
        <span className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          PENDING
        </span>
      </div>
    );
  };

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Database className="w-4 h-4 text-[var(--qc-success)]" />
        <h4 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Technical Metadata
        </h4>
      </div>
      <div className="space-y-2">
        {metadata.bitrate && (
          <div className="px-2 py-1.5 rounded bg-white/5 border border-[var(--qc-panel-border)]">
            <div className="text-[10px] text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>BITRATE</div>
            <div className="text-xs text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.bitrate}</div>
          </div>
        )}
        {metadata.sampleRate && (
          <div className="px-2 py-1.5 rounded bg-white/5 border border-[var(--qc-panel-border)]">
            <div className="text-[10px] text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>SAMPLE RATE</div>
            <div className="text-xs text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.sampleRate}</div>
          </div>
        )}
      </div>
      <div>
        <div className="text-[10px] text-[var(--qc-success)] mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>VOA</div>
        {getVOABadge()}
      </div>
      <table className="w-full text-xs">
        <tbody className="divide-y divide-[var(--qc-panel-border)]">
          {metadata.fileSize && (
            <tr>
              <td className="py-1 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>File Size</td>
              <td className="py-1 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.fileSize}</td>
            </tr>
          )}
          {metadata.duration && (
            <tr>
              <td className="py-1 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Duration</td>
              <td className="py-1 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.duration}</td>
            </tr>
          )}
          {metadata.format && (
            <tr>
              <td className="py-1 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Format</td>
              <td className="py-1 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.format}</td>
            </tr>
          )}
          {metadata.codec && (
            <tr>
              <td className="py-1 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Codec</td>
              <td className="py-1 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.codec}</td>
            </tr>
          )}
          {metadata.channels && (
            <tr>
              <td className="py-1 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Channels</td>
              <td className="py-1 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.channels}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
