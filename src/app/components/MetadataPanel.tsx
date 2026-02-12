import React from 'react';
import { FileCheck, FileX, HardDrive, Clock, FileType, Shield } from 'lucide-react';

interface Metadata {
  fileSize: string;
  duration: string;
  format: string;
  codec: string;
  voaStatus: 'pass' | 'fail' | 'pending';
  bitrate?: string;
  sampleRate?: string;
  channels?: string;
}

interface MetadataPanelProps {
  metadata: Metadata | null;
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  if (!metadata) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--qc-panel)' }}>
        <Shield className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground text-center">
          No metadata available.<br />Upload a file to view technical details.
        </p>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (metadata.voaStatus === 'pass') {
      return <FileCheck className="w-5 h-5" style={{ color: 'var(--qc-success)' }} />;
    } else if (metadata.voaStatus === 'fail') {
      return <FileX className="w-5 h-5" style={{ color: 'var(--qc-fail)' }} />;
    }
    return <Shield className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusBadge = () => {
    const colors = {
      pass: { bg: 'var(--qc-success-bg)', text: 'var(--qc-success)' },
      fail: { bg: 'var(--qc-fail-bg)', text: 'var(--qc-fail)' },
      pending: { bg: 'var(--muted)', text: 'var(--muted-foreground)' },
    };
    const style = colors[metadata.voaStatus];

    return (
      <div
        className="px-4 py-2 rounded text-center"
        style={{
          backgroundColor: style.bg,
          color: style.text,
          fontFamily: 'IBM Plex Mono, monospace',
        }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          {getStatusIcon()}
          <span className="text-sm uppercase tracking-wider">
            {metadata.voaStatus}
          </span>
        </div>
        <p className="text-xs opacity-75">VOA Validation</p>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--qc-panel)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Technical Metadata
        </h3>
      </div>

      {/* VOA Status Badge */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
        {getStatusBadge()}
      </div>

      {/* Primary Metadata */}
      <div className="border-b" style={{ borderColor: 'var(--qc-panel-border)' }}>
        <div className="p-4 space-y-4">
          {/* File Size */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                File Size
              </span>
            </div>
            <p className="text-lg pl-5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {metadata.fileSize}
            </p>
          </div>

          {/* Duration */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Duration
              </span>
            </div>
            <p className="text-lg pl-5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {metadata.duration}
            </p>
          </div>

          {/* Format & Codec */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileType className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                Format / Codec
              </span>
            </div>
            <p className="text-lg pl-5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              {metadata.format} / {metadata.codec}
            </p>
          </div>
        </div>
      </div>

      {/* Additional Metadata */}
      {(metadata.bitrate || metadata.sampleRate || metadata.channels) && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
              Additional Properties
            </h4>
            <div className="space-y-2">
              {metadata.bitrate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Bitrate:</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.bitrate}</span>
                </div>
              )}
              {metadata.sampleRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Sample Rate:</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.sampleRate}</span>
                </div>
              )}
              {metadata.channels && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>Channels:</span>
                  <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{metadata.channels}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
