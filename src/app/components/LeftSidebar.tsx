import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Clock, Loader2, FileText } from 'lucide-react';

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
}

function ScriptDropzone({
  onScriptSelect,
  scriptFileName,
}: {
  onScriptSelect: (file: File) => void;
  scriptFileName: string;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onScriptSelect(acceptedFiles[0]);
    },
    accept: {
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
        isDragActive
          ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)]'
          : 'border-white/30 hover:border-white/50 hover:bg-white/5'
      }`}
    >
      <input {...getInputProps()} />
      <FileText className="w-6 h-6 mx-auto mb-2 text-white/60" />
      <p className="text-sm text-white/90 mb-1">
        {isDragActive ? 'Drop script' : scriptFileName || 'Drop script or click'}
      </p>
      <p className="text-xs text-white/50">TXT, JSON, DOCX</p>
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
}: LeftSidebarProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      'audio/wav': ['.wav'],
    },
    multiple: false,
  });

  return (
    <div className="h-full flex flex-col bg-[var(--qc-panel)] border-r border-[var(--qc-panel-border)]">
      {/* Upload Zone */}
      <div className="p-4 border-b border-[var(--qc-panel-border)]">
        <h3 className="text-xs uppercase tracking-wider text-white/70 mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          File Upload
        </h3>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-[var(--qc-success)] bg-[var(--qc-success-bg)]'
              : isProcessing
              ? 'border-white/20 cursor-not-allowed opacity-60'
              : 'border-white/30 hover:border-white/50 hover:bg-white/5'
          }`}
        >
          <input {...getInputProps()} disabled={isProcessing} />
          {isProcessing ? (
            <Loader2 className="w-8 h-8 mx-auto mb-2 text-[var(--qc-success)] animate-spin" />
          ) : (
            <Upload className="w-8 h-8 mx-auto mb-2 text-white/60" />
          )}
          <p className="text-sm text-white/90 mb-1">
            {isProcessing ? 'Processing...' : isDragActive ? 'Drop here' : 'Drop WAV file or click to browse'}
          </p>
          <p className="text-xs text-white/50">
            {isProcessing ? currentFileName : 'WAV only'}
          </p>
        </div>

        <h3 className="text-xs uppercase tracking-wider text-white/70 mt-4 mb-3" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
          Script Upload
        </h3>
        <ScriptDropzone
          onScriptSelect={onScriptSelect}
          scriptFileName={scriptFileName}
        />
      </div>

      {/* Previous Uploads */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[var(--qc-panel-border)]">
          <h3 className="text-xs uppercase tracking-wider text-white/70" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
            Previous Uploads
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto">
          {previousUploads.length === 0 ? (
            <div className="p-4 text-center text-white/50 text-sm">
              No previous uploads
            </div>
          ) : (
            <div className="divide-y divide-[var(--qc-panel-border)]">
              {previousUploads.map((file) => (
                <button
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  disabled={isProcessing}
                  className={`w-full p-3 text-left transition-colors ${
                    isProcessing
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/5'
                  } ${selectedFileId === file.id ? 'bg-white/10' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <FileAudio className="w-4 h-4 mt-0.5 text-white/50 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/90 truncate mb-1">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>
                        <Clock className="w-3 h-3" />
                        <span>{file.timestamp}</span>
                      </div>
                    </div>
                    <div
                      className="px-2 py-0.5 rounded text-xs flex-shrink-0 font-medium"
                      style={{
                        fontFamily: 'IBM Plex Mono, monospace',
                        backgroundColor: file.status === 'pass' ? 'var(--qc-success-bg)' : 'var(--qc-fail-bg)',
                        color: file.status === 'pass' ? 'var(--qc-success)' : 'var(--qc-fail)',
                      }}
                    >
                      {file.status === 'pass' ? 'PASS' : 'FAIL'}
                    </div>
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
