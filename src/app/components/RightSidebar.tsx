import React from 'react';
import { Database, CheckCircle, XCircle, Activity } from 'lucide-react';

interface Metadata {
  fileSize?: string;
  duration?: string;
  format?: string;
  codec?: string;
  bitrate?: string;
  sampleRate?: string;
  channels?: string;
  voaStatus: 'pass' | 'fail' | 'pending';
}

interface RightSidebarProps {
  metadata: Metadata | null;
}

export function RightSidebar({ metadata }: RightSidebarProps) {
  if (!metadata) {
    return (
      <div className="h-full flex flex-col bg-[var(--qc-panel)] border-l border-[var(--qc-panel-border)]">
        <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[280px]">
          <Database className="w-16 h-16 text-[var(--qc-success)] mb-4 opacity-80" />
          <p className="text-sm text-[var(--qc-success)] text-center">
            No metadata available.
          </p>
          <p className="text-xs text-white/50 mt-2 text-center">
            Upload a file to view technical metadata.
          </p>
        </div>
      </div>
    );
  }

  const getVOABadge = () => {
    if (metadata.voaStatus === 'pass') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--qc-success-bg)] border border-[var(--qc-success)]/50">
          <CheckCircle className="w-5 h-5 text-[var(--qc-success)]" />
          <span className="text-sm uppercase tracking-wider text-[var(--qc-success)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            PASS
          </span>
        </div>
      );
    } else if (metadata.voaStatus === 'fail') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--qc-fail-bg)] border border-[var(--qc-fail)]/50">
          <XCircle className="w-5 h-5 text-[var(--qc-fail)]" />
          <span className="text-sm uppercase tracking-wider text-[var(--qc-fail)]" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            FAIL
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 border border-[var(--qc-panel-border)]">
        <Activity className="w-5 h-5 text-white/50" />
        <span className="text-sm uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          PENDING
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--qc-panel)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--qc-panel-border)]">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--qc-success)]" />
          <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Technical Metadata
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Badge Section */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-[var(--qc-success)] mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Quality Badges
          </h4>
          <div className="space-y-2">
            {metadata.bitrate && (
              <div className="px-3 py-2 rounded bg-white/5 border border-[var(--qc-panel-border)]">
                <div className="text-xs text-[var(--qc-success)] mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  BITRATE
                </div>
                <div className="text-sm text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {metadata.bitrate}
                </div>
              </div>
            )}
            {metadata.sampleRate && (
              <div className="px-3 py-2 rounded bg-white/5 border border-[var(--qc-panel-border)]">
                <div className="text-xs text-[var(--qc-success)] mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  SAMPLE RATE
                </div>
                <div className="text-sm text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {metadata.sampleRate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VOA Check */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-[var(--qc-success)] mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            VOA Validation
          </h4>
          {getVOABadge()}
        </div>

        {/* Metadata Table */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-[var(--qc-success)] mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            File Properties
          </h4>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-[var(--qc-panel-border)]">
              {metadata.fileSize && (
                <tr>
                  <td className="py-2 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    File Size
                  </td>
                  <td className="py-2 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.fileSize}
                  </td>
                </tr>
              )}
              {metadata.duration && (
                <tr>
                  <td className="py-2 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Duration
                  </td>
                  <td className="py-2 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.duration}
                  </td>
                </tr>
              )}
              {metadata.format && (
                <tr>
                  <td className="py-2 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Format
                  </td>
                  <td className="py-2 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.format}
                  </td>
                </tr>
              )}
              {metadata.codec && (
                <tr>
                  <td className="py-2 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Codec
                  </td>
                  <td className="py-2 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.codec}
                  </td>
                </tr>
              )}
              {metadata.channels && (
                <tr>
                  <td className="py-2 text-white/60" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Channels
                  </td>
                  <td className="py-2 text-right text-white/90" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.channels}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
