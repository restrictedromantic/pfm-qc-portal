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
      <div className="h-full flex flex-col items-center justify-center p-6 bg-green-950/20 border-l border-green-900/30">
        <Database className="w-16 h-16 text-green-700 mb-4" />
        <p className="text-sm text-green-400 text-center">
          No metadata available.
        </p>
        <p className="text-xs text-green-500 mt-2 text-center">
          Upload a file to view technical metadata.
        </p>
      </div>
    );
  }

  const getVOABadge = () => {
    if (metadata.voaStatus === 'pass') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/50">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-sm uppercase tracking-wider text-green-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            PASS
          </span>
        </div>
      );
    } else if (metadata.voaStatus === 'fail') {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/50">
          <XCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm uppercase tracking-wider text-red-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            FAIL
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-500/20 border border-gray-500/50">
        <Activity className="w-5 h-5 text-gray-400" />
        <span className="text-sm uppercase tracking-wider text-gray-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          PENDING
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-green-950/20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-green-900/30">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-green-400" />
          <h3 className="text-xs uppercase tracking-wider text-green-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Technical Metadata
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Badge Section */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-green-400 mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Quality Badges
          </h4>
          <div className="space-y-2">
            {metadata.bitrate && (
              <div className="px-3 py-2 rounded bg-green-900/20 border border-green-900/50">
                <div className="text-xs text-green-400 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  BITRATE
                </div>
                <div className="text-sm text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {metadata.bitrate}
                </div>
              </div>
            )}
            {metadata.sampleRate && (
              <div className="px-3 py-2 rounded bg-green-900/20 border border-green-900/50">
                <div className="text-xs text-green-400 mb-1" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  SAMPLE RATE
                </div>
                <div className="text-sm text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                  {metadata.sampleRate}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VOA Check */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-green-400 mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            VOA Validation
          </h4>
          {getVOABadge()}
        </div>

        {/* Metadata Table */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-green-400 mb-2" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            File Properties
          </h4>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-green-900/30">
              {metadata.fileSize && (
                <tr>
                  <td className="py-2 text-green-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    File Size
                  </td>
                  <td className="py-2 text-right text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.fileSize}
                  </td>
                </tr>
              )}
              {metadata.duration && (
                <tr>
                  <td className="py-2 text-green-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Duration
                  </td>
                  <td className="py-2 text-right text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.duration}
                  </td>
                </tr>
              )}
              {metadata.format && (
                <tr>
                  <td className="py-2 text-green-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Format
                  </td>
                  <td className="py-2 text-right text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.format}
                  </td>
                </tr>
              )}
              {metadata.codec && (
                <tr>
                  <td className="py-2 text-green-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Codec
                  </td>
                  <td className="py-2 text-right text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    {metadata.codec}
                  </td>
                </tr>
              )}
              {metadata.channels && (
                <tr>
                  <td className="py-2 text-green-400" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                    Channels
                  </td>
                  <td className="py-2 text-right text-green-200" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
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
