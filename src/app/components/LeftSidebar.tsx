import React, { useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Clock, Loader2, FileText } from 'lucide-react';
import { TechnicalMetadataView, type Metadata } from './TechnicalMetadataView';

interface AudioFile {
  id: string;
  name: string;
  timestamp: string;
  status: 'pass' | 'fail';
}

interface LeftSidebarProps {
  onFileSelect: (file: File) => void;
  onScriptSelect: (file: File) => void;
  previousUploads: AudioFile[];
  selectedFileId: string | null;
  onFileClick: (file: AudioFile) => void;
  isProcessing: boolean;
  currentFileName?: string;
  scriptFileName?: string;
  metadata: Metadata | null;
}

/** Compact script upload: small clickable area. */
function ScriptUploadCompact({
  onScriptSelect,
  scriptFileName,
}: {
  onScriptSelect: (file: File) => void;
  scriptFileName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onScriptSelect(acceptedFiles[0]);
    },
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div {...getRootProps()} className="border border-[var(--qc-panel-border)] rounded px-3 py-2 flex items-center gap-2 min-h-0">
      <input {...getInputProps()} />
      <FileText className="w-4 h-4 text-white/50 flex-shrink-0" />
      <label className="flex-1 text-left text-xs text-white/80 hover:text-white truncate cursor-pointer shrink min-w-0">
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.json,.docx"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onScriptSelect(f);
            e.target.value = '';
          }}
        />
        {scriptFileName || 'Script (TXT, JSON, DOCX)'}
      </label>
    </div>
  );
}

export function LeftSidebar({
  onFileSelect,
  onScriptSelect,
  previousUploads,
  selectedFileId,
  onFileClick,
  isProcessing,
  currentFileName,
  scriptFileName,
  metadata,
}: LeftSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onFileSelect(acceptedFiles[0]);
    },
    accept: { 'audio/wav': ['.wav'] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div className="h-full flex flex-col bg-[var(--qc-panel)] border-r border-[var(--qc-panel-border)]">
      {/* Compact Upload */}
      <div className="p-3 border-b border-[var(--qc-panel-border)] space-y-2">
        <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          File Upload
        </h3>
        <div
          {...getRootProps()}
          className={`border rounded px-3 py-2 flex items-center gap-2 min-h-0 cursor-pointer transition-colors ${
            isProcessing ? 'border-white/20 opacity-60 cursor-not-allowed' : 'border-[var(--qc-panel-border)] hover:border-white/40 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          {isProcessing ? (
            <Loader2 className="w-4 h-4 text-[var(--qc-success)] animate-spin flex-shrink-0" />
          ) : (
            <Upload className="w-4 h-4 text-white/50 flex-shrink-0" />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!isProcessing) fileInputRef.current?.click();
            }}
            disabled={isProcessing}
            className="flex-1 text-left text-xs text-white/80 hover:text-white truncate bg-transparent border-none cursor-pointer p-0 disabled:cursor-not-allowed"
          >
            {isProcessing ? currentFileName || 'Processing…' : 'Upload WAV or click to browse'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".wav,audio/wav"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFileSelect(f);
              e.target.value = '';
            }}
          />
        </div>
        <ScriptUploadCompact onScriptSelect={onScriptSelect} scriptFileName={scriptFileName || ''} />
      </div>

      {/* Technical Metadata (moved from right sidebar) */}
      <div className="border-b border-[var(--qc-panel-border)]">
        <TechnicalMetadataView metadata={metadata} />
      </div>

      {/* Previous Uploads */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="px-4 py-2 border-b border-[var(--qc-panel-border)]">
          <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Previous Uploads
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {previousUploads.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-xs">No previous uploads</div>
          ) : (
            <div className="divide-y divide-[var(--qc-panel-border)]">
              {previousUploads.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  disabled={isProcessing}
                  className={`w-full p-3 text-left transition-colors ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
                  } ${selectedFileId === file.id ? 'bg-white/10' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <FileAudio className="w-4 h-4 mt-0.5 text-white/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/90 truncate mb-0.5">{file.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-white/50" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        <Clock className="w-3 h-3" />
                        <span>{file.timestamp}</span>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] flex-shrink-0 font-medium"
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        backgroundColor: file.status === 'pass' ? 'var(--qc-success-bg)' : 'var(--qc-fail-bg)',
                        color: file.status === 'pass' ? 'var(--qc-success)' : 'var(--qc-fail)',
                      }}
                    >
                      {file.status === 'pass' ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
