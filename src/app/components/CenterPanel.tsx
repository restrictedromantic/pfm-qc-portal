import React from 'react';
import { FileText } from 'lucide-react';

interface CenterPanelProps {
  transcription: string;
}

export function CenterPanel({ transcription }: CenterPanelProps) {
  return (
    <div className="h-full flex flex-col bg-red-950/20 border-r border-red-900/30">
      {/* Header */}
      <div className="px-6 py-3 border-b border-red-900/30">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-400" />
          <h3 className="text-xs uppercase tracking-wider text-red-300" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Real-Time Transcription
          </h3>
        </div>
      </div>

      {/* Transcription Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {transcription ? (
          <div className="text-sm leading-relaxed text-red-50 whitespace-pre-wrap" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            {transcription}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="w-16 h-16 text-red-700 mb-4" />
            <p className="text-sm text-red-400">
              No transcription available.
            </p>
            <p className="text-xs text-red-500 mt-2">
              Upload an audio file to begin real-time transcription.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
